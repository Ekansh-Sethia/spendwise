import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Password reset email sent');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400, animation: 'fadeInUp .3s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
            spend<span style={{ color: 'var(--accent)' }}>wise</span>
          </div>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 20, marginBottom: 16 }}>Reset Password</h2>
          
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#43e97b', fontSize: 40, marginBottom: 16 }}>✉</div>
              <p style={{ color: 'var(--text2)', marginBottom: 24, fontSize: 14 }}>
                If an account exists with {email}, you will receive a password reset link shortly.
              </p>
              <Link to="/login" className="btn btn-ghost" style={{ width: '100%' }}>Return to login</Link>
            </div>
          ) : (
            <>
              <p style={{ color: 'var(--text2)', marginBottom: 24, fontSize: 14 }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    className="form-input" type="email"
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" required
                  />
                </div>
                <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ marginTop: 4 }}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Link to="/login" style={{ fontSize: 13, color: 'var(--text2)', textDecoration: 'underline' }}>
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
