import React, { useState } from 'react';
import './Login.css';
import { authAPI } from '../../services/api';

function Login({ onAuthSuccess, goToSignup }) {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      const { user, access, refresh } = res.data;
      onAuthSuccess(user, access, refresh);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Internship Portal</h2>
        <p>Please login to continue</p>
        {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="btn-primary" type="submit" disabled={loading || password === ''}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p style={{ marginTop: '15px', fontSize: '14px' }}>
          Don't have an account?{' '}
          <span style={{ color: 'blue', cursor: 'pointer', textDecoration: 'underline' }} onClick={goToSignup}>
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
