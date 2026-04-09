const Expense = require("../models/Expense");

// @GET /api/history  — retourne toutes les depenses triees par date
const getHistory = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    const filter = { user: req.user._id };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (category) filter.category = category;

    const history = await Expense.find(filter).sort({ date: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getHistory };
