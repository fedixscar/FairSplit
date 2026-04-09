const express = require("express");
const router  = express.Router();
const {
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
} = require("../controllers/familyController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

// ── Notifications ──
router.get("/notifications",        getNotifications);      // ← AVANT /:id
router.patch("/notifications/read", markNotificationsRead); // ← AVANT /:id
router.delete("/notifications",     clearNotifications);     // ← AVANT /:id
router.get("/:id",                  getFamilyById);         // ← EN DERNIER

// ── Familles ──
router.get("/",                                    getMyFamilies);
router.post("/",                                   createFamily);
router.post("/join",                               joinFamily);
router.post("/:id/leave",                          leaveFamily);
router.delete("/:id",                              deleteFamily);          // ✅ supprimer groupe

// ── Members admin ──
router.delete("/:id/members/:memberId",            removeMember);          // ✅ virer membre
router.post("/:id/ping/:memberId",                 pingMember);            // ✅ ping
router.patch("/:id/members/:memberId/role",        updateMemberRole);      // ✅ promouvoir/retrograder
router.post("/:id/requests/:userId",               handleJoinRequest);     // ✅ approuver/rejeter demande

// ── Detail ── (EN DERNIER pour ne pas capturer les routes statiques)
router.get("/:id",                                 getFamilyById);

module.exports = router;