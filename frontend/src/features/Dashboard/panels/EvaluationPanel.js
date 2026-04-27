/**
 * EvaluationPanel.js
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │ WHO SEES THIS: workplace_supervisor, academic_supervisor,     │
 * │                administrator                                  │
 * │ Students see their OWN score read-only in ScoreCardPanel.     │
 * └──────────────────────────────────────────────────────────────┘
 *
 * Two sub-views via tab:
 *   1. "Submit" — evaluation form
 *   2. "History" — list of submitted evaluations
 *
 * BUG FIXED: Original EvaluationForm had a math error in the live
 * preview formula:
 *   Math.round((w * 0.4) + (a * 0.3) + (l * 0.3) * 100) / 100
 *   ← this applies *100/100 only to logbook_score due to operator
 *      precedence. Fixed to:
 *   Math.round(((w * 0.4) + (a * 0.3) + (l * 0.3)) * 100) / 100
 */
import React, { useState, useEffect } from 'react';
import { evaluationsAPI, placementsAPI } from '../../../services/api';

export default function EvaluationPanel({ isActive }) {
  const [tab, setTab] = useState('submit');
  return (
    <div className="fade-in">
      <h1 className="panel-title">Evaluations</h1>
      <p className="panel-subtitle">
        Submit and manage student performance evaluations.
      </p>

      <div className="tab-bar">
        <button className={`tab-btn ${tab === 'submit'  ? 'active' : ''}`} onClick={() => setTab('submit')}>
          Submit Evaluation
        </button>
        <button className={`tab-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          History
        </button>
      </div>

      {tab === 'submit'  && <EvalForm  isActive={isActive} />}
      {tab === 'history' && <EvalList  isActive={isActive && tab === 'history'} />}
    </div>
  );
}

/* ── Evaluation form ── */
function EvalForm({ isActive }) {
  const [placements, setPlacements] = useState([]);
  const [form, setForm] = useState({
    placement: '', workplace_score: '', academic_score: '', logbook_score: '', feedback: '',
  });
  const [preview, setPreview] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isActive) return;
    placementsAPI.list()
      .then(r => setPlacements(r.data))
      .catch(() => setError('Could not load placements.'));
  }, [isActive]);

  const set = (field) => (e) => {
    const val = e.target.value;
    const updated = { ...form, [field]: val };
    setForm(updated);
    // BUG FIX: corrected formula (parentheses around entire sum before *100)
    const w = parseFloat(updated.workplace_score) || 0;
    const a = parseFloat(updated.academic_score)  || 0;
    const l = parseFloat(updated.logbook_score)   || 0;
    if (w || a || l) {
      const total = Math.round(((w * 0.4) + (a * 0.3) + (l * 0.3)) * 100) / 100;
      const grade = total >= 80 ? 'A' : total >= 70 ? 'B' : total >= 60 ? 'C' : total >= 50 ? 'D' : 'F';
      setPreview({ total, grade });
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const scores = [form.workplace_score, form.academic_score, form.logbook_score];
    for (const s of scores) {
      if (parseInt(s, 10) < 0 || parseInt(s, 10) > 100) {
        setError('All scores must be between 0 and 100.');
        return;
      }
    }
    setSaving(true);
    try {
      await evaluationsAPI.create({
        placement:       parseInt(form.placement, 10),
        workplace_score: parseInt(form.workplace_score, 10),
        academic_score:  parseInt(form.academic_score,  10),
        logbook_score:   parseInt(form.logbook_score,   10),
        feedback:        form.feedback,
      });
      setSuccess('Evaluation submitted successfully!');
      setForm({ placement: '', workplace_score: '', academic_score: '', logbook_score: '', feedback: '' });
      setPreview(null);
    } catch (err) {
      const data = err.response?.data;
      setError(
        typeof data === 'object'
          ? Object.values(data).flat().join(' ')
          : 'Submission failed. This student may already have an evaluation.'
      );
    } finally {
      setSaving(false);
    }
  };

  const gradeColor = (g) => ({
    A: 'var(--brand-green-light)',
    B: 'var(--status-info)',
    C: 'var(--status-warn)',
    D: 'var(--brand-red-light)',
    F: 'var(--brand-red-light)',
  }[g] || 'var(--text-primary)');

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
      {error   && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="form-group">
        <label className="form-label">Student placement</label>
        <select className="form-select" value={form.placement} onChange={set('placement')} required>
          <option value="">Choose a placement…</option>
          {placements.map(p => (
            <option key={p.id} value={p.id}>{p.organization_name} — {p.position}</option>
          ))}
        </select>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
        Formula: 40% Workplace + 30% Academic + 30% Logbook
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
        {[
          { field: 'workplace_score', label: 'Workplace', weight: '40%' },
          { field: 'academic_score',  label: 'Academic',  weight: '30%' },
          { field: 'logbook_score',   label: 'Logbook',   weight: '30%' },
        ].map(({ field, label, weight }) => (
          <div key={field} className="form-group">
            <label className="form-label">
              {label} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({weight})</span>
            </label>
            <input className="form-input" type="number" min="0" max="100"
              value={form[field]} onChange={set(field)}
              placeholder="0–100" required />
          </div>
        ))}
      </div>

      {/* Live preview */}
      {preview && (
        <div style={{
          background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--r-md)', padding: '14px 18px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 24
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, letterSpacing: '.05em' }}>WEIGHTED TOTAL</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--brand-green-light)', fontFamily: 'Outfit' }}>
              {preview.total}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, letterSpacing: '.05em' }}>GRADE</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: gradeColor(preview.grade), fontFamily: 'Outfit' }}>
              {preview.grade}
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8 }}>
            <div>Workplace: {form.workplace_score || 0} × 0.4 = {((parseFloat(form.workplace_score) || 0) * 0.4).toFixed(1)}</div>
            <div>Academic:  {form.academic_score  || 0} × 0.3 = {((parseFloat(form.academic_score)  || 0) * 0.3).toFixed(1)}</div>
            <div>Logbook:   {form.logbook_score   || 0} × 0.3 = {((parseFloat(form.logbook_score)   || 0) * 0.3).toFixed(1)}</div>
          </div>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Supervisor feedback</label>
        <textarea className="form-textarea" value={form.feedback}
          placeholder="Detailed feedback on the student's performance, strengths, and areas for improvement…"
          onChange={set('feedback')} required style={{ minHeight: 120 }} />
      </div>

      <button className="btn btn-primary" type="submit" disabled={saving}>
        {saving ? 'Submitting…' : 'Submit Evaluation'}
      </button>
    </form>
  );
}

/* ── Evaluation history ── */
function EvalList({ isActive }) {
  const [evals,   setEvals]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!isActive) return;
    evaluationsAPI.list()
      .then(r => setEvals(r.data))
      .catch(() => setError('Could not load evaluations.'))
      .finally(() => setLoading(false));
  }, [isActive]);

  if (loading) return <div className="spinner" />;
  if (error)   return <div className="alert alert-danger">{error}</div>;
  if (!evals.length) return (
    <div className="card">
      <div className="empty-state">
        <h4>No evaluations yet</h4>
        <p>Submitted evaluations will appear here.</p>
      </div>
    </div>
  );

  return (
    <div>
      {evals.map(ev => (
        <div key={ev.id} className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontFamily: 'Outfit', fontWeight: 700, color: 'var(--text-primary)' }}>
              Placement #{ev.placement}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontFamily: 'Outfit', fontSize: 20, fontWeight: 800,
                color: ev.grade >= 'A' && ev.grade <= 'B' ? 'var(--brand-green-light)' : 'var(--status-warn)' }}>
                {ev.grade}
              </span>
              <span className="badge badge-neutral">{ev.total_score}%</span>
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>
            Submitted: {ev.submission_date}
          </div>
          {ev.feedback && (
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0 }}>
              {ev.feedback}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
