const mongoose = require("mongoose");

const recurringExpenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Le titre est requis"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Le montant est requis"],
      min: [0, "Le montant doit etre positif"],
    },
    paid_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    family_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
      required: true,
    },
    category: {
      type: String,
      enum: ["food", "rent", "entertainment", "utilities", "bills", "other"],
      default: "other",
    },
    repeatIntervalDays: {
      type: Number,
      required: [true, "L'intervalle de repetition est requis"],
      min: [1, "L'intervalle doit etre d'au moins 1 jour"],
      default: 30,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    lastOccurrence: {
      type: Date,
      default: null,
    },
    nextOccurrence: {
      type: Date,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    participants: [
      {
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        shared_amount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("RecurringExpense", recurringExpenseSchema);
