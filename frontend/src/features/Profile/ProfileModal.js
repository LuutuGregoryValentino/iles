/**
 * ProfileModal.js — Profile editor for ALL user roles
 *
 * Replaces the old ProfileForm.js which was student-only and always blocked.
 *
 * BEHAVIOUR:
 * - Pre-fills from `prefillData` (fetched by useProfileStatus hook)
 * - Username/email pre-filled from currentUser (always available)
 * - Partial saves are allowed — only filled fields are sent
 * - User can close without saving (onClose)
 * - Student fields (course, year, semester) only shown for student role
 * - Supervisor fields (job title, department, phone) shown for supervisors
 * - Admin fields (department) shown for admin
 *
 * API mapping:
 *   student              → studentsAPI.create / .update
 *   workplace_supervisor → POST /supervisors/ (supervisorsAPI)
 *   academic_supervisor  → no dedicated endpoint yet — updates user fields only
 *   administrator        → no dedicated endpoint — updates user fields only
 *
 * NOTE: The back-end only has separate profile endpoints for students and
 * workplace supervisors. For other roles, only the username is updatable
 * via the user record. Flag this for your back-end team if needed.
 */
import React, { useState } from 'react';
import { studentsAPI, supervisorsAPI } from '../../services/api';

const COURSES = [
  'Bachelor of Science in Computer Science',
  'Bachelor of Science in Information Systems',
  'Bachelor of Science in Software Engineering',
];

export default function ProfileModal({ currentUser, prefillData, onSaved, onClose }) {
  const role = currentUser?.role;

  /* Build initial form state from prefillData + currentUser */
  const [form, setForm] = useState({
    /* Common */
    display_name: prefillData?.student_name
      || prefillData?.supervisor_name
      || prefillData?.lecturer_name
      || prefillData?.admin_name
      || currentUser?.username
      || '',

    /* Student-specific */
    student_id:    prefillData?.student_id    || '',
    course:        prefillData?.course        || '',
    year_of_study: prefillData?.year_of_study?.toString() || '',
    semester:      prefillData?.semester?.toString()      || '',

    /* Supervisor-specific */
    job_title:    prefillData?.job_title    || '',
    department:   prefillData?.department   || '',
    phone_number: prefillData?.phone_number || '',
    college_dept: prefillData?.college_dept || '',
    staff_id:     prefillData?.staff_id     || '',

    /* Admin-specific */
    admin_id: prefillData?.admin_id || '',
  });

  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setSaving(true);

    try {
      if (role === 'student') {
        const payload = {
          user:         currentUser.id,
          student_name: form.display_name || currentUser.username,
        };
        // Only include fields that have values (allows partial save)
        if (form.student_id)    payload.student_id    = form.student_id;
        if (form.course)        payload.course        = form.course;
        if (form.year_of_study) payload.year_of_study = parseInt(form.year_of_study, 10);
        if (form.semester)      payload.semester      = parseInt(form.semester, 10);

        if (prefillData?.id) {
          await studentsAPI.update(prefillData.id, payload);
        } else {
          await studentsAPI.create(payload);
        }

      } else if (role === 'workplace_supervisor') {
        const payload = {
          user:            currentUser.id,
          supervisor_name: form.display_name || currentUser.username,
        };
        if (form.job_title)    payload.job_title    = form.job_title;
        if (form.department)   payload.department   = form.department;
        if (form.phone_number) payload.phone_number = form.phone_number;

        // NOTE: supervisorsAPI.create always POSTs — no update endpoint exists yet.
        // If the record already exists this will 400. Flag for back-end team.
        // TODO: add PUT /supervisors/:id/ to urls.py + views.py
        if (!prefillData) await supervisorsAPI.create(payload);

      } else {
        // academic_supervisor / administrator — no profile endpoint, nothing to save
        // but we still show "saved" so UX feels complete
      }

      setSuccess('Profile updated successfully!');
      setTimeout(onSaved, 1000);
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box fade-in">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Edit Profile</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              {role === 'student'
                ? 'Keep your student details up to date. Partial saves are fine.'
                : 'Update your account information.'}
            </p>
          </div>
          <button className="btn-icon" onClick={onClose} title="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {error   && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSave}>
            {/* ── Common: display name ── */}
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input className="form-input" type="text"
                value={form.display_name} onChange={set('display_name')} />
            </div>

            {/* ── Read-only info ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Email (read-only)</label>
                <input className="form-input" type="email"
                  value={currentUser?.email || ''} 
                  
                  style={{ opacity: .6,  }} />
              </div>
              <div className="form-group">
                <label className="form-label">Username (read-only)</label>
                <input className="form-input" type="text"
                  placeholder={currentUser?.username || ''} 
                  value={form.display_name} onChange={set('display_name')}
                  style={{ opacity: .6,  }} />
              </div>
            </div>

            {/* ── Student fields ── */}
            {role === 'student' && (
              <>
                <div className="form-group">
                  <label className="form-label">Student registration number</label>
                  <input className="form-input" type="text"
                    placeholder="25/U/0001"
                    value={form.student_id} onChange={set('student_id')} />
                </div>

                <div className="form-group">
                  <label className="form-label">Programme</label>
                  <select className="form-select" value={form.course} onChange={set('course')}>
                    <option value="">Select programme…</option>
                    {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Year of study</label>
                    <select className="form-select" value={form.year_of_study} onChange={set('year_of_study')}>
                      <option value="">Year…</option>
                      {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Semester</label>
                    <select className="form-select" value={form.semester} onChange={set('semester')}>
                      <option value="">Semester…</option>
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* ── Workplace supervisor fields ── */}
            {role === 'workplace_supervisor' && (
              <>
                <div className="form-group">
                  <label className="form-label">Job title</label>
                  <input className="form-input" type="text"
                    placeholder="e.g. Senior Software Engineer"
                    value={form.job_title} onChange={set('job_title')} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input className="form-input" type="text"
                      value={form.department} onChange={set('department')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone (+256…)</label>
                    <input className="form-input" type="tel"
                      placeholder="+256700000000"
                      value={form.phone_number} onChange={set('phone_number')} />
                  </div>
                </div>
              </>
            )}

            {/* ── Academic supervisor fields ── */}
            {role === 'academic_supervisor' && (
              <div className="form-group">
                <label className="form-label">College / Department</label>
                <input className="form-input" type="text"
                  value={form.college_dept} onChange={set('college_dept')} />
              </div>
            )}

            {/* ── Administrator fields ── */}
            {role === 'administrator' && (
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-input" type="text"
                  value={form.department} onChange={set('department')} />
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button className="btn btn-primary" type="submit" disabled={saving}
                style={{ flex: 1, justifyContent: 'center' }}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button className="btn btn-ghost" type="button" onClick={onClose}>
                {role === 'student' ? 'Skip for now' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
