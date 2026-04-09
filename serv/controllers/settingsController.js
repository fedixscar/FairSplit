const User = require("../models/User");
const bcrypt = require("bcryptjs");

// @PUT /api/settings/profile
const updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, avatar },
      { new: true, runValidators: true }
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PUT /api/settings/password
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Mot de passe actuel incorrect" });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: "Mot de passe mis a jour" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/settings/account
const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: "Compte supprime" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { updateProfile, updatePassword, deleteAccount };
