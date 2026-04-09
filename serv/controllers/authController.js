const jwt    = require("jsonwebtoken");
const crypto = require("crypto");
const { Resend } = require("resend");
const User   = require("../models/User");
const Family = require("../models/Family"); // ← nécessaire pour chercher le groupe

let resendClient = null;
const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

// ── Genere un token JWT ──
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// ── Helper : trouver le familyId d'un user ──
// Cherche d'abord dans user.family, sinon dans la collection Family
const resolveFamilyId = async (user) => {
  if (user.family) return user.family.toString();

  const family = await Family.findOne({ "members.user_id": user._id }).select("_id").lean();
  return family ? family._id.toString() : null;
};

// @POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email deja utilise" });
    }

    const user = await User.create({ name, email, password });
    const familyId = await resolveFamilyId(user); // null a la creation, pas encore de groupe

    res.status(201).json({
      _id:      user._id,
      name:     user.name,
      email:    user.email,
      avatar:   user.avatar,
      handle:   user.handle,
      familyId: familyId,          // ← inclus dans la reponse (null si pas de groupe)
      token:    generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    // ← Resoudre le familyId a chaque login
    const familyId = await resolveFamilyId(user);

    res.json({
      _id:      user._id,
      name:     user.name,
      email:    user.email,
      avatar:   user.avatar,
      handle:   user.handle,
      familyId: familyId,          // ← CLEF DU FIX : renvoye au frontend
      token:    generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/auth/me (protegee)
const getMe = async (req, res) => {
  try {
    const familyId = await resolveFamilyId(req.user);
    res.json({ ...req.user.toObject(), familyId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const resend = getResendClient();
    if (!resend) {
      return res.status(500).json({ message: "Configuration email manquante (RESEND_API_KEY)." });
    }

    const user = await User.findOne({ email });

    // Toujours répondre OK (sécurité anti-énumération)
    if (!user) {
      return res.status(200).json({ message: "Si ce compte existe, un email a été envoyé." });
    }

    // Générer le token
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken   = token;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 min
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const resetLink = `${frontendUrl}/reset-password/${token}`;

    // Envoyer avec Resend
    const { error } = await resend.emails.send({
      from: `FairSplit <${fromEmail}>`,
      to:   user.email,
      subject: "Réinitialisation de votre mot de passe - FairSplit",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#07101e;color:#e2e8f0;border-radius:12px;">
          <h2 style="color:#2dd4bf;margin-bottom:8px;">FairSplit</h2>
          <p>Bonjour <strong>${user.name}</strong>,</p>
          <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
          <a href="${resetLink}"
             style="display:inline-block;margin:24px 0;padding:12px 28px;background:#2dd4bf;color:#07101e;border-radius:8px;font-weight:700;text-decoration:none;">
            Réinitialiser mon mot de passe
          </a>
          <p style="color:#94a3b8;font-size:13px;">
            Ce lien expire dans <strong>15 minutes</strong>.<br>
            Si vous n'avez pas fait cette demande, ignorez cet email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      // Le token ne doit pas rester actif si l'email n'est pas parti.
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      const reason = error.message || error.name || "Vérifiez RESEND_API_KEY, RESEND_FROM_EMAIL et le domaine Resend.";
      return res.status(500).json({ message: `Erreur envoi email: ${reason}` });
    }

    res.status(200).json({ message: "Email envoyé." });

  } catch (error) {
    console.error("forgotPassword error:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// @POST /api/auth/reset-password/:token
const resetPassword = async (req, res) => {
  try {
    const token = (req.params.token || "").trim();
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Lien invalide." });
    }
    if (!password || String(password).trim().length < 6) {
      return res.status(400).json({ message: "Mot de passe trop court (min 6 caractères)." });
    }

    const user = await User.findOne({
      resetPasswordToken:   token,
      resetPasswordExpires: { $gt: Date.now() }, // token encore valide
    });

    if (!user) {
      return res.status(400).json({ message: "Lien invalide ou expiré." });
    }

    user.password             = password; // le pre-save hook va hasher
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (error) {
    console.error("resetPassword error:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword };