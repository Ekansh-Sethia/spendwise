const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper — get a Gemini model instance
function getModel() {
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

// Helper — build the user's financial context string
async function buildFinancialContext(userId) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [transactions, budget, catSummary] = await Promise.all([
    Transaction.find({ user: userId, date: { $gte: startOfMonth } })
      .sort({ date: -1 })
      .limit(50),
    Budget.findOne({ user: userId }),
    Transaction.aggregate([
      { $match: { user: userId, date: { $gte: startOfMonth } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ])
  ]);

  const totalSpent = catSummary.reduce((a, c) => a + c.total, 0);
  const catBreakdown = catSummary
    .map(c => `${c._id}: ₹${c.total.toFixed(0)} (${c.count} transactions)`)
    .join(', ');
  const recentTxns = transactions
    .slice(0, 10)
    .map(t =>
      `${t.description} - ₹${t.amount} (${t.category}, ${t.paymentMode}, ${new Date(t.date).toLocaleDateString('en-IN')})`
    )
    .join('\n');

  const catBudgets = budget?.categories
    ? Object.entries(
        budget.categories.toObject ? budget.categories.toObject() : budget.categories
      )
        .map(([k, v]) => {
          const spent = catSummary.find(c => c._id === k)?.total || 0;
          return `${k}: spent ₹${spent.toFixed(0)} of ₹${v} limit`;
        })
        .join('\n')
    : 'No budgets set';

  return {
    systemPrompt: `You are SpendWise AI, a sharp and empathetic personal finance advisor for Indian users.

USER FINANCIAL DATA (${now.toLocaleString('default', { month: 'long', year: 'numeric' })}):
- Total budget: ₹${budget?.totalMonthly || 20000}
- Total spent so far: ₹${totalSpent.toFixed(0)} (${budget?.totalMonthly ? Math.round(totalSpent / budget.totalMonthly * 100) : '?'}% of budget)
- Remaining budget: ₹${Math.max(0, (budget?.totalMonthly || 20000) - totalSpent).toFixed(0)}
- Days remaining in month: ${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()}

SPENDING BY CATEGORY:
${catBreakdown || 'No transactions yet'}

CATEGORY BUDGETS:
${catBudgets}

RECENT TRANSACTIONS:
${recentTxns || 'None'}

INSTRUCTIONS:
- Be specific and data-driven in your analysis
- Use Indian Rupee (₹) and Indian context
- Give actionable, practical recommendations
- Be warm, conversational, not preachy
- Keep responses concise (150-200 words max unless generating a full report)
- For reports, be more detailed with sections
- Highlight patterns, anomalies, and opportunities to save`,
    totalSpent,
    budget,
    catSummary,
    transactions
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/insights  — chat with AI about your expenses
// ─────────────────────────────────────────────────────────────────────────────
router.post('/insights', auth, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    const { systemPrompt } = await buildFinancialContext(req.user._id);
    const model = getModel();

    // Gemini uses startChat() for multi-turn conversations
    // We prepend the system prompt as the first user message + model ack
    const history = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }]
      },
      {
        role: 'model',
        parts: [{ text: 'Understood! I have your full financial context. How can I help you?' }]
      },
      // Add previous conversation turns
      ...conversationHistory.slice(-6).map(m => ({
        role: m.role === 'ai' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
    ];

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(message);
    const aiMessage = result.response.text();

    res.json({ message: aiMessage });
  } catch (err) {
    console.error('Gemini AI error:', err);
    res.status(500).json({ error: 'AI service unavailable: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/categorize  — auto-categorize a transaction description
// ─────────────────────────────────────────────────────────────────────────────
router.post('/categorize', auth, async (req, res) => {
  try {
    const { description, amount } = req.body;
    if (!description) return res.status(400).json({ error: 'Description required' });

    const model = getModel();
    const prompt = `You are an expense categorizer for Indian users.
Given this transaction, respond with ONLY a raw JSON object — no markdown, no backticks, no explanation.
Format: {"category": "food", "merchant": "Zomato"}
Categories allowed: food, transport, shopping, health, bills, entertainment, other

Transaction: "${description}"
Amount: ₹${amount || '?'}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (err) {
    console.error('Categorize error:', err);
    res.status(500).json({ category: 'other', merchant: null });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/report  — generate a full financial report
// ─────────────────────────────────────────────────────────────────────────────
router.post('/report', auth, async (req, res) => {
  try {
    const { period = 'month' } = req.body;
    const now = new Date();
    const start = new Date(now);
    if (period === 'week') start.setDate(now.getDate() - 7);
    else if (period === 'biweek') start.setDate(now.getDate() - 14);
    else start.setDate(1);

    const [transactions, budget, catSummary] = await Promise.all([
      Transaction.find({ user: req.user._id, date: { $gte: start } }).sort({ date: -1 }),
      Budget.findOne({ user: req.user._id }),
      Transaction.aggregate([
        { $match: { user: req.user._id, date: { $gte: start } } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ])
    ]);

    const totalSpent = catSummary.reduce((a, c) => a + c.total, 0);
    const catText = catSummary.map(c => `${c._id}: ₹${c.total.toFixed(0)}`).join(', ');
    const txnList = transactions
      .slice(0, 30)
      .map(t => `${new Date(t.date).toLocaleDateString('en-IN')}: ${t.description} ₹${t.amount} (${t.category})`)
      .join('\n');

    const model = getModel();
    const prompt = `You are SpendWise AI. Generate a detailed ${period} expense report in clean markdown format. Use ₹ for currency. Be specific, insightful, and actionable.

DATA:
Budget: ₹${budget?.totalMonthly || 20000}
Total Spent: ₹${totalSpent.toFixed(0)}
Period: ${start.toLocaleDateString('en-IN')} to ${now.toLocaleDateString('en-IN')}
By Category: ${catText}

Transactions:
${txnList}

Generate a report with these sections:
1. Executive Summary
2. Category Analysis
3. Top Expenses
4. Spending Patterns
5. Budget Performance
6. 5 Specific Actionable Recommendations to save money next month`;

    const result = await model.generateContent(prompt);
    res.json({ report: result.response.text(), generatedAt: new Date() });
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;