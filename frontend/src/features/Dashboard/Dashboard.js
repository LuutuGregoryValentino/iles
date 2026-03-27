
import React, { useState } from 'react';
import './Dashboard.css';
import ProfileForm from '../Profile/ProfileForm'; // Reuse your form!

function Dashboard() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <h2>Internship Portal</h2>
        <ul>
          <li onClick={() => setActiveTab("home")}>Dashboard Home</li>
          <li onClick={() => setActiveTab("profile")}>My Profile</li>
          <li onClick={() => setActiveTab("internships")}>Find Internships</li>
        </ul>
      </aside>

      <header className="topbar">
        <span>Welcome, Student!</span>
      </header>

      <main className="main-content">
        {activeTab === "home" && <h3>Overview coming soon...</h3>}
        {activeTab === "profile" && <ProfileForm />}
        {activeTab === "internships" && <h3>Internship listings coming soon...</h3>}
      </main>
    </div>
  );
}

export default Dashboard;