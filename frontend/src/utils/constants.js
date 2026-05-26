export const CATEGORIES = {
  food:          { label: 'Food',          icon: '🍜', color: '#ff6584', bg: 'rgba(255,101,132,0.12)' },
  transport:     { label: 'Transport',     icon: '🚗', color: '#6c63ff', bg: 'rgba(108,99,255,0.12)' },
  shopping:      { label: 'Shopping',      icon: '🛍️', color: '#f9ca24', bg: 'rgba(249,202,36,0.12)'  },
  health:        { label: 'Health',        icon: '💊', color: '#43e97b', bg: 'rgba(67,233,123,0.12)'  },
  bills:         { label: 'Bills',         icon: '⚡', color: '#ff9f43', bg: 'rgba(255,159,67,0.12)'  },
  entertainment: { label: 'Entertainment', icon: '🎬', color: '#a29bfe', bg: 'rgba(162,155,254,0.12)' },
  other:         { label: 'Other',         icon: '📦', color: '#74b9ff', bg: 'rgba(116,185,255,0.12)' },
};

export const PAYMENT_MODES = {
  upi:        { label: 'UPI',          icon: '📱' },
  card:       { label: 'Card',         icon: '💳' },
  cash:       { label: 'Cash',         icon: '💵' },
  netbanking: { label: 'Net Banking',  icon: '🏦' },
  wallet:     { label: 'Wallet',       icon: '👛' },
};

export const fmt = (n, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n || 0);

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const fmtShortDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
