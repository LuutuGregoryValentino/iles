import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { studentsAPI, logbooksAPI, evaluationsAPI, placementsAPI } from '../../services/api';

function Dashboard({ currentUser, onLogout, goToProfile }) {
  const [view, setView]             = useState('overview');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [stats, setStats]           = useState({ students: 0, logbooks: 0, evaluations: 0, placements: 0 });
  const [logbooks, setLogbooks]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sRes, lRes, eRes, pRes] = await Promise.all([
          studentsAPI.list(),
          logbooksAPI.list(),
          evaluationsAPI.list(),
          placementsAPI.list(),
        ]);
        setStats({
          students:    sRes.data.length,
          logbooks:    lRes.data.length,
          evaluations: eRes.data.length,
          placements:  pRes.data.length,
        });
        setLogbooks(lRes.data);
      } catch (err) {
        setError('Failed to load dashboard data. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="logo">ILES Portal</div>
        <ul className="nav-links">
          <li className={view === 'overview' ? 'active' : ''} onClick={() => setView('overview')}>Dashboard</li>
          <li className={view === 'logbook'  ? 'active' : ''} onClick={() => setView('logbook')}>Submit Logbook</li>
          <li onClick={goToProfile}>My Profile</li>
          <li onClick={onLogout} style={{ marginTop: 'auto', color: '#e74c3c' }}>Logout</li>
        </ul>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="search-bar">
            <input type="text" placeholder="Search..." />
          </div>
          <div className="topbar-actions">
            <button onClick={toggleTheme}>{isDarkMode ? 'Light' : 'Dark'}</button>
            <div className="user-profile">
              <span>{currentUser?.username || 'User'}</span>
              <small style={{ display: 'block', fontSize: '11px', color: '#888' }}>
                {currentUser?.role?.replace(/_/g, ' ')}
              </small>
            </div>
          </div>
        </header>

        <div className="content">
          {loading && <p>Loading data...</p>}
          {error   && <p style={{ color: 'red' }}>{error}</p>}

          {!loading && view === 'overview' && (
            <>
              <h2>Internship Overview</h2>
              <div className="stats-grid">
                <StatCard title="Students"    value={stats.students}    />
                <StatCard title="Placements"  value={stats.placements}  />
                <StatCard title="Logbooks"    value={stats.logbooks}    />
                <StatCard title="Evaluations" value={stats.evaluations} />
              </div>

              <h3 style={{ marginTop: '2rem' }}>Recent Logbook Entries</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>Week</th>
                    <th style={{ padding: '8px' }}>Tasks</th>
                    <th style={{ padding: '8px' }}>Hours</th>
                    <th style={{ padding: '8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logbooks.length === 0 && (
                    <tr><td colSpan="4" style={{ padding: '12px 8px', color: '#888' }}>No logbook entries yet.</td></tr>
                  )}
                  {logbooks.slice(0, 5).map((lb) => (
                    <tr key={lb.entry_id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px' }}>Week {lb.week_number}</td>
                      <td style={{ padding: '8px' }}>{lb.tasks_done?.substring(0, 50)}...</td>
                      <td style={{ padding: '8px' }}>{lb.hours_worked}h</td>
                      <td style={{ padding: '8px' }}>{lb.logbook_submission_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="card">
      <div className="card-header">{title}</div>
      <div className="card-value" style={{ fontSize: '28px', fontWeight: '600' }}>{value}</div>
    </div>
  );
}

export default Dashboard;
