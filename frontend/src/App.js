import React, { useState } from 'react';
import './App.css';
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

function App() {

  const [screen, setScreen] = useState("login"); //use of state and conditional rendering to swithch between the logina nd signup pages, 
  return (
    <div className='App'>
      {screen === "login" && ( //if my state is login, load <Login /> set teh loginNavigate to swtich to signup upon click call
        <Login loginNavigate={() => setScreen("signup")} /> 
      )}

      {screen === 'signup' && (
        <Signup loginNavigate={() => setScreen('login')} />
      )}
<<<<<<< HEAD
    </div>
  );
=======

      {screen === "profile" && <ProfileForm/>}
    </div>
  );

>>>>>>> 3be749ee887fa80dc68098377f2ae91b7aae1927
=======
import Dashboard from './features/Dashboard/Dashboard';

function App() {
  const [screen, setScreen] = useState(() =>
    localStorage.getItem('access_token') ? 'dashboard' : 'login'
  );

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleAuthSuccess = (user, access, refresh) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));
    setCurrentUser(user);
    setScreen('profile');
  };

  const handleLogout = () => {
    localStorage.clear();
    setCurrentUser(null);
    setScreen('login');
  };

  return (
    <div className="App">
      
      {process.env.NODE_ENV === 'development' && (
        <nav style={{ background: '#eee', padding: '10px', display: 'flex', gap: '10px' }}>
          <button onClick={() => setScreen('login')}>Mock Login Screen</button>
          <button onClick={() => setScreen('signup')}>Mock Signup Screen</button>
          <button onClick={() => {
            setCurrentUser({ name: 'Dev User', email: 'dev@test.com' });
            setScreen('profile');
          }}>Mock Profile (Authed)</button>
          <button onClick={() => setScreen('dashboard')}>Mock Dashboard</button>
        </nav>
      )}

      {screen === 'login' && (
        <Login onAuthSuccess={handleAuthSuccess} goToSignup={() => setScreen('signup')} />
      )}
      {screen === 'signup' && (
        <Signup onAuthSuccess={handleAuthSuccess} goToLogin={() => setScreen('login')} />
      )}
      {screen === 'profile' && (
        <ProfileForm currentUser={currentUser} onSaved={() => setScreen('dashboard')} />
      )}
      {screen === 'dashboard' && (
        <Dashboard currentUser={currentUser} onLogout={handleLogout} goToProfile={() => setScreen('profile')} />
      )}
    </div>
  );
>>>>>>> 655eba7013d1ea32c99de08782175169bbd568be
}

export default App;