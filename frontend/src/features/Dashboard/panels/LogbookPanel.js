/**
 * LogbookPanel.js
 *
 * ┌─────────────────────────────────────────────────────┐
 * │ WHO SEES THIS: student role only                     │
 * │ CONDITION: SECTIONS entry has roles: ['student']     │
 * │            in Dashboard.js                           │
 * └─────────────────────────────────────────────────────┘
 *
 * One-page panel: history table on the left, submit form on the right.
 * Student can see all their own logbooks and submit a new one.
 *
 * BUG FIXED: Original LogbookForm never refreshed the history list after
 * a successful submission. Now both live in the same component and share state.
 *
 * BUG FIXED: hours_worked was sent as a string in the original.
 * Now parsed as float before posting.
 */
import React, { useState, useEffect } from 'react';
import { logbooksAPI, placementsAPI } from '../../../services/api';

export default function LogbookPanel({ currentUser, isActive }) {
  const [logbooks,   setLogbooks]   = useState([]);
  const [placements, setPlacements] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [l, p] = await Promise.all([logbooksAPI.list(), placementsAPI.list()]);
      setLogbooks(l.data);
      setPlacements(p.data);
    } catch { /* handled per-request */ }
    setLoading(false);
  };

  useEffect(() => { if (isActive) load(); }, [isActive]); // eslint-disable-line

  const statusBadge = (s) =>
    s === 'Approved'  ? 'badge-success' :
    s === 'Submitted' ? 'badge-warn'    : 'badge-neutral';

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="panel-title">My Logbook</h1>
          <p className="panel-subtitle">Submit and track your weekly logbook entries.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(s => !s)}
        >
          {showForm ? 'Hide form' : '+ New Entry'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showForm ? '1fr 380px' : '1fr', gap: 24, alignItems: 'start' }}>

        {/* ── History ── */}
        <div>
          {loading ? (
            <div className="spinner" />
          ) : logbooks.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
                <h4>No entries yet</h4>
                <p>Submit your first weekly logbook to get started.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {logbooks.map(lb => (
                <div key={lb.id} className="card" style={{
                  borderLeft: `4px solid ${
                    lb.submission_status === 'Approved'  ? 'var(--brand-green-light)' :
                    lb.submission_status === 'Submitted' ? 'var(--brand-gold)'        :
                    'var(--border-strong)'
                  }`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 2 }}>
                        Week {lb.week_number}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {lb.start_date} → {lb.end_date} &nbsp;·&nbsp; {lb.hours_worked}h worked
                      </div>
                    </div>
                    <span className={`badge ${statusBadge(lb.submission_status)}`}>
                      {lb.submission_status}
                    </span>
                  </div>
                  <hr className="divider" />
                  <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0 }}>
                    <strong>Tasks:</strong> {lb.tasks_done}
                  </p>
                  {lb.challenges && lb.challenges !== 'None' && (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '8px 0 0' }}>
                      <strong>Challenges:</strong> {lb.challenges}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Submit form ── */}
        {showForm && (
          <div className="card" style={{ position: 'sticky', top: 0 }}>
            <LogbookForm
              placements={placements}
              onSubmitted={() => { setShowForm(false); load(); }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Inline form component ── */
function LogbookForm({ placements, onSubmitted, onCancel }) {
  const [form, setForm] = useState({
    placement: '', week_number: '', start_date: '', end_date: '',
    tasks_done: '', hours_worked: '', challenges: '',
    submission_status: 'Submitted',
  });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setSaving(true);
    try {
      await logbooksAPI.create({
        ...form,
        week_number:  parseInt(form.week_number, 10),
        hours_worked: parseFloat(form.hours_worked),
      });
      setSuccess('Logbook submitted!');
      setTimeout(onSubmitted, 1200);
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Submission failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16, marginBottom: 16, color: 'var(--text-primary)' }}>
        New Entry
      </div>

      {error   && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="form-group">
        <label className="form-label">Placement</label>
        <select className="form-select" value={form.placement} onChange={set('placement')} required>
          <option value="">Select placement…</option>
          {placements.map(p => (
            <option key={p.id} value={p.id}>{p.organization_name} — {p.position}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Week #</label>
          <input className="form-input" type="number" min="1"
            value={form.week_number} onChange={set('week_number')} required />
        </div>
        <div className="form-group">
          <label className="form-label">Hours worked</label>
          <input className="form-input" type="number" step="0.5" min="0" max="80"
            value={form.hours_worked} onChange={set('hours_worked')} required />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Start date</label>
          <input className="form-input" type="date" value={form.start_date} onChange={set('start_date')} required />
        </div>
        <div className="form-group">
          <label className="form-label">End date</label>
          <input className="form-input" type="date" value={form.end_date} onChange={set('end_date')} required />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Tasks done this week</label>
        <textarea className="form-textarea" value={form.tasks_done}
          placeholder="Describe the specific tasks you worked on…"
          onChange={set('tasks_done')} required style={{ minHeight: 80 }} />
      </div>

      <div className="form-group">
        <label className="form-label">Challenges (write "None" if none)</label>
        <textarea className="form-textarea" value={form.challenges}
          placeholder="Any challenges faced?"
          onChange={set('challenges')} style={{ minHeight: 60 }} />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Submitting…' : 'Submit'}
        </button>
        <button className="btn btn-ghost" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
