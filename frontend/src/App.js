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
 * CHANGES FROM v1:
 * - Wraps everything in NotificationProvider for global notification system
 * - Delegates profile-check logic to useProfileStatus hook (no more simple
 *   needsProfile flag — now checks DB, respects 7-day recheck window, and
 *   shows notification instead of modal for repeat logins)
 * - Profile modal can be opened from the user avatar menu at any time
 */
<<<<<<< HEAD

=======
import React, { useState, useEffect } from 'react';
import './styles/global.css';
import { NotificationProvider } from './context/NotificationContext';
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
  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  /* ── Auth state ── */
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  /* ── Session-expired event (fired by api.js interceptor) ── */
  useEffect(() => {
    const handleExpiry = () => {
      localStorage.clear();
      setCurrentUser(null);
    };
    window.addEventListener('iles:session-expired', handleExpiry);
    return () => window.removeEventListener('iles:session-expired', handleExpiry);
  }, []);

  const handleAuthSuccess = (user, access, refresh) => {
    localStorage.setItem('access_token',  access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user',          JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.clear();
    setCurrentUser(null);
  };

  const isLoggedIn = Boolean(currentUser && localStorage.getItem('access_token'));

  return (
    <NotificationProvider>
      <div className="App">
        {!isLoggedIn && (
          <AuthShell onAuthSuccess={handleAuthSuccess} />
        )}
        {isLoggedIn && (
          <Dashboard
            currentUser={currentUser}
            onLogout={handleLogout}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}
      </div>
    </NotificationProvider>
  );
>>>>>>> 655eba7013d1ea32c99de08782175169bbd568be
}

export default App;
