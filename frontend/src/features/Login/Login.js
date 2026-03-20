import React, { useState } from 'react';
import './Login.css';

function Login(props) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = (e) => {
        e.preventDefault();
        alert(`Logging in with: ${email}`);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Internship Portal</h2>
                <p>Please login to continue</p>

                <form onSubmit={handleLogin}>
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit">Login</button>
                </form>

                <p style={{ marginTop: '15px', fontSize: '14px' }}>
                    Don't have an account? 
                    <span
                        style={{ padding:'5px', color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick = {props.loginNavigate}
                    >
                         Sign up
                    </span>
                </p>
            </div>
        </div>
    );
}

export default Login;