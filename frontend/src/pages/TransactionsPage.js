import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { CATEGORIES, PAYMENT_MODES, fmt, fmtDate } from '../utils/constants';
import AddTransactionModal from '../components/AddTransactionModal';

const PERIODS = [
  { value: 'week', label: 'This week' },
  { value: 'biweek', label: 'Last 2 weeks' },
  { value: 'month', label: 'This month' },
  { value: 'all', label: 'All time' },
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [totalForPeriod, setTotalForPeriod] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period, page, limit: 20 });
      if (category !== 'all') params.append('category', category);
      const res = await api.get(`/transactions?${params}`);
      setTransactions(res.data.transactions);
      setPagination(res.data.pagination);
      setTotalForPeriod(res.data.transactions.reduce((a, t) => a + t.amount, 0));
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [period, category, page]);

  useEffect(() => { load(); }, [load]);

  const deleteTransaction = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    setDeleting(id);
    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Deleted');
      setTransactions(prev => prev.filter(t => t._id !== id));
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="animate-in">
      <div className="top-bar">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">Your full expense history</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Expense</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="form-select" style={{ maxWidth: 160 }} value={period} onChange={e => { setPeriod(e.target.value); setPage(1); }}>
          {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select className="form-select" style={{ maxWidth: 160 }} value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
          <option value="all">All categories</option>
          {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text2)' }}>
          {pagination.total || 0} transactions · <span style={{ color: 'var(--text)', fontWeight: 600 }}>{fmt(totalForPeriod)}</span>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4,5].map(i => <div key={i} style={{ height: 64 }} className="skeleton" />)}
        </div>
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <p>No transactions found for the selected filters.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {transactions.map(t => {
              const cat = CATEGORIES[t.category] || CATEGORIES.other;
              const mode = PAYMENT_MODES[t.paymentMode];
              return (
                <div key={t._id} className="txn-item">
                  <div className="txn-icon" style={{ background: cat.bg }}>{cat.icon}</div>
                  <div className="txn-info">
                    <div className="txn-name">
                      {t.description}
                      <span className={`badge ${t.isAutoDetected ? 'badge-auto' : 'badge-manual'}`} style={{ marginLeft: 6 }}>
                        {t.isAutoDetected ? 'auto' : 'manual'}
                      </span>
                    </div>
                    <div className="txn-meta">
                      {cat.label} · {mode?.icon} {mode?.label} · {fmtDate(t.date)}
                      {t.notes && <> · <span style={{ fontStyle: 'italic' }}>{t.notes}</span></>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="txn-amount" style={{ color: cat.color }}>{fmt(t.amount)}</div>
                    <div className="txn-actions">
                      <button
                        className="btn btn-danger btn-sm btn-icon"
                        onClick={() => deleteTransaction(t._id)}
                        disabled={deleting === t._id}
                        title="Delete"
                      >
                        {deleting === t._id ? '...' : '🗑'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
              <span style={{ padding: '6px 12px', fontSize: 13, color: 'var(--text2)' }}>Page {page} of {pagination.pages}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}>Next →</button>
            </div>
          )}
        </>
      )}

      {showAdd && <AddTransactionModal onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}
