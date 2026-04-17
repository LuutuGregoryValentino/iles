import React, { useState, useEffect } from 'react';
import './ProfileForm.css';
import { studentsAPI } from '../../services/api';

function ProfileForm({ currentUser, onSaved }) {
  const [form, setForm] = useState({
    student_name: currentUser?.username || '',
    student_id: '',
    course: '',
    year_of_study: '',
    semester: '',
  });
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [existingId, setExistingId] = useState(null); // track existing profile ID

  // On mount, check if a student profile already exists for this user
  useEffect(() => {
    const fetchExisting = async () => {
      try {
        const res = await studentsAPI.list();
        const profiles = res.data;
        // Find a profile belonging to the current user
        const mine = profiles.find(
          (p) => p.user === currentUser?.id || p.user?.id === currentUser?.id
        );
        if (mine) {
          setExistingId(mine.id);
          setForm({
            student_name:  mine.student_name  || currentUser?.username || '',
            student_id:    mine.student_id    || '',
            course:        mine.course        || '',
            year_of_study: String(mine.year_of_study || ''),
            semester:      String(mine.semester      || ''),
          });
        }
      } catch {
        // No existing profile found — that's fine, we'll create one
      }
    };

    if (currentUser?.id) fetchExisting();
  }, [currentUser]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    // Guard: ensure we have a valid user ID before submitting
    if (!currentUser?.id) {
      setError('User session is invalid. Please log out and sign in again.');
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      user:          currentUser.id,
      year_of_study: parseInt(form.year_of_study),
      semester:      parseInt(form.semester),
    };

    try {
      if (existingId) {
        // Profile already exists — update it
        await studentsAPI.update(existingId, payload);
      } else {
        // No profile yet — create one
        const res = await studentsAPI.create(payload);
        setExistingId(res.data.id); // store the new profile's ID
      }
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
    <div className="auth-card">
      <h2>Complete Your Profile</h2>
      {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
      <form onSubmit={handleSave}>
        <div className="input-group">
          <label>Full Name</label>
          <input
            type="text"
            value={form.student_name}
            onChange={set('student_name')}
            required
          />
        </div>
        <div className="input-group">
          <label>Student ID</label>
          <input
            type="text"
            value={form.student_id}
            onChange={set('student_id')}
            placeholder="25/U/0001"
            required
          />
        </div>
        <div className="input-group">
          <label>Course</label>
          <select value={form.course} onChange={set('course')} required>
            <option value="">Select course</option>
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