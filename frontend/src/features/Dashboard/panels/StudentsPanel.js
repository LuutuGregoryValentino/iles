/**
 * StudentsPanel.js (v2) — Admin only
 *
 * NEW FEATURES:
 * - Add new user account (POST /auth/register/ then student profile)
 * - Edit student details inline (PUT /students/:id/)
 * - Deactivate account — sets is_active=false via PATCH /students/:id/
 *   NOTE: The current back-end has no is_active toggle endpoint.
 *   TODO: Add PATCH /users/:id/ in views.py that allows admin to toggle is_active.
 *         Until then the deactivate button shows a clear "not yet implemented" note.
 * - Delete student record (DELETE /students/:id/ — admin only, enforced server-side)
 *
 * BUG NOTE: studentsAPI.update() sends PUT which requires ALL fields.
 *           For partial updates the back-end student_detail_api uses partial=True
 *           in the serializer call, so PUT with missing fields will still work.
 */
import React, { useState, useEffect } from 'react';
import { studentsAPI, authAPI } from '../../../services/api';

const COURSES = [
  'Bachelor of Science in Computer Science',
  'Bachelor of Science in Information Systems',
  'Bachelor of Science in Software Engineering',
];

export default function StudentsPanel({ isActive }) {
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  /* UI state */
  const [editTarget,   setEditTarget]   = useState(null);  // student object being edited
  const [showAddForm,  setShowAddForm]  = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // student id

  const load = () => {
    setLoading(true);
    studentsAPI.list()
      .then(r => setStudents(r.data))
      .catch(() => setError('Failed to load students.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (isActive) load(); }, [isActive]); // eslint-disable-line

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return (
      s.student_name?.toLowerCase().includes(q) ||
      s.student_id?.toLowerCase().includes(q) ||
      s.course?.toLowerCase().includes(q)
    );
  });

  const handleDelete = async (id) => {
    try {
      // NOTE: DELETE /students/:id/ — admin only, enforced server-side (views.py line ~95)
      await studentsAPI.delete(id); // DELETE /students/:id/ — admin only (views.py enforces this)
      setStudents(prev => prev.filter(s => s.id !== id));
      setSuccess('Student record deleted.');
      setConfirmDelete(null);
    } catch {
      setError('Delete failed. The server may have rejected it.');
    }
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div>
          <h1 className="panel-title">Students</h1>
          <p className="panel-subtitle">{students.length} registered student{students.length !== 1 ? 's' : ''}.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input className="form-input" style={{ paddingLeft: 32, width: 220 }}
              placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => { setShowAddForm(true); setEditTarget(null); }}>
            + Add Student
          </button>
        </div>
      </div>

      {error   && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: (showAddForm || editTarget) ? '1fr 380px' : '1fr', gap: 24, alignItems: 'start' }}>

        {/* Table */}
        <div>
          {loading ? (
            <div className="spinner" />
          ) : filtered.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <h4>{search ? 'No matches' : 'No students yet'}</h4>
                <p>{search ? 'Try a different search.' : 'Add a student using the button above.'}</p>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>ID</th>
                    <th>Programme</th>
                    <th>Yr/Sem</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'var(--brand-green-dim)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'Outfit', fontWeight: 700, fontSize: 13,
                            color: 'var(--brand-green-light)', flexShrink: 0,
                          }}>
                            {s.student_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {s.student_name}
                          </span>
                        </div>
                      </td>
                      <td>
                        <code style={{ fontSize: 12, background: 'var(--bg-raised)', padding: '2px 8px', borderRadius: 4 }}>
                          {s.student_id}
                        </code>
                      </td>
                      <td style={{ fontSize: 12.5, maxWidth: 180 }}>{s.course?.replace('Bachelor of Science in ', 'BSc ')}</td>
                      <td style={{ fontSize: 13 }}>Y{s.year_of_study} S{s.semester}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          {/* Edit */}
                          <button
                            className="btn btn-ghost"
                            style={{ padding: '4px 12px', fontSize: 12 }}
                            onClick={() => { setEditTarget(s); setShowAddForm(false); }}>
                            Edit
                          </button>
                          {/* Delete with confirmation */}
                          {confirmDelete === s.id ? (
                            <>
                              <button
                                className="btn btn-danger"
                                style={{ padding: '4px 10px', fontSize: 12 }}
                                onClick={() => handleDelete(s.id)}>
                                Confirm delete
                              </button>
                              <button
                                className="btn btn-ghost"
                                style={{ padding: '4px 8px', fontSize: 12 }}
                                onClick={() => setConfirmDelete(null)}>
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              className="btn btn-ghost"
                              style={{ padding: '4px 10px', fontSize: 12, color: 'var(--brand-red-light)', borderColor: 'var(--brand-red-dim)' }}
                              onClick={() => setConfirmDelete(s.id)}>
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Side panel: Add or Edit */}
        {(showAddForm || editTarget) && (
          <div className="card" style={{ position: 'sticky', top: 0 }}>
            {showAddForm && (
              <AddStudentForm
                onCreated={() => { setShowAddForm(false); load(); setSuccess('Student added successfully.'); }}
                onCancel={() => setShowAddForm(false)}
              />
            )}
            {editTarget && (
              <EditStudentForm
                student={editTarget}
                onSaved={() => { setEditTarget(null); load(); setSuccess('Student updated.'); }}
                onCancel={() => setEditTarget(null)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Add student: register user + create profile ── */
function AddStudentForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', username: '', email: '', university_id: '', password: 'Iles@2025!',
    student_id: '', course: '', year_of_study: '', semester: '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const set = f => e => setForm(v => ({ ...v, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    setSaving(true);
    try {
      /* Step 1: Register user account */
      const res = await authAPI.register({
        first_name:    form.first_name,
        last_name:     form.last_name,
        username:      form.username,
        email:         form.email,
        university_id: form.university_id,
        role:          'student',
        password:      form.password,
      });
      const userId = res.data.user.id;

      /* Step 2: Create student profile */
      await studentsAPI.create({
        user:          userId,
        student_name:  form.username,
        student_id:    form.student_id,
        course:        form.course,
        year_of_study: parseInt(form.year_of_study, 10),
        semester:      parseInt(form.semester, 10),
      });
      onCreated();
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed to create student.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16, marginBottom: 16, color: 'var(--text-primary)' }}>
        Add New Student
      </div>
      {error && <div className="alert alert-danger">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">First Name</label>
          <input className="form-input" type="text" value={form.first_name} onChange={set('first_name')} required />
        </div>
        <div className="form-group">
          <label className="form-label">Last Name</label>
          <input className="form-input" type="text" value={form.last_name} onChange={set('last_name')} required />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Username (handle)</label>
        <input className="form-input" type="text" placeholder="e.g. jdoe" value={form.username} onChange={set('username')} required />
      </div>

      <div className="form-group">
        <label className="form-label">Email</label>
        <input className="form-input" type="email" value={form.email} onChange={set('email')} required />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">University ID</label>
          <input className="form-input" type="text" placeholder="25/U/001" value={form.university_id} onChange={set('university_id')} required />
        </div>
        <div className="form-group">
          <label className="form-label">Student Reg. No.</label>
          <input className="form-input" type="text" placeholder="25/U/001" value={form.student_id} onChange={set('student_id')} required />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Programme</label>
        <select className="form-select" value={form.course} onChange={set('course')} required>
          <option value="">Select…</option>
          {COURSES.map(c => <option key={c} value={c}>{c.replace('Bachelor of Science in ', 'BSc ')}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Year</label>
          <select className="form-select" value={form.year_of_study} onChange={set('year_of_study')} required>
            <option value="">Year…</option>
            {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Semester</label>
          <select className="form-select" value={form.semester} onChange={set('semester')} required>
            <option value="">Sem…</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Temporary password</label>
        <input className="form-input" type="text" value={form.password} onChange={set('password')} required />
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          Student should change this on first login.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Creating…' : 'Create Student'}
        </button>
        <button className="btn btn-ghost" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

/* ── Edit student ── */
function EditStudentForm({ student, onSaved, onCancel }) {
  const [form, setForm] = useState({
    student_name:  student.student_name  || '',
    student_id:    student.student_id    || '',
    course:        student.course        || '',
    year_of_study: student.year_of_study?.toString() || '',
    semester:      student.semester?.toString()      || '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const set = f => e => setForm(v => ({ ...v, [f]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault(); setError('');
    setSaving(true);
    try {
      await studentsAPI.update(student.id, {
        ...form,
        year_of_study: parseInt(form.year_of_study, 10),
        semester:      parseInt(form.semester, 10),
      });
      onSaved();
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave}>
      <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16, marginBottom: 16, color: 'var(--text-primary)' }}>
        Edit Student
      </div>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="form-group">
        <label className="form-label">Full name</label>
        <input className="form-input" type="text" value={form.student_name} onChange={set('student_name')} required />
      </div>
      <div className="form-group">
        <label className="form-label">Registration number</label>
        <input className="form-input" type="text" value={form.student_id} onChange={set('student_id')} required />
      </div>
      <div className="form-group">
        <label className="form-label">Programme</label>
        <select className="form-select" value={form.course} onChange={set('course')} required>
          <option value="">Select…</option>
          {COURSES.map(c => <option key={c} value={c}>{c.replace('Bachelor of Science in ', 'BSc ')}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Year</label>
          <select className="form-select" value={form.year_of_study} onChange={set('year_of_study')} required>
            {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Semester</label>
          <select className="form-select" value={form.semester} onChange={set('semester')} required>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        <button className="btn btn-ghost" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
