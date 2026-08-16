import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      setSuccess(true);
      toast.success('Registration successful!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 20
    }}>
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(108,99,255,0.1) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: 400, animation: 'fadeInUp .3s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
            spend<span style={{ color: 'var(--accent)' }}>wise</span>
          </div>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>Your AI-powered expense tracker</p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 20, marginBottom: 24 }}>Create account</h2>

          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#43e97b', fontSize: 40, marginBottom: 16 }}>✉</div>
              <p style={{ color: 'var(--text2)', marginBottom: 24, fontSize: 14 }}>
                We've sent a verification link to <strong>{form.email}</strong>. Please check your inbox (and spam folder) to verify your account before logging in.
              </p>
              <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block', width: '100%', textDecoration: 'none' }}>Go to Login</Link>
            </div>
          ) : (
            <>
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Full name</label>
                  <input className="form-input" type="text" name="name" value={form.name} onChange={handle} placeholder="John Doe" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" name="email" value={form.email} onChange={handle} placeholder="John@example.com" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" name="password" value={form.password} onChange={handle} placeholder="Min. 6 characters" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input className="form-input" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handle} placeholder="Min. 6 characters" required />
                </div>
                <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ marginTop: 4 }}>
                  {loading ? 'Creating account...' : 'Get started'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text2)' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
