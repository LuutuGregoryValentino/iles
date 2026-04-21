/**
 * ReviewPanel.js — Logbook review for supervisors & admin
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │ WHO SEES THIS: workplace_supervisor, academic_supervisor,     │
 * │                administrator                                  │
 * │ CONDITION: SECTIONS entry roles in Dashboard.js              │
 * └──────────────────────────────────────────────────────────────┘
 *
 * Ported from SupervisorReview.js with the new design system.
 * BUG FIXED: Original filter tabs counted all logbooks for the
 * selected filter badge but filtered on frontend — the count was
 * correct but the display order was arbitrary. Now sorted by week.
 */
import React, { useState, useEffect } from 'react';
import { logbooksAPI } from '../../../services/api';

const FILTERS = ['All', 'Submitted', 'Approved', 'Draft'];

export default function ReviewPanel({ isActive }) {
  const [logbooks,  setLogbooks]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('Submitted');
  const [updating,  setUpdating]  = useState(null);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');

  useEffect(() => {
    if (!isActive) return;
    setLoading(true);
    logbooksAPI.list()
      .then(r => setLogbooks(
        [...r.data].sort((a, b) => a.week_number - b.week_number)
      ))
      .catch(() => setError('Failed to load logbooks.'))
      .finally(() => setLoading(false));
  }, [isActive]);

  const updateStatus = async (id, newStatus) => {
    setUpdating(id); setSuccess(''); setError('');
    try {
      await logbooksAPI.updateStatus(id, { submission_status: newStatus });
      setLogbooks(prev => prev.map(lb =>
        lb.id === id ? { ...lb, submission_status: newStatus } : lb
      ));
      setSuccess(`Logbook ${newStatus.toLowerCase()} successfully.`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Update failed.');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === 'All'
    ? logbooks
    : logbooks.filter(lb => lb.submission_status === filter);

  const countFor = (f) => f === 'All'
    ? logbooks.length
    : logbooks.filter(lb => lb.submission_status === f).length;

  return (
    <div className="fade-in">
      <h1 className="panel-title">Logbook Review</h1>
      <p className="panel-subtitle">Review and approve student logbook submissions.</p>

      {error   && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filter tabs */}
      <div className="tab-bar">
        {FILTERS.map(f => (
          <button key={f}
            className={`tab-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}>
            {f}
            <span style={{
              marginLeft: 6, fontSize: 11, fontWeight: 700,
              background: filter === f ? 'rgba(37,168,85,.2)' : 'var(--bg-overlay)',
              color: filter === f ? 'var(--brand-green-light)' : 'var(--text-muted)',
              borderRadius: 99, padding: '1px 7px'
            }}>
              {countFor(f)}
            </span>
          </button>
        ))}
      </div>

      {loading && <div className="spinner" />}

      {!loading && filtered.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <h4>No {filter === 'All' ? '' : filter.toLowerCase()} logbooks</h4>
            <p>Nothing to show here yet.</p>
          </div>
        </div>
      )}

      {!loading && filtered.map(lb => (
        <div key={lb.id} className="card" style={{
          marginBottom: 12,
          borderLeft: `4px solid ${
            lb.submission_status === 'Approved'  ? 'var(--brand-green-light)' :
            lb.submission_status === 'Submitted' ? 'var(--brand-gold)'        :
            'var(--border-strong)'
          }`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 2 }}>
                Week {lb.week_number}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {lb.start_date} → {lb.end_date} &nbsp;·&nbsp; {lb.hours_worked}h worked
              </div>
            </div>
            <span className={`badge ${
              lb.submission_status === 'Approved'  ? 'badge-success' :
              lb.submission_status === 'Submitted' ? 'badge-warn'    : 'badge-neutral'
            }`}>
              {lb.submission_status}
            </span>
          </div>

          <p style={{ margin: '0 0 6px', fontSize: 13.5, color: 'var(--text-secondary)' }}>
            <strong>Tasks: </strong>{lb.tasks_done}
          </p>
          {lb.challenges && lb.challenges !== 'None' && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
              <strong>Challenges: </strong>{lb.challenges}
            </p>
          )}

          {/* ── Action buttons: only shown when status === 'Submitted' ── */}
          {lb.submission_status === 'Submitted' && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 10 }}>
              <button
                className="btn btn-primary"
                onClick={() => updateStatus(lb.id, 'Approved')}
                disabled={updating === lb.id}
                style={{ padding: '6px 18px', fontSize: 13 }}>
                {updating === lb.id ? 'Updating…' : '✓ Approve'}
              </button>
              <button
                className="btn btn-danger"
                onClick={() => updateStatus(lb.id, 'Draft')}
                disabled={updating === lb.id}
                style={{ padding: '6px 18px', fontSize: 13 }}>
                ↩ Return to Draft
              </button>
            </div>
          )}

          {lb.submission_status === 'Approved' && (
            <p style={{ marginTop: 10, fontSize: 12, color: 'var(--brand-green-light)' }}>
              ✓ Approved — this logbook is locked.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
