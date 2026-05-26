const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');

// GET /api/transactions  — list with filters
router.get('/', auth, async (req, res) => {
  try {
    const {
      period = 'month', category, page = 1, limit = 50, startDate, endDate
    } = req.query;

    const filter = { user: req.user._id };

    // Date range
    const now = new Date();
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else {
      const start = new Date(now);
      if (period === 'week') start.setDate(now.getDate() - 7);
      else if (period === 'biweek') start.setDate(now.getDate() - 14);
      else if (period === 'month') start.setDate(1); // first of month
      else if (period === 'all') delete filter.date;
      if (period !== 'all') filter.date = { $gte: start, $lte: now };
    }

    if (category && category !== 'all') filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
      Transaction.countDocuments(filter)
    ]);

    res.json({
      transactions,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/transactions
router.post('/', auth, [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('description').trim().notEmpty(),
  body('category').isIn(['food','transport','shopping','health','bills','entertainment','other']),
  body('paymentMode').isIn(['upi','card','cash','netbanking','wallet'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { amount, description, category, paymentMode, date, isAutoDetected, rawSmsText, merchant, notes, tags } = req.body;
    const transaction = await Transaction.create({
      user: req.user._id, amount, description, category, paymentMode,
      date: date ? new Date(date) : new Date(),
      isAutoDetected: isAutoDetected || false,
      rawSmsText, merchant, notes, tags
    });
    res.status(201).json({ transaction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/transactions/:id
router.patch('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    const allowed = ['amount', 'description', 'category', 'paymentMode', 'date', 'merchant', 'notes', 'tags'];
    allowed.forEach(f => { if (req.body[f] !== undefined) transaction[f] = req.body[f]; });
    await transaction.save();
    res.json({ transaction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!result) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/transactions/summary  — totals by category for current month
router.get('/summary', auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const summary = await Transaction.aggregate([
      { $match: { user: req.user._id, date: { $gte: startOfMonth } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const total = summary.reduce((acc, s) => acc + s.total, 0);
    res.json({ summary, total, month: now.toLocaleString('default', { month: 'long', year: 'numeric' }) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
