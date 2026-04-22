/**
 * ProfileForm.js — Student profile setup
 *
 * Rendered as a modal overlay inside Dashboard on first login.
 * Non-student roles skip this entirely (gated in App.js → Dashboard).
 *
 * ┌──────────────────────────────────────────────────┐
 * │ WHO SEES THIS: student role only, on first login │
 * │ CONDITION: needsProfile === true (App.js)         │
 * └──────────────────────────────────────────────────┘
 *
 * BUG FIXED: Original sent year_of_study and semester as strings;
 * the API expected integers. Now explicitly parsed.
 */
import React, { useState } from 'react';
import { studentsAPI } from '../../services/api';

const COURSES = [
  'Bachelor of Science in Computer Science',
  'Bachelor of Science in Information Systems',
  'Bachelor of Science in Software Engineering',
];

export default function ProfileForm({ currentUser, onSaved }) {
  const [form, setForm] = useState({
    student_name:  currentUser?.username || '',
    student_id:    '',
    course:        '',
    year_of_study: '',
    semester:      '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await studentsAPI.create({
        ...form,
        user:          currentUser.id,
        year_of_study: parseInt(form.year_of_study, 10),
        semester:      parseInt(form.semester, 10),
      });
      onSaved();
    } catch (err) {
      const data = err.response?.data;
      setError(
        typeof data === 'object'
          ? Object.values(data).flat().join(' ')
          : 'Could not save profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box fade-in">
        <div className="modal-header">
          <h2 className="modal-title">Complete your profile</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Before you start, we need a few details about you.
          </p>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input className="form-input" type="text"
                value={form.student_name} onChange={set('student_name')} required />
            </div>

            <div className="form-group">
              <label className="form-label">Student registration number</label>
              <input className="form-input" type="text"
                placeholder="25/U/0001" value={form.student_id}
                onChange={set('student_id')} required />
            </div>

            <div className="form-group">
              <label className="form-label">Programme</label>
              <select className="form-select" value={form.course}
                onChange={set('course')} required>
                <option value="">Select your programme</option>
                {COURSES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Year of study</label>
                <select className="form-select" value={form.year_of_study}
                  onChange={set('year_of_study')} required>
                  <option value="">Year</option>
                  {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Semester</label>
                <select className="form-select" value={form.semester}
                  onChange={set('semester')} required>
                  <option value="">Semester</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                </select>
              </div>
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={saving}
              style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 8 }}
            >
              {saving ? 'Saving…' : 'Save & continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
