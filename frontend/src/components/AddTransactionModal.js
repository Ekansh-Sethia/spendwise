import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { CATEGORIES, PAYMENT_MODES } from '../utils/constants';

const EMPTY = { amount: '', description: '', category: 'food', paymentMode: 'upi', date: new Date().toISOString().split('T')[0], notes: '' };

export default function AddTransactionModal({ onClose, onAdded }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [smsText, setSmsText] = useState('');
  const [smsMode, setSmsMode] = useState(false);
  const [parsing, setParsing] = useState(false);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const parseSMS = async () => {
    if (!smsText.trim()) { toast.error('Paste an SMS message first'); return; }
    setParsing(true);
    try {
      const res = await api.post('/sms/parse', { smsText });
      if (res.data.success) {
        const p = res.data.parsed;
        setForm({
          amount: p.amount || '',
          description: p.description || p.merchant || '',
          category: p.category || 'other',
          paymentMode: p.paymentMode || 'upi',
          date: new Date().toISOString().split('T')[0],
          notes: ''
        });
        setSmsMode(false);
        toast.success('Transaction detected!');
      } else {
        toast.error('Could not detect a debit transaction in this SMS');
      }
    } catch {
      toast.error('SMS parsing failed');
    } finally {
      setParsing(false);
    }
  };

  const submit = async e => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error('Enter a valid amount'); return; }
    setLoading(true);
    try {
      const res = await api.post('/transactions', {
        ...form,
        amount: parseFloat(form.amount),
        isAutoDetected: false
      });
      toast.success('Expense added!');
      onAdded(res.data.transaction);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18 }}>Add Expense</h2>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* SMS toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            className={`btn btn-sm ${!smsMode ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSmsMode(false)}
          >✏️ Manual</button>
          <button
            className={`btn btn-sm ${smsMode ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSmsMode(true)}
          >📱 From SMS</button>
        </div>

        {smsMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Paste bank SMS</label>
              <textarea
                className="form-textarea"
                value={smsText}
                onChange={e => setSmsText(e.target.value)}
                placeholder="Your a/c XX1234 is debited by Rs.1,250 on 09-Apr for Zomato Order. Avl balance: ₹18,750"
                rows={4}
              />
            </div>
            <button className="btn btn-primary" onClick={parseSMS} disabled={parsing}>
              {parsing ? 'Detecting...' : '🔍 Detect & Fill'}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input className="form-input" type="number" name="amount" value={form.amount} onChange={handle} placeholder="0" min="0" step="0.01" required />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date" name="date" value={form.date} onChange={handle} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" type="text" name="description" value={form.description} onChange={handle} placeholder="What did you spend on?" required />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <div className="cat-grid">
                {Object.entries(CATEGORIES).map(([k, v]) => (
                  <div
                    key={k}
                    className={`cat-option${form.category === k ? ' selected' : ''}`}
                    onClick={() => setForm(f => ({ ...f, category: k }))}
                  >
                    <span className="cat-emoji">{v.icon}</span>
                    {v.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Mode</label>
              <select className="form-select" name="paymentMode" value={form.paymentMode} onChange={handle}>
                {Object.entries(PAYMENT_MODES).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <input className="form-input" type="text" name="notes" value={form.notes} onChange={handle} placeholder="Any extra details..." />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>
                {loading ? 'Saving...' : 'Save Expense'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
