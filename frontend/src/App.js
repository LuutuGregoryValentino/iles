import React, { useState } from 'react';
import './App.css';
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
=======
import Login       from './features/Login/Login';
import Signup      from './features/Signup/Signup';
import ProfileForm from './features/Profile/ProfileForm';
import Dashboard   from './features/Dashboard/Dashboard';
>>>>>>> b3b99c241737ce916f5ac9ab26cf25915cb9052f

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
>>>>>>> 655eba7013d1ea32c99de08782175169bbd568be
}

export default App;
