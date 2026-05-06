/**
 * Sidebar.js (v2)
 * NEW: expanded footer with team credits + system info panel
 */
import React, { useState } from 'react';
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

const TEAM = [
  { name: 'Luutu Rahma',   role: 'Full-Stack Lead',    email: 'rahma@iles.mak.ac.ug' },
  { name: 'Luutu Gregory',   role: 'Frontend Dev',    email: 'greg@iles.mak.ac.ug' },
  { name: 'Kukunda Stacy',      role: 'UI/UX Designer',     email: 'stacy@iles.mak.ac.ug' },
  { name: 'Mumberere Breiline',     role: 'Backend Developer',  email: 'breiline@iles.mak.ac.ug' },
  { name: 'Raudha Nambuya',   role: 'Backend Developer', email: 'raudha@iles.mak.ac.ug' },
  { name: 'Ojambo Nicholas',   role: 'Frontend Dev', email: 'nicho@iles.mak.ac.ug' },
];

const ROLE_LABELS = {
  student:              'Student',
  workplace_supervisor: 'Workplace Supervisor',
  academic_supervisor:  'Academic Supervisor',
  administrator:        'Administrator',
};

export default function Sidebar({ sections, activeSection, onNav, currentUser, isOpen }) {
  const [showTeam, setShowTeam] = useState(false);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      {/* ── Logo ── */}
      <div className="sb-logo">
        <div className="sb-logo-mark"><span>IL</span></div>
        <div className="sb-logo-text">
          <span className="sb-logo-name">ILES</span>
          <span className="sb-logo-sub">CoCIS · Makerere</span>
        </div>
      </div>

      {/* ── User badge ── */}
      <div className="sb-user">
        <div className="sb-avatar">
          {(currentUser?.username || 'U').slice(0,2).toUpperCase()}
        </div>
        <div className="sb-user-info">
          <span className="sb-user-name">{currentUser?.username || 'User'}</span>
          <span className="sb-user-role">{ROLE_LABELS[currentUser?.role] || 'User'}</span>
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

      {/* ── Team credits footer ── */}
      <div className="sb-footer">
        <button className="sb-footer-toggle" onClick={() => setShowTeam(t => !t)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          About this system
        </button>

        {showTeam && (
          <div className="sb-team-panel">
            <div className="sb-team-title">Development Team</div>
            {TEAM.map(m => (
              <div key={m.email} className="sb-team-member">
                <div className="sb-team-name">{m.name}</div>
                <div className="sb-team-role">{m.role}</div>
                <a href={`mailto:${m.email}`} className="sb-team-email">{m.email}</a>
              </div>
            ))}
            <div className="sb-version">
              ILES v1.0 · CoCIS Makerere University · {new Date().getFullYear()}
            </div>
          </div>
        )}

        {!showTeam && (
          <div className="sb-version-inline">
            ILES v1.0 · {new Date().getFullYear()}
          </div>
        )}
      </div>
    </aside>
  );
}
