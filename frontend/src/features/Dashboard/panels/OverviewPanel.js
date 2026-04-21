/**
 * OverviewPanel.js — Home dashboard for all roles
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │ ROLE-BASED CONTENT STRATEGY                                   │
 * │                                                               │
 * │ student              → placement info, logbook progress,      │
 * │                        latest logbook status, pending issues  │
 * │                                                               │
 * │ workplace_supervisor → pending logbooks to review,            │
 * │                        evaluations to submit                  │
 * │                                                               │
 * │ academic_supervisor  → same as workplace supervisor            │
 * │                                                               │
 * │ administrator        → total students, active placements,     │
 * │                        open issues, pending logbooks          │
 * └──────────────────────────────────────────────────────────────┘
 *
 * All data is fetched fresh when isActive becomes true.
 */
import React, { useState, useEffect } from 'react';
import {
  studentsAPI, placementsAPI, logbooksAPI,
  evaluationsAPI, issuesAPI
} from '../../../services/api';

/* ── Small helpers ── */
function StatTile({ color, icon, value, label, sub }) {
  return (
    <div className={`stat-tile ${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function PlacementCard({ placement }) {
  if (!placement) return (
    <div className="card" style={{ textAlign: 'center', padding: '36px 24px' }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>🏢</div>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
        No active placement yet. Contact your administrator.
      </p>
    </div>
  );

  const statusColor = {
    Active:   'badge-success',
    Pending:  'badge-warn',
    Complete: 'badge-neutral',
  }[placement.placement_status] || 'badge-neutral';

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Current Placement</span>
        <span className={`badge ${statusColor}`}>{placement.placement_status}</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
        {placement.organization_name}
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
        {placement.position}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        {placement.start_date} → {placement.end_date}
      </div>
    </div>
  );
}

/* ── Icon helpers ── */
const icons = {
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  book: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
    </svg>
  ),
  alert: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  chart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  check: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

/* ═══════════════════════════════════════════════════════════════ */

export default function OverviewPanel({ currentUser, isActive }) {
  const role = currentUser?.role;
  const [data,    setData]    = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isActive) return;
    setLoading(true);
    fetchData(role).then(d => { setData(d); setLoading(false); });
  }, [isActive, role]); // eslint-disable-line

  if (loading) return <div className="spinner" />;

  /* ── Delegate to role-specific view ── */
  if (role === 'student')       return <StudentOverview data={data} />;
  if (role === 'administrator') return <AdminOverview   data={data} />;
  return <SupervisorOverview data={data} />;
}

/* ── Data fetchers per role ── */
async function fetchData(role) {
  try {
    if (role === 'student') {
      const [p, l, i] = await Promise.all([
        placementsAPI.list(),
        logbooksAPI.list(),
        issuesAPI.list(),
      ]);
      return { placement: p.data[0] || null, logbooks: p.data, issues: i.data, allLogbooks: l.data };
    }
    if (role === 'administrator') {
      const [s, p, l, i] = await Promise.all([
        studentsAPI.list(),
        placementsAPI.list(),
        logbooksAPI.list(),
        issuesAPI.list(),
      ]);
      return { students: s.data, placements: p.data, logbooks: l.data, issues: i.data };
    }
    /* supervisor */
    const [l, e, i] = await Promise.all([
      logbooksAPI.list(),
      evaluationsAPI.list(),
      issuesAPI.list(),
    ]);
    return { logbooks: l.data, evaluations: e.data, issues: i.data };
  } catch { return {}; }
}

/* ─── Student overview ─── */
function StudentOverview({ data }) {
  const { placement, allLogbooks = [], issues = [] } = data;
  const approved  = allLogbooks.filter(l => l.submission_status === 'Approved').length;
  const submitted = allLogbooks.filter(l => l.submission_status === 'Submitted').length;
  const openIssues = issues.filter(i => i.status !== 'Resolved').length;

  return (
    <div className="fade-in">
      <h1 className="panel-title">Overview</h1>
      <p className="panel-subtitle">Your internship at a glance.</p>

      <div className="stat-grid">
        <StatTile color="green" icon={icons.book}
          value={allLogbooks.length} label="Total Logbooks"
          sub={`${approved} approved`} />
        <StatTile color="gold" icon={icons.check}
          value={submitted} label="Awaiting Review" />
        <StatTile color="red" icon={icons.alert}
          value={openIssues} label="Open Issues" />
      </div>

      <PlacementCard placement={placement} />

      {/* Recent logbooks */}
      {allLogbooks.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <span className="card-title">Recent Logbook Entries</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Week</th>
                <th>Date Range</th>
                <th>Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {allLogbooks.slice(0, 5).map(lb => (
                <tr key={lb.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    Week {lb.week_number}
                  </td>
                  <td>{lb.start_date} → {lb.end_date}</td>
                  <td>{lb.hours_worked}h</td>
                  <td>
                    <span className={`badge ${
                      lb.submission_status === 'Approved'  ? 'badge-success' :
                      lb.submission_status === 'Submitted' ? 'badge-warn'    : 'badge-neutral'
                    }`}>{lb.submission_status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Supervisor overview ─── */
function SupervisorOverview({ data }) {
  const { logbooks = [], evaluations = [], issues = [] } = data;
  const pending   = logbooks.filter(l => l.submission_status === 'Submitted').length;
  const openIssues = issues.filter(i => i.status !== 'Resolved').length;

  return (
    <div className="fade-in">
      <h1 className="panel-title">Overview</h1>
      <p className="panel-subtitle">Your pending actions.</p>

      <div className="stat-grid">
        <StatTile color="gold"  icon={icons.book}  value={pending}         label="Logbooks to Review" />
        <StatTile color="green" icon={icons.chart}  value={evaluations.length} label="Evaluations Submitted" />
        <StatTile color="red"   icon={icons.alert}  value={openIssues}     label="Open Issues" />
      </div>

      {pending > 0 && (
        <div className="alert alert-warn" style={{ marginTop: 20 }}>
          You have <strong>{pending}</strong> logbook{pending > 1 ? 's' : ''} waiting for your review.
        </div>
      )}
    </div>
  );
}

/* ─── Admin overview ─── */
function AdminOverview({ data }) {
  const { students = [], placements = [], logbooks = [], issues = [] } = data;
  const activePlacements = placements.filter(p => p.placement_status === 'Active').length;
  const pendingLogbooks  = logbooks.filter(l => l.submission_status === 'Submitted').length;
  const openIssues       = issues.filter(i => i.status !== 'Resolved').length;

  return (
    <div className="fade-in">
      <h1 className="panel-title">Overview</h1>
      <p className="panel-subtitle">System-wide statistics.</p>

      <div className="stat-grid">
        <StatTile color="green" icon={icons.users} value={students.length}   label="Total Students" />
        <StatTile color="blue"  icon={icons.chart}  value={activePlacements} label="Active Placements" />
        <StatTile color="gold"  icon={icons.book}   value={pendingLogbooks}  label="Pending Logbooks" />
        <StatTile color="red"   icon={icons.alert}  value={openIssues}       label="Open Issues" />
      </div>

      {/* Issues summary */}
      {openIssues > 0 && (
        <div className="alert alert-warn">
          <strong>{openIssues}</strong> unresolved issue{openIssues > 1 ? 's' : ''} need your attention.
        </div>
      )}

      {/* Placements table */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <span className="card-title">Recent Placements</span>
        </div>
        {placements.length === 0 ? (
          <div className="empty-state">
            <p>No placements created yet.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Organisation</th><th>Position</th><th>Status</th></tr>
            </thead>
            <tbody>
              {placements.slice(0, 6).map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {p.organization_name}
                  </td>
                  <td>{p.position}</td>
                  <td>
                    <span className={`badge ${
                      p.placement_status === 'Active'   ? 'badge-success' :
                      p.placement_status === 'Pending'  ? 'badge-warn'    : 'badge-neutral'
                    }`}>{p.placement_status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
