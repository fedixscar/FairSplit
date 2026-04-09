const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
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
  getDashboardStats,   // ← NOUVEAU
} = require("../controllers/expenseController");

const {
  createRecurringExpense,
  getRecurringExpenses,
  deleteRecurringExpense
} = require("../controllers/recurringExpenseController");

// ⚠️  /dashboard AVANT /:familyId pour eviter le conflit de route
router.get("/dashboard", protect, getDashboardStats);

// ─── Recurring Expenses ───
router.post  ("/recurring",           protect, createRecurringExpense);
router.get   ("/recurring/:familyId", protect, getRecurringExpenses);
router.delete("/recurring/:id",       protect, deleteRecurringExpense);

router.post  ("/",                    protect, createExpense);
router.get   ("/:familyId",           protect, getExpensesByFamily);
router.put   ("/:id",                 protect, updateExpense);
router.delete("/:id",                 protect, deleteExpense);
router.get   ("/:familyId/balance",   protect, getBalance);
router.get   ("/:familyId/history",   protect, getHistory);
router.patch ("/:id/pay",             protect, payExpense);
router.patch ("/:id/unpay",           protect, unpayExpense);
router.patch ("/:id/payments/:participantId/approve", protect, approvePaymentRequest);
router.patch ("/:id/payments/:participantId/reject",  protect, rejectPaymentRequest);

module.exports = router;