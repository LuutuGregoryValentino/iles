/**
 * OverviewPanel.js (v2)
 *
 * Role-specific dashboards with inline SVG charts (no external lib needed).
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │ student   → placement card, logbook progress bar chart,      │
 * │             weekly hours line chart, score gauge if available │
 * │                                                               │
 * │ supervisor → logbooks by status donut, issues by status bar  │
 * │                                                               │
 * │ admin     → students/placements/issues stat tiles,           │
 * │             placements by status donut, logbook approval bar, │
 * │             issues trend, recent activity table               │
 * └──────────────────────────────────────────────────────────────┘
 *
 * Notifications pushed here:
 *   - admin: if open issues > 0
 *   - supervisor: if pending logbooks > 0
 *   - student: if no placement found
 */
import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../../context/NotificationContext';
import {
  studentsAPI, placementsAPI, logbooksAPI,
  evaluationsAPI, issuesAPI,
} from '../../../services/api';

/* ═══════════════════════════════════════════════════════════════
   CHART HELPERS — pure SVG, zero dependencies
═══════════════════════════════════════════════════════════════ */

/**
 * BarChart — fixed 400×180 internal coordinate system, scales to container via viewBox.
 *
 * FIX: The original calculated `w` from bar count × pixel width, which caused
 * the SVG to be huge when width="100%" scaled it up. Now we use a fixed internal
 * canvas (400 wide) and distribute bars evenly across it regardless of count.
 * The value labels sit INSIDE the bar when the bar is tall enough, and above it
 * when short — preventing the massive floating numbers seen in the screenshots.
 */
function BarChart({ data, height = 160 }) {
  if (!data || data.length === 0) return null;

  const CANVAS_W  = 400;
  const CANVAS_H  = height;
  const PAD_L     = 10;
  const PAD_R     = 10;
  const LABEL_H   = 22; // space below bars for x-axis labels
  const totalW    = CANVAS_W - PAD_L - PAD_R;
  const n         = data.length;
  const barW      = Math.min(48, (totalW / n) * 0.55);
  const slotW     = totalW / n;
  const max       = Math.max(...data.map(d => d.value), 1);

  return (
    <svg
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H + LABEL_H}`}
      width="100%"
      style={{ display: 'block', overflow: 'visible' }}
      preserveAspectRatio="xMidYMax meet"
    >
      {data.map((d, i) => {
        const barH  = Math.max((d.value / max) * CANVAS_H, d.value > 0 ? 4 : 0);
        const x     = PAD_L + i * slotW + (slotW - barW) / 2;
        const y     = CANVAS_H - barH;
        const labelInside = barH > 24;

        return (
          <g key={`${d.label}-${i}`}>
            {/* Track */}
            <rect x={x} y={0} width={barW} height={CANVAS_H}
              fill="var(--bg-overlay)" rx="4" />

            {/* Value bar — only render if value > 0 */}
            {d.value > 0 && (
              <rect x={x} y={y} width={barW} height={barH}
                fill={d.color || 'var(--brand-green-light)'} rx="4" />
            )}

            {/* Value label — inside bar if tall, above track if short */}
            <text
              x={x + barW / 2}
              y={labelInside ? y + barH - 7 : Math.max(y - 5, 12)}
              textAnchor="middle"
              fontSize="12"
              fontWeight="700"
              fontFamily="Outfit, sans-serif"
              fill={labelInside ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)'}
            >
              {d.value}
            </text>

            {/* X-axis label */}
            <text
              x={x + barW / 2}
              y={CANVAS_H + LABEL_H - 4}
              textAnchor="middle"
              fontSize="11"
              fontFamily="Source Sans 3, sans-serif"
              fill="var(--text-muted)"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Donut chart */
function DonutChart({ segments, size = 120, label, sublabel }) {
  // segments: [{ value, color, name }]
  const total = segments.reduce((s, d) => s + d.value, 0) || 1;
  const r = 40;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  const arcs = segments.map(seg => {
    const dash = (seg.value / total) * circ;
    const gap  = circ - dash;
    const arc  = { ...seg, dash, gap, offset };
    offset += dash;
    return arc;
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="var(--bg-overlay)" strokeWidth="14" />
        {arcs.map((arc, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={arc.color} strokeWidth="14"
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={-arc.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray .5s ease' }}
          />
        ))}
        {/* Centre label */}
        {label !== undefined && (
          <>
            <text x={cx} y={cy - 4} textAnchor="middle"
              fontSize="16" fontWeight="800" fill="var(--text-primary)"
              fontFamily="Outfit">{label}</text>
            {sublabel && (
              <text x={cx} y={cy + 12} textAnchor="middle"
                fontSize="9" fill="var(--text-muted)"
                fontFamily="Source Sans 3">{sublabel}</text>
            )}
          </>
        )}
      </svg>
      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', marginLeft: 'auto', paddingLeft: 12 }}>
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mini progress bar */
function MiniProgress({ value, max, color }) {
  const pct = Math.min((value / Math.max(max, 1)) * 100, 100);
  return (
    <div className="progress-track" style={{ height: 6 }}>
      <div className="progress-fill" style={{ width: `${pct}%`, background: color || 'var(--brand-green-light)' }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STAT TILE
═══════════════════════════════════════════════════════════════ */
function StatTile({ color, iconPath, value, label, sub, onClick }) {
  return (
    <div
      className={`stat-tile ${color}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="stat-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d={iconPath} />
        </svg>
      </div>
      <div className="stat-value">{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
      {onClick && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
          Click to manage →
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function OverviewPanel({ currentUser, isActive, onNavigate }) {
  const role = currentUser?.role;
  const [data,    setData]    = useState({});
  const [loading, setLoading] = useState(true);
  const { push } = useNotifications();

  useEffect(() => {
    if (!isActive) return;
    setLoading(true);
    fetchByRole(role).then(d => {
      setData(d);
      setLoading(false);
      /* Push relevant notifications */
      if (role === 'administrator' && d.issues?.filter(i => i.status !== 'Resolved').length > 0) {
        push({
          type: 'warn',
          title: 'Open issues need attention',
          body: `${d.issues.filter(i => i.status !== 'Resolved').length} unresolved student issues.`,
          action: { label: 'Go to Issues', sectionId: 'issues' },
        });
      }
      if ((role === 'workplace_supervisor' || role === 'academic_supervisor') &&
          d.logbooks?.filter(l => l.submission_status === 'Submitted').length > 0) {
        push({
          type: 'info',
          title: 'Logbooks awaiting review',
          body: `${d.logbooks.filter(l => l.submission_status === 'Submitted').length} logbooks need your approval.`,
          action: { label: 'Review logbooks', sectionId: 'review' },
        });
      }
    });
  }, [isActive, role]); // eslint-disable-line

  if (loading) return <div className="spinner" />;

  if (role === 'student')       return <StudentOverview       data={data} onNavigate={onNavigate} />;
  if (role === 'administrator') return <AdminOverview         data={data} onNavigate={onNavigate} />;
  return                               <SupervisorOverview    data={data} onNavigate={onNavigate} />;
}

/* ── Fetchers ── */
async function fetchByRole(role) {
  try {
    if (role === 'student') {
      const [p, l, e, i] = await Promise.all([
        placementsAPI.list(), logbooksAPI.list(),
        evaluationsAPI.list(), issuesAPI.list(),
      ]);
      return { placement: p.data[0] || null, logbooks: l.data, evaluations: e.data, issues: i.data };
    }
    if (role === 'administrator') {
      const [s, p, l, i] = await Promise.all([
        studentsAPI.list(), placementsAPI.list(),
        logbooksAPI.list(), issuesAPI.list(),
      ]);
      return { students: s.data, placements: p.data, logbooks: l.data, issues: i.data };
    }
    const [l, e, i] = await Promise.all([
      logbooksAPI.list(), evaluationsAPI.list(), issuesAPI.list(),
    ]);
    return { logbooks: l.data, evaluations: e.data, issues: i.data };
  } catch { return {}; }
}

/* ═══════════════════════════════════════════════════════════════
   STUDENT OVERVIEW
═══════════════════════════════════════════════════════════════ */
function StudentOverview({ data, onNavigate }) {
  const { placement, logbooks = [], evaluations = [], issues = [] } = data;
  const approved  = logbooks.filter(l => l.submission_status === 'Approved').length;
  const submitted = logbooks.filter(l => l.submission_status === 'Submitted').length;
  const drafts    = logbooks.filter(l => l.submission_status === 'Draft').length;
  const openIssues = issues.filter(i => i.status !== 'Resolved').length;
  const myEval = placement ? evaluations.find(e => e.placement === placement.id) : null;

  const ICONS = {
    book:  'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    alert: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  };

  return (
    <div className="fade-in">
      <h1 className="panel-title">Overview</h1>
      <p className="panel-subtitle">Your internship at a glance.</p>

      {/* Stat tiles */}
      <div className="stat-grid">
        <StatTile color="green" iconPath={ICONS.book}
          value={logbooks.length} label="Total Logbooks"
          sub={`${approved} approved · ${submitted} pending`}
          onClick={() => onNavigate?.('logbook')} />
        <StatTile color="gold" iconPath={ICONS.check}
          value={submitted} label="Awaiting Review" />
        <StatTile color="red" iconPath={ICONS.alert}
          value={openIssues} label="Open Issues"
          onClick={openIssues > 0 ? () => onNavigate?.('issues') : undefined} />
        {myEval && (
          <StatTile color="blue"
            iconPath="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10"
            value={`${myEval.total_score}%`} label="My Score"
            sub={`Grade: ${myEval.grade}`}
            onClick={() => onNavigate?.('scorecard')} />
        )}
      </div>

      <div className="dash-two-col">
        {/* Placement card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Current Placement</span>
            {placement && (
              <span className={`badge ${
                placement.placement_status === 'Active'   ? 'badge-success' :
                placement.placement_status === 'Pending'  ? 'badge-warn'    : 'badge-neutral'
              }`}>{placement.placement_status}</span>
            )}
          </div>
          {!placement ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <p style={{ fontSize: 13 }}>No placement yet. Contact your administrator.</p>
            </div>
          ) : (
            <>
              <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-primary)', marginBottom: 4 }}>
                {placement.organization_name}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 10 }}>
                {placement.position}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {placement.start_date} → {placement.end_date}
              </div>
            </>
          )}
        </div>

        {/* Logbook status donut */}
        <div className="card">
          <div className="card-header"><span className="card-title">Logbook Status</span></div>
          {logbooks.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <p style={{ fontSize: 13 }}>No logbook entries yet.</p>
            </div>
          ) : (
            <DonutChart
              size={110}
              label={logbooks.length}
              sublabel="entries"
              segments={[
                { name: 'Approved',  value: approved,  color: 'var(--brand-green-light)' },
                { name: 'Submitted', value: submitted, color: 'var(--status-warn)' },
                { name: 'Draft',     value: drafts,    color: 'var(--border-strong)' },
              ].filter(s => s.value > 0)}
            />
          )}
        </div>
      </div>

      {/* Logbook hours bar chart */}
      {logbooks.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <span className="card-title">Weekly Hours Worked</span>
          </div>
          <BarChart
            height={120}
            data={logbooks.slice(-8).map(lb => ({
              label: `W${lb.week_number}`,
              value: parseFloat(lb.hours_worked) || 0,
              color: lb.submission_status === 'Approved'
                ? 'var(--brand-green-light)'
                : lb.submission_status === 'Submitted'
                ? 'var(--status-warn)'
                : 'var(--border-strong)',
            }))}
          />
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUPERVISOR OVERVIEW
═══════════════════════════════════════════════════════════════ */
function SupervisorOverview({ data, onNavigate }) {
  const { logbooks = [], evaluations = [], issues = [] } = data;
  const pending  = logbooks.filter(l => l.submission_status === 'Submitted').length;
  const approved = logbooks.filter(l => l.submission_status === 'Approved').length;
  const drafts   = logbooks.filter(l => l.submission_status === 'Draft').length;
  const openIssues = issues.filter(i => i.status !== 'Resolved').length;

  return (
    <div className="fade-in">
      <h1 className="panel-title">Overview</h1>
      <p className="panel-subtitle">Your pending actions.</p>

      <div className="stat-grid">
        <StatTile color="gold"
          iconPath="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"
          value={pending} label="Logbooks to Review"
          onClick={pending > 0 ? () => onNavigate?.('review') : undefined} />
        <StatTile color="green"
          iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          value={evaluations.length} label="Evaluations Submitted" />
        <StatTile color="red"
          iconPath="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          value={openIssues} label="Open Issues"
          onClick={openIssues > 0 ? () => onNavigate?.('issues') : undefined} />
      </div>

      {pending > 0 && (
        <div className="alert alert-warn" style={{ marginBottom: 20 }}>
          <strong>{pending}</strong> logbook{pending !== 1 ? 's' : ''} waiting for your review.
        </div>
      )}

      <div className="dash-two-col">
        <div className="card">
          <div className="card-header"><span className="card-title">Logbook Breakdown</span></div>
          <DonutChart
            size={110}
            label={logbooks.length}
            sublabel="total"
            segments={[
              { name: 'Approved',  value: approved, color: 'var(--brand-green-light)' },
              { name: 'Pending',   value: pending,  color: 'var(--status-warn)' },
              { name: 'Draft',     value: drafts,   color: 'var(--border-strong)' },
            ].filter(s => s.value > 0)}
          />
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Issues by Status</span></div>
          {issues.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No issues reported yet.</p>
          ) : (
            <BarChart
              height={120}
              data={[
                { label: 'Pending',   value: issues.filter(i => i.status === 'Pending').length,   color: 'var(--status-warn)' },
                { label: 'In Review', value: issues.filter(i => i.status === 'In Review').length,  color: 'var(--status-info)' },
                { label: 'Resolved',  value: issues.filter(i => i.status === 'Resolved').length,  color: 'var(--brand-green-light)' },
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ADMIN OVERVIEW
═══════════════════════════════════════════════════════════════ */
function AdminOverview({ data, onNavigate }) {
  const { students = [], placements = [], logbooks = [], issues = [] } = data;
  const active    = placements.filter(p => p.placement_status === 'Active').length;
  const pending   = placements.filter(p => p.placement_status === 'Pending').length;
  const complete  = placements.filter(p => p.placement_status === 'Complete').length;
  const pendingLogs  = logbooks.filter(l => l.submission_status === 'Submitted').length;
  const approvedLogs = logbooks.filter(l => l.submission_status === 'Approved').length;
  const openIssues   = issues.filter(i => i.status !== 'Resolved').length;

  return (
    <div className="fade-in">
      <h1 className="panel-title">Overview</h1>
      <p className="panel-subtitle">System-wide statistics.</p>

      {/* Top stat tiles — all clickable */}
      <div className="stat-grid">
        <StatTile color="green"
          iconPath="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          value={students.length} label="Total Students"
          sub={`${active} active placements`}
          onClick={() => onNavigate?.('students')} />
        <StatTile color="blue"
          iconPath="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1"
          value={placements.length} label="All Placements"
          sub={`${active} active · ${pending} pending`}
          onClick={() => onNavigate?.('placements')} />
        <StatTile color="gold"
          iconPath="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13"
          value={pendingLogs} label="Pending Logbooks"
          sub={`${approvedLogs} approved so far`}
          onClick={pendingLogs > 0 ? () => onNavigate?.('review') : undefined} />
        <StatTile color="red"
          iconPath="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          value={openIssues} label="Open Issues"
          onClick={openIssues > 0 ? () => onNavigate?.('issues') : undefined} />
      </div>

      {openIssues > 0 && (
        <div className="alert alert-warn" style={{ marginBottom: 20 }}>
          <strong>{openIssues}</strong> unresolved issue{openIssues !== 1 ? 's' : ''} need your attention.
          <button
            onClick={() => onNavigate?.('issues')}
            style={{ marginLeft: 12, background: 'none', border: 'none',
              color: 'var(--status-warn)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
            View issues →
          </button>
        </div>
      )}

      <div className="dash-two-col">
        {/* Placements by status donut */}
        <div className="card">
          <div className="card-header"><span className="card-title">Placements by Status</span></div>
          {placements.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <p style={{ fontSize: 13 }}>No placements yet.</p>
            </div>
          ) : (
            <DonutChart
              size={120}
              label={placements.length}
              sublabel="total"
              segments={[
                { name: 'Active',    value: active,   color: 'var(--brand-green-light)' },
                { name: 'Pending',   value: pending,  color: 'var(--status-warn)' },
                { name: 'Complete',  value: complete, color: 'var(--border-strong)' },
              ].filter(s => s.value > 0)}
            />
          )}
        </div>

        {/* Issues breakdown bar */}
        <div className="card">
          <div className="card-header"><span className="card-title">Issues Breakdown</span></div>
          {issues.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <p style={{ fontSize: 13 }}>No issues reported.</p>
            </div>
          ) : (
            <BarChart
              height={120}
              data={[
                { label: 'Pending',   value: issues.filter(i => i.status === 'Pending').length,   color: 'var(--status-warn)' },
                { label: 'In Review', value: issues.filter(i => i.status === 'In Review').length,  color: 'var(--status-info)' },
                { label: 'Resolved',  value: issues.filter(i => i.status === 'Resolved').length,  color: 'var(--brand-green-light)' },
              ]}
            />
          )}
        </div>
      </div>

      {/* Logbook approval progress */}
      {logbooks.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <span className="card-title">Logbook Approval Progress</span>
            <span className="badge badge-neutral">{logbooks.length} total</span>
          </div>
          {[
            { label: 'Approved',  count: approvedLogs,                                            color: 'var(--brand-green-light)' },
            { label: 'Submitted', count: pendingLogs,                                             color: 'var(--status-warn)' },
            { label: 'Draft',     count: logbooks.filter(l => l.submission_status==='Draft').length, color: 'var(--border-strong)' },
          ].map(row => (
            <div key={row.label} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {row.count} / {logbooks.length}
                </span>
              </div>
              <MiniProgress value={row.count} max={logbooks.length} color={row.color} />
            </div>
          ))}
        </div>
      )}

      {/* Recent placements table */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <span className="card-title">Recent Placements</span>
          <button
            className="btn btn-ghost"
            style={{ padding: '4px 12px', fontSize: 12 }}
            onClick={() => onNavigate?.('placements')}>
            View all →
          </button>
        </div>
        {placements.length === 0 ? (
          <div className="empty-state" style={{ padding: '20px 0' }}>
            <p style={{ fontSize: 13 }}>No placements created yet.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Organisation</th><th>Position</th><th>Status</th></tr>
            </thead>
            <tbody>
              {placements.slice(0, 5).map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.organization_name}</td>
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
