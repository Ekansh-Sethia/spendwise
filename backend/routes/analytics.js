const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');

// GET /api/analytics/trend?period=week|biweek|month
router.get('/trend', auth, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const now = new Date();
    let days = period === 'week' ? 7 : period === 'biweek' ? 14 : 30;
    const start = new Date(now);
    start.setDate(now.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);

    const transactions = await Transaction.find({
      user: req.user._id,
      date: { $gte: start, $lte: now }
    }).select('amount date category');

    // Group by day
    const dayMap = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dayMap[key] = { date: key, total: 0, byCategory: {} };
    }
    transactions.forEach(t => {
      const key = new Date(t.date).toISOString().split('T')[0];
      if (dayMap[key]) {
        dayMap[key].total += t.amount;
        dayMap[key].byCategory[t.category] = (dayMap[key].byCategory[t.category] || 0) + t.amount;
      }
    });

    res.json({ trend: Object.values(dayMap), period, days });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/categories?period=month
router.get('/categories', auth, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const now = new Date();
    const start = new Date(now);
    if (period === 'week') start.setDate(now.getDate() - 7);
    else if (period === 'biweek') start.setDate(now.getDate() - 14);
    else start.setDate(1); // start of month

    const data = await Transaction.aggregate([
      { $match: { user: req.user._id, date: { $gte: start } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 }, avgAmount: { $avg: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    const grandTotal = data.reduce((a, d) => a + d.total, 0);
    const enriched = data.map(d => ({ ...d, pct: grandTotal ? Math.round(d.total / grandTotal * 100) : 0 }));
    res.json({ categories: enriched, total: grandTotal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/merchants?limit=10
router.get('/merchants', auth, async (req, res) => {
  try {
    const { period = 'month', limit = 10 } = req.query;
    const now = new Date();
    const start = new Date(now);
    if (period === 'week') start.setDate(now.getDate() - 7);
    else if (period === 'biweek') start.setDate(now.getDate() - 14);
    else start.setDate(1);

    const data = await Transaction.aggregate([
      { $match: { user: req.user._id, date: { $gte: start } } },
      { $group: { _id: '$description', total: { $sum: '$amount' }, count: { $sum: 1 }, category: { $first: '$category' } } },
      { $sort: { total: -1 } },
      { $limit: parseInt(limit) }
    ]);
    res.json({ merchants: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/report?period=week|biweek|month
router.get('/report', auth, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const now = new Date();
    const start = new Date(now);
    if (period === 'week') start.setDate(now.getDate() - 7);
    else if (period === 'biweek') start.setDate(now.getDate() - 14);
    else start.setDate(1);

    const [byCategory, byMode, trend, total] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: req.user._id, date: { $gte: start } } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ]),
      Transaction.aggregate([
        { $match: { user: req.user._id, date: { $gte: start } } },
        { $group: { _id: '$paymentMode', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ]),
      Transaction.find({ user: req.user._id, date: { $gte: start } }).sort({ date: -1 }),
      Transaction.aggregate([
        { $match: { user: req.user._id, date: { $gte: start } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 }, avg: { $avg: '$amount' } } }
      ])
    ]);

    res.json({
      period,
      startDate: start,
      endDate: now,
      byCategory,
      byPaymentMode: byMode,
      transactions: trend,
      totals: total[0] || { total: 0, count: 0, avg: 0 }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
