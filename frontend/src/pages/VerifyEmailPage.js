import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const { login } = useAuth(); // We might not be able to call login directly if it requires email/password, but our verify endpoint returns token+user.
  // Actually, useAuth login takes email, password. We should probably just navigate to login on success, or manually set token.
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await api.get(`/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(res.data.message);
        // Automatically set token and navigate? The easiest is to just ask them to log in.
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed');
      }
    };
    verify();
  }, [token, navigate]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <div className="card" style={{ padding: 32, textAlign: 'center', maxWidth: 400, width: '100%' }}>
        <h2 style={{ marginBottom: 16 }}>Email Verification</h2>
        
        {status === 'verifying' && (
          <div>
            <div className="dot-loader" style={{ justifyContent: 'center', margin: '20px 0' }}><span/><span/><span/></div>
            <p style={{ color: 'var(--text2)' }}>Verifying your email...</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div style={{ color: '#43e97b', fontSize: 48, marginBottom: 16 }}>✓</div>
            <p style={{ color: 'var(--text)', marginBottom: 24 }}>{message}</p>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>Redirecting to login...</p>
            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block', marginTop: 16 }}>Go to Login</Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{ color: '#ff6584', fontSize: 48, marginBottom: 16 }}>✗</div>
            <p style={{ color: 'var(--text)', marginBottom: 24 }}>{message}</p>
            <Link to="/login" className="btn btn-ghost">Back to Login</Link>
          </div>
        )}
      </div>
    </div>
  );
}
