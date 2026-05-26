const mongoose = require('mongoose');

const CATEGORIES = ['food', 'transport', 'shopping', 'health', 'bills', 'entertainment', 'other'];
const PAYMENT_MODES = ['upi', 'card', 'cash', 'netbanking', 'wallet'];

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String, required: true, trim: true },
  category: { type: String, required: true, enum: CATEGORIES },
  paymentMode: { type: String, required: true, enum: PAYMENT_MODES },
  date: { type: Date, default: Date.now, index: true },
  isAutoDetected: { type: Boolean, default: false },
  rawSmsText: { type: String },
  merchant: { type: String, trim: true },
  notes: { type: String, trim: true },
  tags: [{ type: String }]
}, { timestamps: true });

// Index for fast date-range queries
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
