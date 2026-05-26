import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, fmt, fmtShortDate } from '../utils/constants';
import AddTransactionModal from '../components/AddTransactionModal';

export default function DashboardPage() {
  const { user } = useAuth();
  const [budget, setBudget] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, tRes, sRes] = await Promise.all([
        api.get('/budget'),
        api.get('/transactions?period=month&limit=8'),
        api.get('/transactions/summary')
      ]);
      setBudget(bRes.data);
      setTransactions(tRes.data.transactions);
      setSummary(sRes.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalSpent = budget?.totalSpent || 0;
  const totalBudget = budget?.budget?.totalMonthly || 20000;
  const budgetPct = Math.min(100, Math.round(totalSpent / totalBudget * 100));
  const budgetBarClass = budgetPct >= 90 ? 'danger' : budgetPct >= 70 ? 'warn' : '';

  if (loading) return (
    <div>
      <div style={{ height: 28, width: 200, marginBottom: 28 }} className="skeleton" />
      <div className="grid-4" style={{ marginBottom: 16 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height: 100 }} className="skeleton" />)}
      </div>
      <div style={{ height: 160 }} className="skeleton" />
    </div>
  );

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="top-bar">
        <div>
          <h1 className="page-title">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Expense</button>
      </div>

      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Spent this month</div>
          <div className="stat-value">{fmt(totalSpent)}</div>
          <div className="stat-change text-danger">↑ {budgetPct}% of budget</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Budget remaining</div>
          <div className="stat-value text-success">{fmt(Math.max(0, totalBudget - totalSpent))}</div>
          <div className="stat-change text-muted">of {fmt(totalBudget)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Transactions</div>
          <div className="stat-value">{summary?.total || transactions.length}</div>
          <div className="stat-change text-muted">this month</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Top category</div>
          <div className="stat-value" style={{ fontSize: 20 }}>
            {summary?.summary?.[0] ? (
              <>{CATEGORIES[summary.summary[0]._id]?.icon} {CATEGORIES[summary.summary[0]._id]?.label}</>
            ) : '—'}
          </div>
          <div className="stat-change text-muted">
            {summary?.summary?.[0] ? fmt(summary.summary[0].total) : 'No data'}
          </div>
        </div>
      </div>

      {/* Budget bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontFamily: 'var(--font-head)' }}>Monthly Budget</h3>
          <Link to="/budget" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>Manage →</Link>
        </div>
        <div className="progress-wrap" style={{ height: 10, marginBottom: 8 }}>
          <div className={`progress-bar ${budgetBarClass}`} style={{ width: `${budgetPct}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)' }}>
          <span>{budgetPct}% used — {fmt(totalSpent)} spent</span>
          <span>{fmt(Math.max(0, totalBudget - totalSpent))} left</span>
        </div>
      </div>

      {/* Notifications */}
      {budget?.notifications?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {budget.notifications.map((n, i) => (
            <div key={i} className={`notif-pill ${n.type}`}>
              <span style={{ fontSize: 18 }}>{n.type === 'danger' ? '🚨' : n.type === 'warning' ? '⚠️' : '💡'}</span>
              <span style={{ fontSize: 13 }}>{n.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Category overview */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 15, fontFamily: 'var(--font-head)' }}>By Category</h3>
          <Link to="/analytics" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>Full analytics →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
          {Object.entries(CATEGORIES).map(([k, v]) => {
            const catData = summary?.summary?.find(s => s._id === k);
            const amount = catData?.total || 0;
            const catLimit = budget?.budget?.categories?.[k] || 0;
            const pct = catLimit ? Math.min(100, Math.round(amount / catLimit * 100)) : 0;
            return (
              <div key={k} style={{
                background: 'var(--bg3)', borderRadius: 'var(--r-md)',
                padding: '12px 10px', textAlign: 'center',
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{v.icon}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>{v.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-head)', color: v.color }}>{fmt(amount)}</div>
                {catLimit > 0 && (
                  <div className="progress-wrap" style={{ height: 4, marginTop: 6 }}>
                    <div className={`progress-bar ${pct >= 90 ? 'danger' : pct >= 70 ? 'warn' : ''}`} style={{ width: `${pct}%`, background: v.color }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent transactions */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontFamily: 'var(--font-head)' }}>Recent Transactions</h3>
          <Link to="/transactions" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>View all →</Link>
        </div>
        {transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💸</div>
            <p>No transactions yet. Add your first expense!</p>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add Expense</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {transactions.map(t => {
              const cat = CATEGORIES[t.category] || CATEGORIES.other;
              return (
                <div key={t._id} className="txn-item">
                  <div className="txn-icon" style={{ background: cat.bg }}>{cat.icon}</div>
                  <div className="txn-info">
                    <div className="txn-name">
                      {t.description}
                      <span className={`badge ${t.isAutoDetected ? 'badge-auto' : 'badge-manual'}`} style={{ marginLeft: 6, fontSize: 10 }}>
                        {t.isAutoDetected ? 'auto' : 'manual'}
                      </span>
                    </div>
                    <div className="txn-meta">{cat.label} · {t.paymentMode.toUpperCase()} · {fmtShortDate(t.date)}</div>
                  </div>
                  <div className="txn-amount" style={{ color: cat.color }}>{fmt(t.amount)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAdd && <AddTransactionModal onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}
