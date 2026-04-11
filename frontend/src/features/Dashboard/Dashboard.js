import React, { useState } from 'react';
import './Dashboard.css';

function Dashboard() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [view, setView] = useState("ecommerce"); // Default view

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        // This tells the CSS to switch to the dark variables
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'light' : 'dark');
    };

    return (
        <div className="dashboard-container">
            {/* 1. SIDEBAR */}
            <aside className="sidebar">
              <div className="logo">TailAdmin</div>
              <ul className="nav-links">
                <li className={view === "ecommerce" ? "active" : ""} onClick={() => setView("ecommerce")}>Dashboard</li>
                <li onClick={() => setView("profile")}>User Profile</li>
                <li onClick={() => setView("task")}>Task</li>
                <li onClick={() => setView("forms")}>Forms</li>
              </ul>
            </aside>

            {/* 2. MAIN CONTENT AREA */}
            <main className="main-content">
                <header className="topbar">
                    <div className="search-bar">
                      <input type="text" placeholder="Search or type command..." />
                    </div>
                    <div className="topbar-actions">
                      <button onClick={toggleTheme}>
                        {isDarkMode ? '☀️' : '🌙'}
                      </button>
                      <div className="user-profile">
                        <span>Emirhan Boruch</span>
                      </div>
                    </div>
                </header>

                <div className="content">
                    {view === "ecommerce" && <EcommerceStats />}
                    {/* Other views go here */}
                </div>
            </main>
        </div>
    );
}

// The "Cards" part of your image
function EcommerceStats() {
  return (
    <div className="stats-grid">
      <StatCard title="Total Views" value="3.456" growth="+0.43%" />
      <StatCard title="Total Profit" value="$45.2K" growth="+4.35%" />
      <StatCard title="Total Product" value="2.450" growth="+2.59%" />
      <StatCard title="Total Users" value="3.456" growth="+0.95%" />
    </div>
  )
}

function StatCard({ title, value, growth }) {
  return (
    <div className="card">
      <div className="card-header">{title}</div>
      <div className="card-value">{value}</div>
      <div className="card-growth">{growth}</div>
    </div>
  );
}

export default Dashboard;