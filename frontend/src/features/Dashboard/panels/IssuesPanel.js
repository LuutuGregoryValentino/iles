/**
 * IssuesPanel.js
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │ WHO SEES THIS: ALL roles                                      │
 * │                                                               │
 * │ student              → can submit issues + view own           │
 * │ workplace_supervisor → can view all + update status           │
 * │ academic_supervisor  → can view all + update status           │
 * │ administrator        → can view all + update status           │
 * │                                                               │
 * │ CONDITION: role check below at ▼ ROLE GATE                    │
 * └──────────────────────────────────────────────────────────────┘
 *
 * BUG FIXED: Original IssueForm called onSubmitted immediately after
 * a 2s timeout but did NOT re-fetch the issues list from the server.
 * Now issues list re-fetches after every submission.
 */
import React, { useState, useEffect } from 'react';
import { issuesAPI } from '../../../services/api';

const STATUS_COLORS = {
  Pending:   'badge-warn',
  'In Review': 'badge-info',
  Resolved:  'badge-success',
};

const STATUS_OPTIONS = ['Pending', 'In Review', 'Resolved'];

export default function IssuesPanel({ currentUser, isActive }) {
  const role = currentUser?.role;
  const isStudent = role === 'student';

  const [issues,   setIssues]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error,    setError]    = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await issuesAPI.list();
      setIssues(res.data);
    } catch {
      setError('Failed to load issues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isActive) load(); }, [isActive]); // eslint-disable-line

  /* ── Admin/supervisor: update issue status inline ── */
  const updateStatus = async (id, newStatus) => {
    try {
      await issuesAPI.updateStatus(id, { status: newStatus });
      setIssues(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
    } catch {
      setError('Could not update issue status.');
    }
  };

  const openCount = issues.filter(i => i.status !== 'Resolved').length;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="panel-title">Issues</h1>
          <p className="panel-subtitle">
            {isStudent
              ? 'Report and track problems during your internship.'
              : `Manage student-reported issues. ${openCount > 0 ? `${openCount} open.` : 'All clear.'}`}
          </p>
        </div>

        {/* ▼ ROLE GATE: only students can submit new issues */}
        {isStudent && (
          <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
            {showForm ? 'Cancel' : '+ Report Issue'}
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div style={{
        display: 'grid',
        gridTemplateColumns: showForm ? '1fr 380px' : '1fr',
        gap: 24, alignItems: 'start'
      }}>

        {/* ── Issues list ── */}
        <div>
          {loading ? (
            <div className="spinner" />
          ) : issues.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <h4>No issues reported</h4>
                <p>{isStudent ? 'Use the button above to report a problem.' : 'No student issues yet.'}</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {issues.map(issue => (
                <div key={issue.id} className="card" style={{
                  // borderLeft: `4px solid ${
                  //   issue.status === 'Resolved'   ? 'var(--brand-green-light)' :
                  //   issue.status === 'In Review'  ? 'var(--status-info)'       :
                  //   'var(--brand-gold)'
                  // }`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                      {issue.title}
                    </div>
                    <span className={`badge ${STATUS_COLORS[issue.status] || 'badge-neutral'}`}>
                      {issue.status}
                    </span>
                  </div>

                  <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.6 }}>
                    {issue.description}
                  </p>

                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    Reported: {new Date(issue.created_at).toLocaleDateString()}
                  </div>

                  {/* ▼ ROLE GATE: only admins/supervisors can change status */}
                  {!isStudent && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center', marginRight: 4 }}>
                        Update status:
                      </span>
                      {STATUS_OPTIONS.filter(s => s !== issue.status).map(s => (
                        <button key={s}
                          className="btn btn-ghost"
                          style={{ padding: '4px 12px', fontSize: 12 }}
                          onClick={() => updateStatus(issue.id, s)}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Supervisor feedback if any */}
                  {issue.supervisor_feedback && (
                    <div style={{
                      marginTop: 10, background: 'var(--bg-raised)',
                      borderRadius: 'var(--r-sm)', padding: '10px 14px'
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '.05em', textTransform: 'uppercase' }}>
                        Supervisor Response
                      </div>
                      <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0 }}>
                        {issue.supervisor_feedback}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Submit form (students only) ── */}
        {showForm && isStudent && (
          <div className="card" style={{ position: 'sticky', top: 0 }}>
            <IssueForm
              onSubmitted={() => { setShowForm(false); load(); }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Issue report form ── */
function IssueForm({ onSubmitted, onCancel }) {
  const [form,    setForm]    = useState({ title: '', description: '' });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setSaving(true);
    try {
      await issuesAPI.create(form);
      setSuccess('Issue reported! An administrator will review it shortly.');
      setTimeout(onSubmitted, 1500);
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed to submit issue.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16, marginBottom: 16, color: 'var(--text-primary)' }}>
        Report an Issue
      </div>

      {error   && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="form-group">
        <label className="form-label">Issue title</label>
        <input className="form-input" type="text"
          value={form.title}
          placeholder="Briefly describe the problem"
          onChange={set('title')} required />
      </div>

      <div className="form-group">
        <label className="form-label">Full description</label>
        <textarea className="form-textarea" value={form.description}
          placeholder="What happened, when it happened, who is involved…"
          onChange={set('description')} required style={{ minHeight: 120 }} />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-danger" type="submit" disabled={saving}>
          {saving ? 'Submitting…' : 'Submit Issue'}
        </button>
        <button className="btn btn-ghost" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
