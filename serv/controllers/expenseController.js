const Expense = require("../models/Expense");
const Family  = require("../models/Family");
const User    = require("../models/User");
const Counter = require("../models/Counter");
const Notification = require("../models/Notification");
const { processRecurringExpenses } = require("./recurringExpenseController");

// ─── Helper ───────────────────────────────────────────────────
const checkMembership = async (familyId, userId) => {
  const family = await Family.findById(familyId);
  if (!family) return null;
  const isMember = family.members.some(
    (m) => m.user_id.toString() === userId.toString()
  );
  return isMember ? family : null;
};

const getMemberRole = (family, userId) => {
  const member = (family?.members || []).find(
    (m) => toObjectIdString(m.user_id) === userId.toString()
  );
  return member?.role || null;
};

const isAdminOrMod = (role) => role === "chef" || role === "mod";

const hasUserExpensesInFamily = async (familyId, userId) => {
  const count = await Expense.countDocuments({
    family_id: familyId,
    $or: [{ paid_by: userId }, { "participants.user_id": userId }],
  });
  return count > 0;
};

const toObjectIdString = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value._id) return value._id.toString();
  if (value.toString) return value.toString();
  return null;
};

const resolveUserFamilyId = async (userDoc) => {
  if (userDoc?.family) return userDoc.family.toString();
  const family = await Family.findOne({ "members.user_id": userDoc._id }).select("_id").lean();
  if (family?._id) return family._id.toString();

  // Fallback: old data may contain expenses but not family membership synced yet.
  const recentUserExpense = await Expense.findOne({
    $or: [{ paid_by: userDoc._id }, { "participants.user_id": userDoc._id }],
  })
    .select("family_id")
    .sort({ createdAt: -1 })
    .lean();
  return recentUserExpense?.family_id?.toString() || null;
};

// @POST /api/expenses
const createExpense = async (req, res) => {
  try {
    const { title, amount, family_id, date, participants, splitWith, category, status, receipt } = req.body;

    const family = await checkMembership(family_id, req.user._id);
    if (!family) return res.status(403).json({ message: "Famille introuvable ou acces refuse" });

    if (receipt && !receipt.startsWith("data:image/") && !receipt.startsWith("data:application/pdf")) {
      return res.status(400).json({ message: "Format de recu invalide (Image ou PDF uniquement)" });
    }
    if (receipt && receipt.length > 2800000) {
      return res.status(400).json({ message: "Recu trop lourd (max ~2MB)" });
    }

    let parts = participants;
    const authorId = req.user._id.toString();

    // 1. Si splitWith est fourni, on construit les participants
    if (!parts && splitWith && splitWith.length > 0) {
      const shared = parseFloat((amount / splitWith.length).toFixed(2));
      parts = splitWith.map((id) => {
        const isAuthor = String(id).toLowerCase() === authorId.toLowerCase();
        return {
          user_id: id.toString(),
          shared_amount: shared,
          paid: isAuthor,
          payment_request_status: isAuthor ? "approved" : "none",
          payment_reviewed_at: isAuthor ? new Date() : null,
          payment_reviewed_by: isAuthor ? req.user._id : null
        };
      });
    }

    // 2. Si rien n'est fourni, on divise par tous les membres du groupe
    if (!parts || parts.length === 0) {
      const memberCount = family.members.length;
      const shared = parseFloat((amount / memberCount).toFixed(2));
      parts = family.members.map((m) => {
        const mId = m.user_id.toString();
        const isAuthor = mId.toLowerCase() === authorId.toLowerCase();
        return {
          user_id: m.user_id,
          shared_amount: shared,
          paid: isAuthor,
          payment_request_status: isAuthor ? "approved" : "none",
          payment_reviewed_at: isAuthor ? new Date() : null,
          payment_reviewed_by: isAuthor ? req.user._id : null
        };
      });
    } else {
      // 3. On repasse sur les participants pour être sûr que l'auteur est marqué payé
      parts = parts.map(p => {
        const pUserId = String(p.user_id?._id || p.user_id || p).toLowerCase();
        const isAuthor = pUserId === authorId.toLowerCase();
        
        // On reconstruit l'objet participant
        let pObj = (typeof p === "object" && !Array.isArray(p)) ? { ...p } : { user_id: p };
        if (!pObj.user_id) pObj.user_id = p;

        if (isAuthor) {
          return {
            ...pObj,
            paid: true,
            payment_request_status: "approved",
            payment_reviewed_at: pObj.payment_reviewed_at || new Date(),
            payment_reviewed_by: pObj.payment_reviewed_by || req.user._id
          };
        }
        return { ...pObj, paid: !!pObj.paid };
      });
    }

    const allPaid = (parts || []).every(p => p.paid);

    // ✅ Générer ID de ticket séquentiel (FSTXXXXXX)
    const counter = await Counter.findOneAndUpdate(
      { id: "expense_ticket" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const ticketId = `FST${String(counter.seq).padStart(6, "0")}`;

    const expense = await Expense.create({
      title,
      amount,
      paid_by: req.user._id,
      family_id,
      date: date || Date.now(),
      category: category || "other",
      status: allPaid ? "settled" : "pending",
      receipt: receipt || "",
      participants: parts,
      ticket_id: ticketId
    });

    const populated = await Expense.findById(expense._id)
      .populate("paid_by", "name email")
      .populate("participants.user_id", "name email");

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/expenses/:familyId
const getExpensesByFamily = async (req, res) => {
  try {
    const family = await checkMembership(req.params.familyId, req.user._id);
    if (!family) return res.status(403).json({ message: "Accès refusé" });

    // ✅ Traitement des dépenses récurrentes avant de charger les dépenses
    try {
      await processRecurringExpenses(req.params.familyId);
    } catch (recErr) {
      console.error("Recurring processing error in getExpensesByFamily:", recErr);
    }

    const expenses = await Expense.find({ family_id: req.params.familyId })
      .populate("paid_by", "name email")
      .populate("participants.user_id", "name email")
      .sort({ date: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PUT /api/expenses/:id
const updateExpense = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: "Dépense introuvable" });

    const isPayer = expense.paid_by.toString() === userId;
    const isParticipant = expense.participants.some(p => p.user_id.toString() === userId);

    if (!isPayer && !isParticipant) {
      return res.status(403).json({ message: "Non autorisé à modifier cette dépense" });
    }

    // Si l'utilisateur n'est pas le payeur principal, il ne peut QUE modifier le reçu
    if (!isPayer && isParticipant) {
      if (req.body.receipt !== undefined) {
        if (req.body.receipt && !req.body.receipt.startsWith("data:image/") && !req.body.receipt.startsWith("data:application/pdf")) {
          return res.status(400).json({ message: "Format de reçu invalide (Image ou PDF uniquement)" });
        }
        expense.receipt = req.body.receipt;
        await expense.save();
      } else {
        return res.status(403).json({ message: "Seul le payeur peut modifier les détails de la dépense" });
      }
    } else {
      // Le payeur peut tout modifier
      if (req.body.receipt && !req.body.receipt.startsWith("data:image/") && !req.body.receipt.startsWith("data:application/pdf")) {
        return res.status(400).json({ message: "Format de reçu invalide (Image ou PDF uniquement)" });
      }
      
      if (req.body.participants) {
        req.body.participants = req.body.participants.map(p => {
          const rawId = p.user_id?._id || p.user_id || p;
          const pUserId = String(rawId).toLowerCase().trim();
          const normAuthorId = String(userId).toLowerCase().trim();
          if (pUserId === normAuthorId) {
            return {
              ...p,
              paid: true,
              payment_request_status: "approved"
            };
          }
          return p;
        });
      }

      Object.assign(expense, req.body);
      
      // Recalculer le statut global
      if (expense.participants && expense.participants.length > 0) {
        const allPaid = expense.participants.every(p => p.paid);
        expense.status = allPaid ? "settled" : "pending";
      }

      await expense.save();
    }
    
    const populated = await Expense.findById(expense._id)
      .populate("paid_by", "name email")
      .populate("participants.user_id", "name email");

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/expenses/:id
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      paid_by: req.user._id,
    });
    if (!expense) return res.status(404).json({ message: "Dépense introuvable ou non autorisé" });
    res.json({ message: "Dépense supprimée" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/expenses/:familyId/balance
const getBalance = async (req, res) => {
  try {
    const family = await checkMembership(req.params.familyId, req.user._id);
    if (!family) return res.status(403).json({ message: "Accès refusé" });

    const expenses = await Expense.find({ family_id: req.params.familyId })
      .populate("paid_by", "name email")
      .populate("participants.user_id", "name email");

    const balances = {};
    expenses.forEach((exp) => {
      const payerId   = exp.paid_by._id.toString();
      const payerName = exp.paid_by.name;
      if (!balances[payerId]) balances[payerId] = { name: payerName, net: 0 };
      balances[payerId].net += exp.amount;
      exp.participants.forEach((p) => {
        const uid   = p.user_id._id.toString();
        const uname = p.user_id.name;
        if (!balances[uid]) balances[uid] = { name: uname, net: 0 };
        balances[uid].net -= p.shared_amount;
      });
    });

    const totalFamily = expenses.reduce((sum, e) => sum + e.amount, 0);
    res.json({ totalFamily, balances });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/expenses/:familyId/history
const getHistory = async (req, res) => {
  try {
    const family = await checkMembership(req.params.familyId, req.user._id);
    if (!family) return res.status(403).json({ message: "Accès refusé" });

    // ✅ Traitement des dépenses récurrentes avant de charger l'historique
    try {
      await processRecurringExpenses(req.params.familyId);
    } catch (recErr) {
      console.error("Recurring processing error in getHistory:", recErr);
    }

    const { startDate, endDate } = req.query;
    const filter = { family_id: req.params.familyId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate)   filter.date.$lte = new Date(endDate);
    }

    const history = await Expense.find(filter)
      .populate("paid_by", "name email")
      .populate("participants.user_id", "name email")
      .sort({ date: -1 });

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PATCH /api/expenses/:id/pay
const payExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: "Dépense introuvable" });

    const family = await Family.findById(expense.family_id)
      .populate("members.user_id", "name email");
    if (!family) return res.status(404).json({ message: "Famille introuvable" });

    const role = getMemberRole(family, req.user._id);
    if (!role) return res.status(403).json({ message: "Accès refusé" });

    const participantIndex = expense.participants.findIndex(
      (p) => p.user_id.toString() === req.user._id.toString()
    );
    if (participantIndex === -1) {
      return res.status(403).json({ message: "Vous n'êtes pas participant de cette dépense" });
    }

    const participant = expense.participants[participantIndex];
    if (participant.paid) {
      const populatedAlready = await Expense.findById(expense._id)
        .populate("paid_by", "name email")
        .populate("participants.user_id", "name email");
      return res.status(200).json({ message: "Déjà marqué comme payé.", awaitingApproval: false, expense: populatedAlready });
    }

    if (isAdminOrMod(role)) {
      // Admin/mod can mark directly as paid.
      participant.paid = true;
      participant.payment_request_status = "approved";
      participant.payment_requested_at = participant.payment_requested_at || new Date();
      participant.payment_reviewed_at = new Date();
      participant.payment_reviewed_by = req.user._id;
      const allPaid = expense.participants.every((p) => p.paid);
      if (allPaid) expense.status = "settled";
    } else {
      // Member submits a payment request; admins must validate.
      if (participant.payment_request_status === "pending") {
        return res.status(409).json({ message: "Demande déjà envoyée, en attente de confirmation admin." });
      }
      participant.payment_request_status = "pending";
      participant.payment_requested_at = new Date();
      participant.payment_reviewed_at = null;
      participant.payment_reviewed_by = null;

      const adminMembers = (family.members || []).filter(
        (m) =>
          isAdminOrMod(m.role) &&
          toObjectIdString(m.user_id) !== req.user._id.toString()
      );
      if (adminMembers.length > 0) {
        const senderName = req.user?.name || "Un membre";
        const notifications = adminMembers.map((m) => ({
          to: toObjectIdString(m.user_id),
          from: req.user._id,
          family: family._id,
          expense: expense._id,
          participant: req.user._id,
          type: "payment_request",
          message: `${senderName} a payé sa part pour "${expense.title}".`,
        }));
        const created = await Notification.insertMany(notifications);
        if (req.io) {
          created.forEach((notif) => {
            req.io.to(`user_${notif.to}`).emit("notification", {
              _id: notif._id,
              type: notif.type,
              message: notif.message,
              expense: notif.expense,
              participant: notif.participant,
              family: { _id: family._id, name: family.name },
              createdAt: notif.createdAt,
            });
          });
        }
      }
    }

    await expense.save();

    const populated = await Expense.findById(expense._id)
      .populate("paid_by", "name email")
      .populate("participants.user_id", "name email");

    return res.json({
      message: isAdminOrMod(role)
        ? "Paiement validé."
        : "Demande envoyée. En attente de confirmation admin.",
      awaitingApproval: !isAdminOrMod(role),
      expense: populated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PATCH /api/expenses/:id/unpay
const unpayExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: "Dépense introuvable" });

    const family = await Family.findById(expense.family_id);
    if (!family) return res.status(404).json({ message: "Famille introuvable" });

    const role = getMemberRole(family, req.user._id);
    if (!role) return res.status(403).json({ message: "Accès refusé" });

    const participantIndex = expense.participants.findIndex(
      (p) => p.user_id.toString() === req.user._id.toString()
    );
    if (participantIndex === -1) {
      return res.status(403).json({ message: "Vous n'êtes pas participant de cette dépense" });
    }

    const participant = expense.participants[participantIndex];
    
    // Restriction 3 heures
    const payDate = participant.payment_reviewed_at || participant.payment_requested_at || expense.updatedAt;
    const diffHrs = (new Date() - new Date(payDate)) / (1000 * 60 * 60);
    if (diffHrs > 3) {
      return res.status(400).json({ message: "L'annulation n'est plus possible après 3 heures." });
    }

    // Si c'est déjà réglé (tout le monde a payé), on ne peut pas annuler sans l'admin? 
    // Pour l'instant, on permet l'annulation si c'est "pending" ou si l'utilisateur est admin.
    if (!participant.paid && participant.payment_request_status === "none") {
      return res.status(400).json({ message: "Ce paiement n'est pas marqué comme effectué." });
    }

    // Annuler la demande ou le paiement
    participant.paid = false;
    participant.payment_request_status = "none";
    participant.payment_reviewed_at = null;
    participant.payment_reviewed_by = null;
    expense.status = "pending"; // S'assurer que la dépense n'est plus "settled"

    // Supprimer les notifications de demande de paiement envoyées aux admins
    await Notification.deleteMany({
      expense: expense._id,
      from: req.user._id,
      type: "payment_request"
    });

    await expense.save();

    const populated = await Expense.findById(expense._id)
      .populate("paid_by", "name email")
      .populate("participants.user_id", "name email");

    return res.json({
      message: "Paiement annulé.",
      expense: populated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PATCH /api/expenses/:id/payments/:participantId/approve
const approvePaymentRequest = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: "Dépense introuvable" });

    const family = await Family.findById(expense.family_id)
      .populate("members.user_id", "name email");
    if (!family) return res.status(404).json({ message: "Famille introuvable" });

    const role = getMemberRole(family, req.user._id);
    if (!isAdminOrMod(role)) return res.status(403).json({ message: "Seul un admin/modérateur peut confirmer." });

    const participant = expense.participants.find(
      (p) => toObjectIdString(p.user_id) === req.params.participantId
    );
    if (!participant) return res.status(404).json({ message: "Participant introuvable." });
    if (participant.payment_request_status !== "pending") {
      return res.status(400).json({ message: "Aucune demande en attente pour ce participant." });
    }

    participant.paid = true;
    participant.payment_request_status = "approved";
    participant.payment_reviewed_at = new Date();
    participant.payment_reviewed_by = req.user._id;

    const allPaid = expense.participants.every((p) => p.paid);
    expense.status = allPaid ? "settled" : "pending";
    await expense.save();

    const notif = await Notification.create({
      to: req.params.participantId,
      from: req.user._id,
      family: family._id,
      expense: expense._id,
      participant: req.params.participantId,
      type: "payment_approved",
      message: `Votre paiement pour "${expense.title}" a ete confirme.`,
    });
    if (req.io) {
      req.io.to(`user_${req.params.participantId}`).emit("notification", {
        _id: notif._id,
        type: notif.type,
        message: notif.message,
        expense: notif.expense,
        participant: notif.participant,
        family: { _id: family._id, name: family.name },
        createdAt: notif.createdAt,
      });
    }

    const populated = await Expense.findById(expense._id)
      .populate("paid_by", "name email")
      .populate("participants.user_id", "name email");
    return res.json({ message: "Paiement confirmé.", expense: populated });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const rejectPaymentRequest = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: "Dépense introuvable" });

    const family = await Family.findById(expense.family_id)
      .populate("members.user_id", "name email");
    if (!family) return res.status(404).json({ message: "Famille introuvable" });

    const role = getMemberRole(family, req.user._id);
    if (!isAdminOrMod(role)) return res.status(403).json({ message: "Seul un admin/modérateur peut refuser." });

    const participant = expense.participants.find(
      (p) => toObjectIdString(p.user_id) === req.params.participantId
    );
    if (!participant) return res.status(404).json({ message: "Participant introuvable." });
    if (participant.payment_request_status !== "pending") {
      return res.status(400).json({ message: "Aucune demande en attente pour ce participant." });
    }

    participant.paid = false;
    participant.payment_request_status = "none";
    participant.payment_reviewed_at = new Date();
    participant.payment_reviewed_by = req.user._id;
    expense.status = "pending";
    await expense.save();

    const notif = await Notification.create({
      to: req.params.participantId,
      from: req.user._id,
      family: family._id,
      expense: expense._id,
      participant: req.params.participantId,
      type: "payment_rejected",
      message: `Votre paiement pour "${expense.title}" n'a pas ete valide par l'admin.`,
    });
    if (req.io) {
      req.io.to(`user_${req.params.participantId}`).emit("notification", {
        _id: notif._id,
        type: notif.type,
        message: notif.message,
        expense: notif.expense,
        participant: notif.participant,
        family: { _id: family._id, name: family.name },
        createdAt: notif.createdAt,
      });
    }

    const populated = await Expense.findById(expense._id)
      .populate("paid_by", "name email")
      .populate("participants.user_id", "name email");
    return res.json({ message: "Demande refusée.", expense: populated });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @GET /api/expenses/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const userId   = req.user._id.toString();
    const familyHint = req.headers["x-family-id"];
    let familyId = await resolveUserFamilyId(req.user);
    if (!familyId && familyHint) familyId = familyHint.toString();

    if (!familyId) {
      return res.status(200).json({
        totalExpenses : 0,
        totalOwedToMe : 0,
        totalIOwe     : 0,
        netBalance    : 0,
        dailyExpenses : [],
        balances      : [],
        categories    : [],
        recentExpenses: [],
        members       : [],
      });
    }

    let family = await checkMembership(familyId, userId);
    if (!family && familyHint && familyHint.toString() !== familyId.toString()) {
      // Second try with explicit hint when user profile is stale.
      const hintedFamily = await checkMembership(familyHint.toString(), userId);
      if (hintedFamily) {
        familyId = familyHint.toString();
        family = hintedFamily;
      } else {
        const canReadByExpenses = await hasUserExpensesInFamily(familyHint.toString(), userId);
        if (canReadByExpenses) {
          familyId = familyHint.toString();
          family = await Family.findById(familyId);
        } else {
          return res.status(403).json({ message: "Accès refusé" });
        }
      }
    } else if (!family) {
      const canReadByExpenses = await hasUserExpensesInFamily(familyId, userId);
      if (!canReadByExpenses) {
        return res.status(403).json({ message: "Accès refusé" });
      }
      family = await Family.findById(familyId);
    }
    const effectiveFamily = family || (await Family.findById(familyId));

    // ✅ Traitement des dépenses récurrentes avant de charger les dépenses
    try {
      await processRecurringExpenses(familyId);
    } catch (recErr) {
      console.error("Recurring expenses processing failed:", recErr);
      // On continue quand même pour ne pas bloquer le dashboard
    }

    const expenses = await Expense.find({ family_id: familyId })
      .populate("paid_by", "name email")
      .populate("participants.user_id", "name email")
      .sort({ date: 1 }); // Sort by date ascending to find the first one easily

    // Trouver la date de la toute première dépense de l'utilisateur dans ce groupe
    let firstExpenseDate = null;
    for (const exp of expenses) {
      const isParticipant = exp.participants.some(p => toObjectIdString(p.user_id) === userId);
      const isPayer = toObjectIdString(exp.paid_by) === userId;
      if (isParticipant || isPayer) {
        firstExpenseDate = new Date(exp.date);
        break;
      }
    }

    const now = new Date();
    let cycleStartDate = firstExpenseDate || new Date(now);
    cycleStartDate.setHours(0, 0, 0, 0);

    // Calculer le début du cycle actuel de 30 jours
    if (firstExpenseDate) {
      const diffTime = now.getTime() - firstExpenseDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const periods = Math.floor(diffDays / 30);
      cycleStartDate = new Date(firstExpenseDate);
      cycleStartDate.setDate(cycleStartDate.getDate() + (periods * 30));
    }
    cycleStartDate.setHours(0, 0, 0, 0);

    const cycleEndDate = new Date(cycleStartDate);
    cycleEndDate.setDate(cycleEndDate.getDate() + 30);

    let pendingCount = 0;
    let settledCount = 0;
    let totalMyExpenses = 0;
    let totalOwedToMe = 0;
    let totalIOwe     = 0;
    const balanceMap  = {};
    const catMap      = {};
    const dailyMap    = {};

    // Inverser pour les calculs de stats récentes si besoin, 
    // mais ici on va juste boucler sur tous pour les balances globales
    for (const exp of expenses) {
      const payerId = toObjectIdString(exp.paid_by);
      if (!payerId) continue;
      const iPaid   = payerId === userId;
      
      const myPart = exp.participants.find(
        (p) => toObjectIdString(p.user_id) === userId
      );
      
      // On ne compte que si l'utilisateur est impliqué
      if (myPart) {
        const myShare = myPart.shared_amount || 0;
        totalMyExpenses += myShare;
        
        if (myPart.paid) settledCount += 1;
        else pendingCount += 1;

        // On ne remplit dailyMap que si la dépense est dans le cycle actuel de 30 jours
        const expDate = new Date(exp.date);
        if (expDate >= cycleStartDate && expDate < cycleEndDate) {
          // Utiliser la date locale YYYY-MM-DD pour le regroupement
          const year = expDate.getFullYear();
          const month = String(expDate.getMonth() + 1).padStart(2, "0");
          const day = String(expDate.getDate()).padStart(2, "0");
          const dateKey = `${year}-${month}-${day}`;
          dailyMap[dateKey] = (dailyMap[dateKey] || 0) + myShare;
        }

        const cat = exp.category || "other";
        catMap[cat] = (catMap[cat] || 0) + myShare;
      }

      if (iPaid) {
        for (const p of exp.participants) {
          const pid = toObjectIdString(p.user_id);
          if (!pid) continue;
          if (pid === userId || p.paid) continue;
          totalOwedToMe += p.shared_amount || 0;
          if (!balanceMap[pid]) balanceMap[pid] = { name: p.user_id?.name || "Utilisateur", amount: 0 };
          balanceMap[pid].amount += p.shared_amount;
        }
      } else {
        if (myPart && !myPart.paid) {
          totalIOwe += myPart.shared_amount || 0;
          if (!balanceMap[payerId]) balanceMap[payerId] = { name: exp.paid_by?.name || "Utilisateur", amount: 0 };
          balanceMap[payerId].amount -= myPart.shared_amount;
        }
      }
    }

    const dailyExpenses = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(cycleStartDate);
      d.setDate(d.getDate() + i);
      const isFuture = d > now;
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const key = `${year}-${month}-${day}`;
      
      const dateLabel = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
      return { 
        day: i + 1, 
        amount: Math.round((dailyMap[key] || 0) * 100) / 100,
        dateLabel,
        isFuture
      };
    });

    const balances = Object.values(balanceMap)
      .filter((b) => b.amount !== 0)
      .map((b) => ({
        name  : b.name.split(" ")[0],
        amount: Math.round(b.amount * 100) / 100,
      }))
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

    const CATEGORY_LABELS = {
      food: "Courses",
      bills: "Factures",
      rent: "Loyer",
      utilities: "Charges",
      entertainment: "Loisirs",
      other: "Autres",
    };

    const catTotal = Object.values(catMap).reduce((a, b) => a + b, 0);
    let categories = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .map(([key, val]) => ({
        name: CATEGORY_LABELS[key] || key,
        val,
      }));

    // Si plus de 6 catégories, on groupe le reste dans "Autres"
    if (categories.length > 6) {
      const top = categories.slice(0, 5);
      const rest = categories.slice(5);
      const otherVal = rest.reduce((acc, curr) => acc + curr.val, 0);
      
      // On cherche si "Autres" existe déjà dans le top
      const otherIdx = top.findIndex(c => c.name === "Autres");
      if (otherIdx > -1) {
        top[otherIdx].val += otherVal;
        categories = top;
      } else {
        categories = [...top, { name: "Autres", val: otherVal }];
      }
    }

    // Calcul des pourcentages avec la méthode du plus grand reste pour assurer 100%
    if (catTotal > 0) {
      const withDecimals = categories.map(c => ({
        ...c,
        pctExact: (c.val / catTotal) * 100,
        pctFloor: Math.floor((c.val / catTotal) * 100)
      }));

      let currentSum = withDecimals.reduce((sum, c) => sum + c.pctFloor, 0);
      const diff = 100 - currentSum;

      if (diff > 0) {
        // Trier par la partie décimale décroissante
        const sortedByRemainder = [...withDecimals].sort((a, b) => {
          const remA = a.pctExact - a.pctFloor;
          const remB = b.pctExact - b.pctFloor;
          return remB - remA;
        });

        for (let i = 0; i < diff; i++) {
          const entry = sortedByRemainder[i];
          const originalIdx = withDecimals.findIndex(c => c.name === entry.name);
          withDecimals[originalIdx].pctFloor += 1;
        }
      }

      categories = withDecimals.map(c => ({
         name: c.name,
         pct: c.pctFloor,
         amount: Math.round(c.val * 100) / 100
       }));
    } else {
      categories = categories.map(c => ({ name: c.name, pct: 0 }));
    }

    const recentExpenses = [...expenses]
      .reverse() // Remettre dans l'ordre décroissant pour les dépenses récentes
      .filter(exp => exp.participants.some(p => toObjectIdString(p.user_id) === userId))
      .slice(0, 5)
      .map((exp) => {
      const iPaid  = toObjectIdString(exp.paid_by) === userId;
      const myPart = exp.participants.find(
        (p) => toObjectIdString(p.user_id) === userId
      );
      return {
        _id       : exp._id,
        title     : exp.title,
        category  : exp.category,
        date      : exp.date,
        paidByName: exp.paid_by.name,
        iPaid,
        myAmount  : myPart ? myPart.shared_amount : 0,
        status    : myPart ? (myPart.paid ? "settled" : "pending") : exp.status,
      };
    });

    const memberIds = (effectiveFamily?.members || []).map((m) => m.user_id);
    const users     = await User.find({ _id: { $in: memberIds } }).select("name");

    const members = await Promise.all(
      users.map(async (u) => {
        const lastExp = expenses.find(
          (e) => toObjectIdString(e.paid_by) === u._id.toString()
        );
        const daysAgo = lastExp
          ? Math.floor((Date.now() - new Date(lastExp.date)) / 86_400_000)
          : 999;
        return {
          _id        : u._id,
          name       : u.name,
          daysAgo,
          lastExpense: lastExp
            ? { title: lastExp.title, amount: lastExp.amount }
            : null,
        };
      })
    );

    res.json({
      totalExpenses : Math.round(totalMyExpenses * 100) / 100,
      totalOwedToMe : Math.round(totalOwedToMe * 100) / 100,
      totalIOwe     : Math.round(totalIOwe * 100) / 100,
      netBalance    : Math.round((totalOwedToMe - totalIOwe) * 100) / 100,
      statusSummary : {
        pending: pendingCount,
        settled: settledCount,
        settlementRate: (pendingCount + settledCount) ? Math.round((settledCount / (pendingCount + settledCount)) * 100) : 0,
      },
      topCategory: categories[0] || null,
      dailyExpenses,
      balances,
      categories,
      recentExpenses,
      members,
    });
  } catch (err) {
    console.error("getDashboardStats error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ─── Exports ──────────────────────────────────────────────────
module.exports = {
  createExpense,
  getExpensesByFamily,
  updateExpense,
  deleteExpense,
  getBalance,
  getHistory,
  payExpense,
  unpayExpense,
  approvePaymentRequest,
  rejectPaymentRequest,
  getDashboardStats,
};