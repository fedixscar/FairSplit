const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const familySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom de la famille est requis"],
      trim: true,
    },
    icon: {
      type: String,
      default: "👥",
    },
    code: {
      type: String,
      unique: true,
      default: () => uuidv4().slice(0, 8).toUpperCase(),
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["chef", "mod", "member"],  // ✅ mod ajoute
          default: "member",
        },
      },
    ],
    pending_members: [
      {
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        requested_at: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Family", familySchema);