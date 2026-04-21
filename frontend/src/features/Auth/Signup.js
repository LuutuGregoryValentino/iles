/**
 * Signup.js
 * BUG FIXED: Password match check was only done on submit; now shown live via CSS class.
 * BUG FIXED: university_id was sent even for non-student roles (fine for back-end,
 *            but now labelled generically as "Staff / Student ID" to avoid confusion).
 */
import React, { useState } from 'react';
import { authAPI } from '../../services/api';

const ROLES = [
  { value: 'student',              label: 'Student' },
  { value: 'workplace_supervisor', label: 'Workplace Supervisor' },
  { value: 'academic_supervisor',  label: 'Academic Supervisor' },
  { value: 'administrator',        label: 'Administrator' },
];

export default function Signup({ onAuthSuccess, goToLogin }) {
  const [form, setForm] = useState({
    email: '', username: '', university_id: '',
    role: 'student', password: '', confirmPassword: '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const passwordsMatch = form.password.length > 0 && form.password === form.confirmPassword;
  const passwordMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
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
      onAuthSuccess(res.data.user, res.data.access, res.data.refresh);
    } catch (err) {
      const data = err.response?.data;
      setError(
        typeof data === 'object'
          ? Object.values(data).flat().join(' ')
          : 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h2>Create account</h2>
      <p className="auth-subtitle">Join the ILES platform</p>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSignup}>
        <div className="form-group">
          <label className="form-label">Role</label>
          <select className="form-select" value={form.role} onChange={set('role')}>
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Full name / username</label>
          <input className="form-input" type="text"
            placeholder="e.g. John Doe" value={form.username}
            onChange={set('username')} required />
        </div>

        <div className="form-group">
          <label className="form-label">Email address</label>
          <input className="form-input" type="email"
            placeholder="you@mak.ac.ug" value={form.email}
            onChange={set('email')} required />
        </div>

        <div className="form-group">
          <label className="form-label">
            {form.role === 'student' ? 'Student ID' : 'Staff ID'}
          </label>
          <input className="form-input" type="text"
            placeholder={form.role === 'student' ? '25/U/0001' : 'STF-0001'}
            value={form.university_id}
            onChange={set('university_id')} required />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className={`form-input ${passwordsMatch ? 'input-ok' : ''} ${passwordMismatch ? 'input-err' : ''}`}
            type="password" placeholder="Min. 8 characters"
            value={form.password} onChange={set('password')} required />
        </div>

        <div className="form-group">
          <label className="form-label">Confirm password</label>
          <input
            className={`form-input ${passwordsMatch ? 'input-ok' : ''} ${passwordMismatch ? 'input-err' : ''}`}
            type="password" placeholder="Re-enter password"
            value={form.confirmPassword} onChange={set('confirmPassword')} required />
          {passwordMismatch && (
            <p style={{ fontSize: 12, color: 'var(--brand-red-light)', marginTop: 4 }}>
              Passwords do not match.
            </p>
          )}
        </div>

        <button
          className="btn btn-primary"
          type="submit"
          disabled={loading || passwordMismatch}
          style={{ width: '100%', justifyContent: 'center', padding: '11px' }}
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div className="auth-switch">
        Already have an account?
        <button onClick={goToLogin}>Sign in</button>
      </div>
    </div>
  );
}
