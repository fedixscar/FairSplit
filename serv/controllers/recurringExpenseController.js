const mongoose = require("mongoose");
const RecurringExpense = require("../models/RecurringExpense");
const Expense = require("../models/Expense");
const Family = require("../models/Family");
const Counter = require("../models/Counter");
const Notification = require("../models/Notification");

// ─── Helpers ──────────────────────────────────────────────────
const checkMembership = async (familyId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(familyId)) return null;
  const family = await Family.findById(familyId);
  if (!family) return null;
  const isMember = family.members.some(
    (m) => m.user_id.toString() === userId.toString()
  );
  return isMember ? family : null;
};

const getMemberRole = (family, userId) => {
  const member = (family?.members || []).find(
    (m) => m.user_id.toString() === userId.toString()
  );
  return member?.role || null;
};

const isAdmin = (role) => role === "chef";

const addTime = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

// ─── Controller Methods ───────────────────────────────────────

// @POST /api/recurring-expenses
const createRecurringExpense = async (req, res) => {
  try {
    const { title, amount, family_id, category, repeatIntervalDays, startDate, participants } = req.body;
    const userId = req.user._id;

    const interval = parseInt(repeatIntervalDays) || 30;

    const family = await checkMembership(family_id, userId);
    if (!family) return res.status(403).json({ message: "Famille introuvable ou acces refuse" });

    const role = getMemberRole(family, userId);
    if (!isAdmin(role)) {
        return res.status(403).json({ message: "Seul l'admin (chef) peut gerer les depenses recurrentes" });
      }

    const start = startDate ? new Date(startDate) : new Date();
    // On recule un peu la date de debut si elle est aujourd'hui pour etre sur qu'elle soit incluse
    const normalizedStart = new Date(start);
    normalizedStart.setSeconds(0);
    normalizedStart.setMilliseconds(0);

    // ✅ Restaurer le calcul automatique des participants (tout le monde si vide)
    let finalParticipants = participants;
    if (!finalParticipants || finalParticipants.length === 0) {
      const share = amount / family.members.length;
      finalParticipants = family.members.map(m => ({
        user_id: m.user_id,
        shared_amount: parseFloat(share.toFixed(2))
      }));
    } else {
      // S'assurer que les montants sont bien repartis sur les participants selectionnes
      const share = amount / finalParticipants.length;
      finalParticipants = finalParticipants.map(p => ({
        user_id: p.user_id,
        shared_amount: parseFloat(share.toFixed(2))
      }));
    }

    const recurring = await RecurringExpense.create({
      title,
      amount,
      paid_by: userId,
      family_id,
      category: category || "other",
      repeatIntervalDays: interval,
      startDate: normalizedStart,
      nextOccurrence: normalizedStart,
      participants: finalParticipants,
      active: true
    });

    console.log(`[Recurring] Created rule "${title}". Force triggering process...`);

    // ✅ Declencher immediatement la creation
    await processRecurringExpenses(family_id);

    res.status(201).json(recurring);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/recurring-expenses/:familyId
const getRecurringExpenses = async (req, res) => {
  try {
    const { familyId } = req.params;
    const userId = req.user._id;

    const family = await checkMembership(familyId, userId);
    if (!family) return res.status(403).json({ message: "Accès refusé" });

    const recurrings = await RecurringExpense.find({ family_id: familyId })
      .populate("paid_by", "name")
      .populate("participants.user_id", "name");

    res.json(recurrings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/recurring-expenses/:id
const deleteRecurringExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const recurring = await RecurringExpense.findById(id);
    if (!recurring) return res.status(404).json({ message: "Dépense récurrente introuvable" });

    const family = await Family.findById(recurring.family_id);
    const role = getMemberRole(family, userId);

    if (!isAdmin(role)) {
      return res.status(403).json({ message: "Seul l'admin (chef) peut supprimer une dépense récurrente" });
    }

    // ✅ Suppression en cascade améliorée
    // On supprime par recurring_id (pour les nouvelles)
    // ET par titre "(Auto)" si le titre correspond (pour les anciennes sans recurring_id)
    await Expense.deleteMany({
      $or: [
        { recurring_id: id },
        { 
          family_id: recurring.family_id,
          title: `${recurring.title} (Auto)`,
          amount: recurring.amount
        }
      ]
    });

    await RecurringExpense.findByIdAndDelete(id);
    res.json({ message: "Dépense récurrente et ses occurrences supprimées" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Worker Method (triggered by middleware or dashboard) ─────
const processRecurringExpenses = async (familyId) => {
  try {
    const now = new Date();
    // On prend une marge très large de 12h pour éviter tout problème de timezone
    // Si nextOccurrence est <= maintenant + 12h, on génère.
    const triggerTime = new Date(now.getTime() + 12 * 60 * 60 * 1000); 

    console.log(`[Recurring] Processing for family ${familyId} at ${now.toISOString()}`);

    const recurrings = await RecurringExpense.find({
      family_id: familyId,
      active: true,
      nextOccurrence: { $lte: triggerTime }
    });

    if (!recurrings.length) {
      console.log(`[Recurring] No pending recurrings for family ${familyId}`);
      return;
    }

    for (const rec of recurrings) {
      console.log(`[Recurring] Rule "${rec.title}" (Next: ${rec.nextOccurrence.toISOString()})`);
      
      let safetyCount = 0;
      while (rec.nextOccurrence <= triggerTime) {
        // ✅ Vérifier si une dépense pour cette règle et cette occurrence existe déjà
        // On cherche une dépense avec le même recurring_id et dont la date est proche de nextOccurrence
        // (Marge de 1h pour être sûr)
        const dateMin = new Date(rec.nextOccurrence.getTime() - 60 * 60 * 1000);
        const dateMax = new Date(rec.nextOccurrence.getTime() + 60 * 60 * 1000);
        
        const alreadyExists = await Expense.findOne({
          recurring_id: rec._id,
          date: { $gte: dateMin, $lte: dateMax }
        });

        if (alreadyExists) {
          console.log(`[Recurring] Expense already exists for ${rec.title} at ${rec.nextOccurrence.toISOString()}. Skipping.`);
          rec.lastOccurrence = rec.nextOccurrence;
          rec.nextOccurrence = addTime(rec.nextOccurrence, rec.repeatIntervalDays);
          await rec.save(); // On met quand même à jour la règle pour passer à la suivante
          continue;
        }

        const participants = rec.participants.map(p => {
          // Extraire l'ID que ce soit un objet ou un string
          const pId = p.user_id?._id || p.user_id;
          const isPayer = pId.toString() === rec.paid_by.toString();
          
          return {
            user_id: pId,
            shared_amount: p.shared_amount,
            paid: isPayer,
            payment_request_status: isPayer ? "approved" : "none",
            payment_reviewed_at: isPayer ? new Date() : null,
            payment_reviewed_by: isPayer ? rec.paid_by : null
          };
        });

        const allPaid = participants.every(p => p.paid);

        // ✅ Utiliser la date théorique de l'occurrence au lieu de "now"
        // pour éviter les doublons si on relance le worker le même jour
        const expenseDate = rec.nextOccurrence;

        // ✅ Générer ID de ticket séquentiel (FSTXXXXXX)
        const counter = await Counter.findOneAndUpdate(
          { id: "expense_ticket" },
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );
        const ticketId = `FST${String(counter.seq).padStart(6, "0")}`;

        const newExpense = await Expense.create({
          title: `${rec.title} (Auto)`,
          amount: rec.amount,
          paid_by: rec.paid_by,
          family_id: rec.family_id,
          date: expenseDate,
          category: rec.category,
          recurring_id: rec._id,
          participants,
          status: allPaid ? "settled" : "pending",
          ticket_id: ticketId
        });

        console.log(`[Recurring] Generated expense ID: ${newExpense._id} for date: ${expenseDate.toISOString()}`);

        rec.lastOccurrence = rec.nextOccurrence;
        rec.nextOccurrence = addTime(rec.nextOccurrence, rec.repeatIntervalDays);
        
        // ✅ Sauvegarder à chaque itération pour éviter les doublons en cas de crash
        await rec.save();

        safetyCount++;
        if (safetyCount > 10) break; // Sécurité anti-boucle infinie
      }
    }
  } catch (err) {
    console.error("[Recurring] CRITICAL ERROR:", err);
  }
};

module.exports = {
  createRecurringExpense,
  getRecurringExpenses,
  deleteRecurringExpense,
  processRecurringExpenses
};
