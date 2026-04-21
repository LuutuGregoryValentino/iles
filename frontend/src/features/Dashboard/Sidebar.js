/**
 * Sidebar.js — Persistent navigation sidebar
 *
 * Receives `sections` already filtered by role from Dashboard.
 * Never does its own role-checking — that separation keeps this
 * component purely presentational and easy to test.
 *
 * The sidebar never unmounts. On mobile it slides in/out via CSS.
 */
import React from 'react';
import './Sidebar.css';

function Icon({ path }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

export default function Sidebar({ sections, activeSection, onNav, currentUser, isOpen }) {
  const roleLabel = {
    student:              'Student',
    workplace_supervisor: 'Workplace Supervisor',
    academic_supervisor:  'Academic Supervisor',
    administrator:        'Administrator',
  }[currentUser?.role] || 'User';

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      {/* ── Logo / Brand ── */}
      <div className="sb-logo">
        <div className="sb-logo-mark">
          <span>IL</span>
        </div>
        <div className="sb-logo-text">
          <span className="sb-logo-name">ILES</span>
          <span className="sb-logo-sub">CoCIS · Makerere</span>
        </div>
      </div>

      {/* ── User badge ── */}
      <div className="sb-user">
        <div className="sb-avatar">
          {(currentUser?.username || 'U')[0].toUpperCase()}
        </div>
        <div className="sb-user-info">
          <span className="sb-user-name">{currentUser?.username || 'User'}</span>
          <span className="sb-user-role">{roleLabel}</span>
        </div>
      </div>

      <div className="sb-divider" />

      {/* ── Navigation ── */}
      <nav className="sb-nav">
        <p className="sb-nav-label">Navigation</p>
        {sections.map(section => (
          <button
            key={section.id}
            className={`sb-nav-item ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => onNav(section.id)}
          >
            <Icon path={section.icon} />
            <span>{section.label}</span>
            {activeSection === section.id && <span className="sb-active-pip" />}
          </button>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="sb-footer">
        <span className="sb-footer-text">ILES v1.0 · {new Date().getFullYear()}</span>
      </div>
    </aside>
  );
}
