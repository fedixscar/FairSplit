const express = require("express");
const router = express.Router();
const { getGroups, createGroup, addMember, deleteGroup } = require("../controllers/groupController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/").get(getGroups).post(createGroup);
router.route("/:id").delete(deleteGroup);
router.post("/:id/members", addMember);

module.exports = router;
