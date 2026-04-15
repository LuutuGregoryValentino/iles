import React, { useState } from 'react';
import '../Login/Login.css';
import './Signup.css';
import { authAPI } from '../../services/api';

function Signup({ onAuthSuccess, goToLogin }) {
  const [form, setForm] = useState({
    email: '', username: '', university_id: '', role: 'student',
    password: '', confirmPassword: '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const passwordMatch = form.confirmPassword.length === 0
    ? ''
    : form.password === form.confirmPassword ? 'input-success' : 'input-error';

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.register({
        email:         form.email,
        username:      form.username,
        university_id: form.university_id,
        role:          form.role,
        password:      form.password,
      });
      const { user, access, refresh } = res.data;
      onAuthSuccess(user, access, refresh);
    } catch (err) {
      const data = err.response?.data;
      const msg = typeof data === 'object'
        ? Object.values(data).flat().join(' ')
        : 'Registration failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>
        {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
        <form onSubmit={handleSignup}>
          <input type="email" placeholder="Email Address"  value={form.email}         onChange={set('email')}         required />
          <input type="text"  placeholder="Username"        value={form.username}       onChange={set('username')}       required />
          <input type="text"  placeholder="University ID"   value={form.university_id}  onChange={set('university_id')}  required />
          <select value={form.role} onChange={set('role')}>
            <option value="student">Student</option>
            <option value="workplace_supervisor">Workplace Supervisor</option>
            <option value="academic_supervisor">Academic Supervisor</option>
          </select>
          <input
            type="password"
            placeholder="Create a password (min 8 chars)"
            value={form.password}
            className={passwordMatch}
            onChange={set('password')}
            required
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={form.confirmPassword}
            className={passwordMatch}
            onChange={set('confirmPassword')}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p style={{ marginTop: '15px', fontSize: '14px' }}>
          Already have an account?{' '}
          <span style={{ color: 'blue', cursor: 'pointer', textDecoration: 'underline' }} onClick={goToLogin}>
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}

export default Signup;
