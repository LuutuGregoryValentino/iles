import React, { useState, useEffect } from 'react';
import { evaluationsAPI, placementsAPI } from '../../services/api';

function EvaluationForm({ onSubmitted }) {
  const [placements, setPlacements] = useState([]);
  const [form, setForm] = useState({
    placement: '',
    workplace_score: '',
    academic_score: '',
    logbook_score: '',
    feedback: '',
  });
  const [preview, setPreview]   = useState(null);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  useEffect(() => {
    placementsAPI.list()
      .then(r => setPlacements(r.data))
      .catch(() => setError('Could not load placements.'));
  }, []);

  const set = field => e => {
    const val = e.target.value;
    const updated = { ...form, [field]: val };
    setForm(updated);

    // Live preview of weighted score
    const w = parseFloat(updated.workplace_score) || 0;
    const a = parseFloat(updated.academic_score)  || 0;
    const l = parseFloat(updated.logbook_score)   || 0;
    if (w || a || l) {
      const total = Math.round((w * 0.4) + (a * 0.3) + (l * 0.3) * 100) / 100;
      const grade = total >= 80 ? 'A' : total >= 70 ? 'B' : total >= 60 ? 'C' : total >= 50 ? 'D' : 'F';
      setPreview({ total: ((w * 0.4) + (a * 0.3) + (l * 0.3)).toFixed(2), grade });
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate scores are between 0 and 100
    const scores = [form.workplace_score, form.academic_score, form.logbook_score];
    for (const s of scores) {
      if (parseInt(s) < 0 || parseInt(s) > 100) {
        setError('All scores must be between 0 and 100.');
        return;
      }
    }

    setSaving(true);
    try {
      await evaluationsAPI.create({
        placement:       parseInt(form.placement),
        workplace_score: parseInt(form.workplace_score),
        academic_score:  parseInt(form.academic_score),
        logbook_score:   parseInt(form.logbook_score),
        feedback:        form.feedback,
      });
      setSuccess('Evaluation submitted successfully!');
      setTimeout(onSubmitted, 2000);
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Submission failed. The student may already have an evaluation.');
    } finally {
      setSaving(false);
    }
  };

  const inp = {
    width: '100%', padding: '10px', marginBottom: '14px',
    borderRadius: '6px', border: '1px solid #ccc',
    fontSize: '14px', boxSizing: 'border-box',
  };
  const lbl = {
    display: 'block', marginBottom: '6px',
    fontWeight: '500', fontSize: '13px', color: '#333',
  };
  const gradeColor = (g) => {
    if (g === 'A') return '#155724';
    if (g === 'B') return '#0F6E56';
    if (g === 'C') return '#856404';
    if (g === 'D') return '#993C1D';
    return '#721c24';
  };

  return (
    <div>
      <h2 style={{ marginBottom: '6px' }}>Submit Student Evaluation</h2>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
        Score the student across three areas. The final grade is calculated automatically
        using the weighted formula: 40% Workplace + 30% Academic + 30% Logbook.
      </p>

      {error   && <p style={{ color:'red',   background:'#ffeaea', padding:'10px', borderRadius:'6px', marginBottom:'16px' }}>{error}</p>}
      {success && <p style={{ color:'green', background:'#eaffea', padding:'10px', borderRadius:'6px', marginBottom:'16px' }}>{success}</p>}

      <form onSubmit={handleSubmit} style={{ maxWidth: '580px' }}>

        {/* Placement selection */}
        <label style={lbl}>Select Student Placement</label>
        <select style={inp} value={form.placement} onChange={set('placement')} required>
          <option value="">Choose a placement...</option>
          {placements.map(p => (
            <option key={p.id} value={p.id}>
              {p.organization_name} — {p.position}
            </option>
          ))}
        </select>

        {/* Score inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div>
            <label style={lbl}>Workplace Score <span style={{ color:'#999', fontWeight:'normal' }}>(40% weight)</span></label>
            <input style={{ ...inp, marginBottom: 0 }} type="number" min="0" max="100"
              value={form.workplace_score} onChange={set('workplace_score')}
              placeholder="0 – 100" required />
          </div>
          <div>
            <label style={lbl}>Academic Score <span style={{ color:'#999', fontWeight:'normal' }}>(30% weight)</span></label>
            <input style={{ ...inp, marginBottom: 0 }} type="number" min="0" max="100"
              value={form.academic_score} onChange={set('academic_score')}
              placeholder="0 – 100" required />
          </div>
          <div>
            <label style={lbl}>Logbook Score <span style={{ color:'#999', fontWeight:'normal' }}>(30% weight)</span></label>
            <input style={{ ...inp, marginBottom: 0 }} type="number" min="0" max="100"
              value={form.logbook_score} onChange={set('logbook_score')}
              placeholder="0 – 100" required />
          </div>
        </div>

        {/* Live score preview */}
        {preview && (
          <div style={{
            background: '#f0f4ff', border: '1px solid #c0ccff',
            borderRadius: '8px', padding: '14px 18px',
            marginBottom: '16px', display: 'flex',
            alignItems: 'center', gap: '20px'
          }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Weighted Total</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#2E5DA6' }}>{preview.total}%</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Grade</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: gradeColor(preview.grade) }}>{preview.grade}</div>
            </div>
            <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.6' }}>
              <div>Workplace: {form.workplace_score || 0} × 0.4 = {((parseFloat(form.workplace_score) || 0) * 0.4).toFixed(1)}</div>
              <div>Academic:  {form.academic_score  || 0} × 0.3 = {((parseFloat(form.academic_score)  || 0) * 0.3).toFixed(1)}</div>
              <div>Logbook:   {form.logbook_score   || 0} × 0.3 = {((parseFloat(form.logbook_score)   || 0) * 0.3).toFixed(1)}</div>
            </div>
          </div>
        )}

        {/* Feedback */}
        <label style={lbl}>Supervisor Feedback</label>
        <textarea style={{ ...inp, height: '120px', resize: 'vertical' }}
          value={form.feedback}
          placeholder="Write detailed feedback about the student's performance, strengths, and areas for improvement..."
          onChange={set('feedback')} required />

        <button type="submit" disabled={saving} style={{
          padding: '11px 28px', background: '#2E5DA6', color: '#fff',
          border: 'none', borderRadius: '6px', cursor: 'pointer',
          fontSize: '14px', fontWeight: '500'
        }}>
          {saving ? 'Submitting...' : 'Submit Evaluation'}
        </button>

        <button type="button" onClick={onSubmitted} style={{
          padding: '11px 20px', background: 'transparent', color: '#666',
          border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer',
          fontSize: '14px', marginLeft: '12px'
        }}>
          Cancel
        </button>
      </form>
    </div>
  );
}

export default EvaluationForm;