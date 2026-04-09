const Group = require("../models/Group");

// @GET /api/groups
const getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate("members", "name email")
      .populate("createdBy", "name email");
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/groups
const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    const group = await Group.create({
      name,
      description,
      createdBy: req.user._id,
      members: [req.user._id],
    });
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/groups/:id/members
const addMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Groupe introuvable" });

    if (!group.members.includes(req.body.userId)) {
      group.members.push(req.body.userId);
      await group.save();
    }
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/groups/:id
const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!group) return res.status(404).json({ message: "Groupe introuvable" });
    res.json({ message: "Groupe supprime" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getGroups, createGroup, addMember, deleteGroup };
