/**
 * StudentsPanel.js
 *
 * ┌─────────────────────────────────────────────────────┐
 * │ WHO SEES THIS: administrator only                    │
 * │ CONDITION: SECTIONS entry has roles:['administrator']│
 * │            in Dashboard.js                           │
 * └─────────────────────────────────────────────────────┘
 *
 * Lists all registered students with their course, year, and
 * current placement status. Admins can search by name/ID.
 *
 * MISSING COMPONENT — this did not exist in the original codebase.
 * The API endpoint GET /students/ already exists in views.py and urls.py.
 * 
 * TO EXTEND: Add a detail drawer or edit modal using studentsAPI.update()
 */
import React, { useState, useEffect } from 'react';
import { studentsAPI } from '../../../services/api';

export default function StudentsPanel({ isActive }) {
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    if (!isActive) return;
    studentsAPI.list()
      .then(r => setStudents(r.data))
      .catch(() => setError('Failed to load students.'))
      .finally(() => setLoading(false));
  }, [isActive]);

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return (
      s.student_name?.toLowerCase().includes(q) ||
      s.student_id?.toLowerCase().includes(q) ||
      s.course?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="panel-title">Students</h1>
          <p className="panel-subtitle">
            All registered students — {students.length} total.
          </p>
        </div>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <svg
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="form-input"
            style={{ paddingLeft: 36, width: 260 }}
            type="text"
            placeholder="Search by name, ID or course…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="spinner" />
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
            <h4>{search ? 'No students match your search' : 'No students yet'}</h4>
            <p>{search ? 'Try a different name or ID.' : 'Students will appear here once they register and complete their profiles.'}</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Student ID</th>
                <th>Programme</th>
                <th>Year</th>
                <th>Semester</th>
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
                        color: 'var(--brand-green-light)', flexShrink: 0
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
                  <td style={{ maxWidth: 220 }}>
                    <span style={{ fontSize: 13 }}>{s.course}</span>
                  </td>
                  <td>Year {s.year_of_study}</td>
                  <td>Sem {s.semester}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
