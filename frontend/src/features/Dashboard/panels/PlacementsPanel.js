
import React, { useState, useEffect } from 'react';
import { placementsAPI, studentsAPI, supervisorsAPI, academicSupervisorsAPI } from '../../../services/api';
import API from '../../../services/api';

const STATUS_OPTIONS = ['Pending', 'Active', 'Complete'];
const STATUS_BADGE = {
  Active:   'badge-success',
  Pending:  'badge-warn',
  Complete: 'badge-neutral',
};
const STATUS_BORDER = {
  Active:   'var(--brand-green-light)',
  Pending:  'var(--brand-gold)',
  Complete: 'var(--border-strong)',
};

export default function PlacementsPanel({ isActive }) {
  const [placements,  setPlacements]  = useState([]);
  const [students,    setStudents]    = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [academicSupervisors, setAcademicSupervisors] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');

  /* UI state */
  const [showCreate,     setShowCreate]     = useState(false);
  const [editTarget,     setEditTarget]     = useState(null);
  const [confirmDelete,  setConfirmDelete]  = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [filterStatus,   setFilterStatus]   = useState('All');
  const [search,         setSearch]         = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [p, s, sv, as] = await Promise.all([
        placementsAPI.list(),
        studentsAPI.list(),
        supervisorsAPI.list(),
        academicSupervisorsAPI.list(),
      ]);
      setPlacements(p.data);
      setStudents(s.data);
      setSupervisors(sv.data);
      setAcademicSupervisors(as.data);
    } catch {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isActive) load(); }, [isActive]); // eslint-disable-line

  /* Quick status update */
  const updateStatus = async (id, newStatus) => {
    setStatusUpdating(id); setError(''); setSuccess('');
    try {
      await placementsAPI.update(id, { placement_status: newStatus });
      setPlacements(prev => prev.map(p =>
        p.id === id ? { ...p, placement_status: newStatus } : p
      ));
      setSuccess(`Status updated to "${newStatus}".`);
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Could not update placement status.');
    } finally {
      setStatusUpdating(null);
    }
  };

  /* Delete with server-side confirmation */
  const handleDelete = async (id) => {
    try {
      // DELETE /placements/:id/ — admin only (server enforces in placement_detail view)
      await API.delete(`/placements/${id}/`);
      setPlacements(prev => prev.filter(p => p.id !== id));
      setSuccess('Placement deleted.');
      setConfirmDelete(null);
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Delete failed.');
      setConfirmDelete(null);
    }
  };

  /* Filtered list */
  const filtered = placements.filter(p => {
    const matchStatus = filterStatus === 'All' || p.placement_status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      p.organization_name?.toLowerCase().includes(q) ||
      p.position?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const countFor = (s) => s === 'All' ? placements.length : placements.filter(p => p.placement_status === s).length;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 16 }}>
        <div>
          <h1 className="panel-title">Placements</h1>
          <p className="panel-subtitle">Manage student internship placements.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input className="form-input" style={{ paddingLeft: 32, width: 200 }}
              placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => { setShowCreate(true); setEditTarget(null); }}>
            + New Placement
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="tab-bar" style={{ marginBottom: 20 }}>
        {['All', ...STATUS_OPTIONS].map(s => (
          <button key={s}
            className={`tab-btn ${filterStatus === s ? 'active' : ''}`}
            onClick={() => setFilterStatus(s)}>
            {s}
            <span style={{
              marginLeft: 5, fontSize: 11, fontWeight: 700,
              background: filterStatus === s ? 'rgba(37,168,85,.2)' : 'var(--bg-overlay)',
              color: filterStatus === s ? 'var(--brand-green-light)' : 'var(--text-muted)',
              borderRadius: 99, padding: '1px 7px',
            }}>{countFor(s)}</span>
          </button>
        ))}
      </div>

      {error   && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div style={{
        display: 'grid',
        gridTemplateColumns: (showCreate || editTarget) ? '1fr 400px' : '1fr',
        gap: 24, alignItems: 'start',
      }}>
        {/* Placements list */}
        <div>
          {loading ? (
            <div className="spinner" />
          ) : filtered.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                <h4>{search ? 'No matches' : filterStatus !== 'All' ? `No ${filterStatus.toLowerCase()} placements` : 'No placements yet'}</h4>
                <p>Use the button above to create a placement.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map(p => (
                <div key={p.id} className="card" style={{
                  borderLeft: `4px solid ${STATUS_BORDER[p.placement_status] || 'var(--border-strong)'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 2 }}>
                        {p.organization_name}
                      </div>
                      <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        {p.position}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {p.start_date} → {p.end_date}
                      </div>
                    </div>
                    <span className={`badge ${STATUS_BADGE[p.placement_status] || 'badge-neutral'}`}>
                      {p.placement_status}
                    </span>
                  </div>

                  {/* Action bar */}
                  <div style={{
                    marginTop: 12, paddingTop: 12,
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
                  }}>
                    {/* Edit */}
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '4px 14px', fontSize: 12 }}
                      onClick={() => { setEditTarget(p); setShowCreate(false); }}>
                      ✏ Edit
                    </button>

                    {/* Status transitions */}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 2px' }}>→</span>
                    {STATUS_OPTIONS.filter(s => s !== p.placement_status).map(s => (
                      <button key={s}
                        className="btn btn-ghost"
                        style={{ padding: '4px 12px', fontSize: 12 }}
                        disabled={statusUpdating === p.id}
                        onClick={() => updateStatus(p.id, s)}>
                        {statusUpdating === p.id ? '…' : `Set ${s}`}
                      </button>
                    ))}

                    {/* Delete */}
                    <div style={{ marginLeft: 'auto' }}>
                      {confirmDelete === p.id ? (
                        <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: 'var(--brand-red-light)' }}>
                            Delete — are you sure?
                          </span>
                          <button className="btn btn-danger"
                            style={{ padding: '4px 12px', fontSize: 12 }}
                            onClick={() => handleDelete(p.id)}>
                            Yes, delete
                          </button>
                          <button className="btn btn-ghost"
                            style={{ padding: '4px 10px', fontSize: 12 }}
                            onClick={() => setConfirmDelete(null)}>
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '4px 12px', fontSize: 12, color: 'var(--brand-red-light)', borderColor: 'var(--brand-red-dim)' }}
                          onClick={() => setConfirmDelete(p.id)}>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side panel: Create or Edit */}
        {(showCreate || editTarget) && (
          <div className="card" style={{ position: 'sticky', top: 0 }}>
            {showCreate && (
              <PlacementForm
                students={students}
                supervisors={supervisors}
                academicSupervisors={academicSupervisors}
                onCreated={() => { setShowCreate(false); load(); setSuccess('Placement created.'); }}
                onCancel={() => setShowCreate(false)}
              />
            )}
            {editTarget && (
              <EditPlacementForm
                placement={editTarget}
                students={students}
                supervisors={supervisors}
                academicSupervisors={academicSupervisors}
                onSaved={() => { setEditTarget(null); load(); setSuccess('Placement updated.'); }}
                onCancel={() => setEditTarget(null)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Create placement ── */
function PlacementForm({ students, supervisors, academicSupervisors, onCreated, onCancel }) {
  const [form, setForm] = useState({
    student: '', organization_name: '', position: '',
    start_date: '', end_date: '',
    workplace_supervisor: '', academic_supervisor: '',
    placement_status: 'Pending',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const set = f => e => setForm(v => ({ ...v, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    setSaving(true);
    try {
      await placementsAPI.create({
        ...form,
        student:              parseInt(form.student, 10),
        workplace_supervisor: form.workplace_supervisor ? parseInt(form.workplace_supervisor, 10) : null,
        academic_supervisor:  form.academic_supervisor ? parseInt(form.academic_supervisor, 10) : null,
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
        <label className="form-label">
          Workplace Supervisor <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
        </label>
        <select className="form-select" value={form.workplace_supervisor} onChange={set('workplace_supervisor')}>
          <option value="">None assigned</option>
          {supervisors.map(s => (
            <option key={s.id} value={s.id}>{s.supervisor_name} — {s.job_title}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">
          Academic Supervisor <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
        </label>
        <select className="form-select" value={form.academic_supervisor} onChange={set('academic_supervisor')}>
          <option value="">None assigned</option>
          {academicSupervisors.map(s => (
            <option key={s.id} value={s.id}>{s.lecturer_name} ({s.college_dept})</option>
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
        <button className="btn btn-ghost" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

/* ── Edit placement ── */
function EditPlacementForm({ placement, students, supervisors, academicSupervisors, onSaved, onCancel }) {
  const [form, setForm] = useState({
    student:              placement.student?.toString()              || '',
    organization_name:    placement.organization_name               || '',
    position:             placement.position                        || '',
    start_date:           placement.start_date                      || '',
    end_date:             placement.end_date                        || '',
    workplace_supervisor: placement.workplace_supervisor?.toString() || '',
    academic_supervisor:  placement.academic_supervisor?.toString()  || '',
    placement_status:     placement.placement_status                || 'Pending',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const set = f => e => setForm(v => ({ ...v, [f]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault(); setError('');
    setSaving(true);
    try {
      await placementsAPI.update(placement.id, {
        ...form,
        student:              parseInt(form.student, 10),
        workplace_supervisor: form.workplace_supervisor ? parseInt(form.workplace_supervisor, 10) : null,
        academic_supervisor:  form.academic_supervisor ? parseInt(form.academic_supervisor, 10) : null,
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
      <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16, marginBottom: 4, color: 'var(--text-primary)' }}>
        Edit Placement
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
        {placement.organization_name} — {placement.position}
      </p>
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
        <input className="form-input" type="text" value={form.organization_name} onChange={set('organization_name')} required />
      </div>

      <div className="form-group">
        <label className="form-label">Position</label>
        <input className="form-input" type="text" value={form.position} onChange={set('position')} required />
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
        <label className="form-label">Workplace Supervisor</label>
        <select className="form-select" value={form.workplace_supervisor} onChange={set('workplace_supervisor')}>
          <option value="">None assigned</option>
          {supervisors.map(s => (
            <option key={s.id} value={s.id}>{s.supervisor_name} — {s.job_title}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Academic Supervisor</label>
        <select className="form-select" value={form.academic_supervisor} onChange={set('academic_supervisor')}>
          <option value="">None assigned</option>
          {academicSupervisors.map(s => (
            <option key={s.id} value={s.id}>{s.lecturer_name} ({s.college_dept})</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Status</label>
        <select className="form-select" value={form.placement_status} onChange={set('placement_status')}>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
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
