import React, { useState } from 'react';
import './App.css';
import Login       from './features/Login/Login';
import Signup      from './features/Signup/Signup';
import ProfileForm from './features/Profile/ProfileForm';
import Dashboard   from './features/Dashboard/Dashboard';

function App() {
  const [screen, setScreen] = useState(() =>
    localStorage.getItem('access_token') ? 'dashboard' : 'login'
  );

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleAuthSuccess = (user, access, refresh) => {
    localStorage.setItem('access_token',  access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user',          JSON.stringify(user));
    setCurrentUser(user);
    setScreen(user.role === 'student' ? 'profile' : 'dashboard');
  };

  const handleLogout = () => {
    localStorage.clear();
    setCurrentUser(null);
    setScreen('login');
  };

  const isAuthenticated = Boolean(localStorage.getItem('access_token'));

  return (
    <div className="App">
      {screen === 'login' && (
        <Login onAuthSuccess={handleAuthSuccess} goToSignup={() => setScreen('signup')} />
      )}
      {screen === 'signup' && (
        <Signup onAuthSuccess={handleAuthSuccess} goToLogin={() => setScreen('login')} />
      )}
      {screen === 'profile' && isAuthenticated && (
        <ProfileForm currentUser={currentUser} onSaved={() => setScreen('dashboard')} />
      )}
      {screen === 'dashboard' && isAuthenticated && (
        <Dashboard currentUser={currentUser} onLogout={handleLogout} goToProfile={() => setScreen('profile')} />
      )}
      {(screen === 'dashboard' || screen === 'profile') && !isAuthenticated && (
        <Login onAuthSuccess={handleAuthSuccess} goToSignup={() => setScreen('signup')} />
      )}
    </div>
  );
}

export default App;
