import React, { useState } from 'react';
import './App.css';
<<<<<<< HEAD
import Signup from "./features/Signup/Signup"
import Login from './features/Login/Login';
=======
import Signup from "./features/Signup/Signup";
import Login from './features/Login/Login';
import Profile from './features/Profile/ProfileForm';
import ProfileForm from './features/Profile/ProfileForm';
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
}

export default App;
