import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { studentsAPI, logbooksAPI, evaluationsAPI, placementsAPI, issuesAPI } from '../../services/api';
import LogbookForm      from '../Logbook/LogbookForm';
import IssueForm        from '../Issues/IssueForm';
import SupervisorReview from '../Supervisor/SupervisorReview';
import EvaluationForm   from '../Evaluation/EvaluationForm';
import ScoreCard        from '../Evaluation/ScoreCard';

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

  // ── NAV ITEMS per role ────────────────────────────────────────────────────
  const allNavItems = [
    { key:'overview',    label:'Dashboard',          roles:['student','academic_supervisor','workplace_supervisor','administrator'] },
    { key:'logbook',     label:'Submit Logbook',     roles:['student'] },
    { key:'score',       label:'My Score',           roles:['student'] },
    { key:'issues',      label:'Report an Issue',    roles:['student'] },
    { key:'review',      label:'Review Logbooks',    roles:['academic_supervisor','workplace_supervisor','administrator'] },
    { key:'evaluate',    label:'Submit Evaluation',  roles:['academic_supervisor','workplace_supervisor'] },
    { key:'profile',     label:'My Profile',         roles:['student'] },
  ];

  const navItems = allNavItems.filter(n => n.roles.includes(role));

  const statusBadge = (s) => {
    const styles = {
      'Approved':  { background:'#d4edda', color:'#155724' },
      'Submitted': { background:'#fff3cd', color:'#856404' },
      'Resolved':  { background:'#d4edda', color:'#155724' },
      'In Review': { background:'#cce5ff', color:'#004085' },
      'Pending':   { background:'#f8d7da', color:'#721c24' },
      'Draft':     { background:'#f8d7da', color:'#721c24' },
    };
    const s2 = styles[s] || { background:'#eee', color:'#333' };
    return { ...s2, padding:'3px 10px', borderRadius:'12px', fontSize:'12px', fontWeight:'500' };
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="logo">ILES Portal</div>
        <ul className="nav-links">
          {navItems.map(n => (
            <li key={n.key}
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
                {role === 'student'             && 'My Internship Overview'}
                {role === 'administrator'        && 'System Overview — All Students'}
                {role === 'academic_supervisor'  && 'Academic Supervisor Dashboard'}
                {role === 'workplace_supervisor' && 'Workplace Supervisor Dashboard'}
              </h2>

              <div className="stats-grid">
                {role !== 'student' && (
                  <StatCard title="Total Students"  value={stats.students}    color="#2E5DA6" />
                )}
                <StatCard title="Placements"    value={stats.placements}  color="#0F6E56" />
                <StatCard title="Logbooks"      value={stats.logbooks}    color="#993C1D" />
                <StatCard title="Evaluations"   value={stats.evaluations} color="#3C3489" />
                <StatCard title="Issues"        value={stats.issues}      color="#72243E" />
              </div>

              {/* Logbooks table */}
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
                    <tr><td colSpan="4" style={{ padding:'20px 8px', color:'#888', textAlign:'center' }}>
                      {role === 'student' ? 'You have not submitted any logbooks yet. Click Submit Logbook to start.' : 'No logbook entries found.'}
                    </td></tr>
                  )}
                  {logbooks.slice(0, 8).map(lb => (
                    <tr key={lb.id} style={{ borderBottom:'1px solid #eee' }}>
                      <td style={{ padding:'10px 8px', fontWeight:'500' }}>Week {lb.week_number}</td>
                      <td style={{ padding:'10px 8px', color:'#555' }}>{lb.tasks_done?.substring(0, 60)}...</td>
                      <td style={{ padding:'10px 8px' }}>{lb.hours_worked}h</td>
                      <td style={{ padding:'10px 8px' }}>
                        <span style={statusBadge(lb.submission_status)}>{lb.submission_status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Issues table */}
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
                            <span style={statusBadge(issue.status)}>{issue.status}</span>
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

              {/* Quick action buttons */}
              {role === 'student' && (
                <div style={{ marginTop:'2rem', display:'flex', gap:'12px', flexWrap:'wrap' }}>
                  <button onClick={() => setView('logbook')} style={{
                    padding:'10px 20px', background:'#2E5DA6', color:'#fff',
                    border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'14px'
                  }}>
                    + Submit Logbook
                  </button>
                  <button onClick={() => setView('issues')} style={{
                    padding:'10px 20px', background:'#993C1D', color:'#fff',
                    border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'14px'
                  }}>
                    + Report Issue
                  </button>
                  <button onClick={() => setView('score')} style={{
                    padding:'10px 20px', background:'#3C3489', color:'#fff',
                    border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'14px'
                  }}>
                    View My Score
                  </button>
                </div>
              )}
              {(role === 'academic_supervisor' || role === 'workplace_supervisor') && (
                <div style={{ marginTop:'2rem', display:'flex', gap:'12px', flexWrap:'wrap' }}>
                  <button onClick={() => setView('review')} style={{
                    padding:'10px 20px', background:'#0F6E56', color:'#fff',
                    border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'14px'
                  }}>
                    Review Logbooks
                  </button>
                  <button onClick={() => setView('evaluate')} style={{
                    padding:'10px 20px', background:'#3C3489', color:'#fff',
                    border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'14px'
                  }}>
                    Submit Evaluation
                  </button>
                </div>
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

          {/* ── EVALUATION FORM ── */}
          {!loading && view === 'evaluate' && (
            <EvaluationForm onSubmitted={() => setView('overview')} />
          )}

          {/* ── STUDENT SCORE CARD ── */}
          {!loading && view === 'score' && (
            <ScoreCard currentUser={currentUser} />
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