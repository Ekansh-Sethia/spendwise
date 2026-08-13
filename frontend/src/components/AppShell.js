import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/',            icon: '◈',  label: 'Dashboard',    end: true },
  { to: '/transactions',icon: '⊞',  label: 'Transactions'  },
  { to: '/analytics',   icon: '◎',  label: 'Analytics'     },
  { to: '/ai',          icon: '✦',  label: 'AI Insights'   },
  { to: '/budget',      icon: '◷',  label: 'Budget'        },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('sw_theme') || 'dark');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sw_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const confirmLogout = () => setShowLogoutModal(true);
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app-shell">
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 18 }}>Confirm Logout</h3>
            <p style={{ color: 'var(--text2)', marginBottom: 24, fontSize: 14 }}>
              Are you sure you want to log out of SpendWise?
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowLogoutModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleLogout}>Log Out</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 99 }}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar${mobileOpen ? ' open' : ''}`}>
        <div className="nav-logo">spend<span>wise</span></div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="nav-section-label">Menu</div>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          <div style={{ marginTop: 'auto', paddingTop: 16 }}>
            <button className="nav-link" onClick={toggleTheme} style={{ width: '100%' }}>
              <span className="nav-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </nav>

        {/* User section */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 8 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(108,99,255,.2)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, flexShrink: 0
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
          </div>
          <button className="nav-link" onClick={confirmLogout} style={{ color: 'var(--accent2)', width: '100%' }}>
            <span className="nav-icon">↩</span> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {/* Mobile header */}
        <div style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }} className="mobile-header">
          <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 22, cursor: 'pointer' }}>☰</button>
          <div className="nav-logo" style={{ marginBottom: 0, fontSize: 18 }}>spend<span style={{ color: 'var(--accent)' }}>wise</span></div>
          <div style={{ width: 32 }} />
        </div>

        <Outlet />
      </main>
    </div>
  );
}
