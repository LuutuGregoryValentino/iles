import React, { useState, useEffect } from 'react';
import './styles/global.css';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import LandingPage from './features/Landing/LandingPage';
import AuthShell from './features/Auth/AuthShell';
import PendingApproval from './features/Auth/PendingApproval';
import Dashboard from './features/Dashboard/Dashboard';


function initialScreen() {
  const token = localStorage.getItem('access_token');
  const sessionAlive = sessionStorage.getItem('iles_session'); // cleared on tab close

  if (!token || !sessionAlive) {
    // return "auth" to laod login page and "landing" to laod the langing page
    return 'auth';
  }


  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) return 'landing';



    // get approval before laoding
    const GATED_ROLES = ['administrator', 'workplace_supervisor', 'academic_supervisor'];
    if (GATED_ROLES.includes(user.role) && user.is_approved === false) {
      return 'pending';
    }

    return 'dashboard';
  } catch {
    return 'landing';
  }
}

function App() {

  const [theme, setTheme] = useState(
    () => localStorage.getItem('iles_theme') || 'dark'
  );
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('iles_theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));


  // screen SM
  const [screen, setScreen] = useState(initialScreen);


  const [currentUser, setCurrentUser] = useState(() => {
    if (!sessionStorage.getItem('iles_session')) return null; // SESSION_GUARD
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const { clearNotifications } = useNotifications();




  useEffect(() => {
    const handleExpiry = () => {
      localStorage.clear();
      sessionStorage.removeItem('iles_session'); // clear session flag
      setCurrentUser(null);
      setScreen('landing');
    };
    window.addEventListener('iles:session-expired', handleExpiry);
    return () => window.removeEventListener('iles:session-expired', handleExpiry);
  }, []);

   const handleAuthSuccess = (user, access, refresh) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));

    sessionStorage.setItem('iles_session', 'true');

    setCurrentUser(user);

    // approval check
    const GATED_ROLES = ['administrator', 'workplace_supervisor', 'academic_supervisor'];
    if (GATED_ROLES.includes(user.role) && user.is_approved === false) {
      setScreen('pending'); //laod approval screen
    } else {
      setScreen('dashboard');
    }
  };

  

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.removeItem('iles_session'); // dletes the session
    setCurrentUser(null);
    setScreen('auth'); 
    // clearNotifications();
  };

  return (
    <NotificationProvider>

      <div className="App">

        {/* for new visitors and un approved users*/}
        {screen === 'landing' && (
          <LandingPage
            onGetStarted={() => setScreen('auth')}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}


        {screen === 'auth' && (
          <AuthShell
            onAuthSuccess={handleAuthSuccess}
            onBack={() => setScreen('landing')}
          />
        )}



        {screen === 'pending' && currentUser && (
          <PendingApproval
            currentUser={currentUser}
            onApproved={(updatedUser) => {
              // when is_approved = true ; 
              localStorage.setItem('user', JSON.stringify(updatedUser));
              setCurrentUser(updatedUser);
              setScreen('dashboard');
            }}
            onLogout={handleLogout}
          />
        )}



        {screen === 'dashboard' && currentUser && (
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
}

export default App;
