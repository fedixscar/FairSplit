const express = require("express");
const router = express.Router();
const purchaseController = require("../controllers/purchaseController");
const { protect } = require("../middleware/authMiddleware");

// Toutes les routes sont protegees par authMiddleware
router.use(protect);

router.get("/", purchaseController.getPurchases);
router.post("/", purchaseController.createPurchase);
router.put("/:id/accept", purchaseController.acceptPurchase);
router.put("/:id/complete", purchaseController.completePurchase);
router.delete("/:id", purchaseController.deletePurchase);

module.exports = router;
