import React, { useState } from 'react';
import './App.css';
import Signup from "./features/Signup/Signup";
import Login from './features/Login/Login';
import Profile from './features/Profile/ProfileForm';
import ProfileForm from './features/Profile/ProfileForm';

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

      {screen === "profile" && <ProfileForm/>}
    </div>
  );

}

export default App;
