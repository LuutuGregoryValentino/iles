<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
import Signup from "./features/Signup/Signup"
import Login from './features/Login/Login';
=======
import Signup from "./features/Signup/Signup";
=======
>>>>>>> 655eba7013d1ea32c99de08782175169bbd568be
import Login from './features/Login/Login';
import Signup from './features/Signup/Signup';
import ProfileForm from './features/Profile/ProfileForm';
<<<<<<< HEAD
>>>>>>> 3be749ee887fa80dc68098377f2ae91b7aae1927


<<<<<<< HEAD
    

=======

=======
=======
>>>>>>> e88e7d016bcc03b17ff7b76c66c40a42bbad4661
/**
 * App.js — Root SPA shell
 *
 * Architecture: Single-page with two "screens":
 *   1. Auth  (login / signup / profile-setup) — full-screen, no sidebar
 *   2. App   (dashboard shell)                — sidebar + content area, never unmounts
 *
 * The dashboard shell stays mounted once logged in.
 * Section switching is handled by Dashboard via activeSection state,
 * so the sidebar, header, and stat tiles never re-render on navigation.
 *
 * BUG FIXED: Original code re-created the entire tree on screen change.
 * Now the dashboard shell persists and only the active panel swaps.
 *
 * ADDED: Dark/light theme toggle stored in localStorage.
 * ADDED: Session-expired event listener from api.js interceptor.
 */
<<<<<<< HEAD

=======
import React, { useState, useEffect } from 'react';
import './styles/global.css';
import AuthShell  from './features/Auth/AuthShell';
import Dashboard  from './features/Dashboard/Dashboard';
>>>>>>> e88e7d016bcc03b17ff7b76c66c40a42bbad4661

function App() {
  /* ── Theme ── */
  const [theme, setTheme] = useState(
    () => localStorage.getItem('iles_theme') || 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('iles_theme', theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  /* ── Auth state ── */
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [needsProfile, setNeedsProfile] = useState(false);

  /* ── Session-expired event (fired by api.js interceptor) ── */
  useEffect(() => {
    const handleExpiry = () => {
      localStorage.clear();
      setCurrentUser(null);
      setNeedsProfile(false);
    };
    window.addEventListener('iles:session-expired', handleExpiry);
    return () => window.removeEventListener('iles:session-expired', handleExpiry);
  }, []);

  /* ── Called by Login/Signup on success ── */
  const handleAuthSuccess = (user, access, refresh) => {
    localStorage.setItem('access_token',  access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user',          JSON.stringify(user));
    setCurrentUser(user);
    // Students without a profile go to setup first
    if (user.role === 'student') setNeedsProfile(true);
  };

  /* ── Called once profile is saved ── */
  const handleProfileSaved = () => setNeedsProfile(false);

  /* ── Logout ── */
  const handleLogout = () => {
    localStorage.clear();
    setCurrentUser(null);
    setNeedsProfile(false);
  };

  const isLoggedIn = Boolean(currentUser && localStorage.getItem('access_token'));

  return (
    <div className="App">
      {!isLoggedIn && (
        <AuthShell onAuthSuccess={handleAuthSuccess} />
      )}

      {isLoggedIn && (
        <Dashboard
          currentUser={currentUser}
          needsProfile={needsProfile}
          onProfileSaved={handleProfileSaved}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
    </div>
  );
>>>>>>> 655eba7013d1ea32c99de08782175169bbd568be
}

export default App;
