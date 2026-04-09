const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      default: Date.now,
    },
    category: {
      type: String,
      enum: ["food", "rent", "entertainment", "utilities", "bills", "other"],
      default: "other",
    },
    status: {
      type: String,
      enum: ["pending", "settled"],
      default: "pending",
    },
    // ✅ Recu stocke en base64
    receipt: {
      type: String,   // "data:image/jpeg;base64,..."
      default: "",
    },
    // ✅ Pour lier une depense a sa source recurrente
    recurring_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecurringExpense",
      default: null,
    },
    // ✅ ID de ticket sequentiel (format FSTXXXXXX)
    ticket_id: {
      type: String,
      unique: true,
      sparse: true,
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
        paid: {
          type: Boolean,
          default: false,
        },
        payment_request_status: {
          type: String,
          enum: ["none", "pending", "approved", "rejected"],
          default: "none",
        },
        payment_requested_at: {
          type: Date,
          default: null,
        },
        payment_reviewed_at: {
          type: Date,
          default: null,
        },
        payment_reviewed_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);