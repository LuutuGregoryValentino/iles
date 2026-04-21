/**
 * AuthShell.js — Full-screen auth wrapper
 *
 * Contains Login + Signup as toggled panels.
 * No router needed — pure state machine.
 */
import React, { useState } from 'react';
import Login  from './Login';
import Signup from './Signup';
import './Auth.css';

export default function AuthShell({ onAuthSuccess }) {
  const [view, setView] = useState('login');

  return (
    <div className="auth-shell">
      {/* Left panel — branding */}
      <div className="auth-brand">
        <div className="auth-brand-inner">
          <div className="auth-logo">
            <div className="auth-logo-mark">
              <span>MU</span>
            </div>
          </div>
          <h1 className="auth-brand-title">ILES</h1>
          <p className="auth-brand-sub">
            Internship Logbook &amp; Evaluation System
          </p>
          <p className="auth-brand-college">
            College of Computing and Information Sciences<br />
            Makerere University
          </p>
          <div className="auth-brand-divider" />
          <ul className="auth-brand-features">
            <li><span className="feat-dot green" />Weekly logbook submissions</li>
            <li><span className="feat-dot green" />Supervisor evaluations</li>
            <li><span className="feat-dot green" />Real-time status tracking</li>
            <li><span className="feat-dot green" />Issue reporting</li>
          </ul>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-form-panel">
        <div className="auth-form-inner fade-in">
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
    </div>
  );
}
