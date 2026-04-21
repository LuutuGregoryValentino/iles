/**
 * DashHeader.js — Persistent top bar
 * Always mounted. Shows current section title + action buttons.
 */
import React, { useState } from 'react';
import { authAPI } from '../../services/api';
import './DashHeader.css';

export default function DashHeader({
  currentUser, activeSection, sidebarOpen, onToggleSidebar,
  theme, onToggleTheme, onLogout
}) {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) await authAPI.logout({ refresh });
    } catch { /* ignore — we clear regardless */ }
    onLogout();
  };

  /* Human-readable section title */
  const titles = {
    overview:   'Overview',
    logbook:    'My Logbook',
    scorecard:  'My Evaluation Score',
    review:     'Logbook Review',
    evaluation: 'Evaluations',
    students:   'Students',
    placements: 'Placements',
    issues:     'Issues',
  };

  return (
    <header className="dash-header">
      {/* Left: sidebar toggle + breadcrumb */}
      <div className="dh-left">
        <button
          className="btn-icon dh-toggle"
          onClick={onToggleSidebar}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {sidebarOpen
              ? <><line x1="3" y1="6"  x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
              : <><line x1="3" y1="6"  x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
        </button>

        <div className="dh-breadcrumb">
          <span className="dh-bc-parent">ILES</span>
          <span className="dh-bc-sep">/</span>
          <span className="dh-bc-current">{titles[activeSection] || activeSection}</span>
        </div>
      </div>

      {/* Right: theme toggle + user + logout */}
      <div className="dh-right">
        {/* Theme toggle */}
        <button
          className="btn-icon dh-theme"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            /* Sun */
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            /* Moon */
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
            </svg>
          )}
        </button>

        {/* User pill */}
        <div className="dh-user-pill">
          <div className="dh-user-avatar">
            {(currentUser?.username || 'U')[0].toUpperCase()}
          </div>
          <span className="dh-user-name">{currentUser?.username}</span>
        </div>

        {/* Logout */}
        <button
          className="btn btn-ghost dh-logout"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {loggingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </header>
  );
}
