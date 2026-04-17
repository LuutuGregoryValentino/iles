import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { studentsAPI, logbooksAPI, evaluationsAPI, placementsAPI, issuesAPI } from '../../services/api';
import LogbookForm    from '../Logbook/LogbookForm';
import IssueForm      from '../Issues/IssueForm';
import SupervisorReview from '../Supervisor/SupervisorReview';

function Dashboard({ currentUser, onLogout, goToProfile }) {
  const [view, setView]         = useState('overview');
  const [isDark, setIsDark]     = useState(false);
  const [stats, setStats]       = useState({ students:0, placements:0, logbooks:0, evaluations:0, issues:0 });
  const [logbooks, setLogbooks] = useState([]);
  const [issues, setIssues]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const role = currentUser?.role || '';

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [sR, lR, eR, pR, iR] = await Promise.all([
          studentsAPI.list(),
          logbooksAPI.list(),
          evaluationsAPI.list(),
          placementsAPI.list(),
          issuesAPI.list(),
        ]);
        setStats({
          students:    sR.data.length,
          logbooks:    lR.data.length,
          evaluations: eR.data.length,
          placements:  pR.data.length,
          issues:      iR.data.length,
        });
        setLogbooks(lR.data);
        setIssues(iR.data);
      } catch {
        setError('Failed to load data. Make sure Django is running on port 8000.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── NAV ITEMS per role ───────────────────────────────────────────────────
  const navItems = [
    { key: 'overview', label: 'Dashboard',        roles: ['student', 'academic_supervisor', 'workplace_supervisor', 'administrator'] },
    { key: 'logbook',  label: 'Submit Logbook',   roles: ['student'] },
    { key: 'issues',   label: 'Report an Issue',  roles: ['student'] },
    { key: 'review',   label: 'Review Logbooks',  roles: ['academic_supervisor', 'workplace_supervisor'] },
    { key: 'review',   label: 'Manage Logbooks',  roles: ['administrator'] },
    { key: 'profile',  label: 'My Profile',       roles: ['student'] },
  ];

  // Remove duplicate 'review' entries
  const uniqueNav = navItems.filter((item, index, self) =>
    item.roles.includes(role) && index === self.findIndex(n => n.key === item.key && n.roles.includes(role))
  );

  const statusColor = (s) => {
    if (s === 'Approved')  return { background:'#d4edda', color:'#155724', padding:'2px 8px', borderRadius:'4px', fontSize:'12px' };
    if (s === 'Submitted') return { background:'#fff3cd', color:'#856404', padding:'2px 8px', borderRadius:'4px', fontSize:'12px' };
    if (s === 'Resolved')  return { background:'#d4edda', color:'#155724', padding:'2px 8px', borderRadius:'4px', fontSize:'12px' };
    if (s === 'In Review') return { background:'#cce5ff', color:'#004085', padding:'2px 8px', borderRadius:'4px', fontSize:'12px' };
    return { background:'#f8d7da', color:'#721c24', padding:'2px 8px', borderRadius:'4px', fontSize:'12px' };
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="logo">ILES Portal</div>
        <ul className="nav-links">
          {uniqueNav.map(n => (
            <li key={n.key + n.label}
              className={view === n.key ? 'active' : ''}
              onClick={() => n.key === 'profile' ? goToProfile() : setView(n.key)}>
              {n.label}
            </li>
          ))}
          <li onClick={onLogout} style={{ marginTop:'auto', color:'#e74c3c' }}>Logout</li>
        </ul>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="search-bar">
            <input type="text" placeholder="Search..." />
          </div>
          <div className="topbar-actions">
            <button onClick={toggleTheme}>{isDark ? 'Light mode' : 'Dark mode'}</button>
            <div className="user-profile">
              <span>{currentUser?.username || 'User'}</span>
              <small style={{ display:'block', fontSize:'11px', color:'#888' }}>
                {role.replace(/_/g, ' ')}
              </small>
            </div>
          </div>
        </header>

        <div className="content">
          {loading && <p>Loading data...</p>}
          {error   && <p style={{ color:'red' }}>{error}</p>}

          {/* ── OVERVIEW ── */}
          {!loading && view === 'overview' && (
            <>
              <h2>
                {role === 'student'              && 'My Internship Overview'}
                {role === 'administrator'         && 'System Overview — All Students'}
                {role === 'academic_supervisor'   && 'Academic Supervisor Dashboard'}
                {role === 'workplace_supervisor'  && 'Workplace Supervisor Dashboard'}
              </h2>

              <div className="stats-grid">
                {/* Students card — only admins and supervisors see total students */}
                {role !== 'student' && (
                  <StatCard title="Total Students"  value={stats.students}    color="#2E5DA6" />
                )}
                <StatCard title="Placements"   value={stats.placements}  color="#0F6E56" />
                <StatCard title="Logbooks"     value={stats.logbooks}    color="#993C1D" />
                <StatCard title="Evaluations"  value={stats.evaluations} color="#3C3489" />
                <StatCard title="Issues"       value={stats.issues}      color="#72243E" />
              </div>

              {/* ── Recent logbooks ── */}
              <h3 style={{ marginTop:'2rem' }}>
                {role === 'student' ? 'My Logbook Entries' : 'Recent Logbook Entries'}
              </h3>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'14px' }}>
                <thead>
                  <tr style={{ borderBottom:'2px solid #ddd', textAlign:'left', background:'#f8f9fa' }}>
                    <th style={{ padding:'10px 8px' }}>Week</th>
                    <th style={{ padding:'10px 8px' }}>Tasks done</th>
                    <th style={{ padding:'10px 8px' }}>Hours</th>
                    <th style={{ padding:'10px 8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logbooks.length === 0 && (
                    <tr><td colSpan="4" style={{ padding:'16px 8px', color:'#888', textAlign:'center' }}>
                      {role === 'student' ? 'You have not submitted any logbooks yet.' : 'No logbook entries found.'}
                    </td></tr>
                  )}
                  {logbooks.slice(0, 8).map(lb => (
                    <tr key={lb.id} style={{ borderBottom:'1px solid #eee' }}>
                      <td style={{ padding:'10px 8px', fontWeight:'500' }}>Week {lb.week_number}</td>
                      <td style={{ padding:'10px 8px', color:'#555' }}>{lb.tasks_done?.substring(0, 60)}...</td>
                      <td style={{ padding:'10px 8px' }}>{lb.hours_worked}h</td>
                      <td style={{ padding:'10px 8px' }}>
                        <span style={statusColor(lb.submission_status)}>{lb.submission_status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ── Issues table — shown to all roles ── */}
              {issues.length > 0 && (
                <>
                  <h3 style={{ marginTop:'2rem' }}>
                    {role === 'student' ? 'My Reported Issues' : 'Recent Issues'}
                  </h3>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'14px' }}>
                    <thead>
                      <tr style={{ borderBottom:'2px solid #ddd', textAlign:'left', background:'#f8f9fa' }}>
                        <th style={{ padding:'10px 8px' }}>Title</th>
                        <th style={{ padding:'10px 8px' }}>Status</th>
                        <th style={{ padding:'10px 8px' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issues.slice(0, 5).map(issue => (
                        <tr key={issue.id} style={{ borderBottom:'1px solid #eee' }}>
                          <td style={{ padding:'10px 8px', fontWeight:'500' }}>{issue.title}</td>
                          <td style={{ padding:'10px 8px' }}>
                            <span style={statusColor(issue.status)}>{issue.status}</span>
                          </td>
                          <td style={{ padding:'10px 8px', color:'#888', fontSize:'12px' }}>
                            {new Date(issue.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </>
          )}

          {/* ── LOGBOOK FORM ── */}
          {!loading && view === 'logbook' && (
            <LogbookForm onSubmitted={() => setView('overview')} />
          )}

          {/* ── ISSUE FORM ── */}
          {!loading && view === 'issues' && (
            <IssueForm onSubmitted={() => setView('overview')} />
          )}

          {/* ── SUPERVISOR REVIEW ── */}
          {!loading && view === 'review' && (
            <SupervisorReview currentUser={currentUser} />
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, color = '#2E5DA6' }) {
  return (
    <div className="card" style={{ borderTop:`3px solid ${color}` }}>
      <div className="card-header" style={{ color:'#666', fontSize:'13px', marginBottom:'8px' }}>{title}</div>
      <div className="card-value" style={{ fontSize:'32px', fontWeight:'700', color }}>{value}</div>
    </div>
  );
}

export default Dashboard;