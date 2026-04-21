/**
 * PlacementsPanel.js
 *
 * ┌─────────────────────────────────────────────────────┐
 * │ WHO SEES THIS: administrator only                    │
 * │ CONDITION: SECTIONS entry has roles:['administrator']│
 * └─────────────────────────────────────────────────────┘
 *
 * MISSING COMPONENT — did not exist in the original codebase.
 * The API endpoints already exist in views.py and urls.py:
 *   GET /placements/     → list all placements
 *   POST /placements/    → create (admin only, enforced server-side)
 *   PUT /placements/:id/ → update status
 *
 * Admin can:
 *   - View all placements with their status
 *   - Create a new placement (assigns a student to an organisation)
 *   - Update placement status (Pending → Active → Complete)
 *
 * TO EXTEND: Add edit/delete functionality using placementsAPI.update()
 *            and a supervisor assignment form.
 *
 * BUG NOTE: The server enforces that only admins can POST to /placements/.
 * This panel adds a client-side guard too — the Create button only appears
 * because this entire panel is gated to administrator role in Dashboard.js.
 */
import React, { useState, useEffect } from 'react';
import { placementsAPI, studentsAPI, supervisorsAPI } from '../../../services/api';

const STATUS_OPTIONS = ['Pending', 'Active', 'Complete'];
const STATUS_COLORS = {
  Active:   'badge-success',
  Pending:  'badge-warn',
  Complete: 'badge-neutral',
};

export default function PlacementsPanel({ isActive }) {
  const [placements,   setPlacements]   = useState([]);
  const [students,     setStudents]     = useState([]);
  const [supervisors,  setSupervisors]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const [updatingId,   setUpdatingId]   = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, s, sv] = await Promise.all([
        placementsAPI.list(),
        studentsAPI.list(),
        supervisorsAPI.list(),
      ]);
      setPlacements(p.data);
      setStudents(s.data);
      setSupervisors(sv.data);
    } catch {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isActive) load(); }, [isActive]); // eslint-disable-line

  /* Quick status update */
  const updateStatus = async (id, newStatus) => {
    setUpdatingId(id); setError(''); setSuccess('');
    try {
      await placementsAPI.update(id, { placement_status: newStatus });
      setPlacements(prev => prev.map(p =>
        p.id === id ? { ...p, placement_status: newStatus } : p
      ));
      setSuccess(`Placement status updated to ${newStatus}.`);
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Could not update placement status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="panel-title">Placements</h1>
          <p className="panel-subtitle">Manage student internship placements.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? 'Cancel' : '+ New Placement'}
        </button>
      </div>

      {error   && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div style={{
        display: 'grid',
        gridTemplateColumns: showForm ? '1fr 400px' : '1fr',
        gap: 24, alignItems: 'start'
      }}>

        {/* ── Placements list ── */}
        <div>
          {loading ? (
            <div className="spinner" />
          ) : placements.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                <h4>No placements yet</h4>
                <p>Use the button above to create the first placement.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {placements.map(p => (
                <div key={p.id} className="card" style={{
                  borderLeft: `4px solid ${
                    p.placement_status === 'Active'   ? 'var(--brand-green-light)' :
                    p.placement_status === 'Complete' ? 'var(--border-strong)'     :
                    'var(--brand-gold)'
                  }`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 2 }}>
                        {p.organization_name}
                      </div>
                      <div style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>
                        {p.position}
                      </div>
                    </div>
                    <span className={`badge ${STATUS_COLORS[p.placement_status] || 'badge-neutral'}`}>
                      {p.placement_status}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                    {p.start_date} → {p.end_date}
                  </div>

                  {/* Status controls */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center', marginRight: 4 }}>
                      Set status:
                    </span>
                    {STATUS_OPTIONS.filter(s => s !== p.placement_status).map(s => (
                      <button key={s}
                        className="btn btn-ghost"
                        style={{ padding: '4px 12px', fontSize: 12 }}
                        disabled={updatingId === p.id}
                        onClick={() => updateStatus(p.id, s)}>
                        {updatingId === p.id ? '…' : s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Create form ── */}
        {showForm && (
          <div className="card" style={{ position: 'sticky', top: 0 }}>
            <PlacementForm
              students={students}
              supervisors={supervisors}
              onCreated={() => { setShowForm(false); load(); }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Create placement form ── */
function PlacementForm({ students, supervisors, onCreated, onCancel }) {
  const [form, setForm] = useState({
    student: '', organization_name: '', position: '',
    start_date: '', end_date: '',
    workplace_supervisor: '', academic_supervisor: '',
    placement_status: 'Pending',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await placementsAPI.create({
        ...form,
        student: parseInt(form.student, 10),
        workplace_supervisor: form.workplace_supervisor ? parseInt(form.workplace_supervisor, 10) : null,
        academic_supervisor:  form.academic_supervisor  ? parseInt(form.academic_supervisor,  10) : null,
      });
      onCreated();
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Could not create placement.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16, marginBottom: 16, color: 'var(--text-primary)' }}>
        New Placement
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="form-group">
        <label className="form-label">Student</label>
        <select className="form-select" value={form.student} onChange={set('student')} required>
          <option value="">Select student…</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.student_name} ({s.student_id})</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Organisation name</label>
        <input className="form-input" type="text"
          placeholder="e.g. MTN Uganda" value={form.organization_name}
          onChange={set('organization_name')} required />
      </div>

      <div className="form-group">
        <label className="form-label">Position / role</label>
        <input className="form-input" type="text"
          placeholder="e.g. Software Engineer Intern" value={form.position}
          onChange={set('position')} required />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Start date</label>
          <input className="form-input" type="date" value={form.start_date} onChange={set('start_date')} required />
        </div>
        <div className="form-group">
          <label className="form-label">End date</label>
          <input className="form-input" type="date" value={form.end_date} onChange={set('end_date')} required />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Workplace supervisor <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
        <select className="form-select" value={form.workplace_supervisor} onChange={set('workplace_supervisor')}>
          <option value="">None assigned</option>
          {supervisors.map(s => (
            <option key={s.id} value={s.id}>{s.supervisor_name} — {s.job_title}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Initial status</label>
        <select className="form-select" value={form.placement_status} onChange={set('placement_status')}>
          <option value="Pending">Pending</option>
          <option value="Active">Active</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Creating…' : 'Create Placement'}
        </button>
        <button className="btn btn-ghost" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
