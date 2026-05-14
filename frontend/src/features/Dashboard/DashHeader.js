/**
 * DashHeader.js — Persistent top bar (v2)
 *
 * CHANGES FROM v1:
 * - Replaced user pill + standalone logout with UserMenu dropdown
 * - Added NotificationBell (navigates to section on action click)
 * - Receives profileComplete + onOpenProfile from Dashboard
 */
import React from 'react';
import NotificationBell from './NotificationBell';
import UserMenu         from './UserMenu';
import './DashHeader.css';

const SECTION_TITLES = {
  overview:   'Overview',
  logbook:    'My Logbook',
  scorecard:  'My Evaluation Score',
  review:     'Logbook Review',
  evaluation: 'Evaluations',
  students:   'Students',
  placements: 'Placements',
  issues:     'Issues',
};

export default function DashHeader({
  currentUser, activeSection, sidebarOpen, onToggleSidebar,
  theme, onToggleTheme, onLogout, profileComplete, onOpenProfile,
  onNavigate,
}) {
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
            <line x1="3" y1="6"  x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <div className="dh-breadcrumb">
          <span className="dh-bc-parent">ILES</span>
          <span className="dh-bc-sep">/</span>
          <span className="dh-bc-current">{SECTION_TITLES[activeSection] || activeSection}</span>
        </div>
      </div>

      {/* Right: theme toggle + notifications + user menu */}
      <div className="dh-right">
        {/* Theme toggle button */}
        <button
          className="btn-icon"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
            </svg>
          )}
        </button>

        {/* Notification bell — navigates to section on action click */}
        <NotificationBell onNavigate={onNavigate} />

        {/* User avatar dropdown (profile + logout) */}
        <UserMenu
          currentUser={currentUser}
          profileComplete={profileComplete}
          onOpenProfile={onOpenProfile}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}
