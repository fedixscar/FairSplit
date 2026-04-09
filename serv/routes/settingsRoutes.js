const express = require("express");
const router  = express.Router();
const User    = require("../models/User");

// ─────────────────────────────────────────────────────────────
// GET /api/settings/profile
// ─────────────────────────────────────────────────────────────
router.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/settings/profile
// Body: { name }
// ─────────────────────────────────────────────────────────────
router.put("/profile", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: "Le nom est requis" });
    }

    const handle = "@" + name.trim().toLowerCase().replace(/\s+/g, ".");

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim(), handle },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/settings/avatar
// Stocke la photo en base64 dans MongoDB
// Body: { avatar: "data:image/jpeg;base64,..." }
// Limite : 500 KB après compression côté client
// ─────────────────────────────────────────────────────────────
router.post("/avatar", async (req, res) => {
  console.log("POST /api/settings/avatar reached");
  try {
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({ message: "Aucune image fournie" });
    }

    // Verifie que c'est bien un base64 image valide
    if (!avatar.startsWith("data:image/")) {
      return res.status(400).json({ message: "Format d'image invalide" });
    }

    // Limite taille : ~500 KB en base64 ≈ 680 000 chars
    if (avatar.length > 700000) {
      return res.status(400).json({ message: "Image trop lourde (max 500 KB)" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });
    res.json({ avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/settings/avatar
// Supprime la photo de profil
// ─────────────────────────────────────────────────────────────
router.delete("/avatar", async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { avatar: "" });
    res.json({ message: "Photo supprimee" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/settings/preferences
// Body: { language?, currency?, notifications? }
// ─────────────────────────────────────────────────────────────
router.put("/preferences", async (req, res) => {
  try {
    const { language, currency, notifications } = req.body;

    const updates = {};
    if (language      !== undefined) updates["preferences.language"]      = language;
    if (currency      !== undefined) updates["preferences.currency"]      = currency;
    if (notifications !== undefined) updates["preferences.notifications"] = notifications;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/settings/password
// Body: { currentPassword, newPassword }
// ─────────────────────────────────────────────────────────────
router.put("/password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Les deux mots de passe sont requis" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Minimum 6 caractères" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Mot de passe actuel incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Mot de passe mis à jour avec succès" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/settings/verify-password
// Body: { password }
// ─────────────────────────────────────────────────────────────
router.post("/verify-password", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: "Mot de passe requis" });

    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Mot de passe incorrect" });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/settings/account
// Body: { password }
// ─────────────────────────────────────────────────────────────
router.delete("/account", async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Mot de passe requis" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mot de passe incorrect" });
    }

    // Supprimer l'utilisateur
    await User.findByIdAndDelete(req.user._id);

    res.json({ message: "Compte supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

module.exports = router;