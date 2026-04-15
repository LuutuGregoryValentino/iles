import React, { useState } from 'react';
import './ProfileForm.css';
import { studentsAPI } from '../../services/api';

function ProfileForm({ currentUser, onSaved }) {
  const [form, setForm] = useState({
    student_name:  currentUser?.username || '',
    student_id:    '',
    course:        '',
    year_of_study: '',
    semester:      '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await studentsAPI.create({
        ...form,
        user:          currentUser.id,
        year_of_study: parseInt(form.year_of_study),
        semester:      parseInt(form.semester),
      });
      onSaved();
    } catch (err) {
      const data = err.response?.data;
      const msg = typeof data === 'object'
        ? Object.values(data).flat().join(' ')
        : 'Could not save profile.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-card">
      <h2>Complete Your Profile</h2>
      {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
      <form onSubmit={handleSave}>
        <div className="input-group">
          <label>Full Name</label>
          <input type="text" value={form.student_name} onChange={set('student_name')} placeholder="Your official name" required />
        </div>
        <div className="input-group">
          <label>Student ID</label>
          <input type="text" value={form.student_id} onChange={set('student_id')} placeholder="25/U/0001" required />
        </div>
        <div className="input-group">
          <label>Course</label>
          <select value={form.course} onChange={set('course')} required>
            <option value="">Select a course</option>
            <option value="Bachelor of Science in Computer Science">BSc Computer Science</option>
            <option value="Bachelor of Science in Information Systems">BSc Information Systems</option>
            <option value="Bachelor of Science in Software Engineering">BSc Software Engineering</option>
          </select>
        </div>
        <div className="input-group">
          <label>Year of Study</label>
          <select value={form.year_of_study} onChange={set('year_of_study')} required>
            <option value="">Select year</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>
        </div>
        <div className="input-group">
          <label>Semester</label>
          <select value={form.semester} onChange={set('semester')} required>
            <option value="">Select semester</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </select>
        </div>
        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}

export default ProfileForm;
