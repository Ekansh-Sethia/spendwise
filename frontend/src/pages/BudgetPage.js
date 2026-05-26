import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { CATEGORIES, fmt } from '../utils/constants';

export default function BudgetPage() {
  const [budget, setBudget] = useState(null);
  const [spendMap, setSpendMap] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalPct, setTotalPct] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ totalMonthly: 20000, categories: {}, alertThresholds: { warning: 70, danger: 90 } });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/budget');
      setBudget(res.data.budget);
      setSpendMap(res.data.spendByCategory || {});
      setNotifications(res.data.notifications || []);
      setTotalSpent(res.data.totalSpent || 0);
      setTotalPct(res.data.totalPct || 0);
      setForm({
        totalMonthly: res.data.budget?.totalMonthly || 20000,
        categories: res.data.budget?.categories || {},
        alertThresholds: res.data.budget?.alertThresholds || { warning: 70, danger: 90 }
      });
    } catch {
      toast.error('Failed to load budget');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/budget', form);
      toast.success('Budget saved!');
      load();
    } catch {
      toast.error('Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const setCatBudget = (cat, val) => setForm(f => ({ ...f, categories: { ...f.categories, [cat]: parseFloat(val) || 0 } }));
  const setThreshold = (key, val) => setForm(f => ({ ...f, alertThresholds: { ...f.alertThresholds, [key]: parseInt(val) || 0 } }));

  if (loading) return (
    <div>
      <div style={{ height: 28, width: 200, marginBottom: 24 }} className="skeleton" />
      {[1,2,3].map(i => <div key={i} style={{ height: 80, marginBottom: 16 }} className="skeleton" />)}
    </div>
  );

  const budgetBarClass = totalPct >= 90 ? 'danger' : totalPct >= 70 ? 'warn' : '';

  return (
    <div className="animate-in">
      <div className="top-bar">
        <div>
          <h1 className="page-title">Budget</h1>
          <p className="page-subtitle">Set limits and track your targets</p>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving...' : '💾 Save Changes'}
        </button>
      </div>

      {/* Overall budget */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontFamily: 'var(--font-head)', marginBottom: 16 }}>Monthly Budget</h3>
        <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Total monthly limit (₹)</label>
            <input
              className="form-input"
              type="number" min="0" step="100"
              value={form.totalMonthly}
              onChange={e => setForm(f => ({ ...f, totalMonthly: parseFloat(e.target.value) || 0 }))}
            />
          </div>
          <div>
            <div className="form-label" style={{ marginBottom: 8 }}>Current status</div>
            <div style={{ fontSize: 24, fontFamily: 'var(--font-head)', fontWeight: 700, marginBottom: 4 }}>
              {fmt(totalSpent)} <span style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 400 }}>of {fmt(form.totalMonthly)}</span>
            </div>
            <div className="progress-wrap" style={{ height: 8, marginBottom: 4 }}>
              <div className={`progress-bar ${budgetBarClass}`} style={{ width: `${Math.min(100, totalPct)}%` }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>
              {totalPct}% used · {fmt(Math.max(0, form.totalMonthly - totalSpent))} remaining
            </div>
          </div>
        </div>

        {/* Alert thresholds */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
            <label className="form-label">Warning at (%)</label>
            <input className="form-input" type="number" min="0" max="100" value={form.alertThresholds.warning} onChange={e => setThreshold('warning', e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
            <label className="form-label">Danger at (%)</label>
            <input className="form-input" type="number" min="0" max="100" value={form.alertThresholds.danger} onChange={e => setThreshold('danger', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Category budgets */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontFamily: 'var(--font-head)', marginBottom: 16 }}>Category Limits</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {Object.entries(CATEGORIES).map(([k, v]) => {
            const spent = spendMap[k] || 0;
            const limit = form.categories[k] || 0;
            const pct = limit ? Math.min(100, Math.round(spent / limit * 100)) : 0;
            const barColor = pct >= 90 ? 'var(--accent2)' : pct >= 70 ? 'var(--accent4)' : v.color;
            return (
              <div key={k}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 130 }}>
                    <span style={{ fontSize: 18 }}>{v.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{v.label}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="progress-wrap" style={{ height: 7 }}>
                      <div className="progress-bar" style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', minWidth: 110, textAlign: 'right' }}>
                    {fmt(spent)} / <input
                      type="number" min="0" step="100"
                      value={form.categories[k] || ''}
                      onChange={e => setCatBudget(k, e.target.value)}
                      placeholder="No limit"
                      style={{
                        background: 'transparent', border: 'none',
                        borderBottom: '1px solid var(--border2)',
                        width: 70, color: 'var(--text)', fontSize: 12,
                        outline: 'none', padding: '1px 2px'
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notifications panel */}
      <div className="card">
        <h3 style={{ fontSize: 15, fontFamily: 'var(--font-head)', marginBottom: 16 }}>
          Alerts & Notifications
          {notifications.filter(n => n.type === 'danger').length > 0 && (
            <span className="badge badge-danger" style={{ marginLeft: 8 }}>
              {notifications.filter(n => n.type === 'danger').length} urgent
            </span>
          )}
        </h3>
        {notifications.length === 0 ? (
          <div className="notif-pill ok" style={{ alignItems: 'center' }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <span style={{ fontSize: 13 }}>All good! Your spending is within budget limits.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notifications.map((n, i) => (
              <div key={i} className={`notif-pill ${n.type}`}>
                <span style={{ fontSize: 20 }}>{n.type === 'danger' ? '🚨' : n.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                <div>
                  <div style={{ fontSize: 13 }}>{n.message}</div>
                  {n.category !== 'total' && (
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                      {CATEGORIES[n.category]?.label} · Spent {fmt(spendMap[n.category] || 0)} of {fmt(form.categories[n.category] || 0)} limit
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--bg3)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
            💡 <strong style={{ color: 'var(--text)' }}>Pro tip:</strong> Notifications are recalculated live from your spending data every time you visit this page. In a production app, you'd enable push notifications for real-time alerts.
          </p>
        </div>
      </div>
    </div>
  );
}
