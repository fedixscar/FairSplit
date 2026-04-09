const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    resetPasswordToken:   { type: String },
    resetPasswordExpires: { type: Date },

    name: {
      type:     String,
      required: [true, "Le nom est requis"],
      trim:     true,
    },
    handle: {
      type:    String,
      trim:    true,
      default: "",
    },
    email: {
      type:      String,
      required:  [true, "L'email est requis"],
      unique:    true,
      lowercase: true,
      trim:      true,
    },
    password: {
      type:      String,
      required:  [true, "Le mot de passe est requis"],
      minlength: 6,
      select:    false,
    },
    // Photo de profil stockee en base64 dans MongoDB
    avatar: {
      type:    String, // "data:image/jpeg;base64,..."
      default: "",
    },
    // ← AJOUT : reference vers le groupe de l'utilisateur
    family: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "Family",
      default: null,
    },
    preferences: {
      language: {
        type:    String,
        enum:    ["en", "fr", "ar"],
        default: "en",
      },
      currency: {
        type:    String,
        enum:    ["TND", "EUR", "USD"],
        default: "TND",
      },
      notifications: {
        type:    Boolean,
        default: true,
      },
    },
  },
  { timestamps: true }
);

// ── Hash password avant save ──
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Genere le handle automatiquement quand name change ──
userSchema.pre("save", function (next) {
  if (!this.isModified("name")) return next();
  this.handle = "@" + this.name.trim().toLowerCase().replace(/\s+/g, ".");
  next();
});

// ── matchPassword ──
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);