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
      onAuthSuccess(res.data.user, res.data.access, res.data.refresh);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
<<<<<<< HEAD
        <h2>Internship Portal</h2>
        <p>Please login to continue</p>

<<<<<<< HEAD
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
<<<<<<< HEAD
                    <button type="submit">Login</button>
                </form>

                <p style={{ marginTop: '15px', fontSize: '14px' }}>
                    Don't have an account? 
                    <span
                        style={{ padding:'5px', color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick = {props.loginNavigate}
                    >
                         Sign up
=======
                    <button className='btn-primary'
                        type="submit"
                        disabled={password===""}
                    >
                        Login
                    </button>
                </form>

                <p style={{ marginTop: '15px', fontSize: '14px' }}>
                    Don't have an account?
                    <span
                        style={{ padding: '5px', color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={props.loginNavigate}
                    >
                        Sign up
>>>>>>> 3be749ee887fa80dc68098377f2ae91b7aae1927
                    </span>
                </p>
            </div>
        </div>
    );
=======
=======
        <h2>ILES — Internship Portal</h2>
        <p>Sign in to continue</p>
>>>>>>> b3b99c241737ce916f5ac9ab26cf25915cb9052f
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
>>>>>>> 655eba7013d1ea32c99de08782175169bbd568be
}

export default Login;
