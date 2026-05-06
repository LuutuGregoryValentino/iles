
import React, { useEffect, useState } from 'react';
import { authAPI } from '../../services/api';
import './PendingApproval.css';

const POLL_MS = 30000; // check status every 30 seconds 

const ROLE_LABELS = {
  administrator: 'Administrator',
  workplace_supervisor: 'Workplace Supervisor',
  academic_supervisor: 'Academic Supervisor',
};

const TEAM_CONTACTS = [
  { name: 'Luutu Rahma', role: 'Full-Stack Lead', email: "rahmaluutun@gmail.com", },
  { name: 'Luutu Gregory', role: 'UI/UX Designer', email: 'snowchildwolf@gmail.com', },
];

export default function PendingApproval({ currentUser, onApproved, onLogout }) {
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [error, setError] = useState('');

  const roleLabel = ROLE_LABELS[currentUser?.role] || currentUser?.role;

  /* checks fi approved */
  const checkApproval = async () => {
    setChecking(true);
    setError('');
    try {
      const res = await authAPI.me();
      const updatedUser = res.data;
      setLastChecked(new Date());
      if (updatedUser.is_approved) {
        onApproved(updatedUser);
      }
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setChecking(false);
    }
  };



  useEffect(() => {
    checkApproval(); // check immediately 
    const interval = setInterval(checkApproval, POLL_MS);
    return () => clearInterval(interval);
  }, []); 

  return (
    <div className="pending-shell">


      <div className="pending-bg" />

      <div className="pending-card fade-in">


        <div className="pending-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        <h1 className="pending-title">Awaiting Approval</h1>

        <p className="pending-body">
          Your <strong>{roleLabel}</strong> account has been created successfully.
          Before you can access the system, an approved administrator needs to
          verify and activate your account.
        </p>

        <div className="pending-info-row">
          <div className="pending-info-item">
            <span className="pending-info-label">Registered as</span>
            <span className="pending-info-value">{roleLabel}</span>
          </div>
          <div className="pending-info-item">
            <span className="pending-info-label">Email</span>
            <span className="pending-info-value">{currentUser?.email}</span>
          </div>
          {lastChecked && (
            <div className="pending-info-item">
              <span className="pending-info-label">Last checked</span>
              <span className="pending-info-value">
                {lastChecked.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="alert alert, danger" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}



        <button {/*check approval with button*/}
          className="btn btn-primary pending-check-btn"
          onClick={checkApproval}
          disabled={checking}
        >
          {checking ? (
            <>
              <span className="pending-spinner" />
              Checking…
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
              </svg>
              Check approval status
            </>
          )}
        </button>

        <p className="pending-auto-note">
          Automatically checking every 30 seconds.
        </p>




        <div className="pending-contacts">
          <div className="pending-contacts-title">Need faster access? Contact the team:</div>
          {TEAM_CONTACTS.map(c => (
            <a key={c.email} href={`mailto:${c.email}`} className="pending-contact-row">
              <div className="pending-contact-avatar">
                {c.name[0]}
              </div>
              <div>
                <div className="pending-contact-name">{c.name}</div>
                <div className="pending-contact-role">{c.role}</div>
                <div className="pending-contact-email">{c.email}</div>
              </div>
            </a>
          ))}
        </div>

        {/* Logout */}
        <button className="pending-logout" onClick={onLogout}>
          Sign out and use a different account
        </button>
      </div>
    </div>
  );
}
