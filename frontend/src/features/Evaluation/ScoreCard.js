import React, { useState, useEffect } from 'react';
import { evaluationsAPI, placementsAPI } from '../../services/api';

function ScoreCard({ currentUser }) {
  const [evaluation, setEvaluation] = useState(null);
  const [placement,  setPlacement]  = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        // Get student's placement first
        const pRes = await placementsAPI.list();
        if (pRes.data.length === 0) {
          setError('No placement found. Contact your administrator.');
          return;
        }
        const myPlacement = pRes.data[0];
        setPlacement(myPlacement);

        // Get evaluation for that placement
        const eRes = await evaluationsAPI.list();
        const myEval = eRes.data.find(e => e.placement === myPlacement.id);
        if (myEval) {
          setEvaluation(myEval);
        }
      } catch {
        setError('Could not load your evaluation. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const gradeColor = (g) => {
    if (g === 'A') return { bg: '#d4edda', text: '#155724', border: '#28a745' };
    if (g === 'B') return { bg: '#cce5ff', text: '#004085', border: '#0066cc' };
    if (g === 'C') return { bg: '#fff3cd', text: '#856404', border: '#ffc107' };
    if (g === 'D') return { bg: '#fde8d8', text: '#7a3b00', border: '#e07a00' };
    return { bg: '#f8d7da', text: '#721c24', border: '#dc3545' };
  };

  const gradeMessage = (g) => {
    if (g === 'A') return 'Excellent performance — Outstanding work!';
    if (g === 'B') return 'Good performance — Well done!';
    if (g === 'C') return 'Satisfactory performance — Keep improving!';
    if (g === 'D') return 'Below average — More effort needed.';
    return 'Needs significant improvement.';
  };

  const barColor = (score) => {
    if (score >= 70) return '#28a745';
    if (score >= 50) return '#ffc107';
    return '#dc3545';
  };

  if (loading) return <p>Loading your evaluation...</p>;
  if (error)   return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ maxWidth: '600px' }}>
      <h2 style={{ marginBottom: '6px' }}>My Evaluation Score</h2>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
        Your internship performance evaluation submitted by your supervisors.
      </p>

      {/* Placement info */}
      {placement && (
        <div style={{
          background: '#f8f9fa', border: '1px solid #e0e0e0',
          borderRadius: '8px', padding: '14px 18px', marginBottom: '20px'
        }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Internship Placement</div>
          <div style={{ fontWeight: '600', fontSize: '15px' }}>{placement.organization_name}</div>
          <div style={{ fontSize: '13px', color: '#555' }}>{placement.position}</div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
            {placement.start_date} → {placement.end_date} &nbsp;|&nbsp;
            Status: <span style={{ fontWeight: '500' }}>{placement.placement_status}</span>
          </div>
        </div>
      )}

      {/* No evaluation yet */}
      {!evaluation && (
        <div style={{
          background: '#fff3cd', border: '1px solid #ffc107',
          borderRadius: '8px', padding: '20px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>⏳</div>
          <div style={{ fontWeight: '600', color: '#856404', marginBottom: '6px' }}>Evaluation Pending</div>
          <div style={{ fontSize: '14px', color: '#856404' }}>
            Your supervisor has not yet submitted your evaluation. Check back later.
          </div>
        </div>
      )}

      {/* Evaluation results */}
      {evaluation && (() => {
        const colors = gradeColor(evaluation.grade);
        return (
          <>
            {/* Grade banner */}
            <div style={{
              background: colors.bg, border: `2px solid ${colors.border}`,
              borderRadius: '12px', padding: '24px',
              textAlign: 'center', marginBottom: '20px'
            }}>
              <div style={{ fontSize: '13px', color: colors.text, marginBottom: '6px', fontWeight: '500' }}>
                FINAL GRADE
              </div>
              <div style={{ fontSize: '72px', fontWeight: '900', color: colors.text, lineHeight: 1 }}>
                {evaluation.grade}
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: colors.text, marginTop: '8px' }}>
                {evaluation.total_score}%
              </div>
              <div style={{ fontSize: '14px', color: colors.text, marginTop: '8px' }}>
                {gradeMessage(evaluation.grade)}
              </div>
            </div>

            {/* Score breakdown */}
            <div style={{
              background: '#fff', border: '1px solid #e0e0e0',
              borderRadius: '8px', padding: '18px', marginBottom: '20px'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '16px', fontSize: '14px', color: '#333' }}>
                Score Breakdown
              </div>

              {[
                { label: 'Workplace Score', score: evaluation.workplace_score, weight: '40%', weighted: (evaluation.workplace_score * 0.4).toFixed(1) },
                { label: 'Academic Score',  score: evaluation.academic_score,  weight: '30%', weighted: (evaluation.academic_score  * 0.3).toFixed(1) },
                { label: 'Logbook Score',   score: evaluation.logbook_score,   weight: '30%', weighted: (evaluation.logbook_score   * 0.3).toFixed(1) },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '13px', color: '#444' }}>
                      {item.label} <span style={{ color: '#999', fontSize: '12px' }}>({item.weight})</span>
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>
                      {item.score}/100 → <span style={{ color: barColor(item.score) }}>{item.weighted} pts</span>
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '8px' }}>
                    <div style={{
                      width: `${item.score}%`, height: '8px',
                      background: barColor(item.score),
                      borderRadius: '4px', transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              ))}

              <div style={{
                borderTop: '1px solid #e0e0e0', marginTop: '14px', paddingTop: '12px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontWeight: '600', fontSize: '14px' }}>Total Score</span>
                <span style={{ fontWeight: '700', fontSize: '18px', color: colors.border }}>
                  {evaluation.total_score}%
                </span>
              </div>
            </div>

            {/* Feedback */}
            {evaluation.feedback && (
              <div style={{
                background: '#f8f9fa', border: '1px solid #e0e0e0',
                borderRadius: '8px', padding: '18px'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '10px', fontSize: '14px', color: '#333' }}>
                  Supervisor Feedback
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: '#555', lineHeight: '1.6' }}>
                  {evaluation.feedback}
                </p>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
                  Submitted on: {evaluation.submission_date}
                </div>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}

export default ScoreCard;