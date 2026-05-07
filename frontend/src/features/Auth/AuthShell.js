
import React, { useState } from 'react';
import Login  from './Login';
import Signup from './Signup';
import './Auth.css';

export default function AuthShell({ onAuthSuccess, onBack }) {
  const [view, setView] = useState('login');

  return (
    <div className="auth-shell">

      {/* bacck to landing */}
      {onBack && (
        <button className="auth-back-btn" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to home
        </button>
      )}

      <div className="auth-brand-header">
        <div className="auth-brand-header-logo">
          <span>IL</span>
        </div>
        <h1>ILES</h1>
        <p>Internship Logbook &amp; Evaluation System · Makerere University</p>
      </div>

      {/* form */}
      <div className="fade-in" style={{ width: '100%', maxWidth: 440 }}>
        {view === 'login' ? (
          <Login
            onAuthSuccess={onAuthSuccess}
            goToSignup={() => setView('signup')}
          />
        ) : (
          <Signup
            onAuthSuccess={onAuthSuccess}
            goToLogin={() => setView('login')}
          />
        )}
      </div>
    </div>
  );
}
