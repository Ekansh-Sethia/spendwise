const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  totalMonthly: { type: Number, default: 20000 },
  categories: {
    food: { type: Number, default: 6000 },
    transport: { type: Number, default: 3000 },
    shopping: { type: Number, default: 4000 },
    health: { type: Number, default: 2000 },
    bills: { type: Number, default: 3000 },
    entertainment: { type: Number, default: 1500 },
    other: { type: Number, default: 500 }
  },
  alertThresholds: {
    warning: { type: Number, default: 70 },  // % of budget
    danger: { type: Number, default: 90 }
  },
  notificationsEnabled: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Budget', budgetSchema);
