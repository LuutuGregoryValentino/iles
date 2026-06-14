/**
 * ScoreCardPanel.js
 *
 * ┌─────────────────────────────────────────────────────┐
 * │ WHO SEES THIS: student role only                     │
 * │ CONDITION: SECTIONS entry has roles: ['student']     │
 * └─────────────────────────────────────────────────────┘
 *
 * Read-only view of the student's evaluation result.
 * BUG FIXED: Original did two separate API calls sequentially.
 * Now uses Promise.all for a single round-trip.
 */
import React, { useState, useEffect } from 'react';
import { evaluationsAPI, placementsAPI } from '../../../services/api';

const gradeColors = {
  A: { bg: 'var(--status-success-bg)', text: 'var(--brand-green-light)', border: 'var(--brand-green-light)' },
  B: { bg: 'var(--status-info-bg)',    text: 'var(--status-info)',        border: 'var(--status-info)' },
  C: { bg: 'var(--status-warn-bg)',    text: 'var(--status-warn)',        border: 'var(--status-warn)' },
  D: { bg: 'rgba(192,57,43,.12)',      text: 'var(--brand-red-light)',    border: 'var(--brand-red-light)' },
  F: { bg: 'var(--status-danger-bg)', text: 'var(--brand-red-light)',    border: 'var(--brand-red-light)' },
};
const gradeMsg = {
  A: 'Excellent performance — Outstanding work!',
  B: 'Good performance — Well done!',
  C: 'Satisfactory — keep pushing.',
  D: 'Below average — more effort needed.',
  F: 'Needs significant improvement.',
};
const barColor = (s) => s >= 70 ? 'var(--brand-green-light)' : s >= 50 ? 'var(--status-warn)' : 'var(--brand-red-light)';

export default function ScoreCardPanel({ currentUser, isActive }) {
  const [evaluation, setEvaluation] = useState(null);
  const [placement,  setPlacement]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  useEffect(() => {
    if (!isActive) return;
    setLoading(true);
    const load = async () => {
      try {
        const [pRes, eRes] = await Promise.all([placementsAPI.list(), evaluationsAPI.list()]);
        const myPlacement = pRes.data[0] || null;
        setPlacement(myPlacement);
        if (myPlacement) {
          const myEval = eRes.data.find(e => e.placement === myPlacement.id);
          setEvaluation(myEval || null);
        }
      } catch {
        setError('Could not load your evaluation. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isActive]);

  if (loading) return <div className="spinner" />;

  return (
    <div className="fade-in" style={{ maxWidth: 640 }}>
      <h1 className="panel-title">My Evaluation Score</h1>
      <p className="panel-subtitle">Your performance evaluation from your supervisors.</p>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Placement info */}
      {placement && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Placement</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
            {placement.organization_name}
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>{placement.position}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            {placement.start_date} → {placement.end_date} &nbsp;·&nbsp;
            <span style={{ fontWeight: 600 }}>{placement.placement_status}</span>
          </div>
        </div>
      )}

      {!placement && !error && (
        <div className="alert alert-warn">
          No placement found. Contact your administrator.
        </div>
      )}

      {/* Pending */}
      {placement && !evaluation && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
          <div style={{ fontWeight: 700, color: 'var(--status-warn)', marginBottom: 6 }}>
            Evaluation Pending
          </div>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
            Your supervisor has not yet submitted your evaluation. Check back later.
          </p>
        </div>
      )}

      {/* Results */}
      {evaluation && (() => {
        const c = gradeColors[evaluation.grade] || gradeColors.F;
        return (
          <>
            {/* Grade banner */}
            <div style={{
              background: c.bg, border: `2px solid ${c.border}`,
              borderRadius: 'var(--r-xl)', padding: '28px 24px',
              textAlign: 'center', marginBottom: 20
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em',
                textTransform: 'uppercase', color: c.text, marginBottom: 8 }}>
                FINAL GRADE
              </div>
              <div style={{ fontSize: 80, fontWeight: 900, color: c.text, lineHeight: 1 }}>
                {evaluation.grade}
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: c.text, marginTop: 8 }}>
                {evaluation.total_score}%
              </div>
              <div style={{ fontSize: 14, color: c.text, marginTop: 10, opacity: .85 }}>
                {gradeMsg[evaluation.grade]}
              </div>
            </div>

            {/* Score breakdown */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 18, color: 'var(--text-primary)' }}>
                Score Breakdown
              </div>
              {[
                { label: 'Workplace Score', score: evaluation.workplace_score, weight: 0.4 },
                { label: 'Academic Score',  score: evaluation.academic_score,  weight: 0.3 },
                { label: 'Logbook Score',   score: evaluation.logbook_score,   weight: 0.3 },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>
                      {item.label}
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                        ({Math.round(item.weight * 100)}% weight)
                      </span>
                    </span>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: barColor(item.score) }}>
                      {(item.score * item.weight).toFixed(1)} pts
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill"
                      style={{ width: `${item.score}%`, background: barColor(item.score) }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                    {item.score}/100
                  </div>
                </div>
              ))}
              <hr className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Total</span>
                <span style={{ color: c.border }}>{evaluation.total_score}%</span>
              </div>
            </div>

            {/* Feedback */}
            {evaluation.feedback && (
              <div className="card">
                <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>
                  Supervisor Feedback
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {evaluation.feedback}
                </p>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
                  Submitted: {evaluation.submission_date}
                </div>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}
