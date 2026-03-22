import logo from './logo.svg';
import React, {useState} from 'react';
import './App.css';
import Signup from "./features/Signup/Signup"
import Login from './features/Login/Login';

function App() {

  const [screen,setScreen] = useState("login");

  return (
    <div className='App'>
      {screen === "login" && (
        <Login onNavigate={()=> setScreen("signup")} />
      )}

      {screen === 'signup' && (
        <Signup onNavigate ={() => setScreen('login')} />
      )}
    </div>
  );
}

export default App;
