import React, { useState } from 'react';
import './Dashboard.css';

function Dashboard() {
    // This state controls which "Page" is showing inside the dashboard
    const [view, setView] = useState("stats"); 

    return (
        <div className="dashboard-container">
            <nav className="side-nav">
                <h3>Internship Hub</h3>
                <button onClick={() => setView("stats")}>Home</button>
                <button onClick={() => setView("profile")}>Profile</button>
                <button onClick={() => setView("tasks")}>My Tasks</button>
            </nav>

            <div className="main-section">
                <header className="top-header">
                    <span>Logged in as: <strong>Student</strong></span>
                    <button className="logout-btn">Logout</button>
                </header>

                <div className="content-area">
                    {/* The Switchboard */}
                    {view === "stats" && <StatsOverview />}
                    {view === "profile" && <div>(Your ProfileForm Component goes here)</div>}
                    {view === "tasks" && <div>(Task Table coming soon)</div>}
                </div>
            </div>
        </div>
    );
}

// A small "Sub-Component" for the home view
function StatsOverview() {
    return (
        <div className="stats-grid">
            <div className="card"><h4>Tasks Done</h4><p>12</p></div>
            <div className="card"><h4>Days Remaining</h4><p>24</p></div>
            <div className="card"><h4>Supervisor Status</h4><p>Active</p></div>
        </div>
    );
}

export default Dashboard;