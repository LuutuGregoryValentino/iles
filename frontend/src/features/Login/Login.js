import React, { useState } from 'react';
import './Login.css';
import { authAPI } from '../../services/api';

function Login({ onAuthSuccess, goToSignup }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      onAuthSuccess(
        res.data.user, 
        res.data.access, 
        res.data.refresh
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>ILES — Internship Portal</h2>
        <p>Sign in to continue</p>
        {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email address" value={email}
            onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} required />
          <button className="btn-primary" type="submit" disabled={loading || !password}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p style={{ marginTop: '15px', fontSize: '14px' }}>
          No account?{' '}
          <span style={{ color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={goToSignup}>Create one</span>
        </p>
      </div>
    </div>
  );
}

export default Login;
