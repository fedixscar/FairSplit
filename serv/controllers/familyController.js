const Family       = require("../models/Family");
const Notification = require("../models/Notification");

// ── Helper : verifier le role d'un user dans une famille ──
const getMemberRole = (family, userId) => {
  const m = family.members.find((m) => {
    const uid = m.user_id?._id
      ? m.user_id._id.toString()
      : m.user_id.toString();
    return uid === userId.toString();
  });
  return m ? m.role : null;
};

const isAdminOrMod = (role) => role === "chef" || role === "mod";
// @POST /api/families — creer une famille
const createFamily = async (req, res) => {
  try {
    const { name, icon } = req.body;
    const family = await Family.create({
      name,
      icon,
      created_by: req.user._id,
      members: [{ user_id: req.user._id, role: "chef" }],
    });
    const populated = await Family.findById(family._id)
      .populate("members.user_id", "name email avatar")
      .populate("created_by", "name email avatar");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/families/join — rejoindre via code
const joinFamily = async (req, res) => {
  try {
    const { code } = req.body;
    const family = await Family.findOne({ code });
    if (!family) return res.status(404).json({ message: "Code groupe invalide" });

    const alreadyMember = family.members.some(
      (m) => m.user_id.toString() === req.user._id.toString()
    );
    if (alreadyMember) return res.status(400).json({ message: "Vous etes deja membre de ce groupe" });

    const alreadyRequested = family.pending_members.some(
      (m) => m.user_id.toString() === req.user._id.toString()
    );
    if (alreadyRequested) return res.status(400).json({ message: "Demande deja envoyee en attente de validation" });

    family.pending_members.push({ user_id: req.user._id });
    await family.save();

    // Notifier le chef et les moderateurs
    const admins = family.members.filter(m => isAdminOrMod(m.role));
    const notifications = admins.map(admin => ({
      to: admin.user_id,
      from: req.user._id,
      family: family._id,
      type: "join_request",
      message: `${req.user.name} souhaite rejoindre le groupe "${family.name}".`,
    }));

    if (notifications.length > 0) {
      const createdNotifs = await Notification.insertMany(notifications);
      if (req.io) {
        createdNotifs.forEach(notif => {
          req.io.to(`user_${notif.to}`).emit("notification", {
            _id: notif._id,
            type: notif.type,
            message: notif.message,
            family: { _id: family._id, name: family.name },
            from: { name: req.user.name, avatar: req.user.avatar },
            createdAt: notif.createdAt,
          });
        });
      }
    }

    res.json({ message: "Demande envoyee avec succes. En attente de validation par l'administrateur." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/families/:id/requests/:userId — approuver ou rejeter une demande
const handleJoinRequest = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { action } = req.body; // "approve" ou "reject"

    const family = await Family.findById(id);
    if (!family) return res.status(404).json({ message: "Groupe introuvable" });

    const myRole = getMemberRole(family, req.user._id);
    if (!isAdminOrMod(myRole)) return res.status(403).json({ message: "Seul l'admin ou un moderateur peut gerer les demandes" });

    const requestIndex = family.pending_members.findIndex(m => m.user_id.toString() === userId);
    if (requestIndex === -1) return res.status(404).json({ message: "Demande introuvable" });

    if (action === "approve") {
      family.members.push({ user_id: userId, role: "member" });
    }
    
    // Dans tous les cas (approve ou reject), on retire de la liste d'attente
    family.pending_members.splice(requestIndex, 1);
    await family.save();

    // Notifier l'utilisateur de la décision
    const message = action === "approve" 
      ? `Votre demande pour rejoindre le groupe "${family.name}" a été acceptée.`
      : `Votre demande pour rejoindre le groupe "${family.name}" a été refusée.`;

    const notif = await Notification.create({
      to: userId,
      from: req.user._id,
      family: family._id,
      type: action === "approve" ? "request_approved" : "request_rejected",
      message,
    });

    if (req.io) {
      req.io.to(`user_${userId}`).emit("notification", {
        _id: notif._id,
        type: notif.type,
        message: notif.message,
        family: { _id: family._id, name: family.name },
        createdAt: notif.createdAt,
      });
    }

    const populated = await Family.findById(family._id)
      .populate("members.user_id", "name email avatar")
      .populate("pending_members.user_id", "name email avatar")
      .populate("created_by", "name email avatar");
    
    res.json({ 
      message: action === "approve" ? "Demande acceptée" : "Demande refusée",
      family: populated 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/families/:id/leave — quitter une famille
const leaveFamily = async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);
    if (!family) return res.status(404).json({ message: "Famille introuvable" });

    const isMember = family.members.some(
      (m) => m.user_id.toString() === req.user._id.toString()
    );
    if (!isMember) return res.status(400).json({ message: "Vous n'êtes pas membre" });

    if (family.members.length === 1) {
      await Family.findByIdAndDelete(req.params.id);
      return res.json({ message: "Groupe supprimé" });
    }

    const isChef = getMemberRole(family, req.user._id) === "chef";
    if (isChef) {
      const next = family.members.find(
        (m) => m.user_id.toString() !== req.user._id.toString()
      );
      if (next) next.role = "chef";
    }

    family.members = family.members.filter(
      (m) => m.user_id.toString() !== req.user._id.toString()
    );
    await family.save();
    res.json({ message: "Vous avez quitté le groupe" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/families/:id — supprimer le groupe (chef uniquement)
const deleteFamily = async (req, res) => {
  try {
    const family = await Family.findById(req.params.id)
      .populate("members.user_id", "name email avatar");
    if (!family) return res.status(404).json({ message: "Famille introuvable" });

    const role = getMemberRole(family, req.user._id);
    if (role !== "chef") return res.status(403).json({ message: "Seul le chef peut supprimer le groupe" });

    // Notifier tous les autres membres
    const notifications = family.members
      .filter((m) => m.user_id._id.toString() !== req.user._id.toString())
      .map((m) => ({
        to:      m.user_id._id,
        from:    req.user._id,
        family:  family._id,
        type:    "group_deleted",
        message: `Le groupe "${family.name}" a été supprimé par l'admin.`,
      }));

    if (notifications.length > 0) {
      const created = await Notification.insertMany(notifications);
      // Émettre via Socket.io
      if (req.io) {
        created.forEach((notif) => {
          req.io.to(`user_${notif.to}`).emit("notification", {
            _id:     notif._id,
            type:    notif.type,
            message: notif.message,
            family:  { _id: family._id, name: family.name },
            createdAt: notif.createdAt,
          });
        });
      }
    }

    await Family.findByIdAndDelete(req.params.id);
    res.json({ message: "Groupe supprimé" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/families/:id/members/:memberId — supprimer un membre (chef ou mod)
const removeMember = async (req, res) => {
  try {
    const family = await Family.findById(req.params.id)
      .populate("members.user_id", "name email avatar");
    if (!family) return res.status(404).json({ message: "Famille introuvable" });

    const myRole     = getMemberRole(family, req.user._id);
    const targetRole = getMemberRole(family, req.params.memberId);

    if (!isAdminOrMod(myRole)) return res.status(403).json({ message: "Accès refusé" });
    if (!targetRole)           return res.status(404).json({ message: "Membre introuvable" });

    // Un mod ne peut pas supprimer un chef ou un autre mod
    if (myRole === "mod" && (targetRole === "chef" || targetRole === "mod")) {
      return res.status(403).json({ message: "Un modérateur ne peut pas supprimer un admin ou un autre modérateur" });
    }
    // Un chef ne peut pas se supprimer lui-même
    if (req.params.memberId === req.user._id.toString()) {
      return res.status(400).json({ message: "Quittez le groupe plutôt que de vous supprimer" });
    }

    family.members = family.members.filter(
      (m) => m.user_id._id.toString() !== req.params.memberId
    );
    await family.save();

    // Notifier le membre supprimé
    const notif = await Notification.create({
      to:      req.params.memberId,
      from:    req.user._id,
      family:  family._id,
      type:    "removed",
      message: `Vous avez été retiré du groupe "${family.name}" par un administrateur.`,
    });

    if (req.io) {
      req.io.to(`user_${req.params.memberId}`).emit("notification", {
        _id:     notif._id,
        type:    notif.type,
        message: notif.message,
        family:  { _id: family._id, name: family.name },
        createdAt: notif.createdAt,
      });
    }

    const populated = await Family.findById(family._id)
      .populate("members.user_id", "name email avatar")
      .populate("pending_members.user_id", "name email avatar")
      .populate("created_by", "name email avatar");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/families/:id/ping/:memberId — pinger un membre (chef ou mod)
const pingMember = async (req, res) => {
  try {
    const family = await Family.findById(req.params.id)
      .populate("members.user_id", "name email avatar");
    if (!family) return res.status(404).json({ message: "Famille introuvable" });

    const myRole = getMemberRole(family, req.user._id);
    if (!isAdminOrMod(myRole)) return res.status(403).json({ message: "Accès refusé" });

    const targetMember = family.members.find(
      (m) => m.user_id._id.toString() === req.params.memberId
    );
    if (!targetMember) return res.status(404).json({ message: "Membre introuvable" });

    const senderName = family.members.find(
      (m) => m.user_id._id.toString() === req.user._id.toString()
    )?.user_id?.name || "Un admin";

    const notif = await Notification.create({
      to:      req.params.memberId,
      from:    req.user._id,
      family:  family._id,
      type:    "ping",
      message: `${senderName} vous rappelle de régler vos dépenses dans le groupe "${family.name}".`,
    });

    if (req.io) {
      req.io.to(`user_${req.params.memberId}`).emit("notification", {
        _id:     notif._id,
        type:    notif.type,
        message: notif.message,
        family:  { _id: family._id, name: family.name },
        from:    { name: senderName },
        createdAt: notif.createdAt,
      });
    }

    res.json({ message: "Ping envoyé" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PATCH /api/families/:id/members/:memberId/role — promouvoir/rétrograder (chef uniquement)
const updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body; // "mod" ou "member"
    if (!["mod", "member"].includes(role)) {
      return res.status(400).json({ message: "Rôle invalide (mod ou member)" });
    }

    const family = await Family.findById(req.params.id)
      .populate("members.user_id", "name email avatar");
    if (!family) return res.status(404).json({ message: "Famille introuvable" });

    const myRole = getMemberRole(family, req.user._id);
    if (myRole !== "chef") return res.status(403).json({ message: "Seul le chef peut changer les rôles" });

    const target = family.members.find(
      (m) => m.user_id._id.toString() === req.params.memberId
    );
    if (!target)            return res.status(404).json({ message: "Membre introuvable" });
    if (target.role === "chef") return res.status(400).json({ message: "Impossible de changer le rôle du chef" });

    target.role = role;
    await family.save();

    // Notifier le membre promu
    const senderName = family.members.find(
      (m) => m.user_id._id.toString() === req.user._id.toString()
    )?.user_id?.name || "L'admin";

    const message = role === "mod"
      ? `${senderName} vous a promu Modérateur dans le groupe "${family.name}".`
      : `Votre rôle a été modifié à Membre dans le groupe "${family.name}".`;

    const notif = await Notification.create({
      to:      req.params.memberId,
      from:    req.user._id,
      family:  family._id,
      type:    "promoted",
      message,
    });

    if (req.io) {
      req.io.to(`user_${req.params.memberId}`).emit("notification", {
        _id:     notif._id,
        type:    notif.type,
        message: notif.message,
        family:  { _id: family._id, name: family.name },
        createdAt: notif.createdAt,
      });
    }

    const populated = await Family.findById(family._id)
      .populate("members.user_id", "name email avatar")
      .populate("created_by", "name email avatar");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/families
const getMyFamilies = async (req, res) => {
  try {
    const families = await Family.find({ "members.user_id": req.user._id })
      .populate("members.user_id", "name email avatar")
      .populate("pending_members.user_id", "name email avatar")
      .populate("created_by", "name email avatar");
    res.json(families);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET 
const getFamilyById = async (req, res) => {
  try {
    const family = await Family.findById(req.params.id)
      .populate("members.user_id", "name email avatar")
      .populate("pending_members.user_id", "name email avatar")
      .populate("created_by", "name email avatar");
    if (!family) return res.status(404).json({ message: "Famille introuvable" });

    const isMember = family.members.some(
      (m) => m.user_id._id.toString() === req.user._id.toString()
    );
    if (!isMember) return res.status(403).json({ message: "Accès refusé" });

    res.json(family);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET
const getNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find({ to: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("from", "name avatar")
      .populate("family", "name");
    res.json(notifs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ to: req.user._id, read: false }, { read: true });
    res.json({ message: "Notifications marquées comme lues" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const clearNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ to: req.user._id });
    res.json({ message: "Notifications supprimées" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createFamily,
  joinFamily,
  leaveFamily,
  deleteFamily,
  removeMember,
  pingMember,
  updateMemberRole,
  getMyFamilies,
  getFamilyById,
  getNotifications,
  markNotificationsRead,
  clearNotifications,
  handleJoinRequest,
};