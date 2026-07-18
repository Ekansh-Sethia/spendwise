import React, { useState, useEffect, useCallback } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title
} from 'chart.js';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { CATEGORIES, fmt } from '../utils/constants';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const PERIODS = [
  { value: 'week', label: 'Week' },
  { value: 'biweek', label: '2 Weeks' },
  { value: 'month', label: 'Month' },
];

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(30, 30, 40, 0.95)',
      titleColor: '#fff',
      bodyColor: '#a29bfe',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      padding: 10,
      displayColors: false,
      callbacks: { label: ctx => ' ₹' + ctx.raw.toLocaleString('en-IN') }
    }
  },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#9190a8', font: { size: 11 } } },
    y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#9190a8', font: { size: 11 }, callback: v => '₹' + (v >= 1000 ? (v/1000).toFixed(0)+'k' : v) } }
  }
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('month');
  const [trend, setTrend] = useState([]);
  const [categories, setCategories] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, cRes, mRes] = await Promise.all([
        api.get(`/analytics/trend?period=${period}`),
        api.get(`/analytics/categories?period=${period}`),
        api.get(`/analytics/merchants?period=${period}&limit=8`)
      ]);
      setTrend(tRes.data.trend);
      setCategories(cRes.data.categories);
      setMerchants(mRes.data.merchants);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const generateReport = async () => {
    setLoadingReport(true);
    setReport(null);
    try {
      const res = await api.post('/ai/report', { period });
      setReport(res.data.report);
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setLoadingReport(false);
    }
  };

  // Prepare chart data
  const trendChartData = {
    labels: trend.map(d => {
      const dt = new Date(d.date);
      return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }),
    datasets: [{
      data: trend.map(d => d.total),
      backgroundColor: trend.map((d, i) => {
        const max = Math.max(...trend.map(x => x.total));
        return d.total === max ? 'rgba(108,99,255,0.9)' : 'rgba(108,99,255,0.35)';
      }),
      borderRadius: 6,
      borderSkipped: false,
    }]
  };

  const doughnutData = {
    labels: categories.map(c => CATEGORIES[c._id]?.label || c._id),
    datasets: [{
      data: categories.map(c => c.total),
      backgroundColor: categories.map(c => CATEGORIES[c._id]?.color || '#74b9ff'),
      borderWidth: 0,
      hoverOffset: 6
    }]
  };

  const doughnutOpts = {
    responsive: true, maintainAspectRatio: false, cutout: '65%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(30, 30, 40, 0.95)',
        titleColor: '#fff',
        bodyColor: '#a29bfe',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: { label: ctx => ` ₹${ctx.raw.toLocaleString('en-IN')} (${ctx.label})` }
      }
    }
  };

  const totalSpent = categories.reduce((a, c) => a + c.total, 0);

  if (loading) return (
    <div>
      <div style={{ height: 28, width: 200, marginBottom: 24 }} className="skeleton" />
      <div style={{ height: 220, marginBottom: 20 }} className="skeleton" />
      <div className="grid-2">
        <div style={{ height: 200 }} className="skeleton" />
        <div style={{ height: 200 }} className="skeleton" />
      </div>
    </div>
  );

  return (
    <div className="animate-in">
      <div className="top-bar">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Spending patterns and insights</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: 'var(--r-md)', padding: 4, gap: 4 }}>
            {PERIODS.map(p => (
              <button
                key={p.value}
                className="btn btn-sm"
                style={{ background: period === p.value ? 'var(--accent)' : 'transparent', color: period === p.value ? '#fff' : 'var(--text2)', border: 'none' }}
                onClick={() => setPeriod(p.value)}
              >{p.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Total spent</div>
          <div className="stat-value">{fmt(totalSpent)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Transactions</div>
          <div className="stat-value">{categories.reduce((a, c) => a + c.count, 0)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg per transaction</div>
          <div className="stat-value">{fmt(categories.reduce((a,c)=>a+c.count,0) ? totalSpent / categories.reduce((a,c)=>a+c.count,0) : 0)}</div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontFamily: 'var(--font-head)', marginBottom: 16 }}>Daily Spending Trend</h3>
        {trend.every(d => d.total === 0) ? (
          <div className="empty-state" style={{ padding: 24 }}>
            <p>No spending data for this period.</p>
          </div>
        ) : (
          <div className="chart-container" style={{ height: 200 }}>
            <Bar data={trendChartData} options={CHART_OPTS} />
          </div>
        )}
      </div>

      {/* Doughnut + legend / Merchants */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <h3 style={{ fontSize: 15, fontFamily: 'var(--font-head)', marginBottom: 16 }}>Category Breakdown</h3>
          {categories.length === 0 ? (
            <div className="empty-state" style={{ padding: 16 }}><p>No data</p></div>
          ) : (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 140, height: 140, flexShrink: 0 }}>
                <Doughnut data={doughnutData} options={doughnutOpts} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {categories.slice(0, 6).map(c => {
                  const cat = CATEGORIES[c._id] || CATEGORIES.other;
                  return (
                    <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: cat.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, flex: 1 }}>{cat.label}</span>
                      <span style={{ fontSize: 11, color: 'var(--text2)' }}>{c.pct}%</span>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{fmt(c.total)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15, fontFamily: 'var(--font-head)', marginBottom: 16 }}>Top Merchants</h3>
          {merchants.length === 0 ? (
            <div className="empty-state" style={{ padding: 16 }}><p>No data</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {merchants.map((m, i) => {
                const cat = CATEGORIES[m.category] || CATEGORIES.other;
                const maxTotal = merchants[0]?.total || 1;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span>{cat.icon} {m._id}</span>
                      <span style={{ fontWeight: 500 }}>{fmt(m.total)}</span>
                    </div>
                    <div className="progress-wrap" style={{ height: 5 }}>
                      <div className="progress-bar" style={{ width: `${Math.round(m.total / maxTotal * 100)}%`, background: cat.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Report section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 15, fontFamily: 'var(--font-head)' }}>AI Report</h3>
            <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Generate a detailed analysis for the selected period</p>
          </div>
          <button className="btn btn-primary" onClick={generateReport} disabled={loadingReport}>
            {loadingReport ? '⏳ Generating...' : '✦ Generate Report'}
          </button>
        </div>
        {loadingReport && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text2)', fontSize: 13 }}>
            <div className="dot-loader"><span/><span/><span/></div>
            Analyzing your spending data...
          </div>
        )}
        {report && (
          <div className="report-content" dangerouslySetInnerHTML={{
            __html: report
              .replace(/^### (.+)$/gm, '<h3>$1</h3>')
              .replace(/^## (.+)$/gm, '<h2>$1</h2>')
              .replace(/^# (.+)$/gm, '<h1>$1</h1>')
              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
              .replace(/^- (.+)$/gm, '<li>$1</li>')
              .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
              .replace(/\n\n/g, '<br/>')
              .replace(/---/g, '<hr/>')
          }} />
        )}
      </div>
    </div>
  );
}
