const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

// GET /api/budget
router.get('/', auth, async (req, res) => {
  try {
    let budget = await Budget.findOne({ user: req.user._id });
    if (!budget) budget = await Budget.create({ user: req.user._id });

    // Compute current month spending
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const spending = await Transaction.aggregate([
      { $match: { user: req.user._id, date: { $gte: startOfMonth } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]);

    const spendMap = {};
    let totalSpent = 0;
    spending.forEach(s => { spendMap[s._id] = s.total; totalSpent += s.total; });

    // Generate notifications
    const notifications = [];
    const totalPct = budget.totalMonthly ? Math.round(totalSpent / budget.totalMonthly * 100) : 0;
    if (totalPct >= budget.alertThresholds.danger) {
      notifications.push({ type: 'danger', message: `⚠️ You've used ${totalPct}% of your monthly budget!`, category: 'total' });
    } else if (totalPct >= budget.alertThresholds.warning) {
      notifications.push({ type: 'warning', message: `You've used ${totalPct}% of your monthly budget.`, category: 'total' });
    }
    Object.entries(budget.categories.toObject ? budget.categories.toObject() : budget.categories).forEach(([cat, limit]) => {
      const spent = spendMap[cat] || 0;
      const pct = limit ? Math.round(spent / limit * 100) : 0;
      if (pct >= budget.alertThresholds.danger) {
        notifications.push({ type: 'danger', message: `${cat} spending at ${pct}% of limit!`, category: cat });
      } else if (pct >= budget.alertThresholds.warning) {
        notifications.push({ type: 'warning', message: `${cat} spending approaching limit (${pct}%).`, category: cat });
      }
    });

    res.json({ budget, totalSpent, spendByCategory: spendMap, notifications, totalPct });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/budget
router.patch('/', auth, async (req, res) => {
  try {
    const { totalMonthly, categories, alertThresholds, notificationsEnabled } = req.body;
    const update = {};
    if (totalMonthly !== undefined) update.totalMonthly = totalMonthly;
    if (categories) update.categories = categories;
    if (alertThresholds) update.alertThresholds = alertThresholds;
    if (notificationsEnabled !== undefined) update.notificationsEnabled = notificationsEnabled;

    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id },
      { $set: update },
      { new: true, upsert: true }
    );
    res.json({ budget });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
