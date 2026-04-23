/**
 * UserMenu.js
 *
 * Clickable avatar dropdown in the header.
 * Shows: user info, profile completion status, "Edit Profile" link, sign out.
 *
 * Props:
 *   currentUser      — user object
 *   profileComplete  — boolean from useProfileStatus
 *   onOpenProfile    — opens the ProfileModal
 *   onLogout         — logs out
 */
import React, { useState, useRef, useEffect } from 'react';
import { authAPI } from '../../services/api';
import './UserMenu.css';

const ROLE_LABELS = {
  student:              'Student',
  workplace_supervisor: 'Workplace Supervisor',
  academic_supervisor:  'Academic Supervisor',
  administrator:        'Administrator',
};

export default function UserMenu({ currentUser, profileComplete, onOpenProfile, onLogout }) {
  const [open,       setOpen]       = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) await authAPI.logout({ refresh });
    } catch { /* ignore */ }
    onLogout();
  };

  const initials = (currentUser?.username || 'U')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="um-wrap" ref={ref}>
      {/* Avatar trigger */}
      <button
        className={`um-trigger ${open ? 'um-open' : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Account menu"
      >
        <div className="um-avatar">{initials}</div>
        {!profileComplete && (
          <span className="um-incomplete-dot" title="Profile incomplete" />
        )}
        <svg className="um-chevron" width="12" height="12" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="um-dropdown">
          {/* User info */}
          <div className="um-info">
            <div className="um-info-avatar">{initials}</div>
            <div>
              <div className="um-info-name">{currentUser?.username}</div>
              <div className="um-info-email">{currentUser?.email}</div>
              <div className="um-info-role">{ROLE_LABELS[currentUser?.role] || currentUser?.role}</div>
            </div>
          </div>

          {/* Profile completion notice */}
          {!profileComplete && (
            <div className="um-incomplete-notice">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Profile incomplete
            </div>
          )}

          <div className="um-divider" />

          {/* Actions */}
          <button className="um-item" onClick={() => { setOpen(false); onOpenProfile(); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Edit Profile
          </button>

          <div className="um-divider" />

          <button className="um-item um-item-danger" onClick={handleLogout} disabled={loggingOut}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
}
