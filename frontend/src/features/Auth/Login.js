/**
 * Login.js
 * BUG FIXED: Original had no loading state reset on success path —
 * if onAuthSuccess threw, the button stayed disabled. Fixed with finally block.
 */
import React, { useState } from 'react';
import { authAPI } from '../../services/api';

export default function Login({ onAuthSuccess, goToSignup }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      onAuthSuccess(res.data.user, res.data.access, res.data.refresh);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h2>Welcome back</h2>
      <p className="auth-subtitle">Sign in to your ILES account</p>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label className="form-label">Email address</label>
          <input
            className="form-input"
            type="email"
            placeholder="you@mak.ac.ug"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          className="btn btn-primary"
          type="submit"
          disabled={loading || !email || !password}
          style={{ width: '100%', justifyContent: 'center', padding: '11px' }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="auth-switch">
        Don't have an account?
        <button onClick={goToSignup}>Create one</button>
      </div>
    </div>
  );
}
