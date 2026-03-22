
import React, { useState } from "react"
import '../Login/Login.css'
import '../../App.css'

function Signup() {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState('');
    const [password, setPassword] = useState("");
    const [confirmPassword, setconfirmPassword] = useState("");

    const handleSignup = (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            alert("Passwords do not much!");
            return;
        }
    }

    console.log(`Creating account for ${email} as ${role}`);

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Signup</h2>
                <form onSubmit={handleSignup}>
                    <input
                        type="email"
                        placeholder="Enter a valid Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <select value={role} onChange={(e) => setRole(e.target.value)}>
                        <option value="student">Student</option>
                        <option value="workplace_supervisor">Workplace Supervisor</option>
                        <option value="academic_supervisor">Academic Supervisor</option>
                    </select>

                    <input
                        type="password"
                        placeholder="Create a password"
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Confirm password"
                        onChange={(e) => setconfirmPassword(e.target.value)}
                        required
                    />

                    <button type="submit">Register</button>
                </form>
            </div>
        </div>
    )
}


export default Signup;