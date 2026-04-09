const mongoose = require("mongoose");

const purchaseRequestSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, "Le nom du produit est requis"],
      trim: true,
    },
    estimatedPrice: {
      type: Number,
      required: [true, "Le prix estime est requis"],
      min: [0, "Le prix doit etre positif"],
    },
    urgency: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    storeLocation: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "completed", "cancelled"],
      default: "pending",
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
      required: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PurchaseRequest", purchaseRequestSchema);
