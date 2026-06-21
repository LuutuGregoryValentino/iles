/*
shown to....
first fime visitors ->  no session history
users who closed the browser without logging out (SESSION_GUARD)
 */

import React, { useState } from 'react';
import './LandingPage.css';

const TEAM = [
  { name: 'Luutu Rahma', role: 'Full-Stack Lead', email: "rahmaluutun@gmail.com", init:"RLN", color:'#fff000' },
  { name: 'Luutu Gregory', role: 'UI/UX Designer', email: 'snowchildwolf@gmail.com', init : "LGV", color:'#0177b6' },
  { name: 'Raudha Nambuya', role: 'Backend Dev', email: 'raur743@gmail.com', init : "RN", color:'#e939af' },
  { name: 'Mumberere Breiline', role: 'Backend Developer', email: 'breilinemumbere@gmail.com', init :"MB", color:'#009e18'},
  { name: 'Ojambo Nicholas', role: 'Frontend Developer', email: 'ojambonicholas052@gmail.com', init:"ON", color:'#ff9100' },
  { name: 'Staty Kukunda', role: 'Frontend Developer', email: 'stacykukunda@gmail.com', init: "SK" , color:'#b300ff'},

];
const STEPS = [
  {
    num: '01',
    role: 'student',
    title: 'Register & complete your profile',
    body: 'Create your student account, select your programme and year of study. Your profile is pre-filled from registration details.',
  },
  {
    num: '02',
    role: 'student',
    title: 'Get assigned to a placement',
    body: 'Your administrator assigns you to an organisation with a workplace supervisor and academic supervisor.',
  },
  {
    num: '03',
    role: 'student',
    title: 'Submit weekly logbooks',
    body: 'Each week, log the tasks you worked on, hours spent, and any challenges. Submit for your supervisor to review.',
  },
  {
    num: '04',
    role: 'supervisor',
    title: 'Supervisors review & evaluate',
    body: 'Workplace and academic supervisors approve logbooks and submit a final weighted evaluation with detailed feedback.',
  },
];

const ROLES = [
  {
    icon: '🎓',
    title: 'Students',
    color: '#00b403',
    points: [
      'Submit weekly logbooks',
      'Track supervisor approvals',
      'View your final evaluation score',
      'Report internship issues',
    ],
  },
  {
    icon: '🏢',
    title: 'Workplace Supervisors',
    color: '#0026ff',
    points: [
      'Review student logbooks',
      'Approve or return entries',
      'Submit workplace evaluations',
      'Manage student issues',
    ],
  },
  {
    icon: '📚',
    title: 'Academic Supervisors',
    color: '#7c3aed',
    points: [
      'Monitor student progress',
      'Review logbook submissions',
      'Submit academic evaluations',
      'Coordinate with placements',
    ],
  },
  {
    icon: '⚙️',
    title: 'Administrators',
    color: '#9ca222',
    points: [
      'Create and manage placements',
      'Add and manage students',
      'Approve supervisor accounts',
      'Oversee all system activity',
    ],
  },
];

/*icons*/
function Icon({ path, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

export default function LandingPage({ onGetStarted, theme, onToggleTheme }) {
  const [activeTab, setActiveTab] = useState('student');

  return (
    <div className="lp-shell">
{/* nav bar */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-nav-brand">
            <div className="lp-nav-logo"><span>IL</span></div>
            <span className="lp-nav-name">ILES</span>
          </div>

          <div className="lp-nav-links">
            <a href="#how">How it works</a>
            <a href="#roles">Who it's for</a>
            <a href="#about">About</a>
            <a href="#team">Team</a>
          </div>

          <div className="lp-nav-actions">


            <button className="btn-icon" onClick={onToggleTheme} title="Toggle theme">
              {theme === 'dark'
                ? <Icon path="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" size={17} />
                : <Icon path="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" size={16} />
              }
            </button>
            <button className="btn btn-ghost lp-signin-btn" onClick={onGetStarted}>
              Sign in
            </button>
            <button className="btn btn-primary" onClick={onGetStarted}>
              Get started
            </button>
          </div>
        </div>
      </nav>


      <section className="lp-hero">
        <div className="lp-orb lp-orb-1" />
        <div className="lp-orb lp-orb-2" />
        <div className="lp-orb lp-orb-3" />

        <div className="lp-hero-inner">
          <div className="lp-hero-badge">
            <span className="lp-hero-badge-dot" />
            CoCIS · Makerere University · Internship System
          </div>

          <h1 className="lp-hero-title">
            Manage your internship<br />
            <span className="lp-hero-accent">end-to-end</span>
          </h1>

          <p className="lp-hero-sub">
            ILES brings students, supervisors, and administrators onto one platform
            for seamless logbook tracking, evaluations, and placement management.
          </p>

          <div className="lp-hero-ctas">
            <button className="btn btn-primary lp-cta-primary" onClick={onGetStarted}>
              <Icon path="M13 10V3L4 14h7v7l9-11h-7z" size={16} />
              Get started — it's free
            </button>
            <a href="#how" className="btn btn-ghost lp-cta-secondary">
              See how it works ↓
            </a>
          </div>


          <div className="lp-stats">
            {[
              { val: '4', label: 'User roles' },
              { val: 'Weekly', label: 'Logbook tracking' },
              { val: 'Live', label: 'Approval status' },
              { val: 'Secure', label: 'JWT auth' },
            ].map(s => (
              <div key={s.label} className="lp-stat">
                <span className="lp-stat-val">{s.val}</span>
                <span className="lp-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="lp-section" id="how">
        <div className="lp-section-inner">
          <div className="lp-section-label">How it works</div>
          <h2 className="lp-section-title">From placement to evaluation in 4 steps</h2>
          <p className="lp-section-sub">
            A clear workflow for every stakeholder, no confusion about what to do next.
          </p>


          <div className="lp-tab-row">
            <button
              className={`lp-tab ${activeTab === 'student' ? 'lp-tab-active' : ''}`}
              onClick={() => setActiveTab('student')}>
              For students
            </button>
            <button
              className={`lp-tab ${activeTab === 'supervisor' ? 'lp-tab-active' : ''}`}
              onClick={() => setActiveTab('supervisor')}>
              For supervisors
            </button>
          </div>

          <div className="lp-steps">
            {STEPS.filter(s => activeTab === 'student' ? s.role !== 'supervisor' : s.role === 'supervisor').map((step, i) => (
              <div key={step.num} className="lp-step">
                <div className="lp-step-num">{step.num}</div>
                <div className="lp-step-body">
                  <h3 className="lp-step-title">{step.title}</h3>
                  <p className="lp-step-text">{step.body}</p>
                </div>
              </div>
            ))}
            {activeTab === 'supervisor' && (
              <div className="lp-step">
                <div className="lp-step-num">05</div>
                <div className="lp-step-body">
                  <h3 className="lp-step-title">Scores are calculated automatically</h3>
                  <p className="lp-step-text">
                    The system applies the weighted formula (40% workplace + 30% academic + 30% logbook)
                    and assigns a final grade. Students can view their score in real time.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>


      <section className="lp-section lp-section-alt" id="roles">
        <div className="lp-section-inner">
          <div className="lp-section-label">Who it's for</div>
          <h2 className="lp-section-title">Built for everyone in the internship cycle</h2>

          <div className="lp-roles-grid">
            {ROLES.map(r => (
              <div key={r.title} className="lp-role-card">
                <div className="lp-role-icon">{r.icon}</div>
                <h3 className="lp-role-title" style={{ color: r.color }}>{r.title}</h3>
                <ul className="lp-role-list">
                  {r.points.map(p => (
                    <li key={p}>
                      <span className="lp-check" style={{ color: r.color }}>✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>



      <section className="lp-section" id="about">
        <div className="lp-section-inner lp-about-grid">
          <div className="lp-about-text">
            <div className="lp-section-label">About ILES</div>
            <h2 className="lp-section-title" style={{ marginBottom: 16 }}>
              What is ILES?
            </h2>
            <p className="lp-about-body">
              The <strong>Internship Logbook &amp; Evaluation System (ILES)</strong> is a
              web-based platform developed by students of the College of Computing and
              Information Sceinces (CoCIS) at Makerere University.
            </p>
            <p className="lp-about-body">
              It was designed to replace paper-based logbook submissions and fragmented
              email communication between students, workplace supervisors, and academic
              supervisors during the industrial training period.
            </p>
            <p className="lp-about-body">
              ILES provides a centralised, role-aware system where each user sees only
              what is relevant to them, students track their own progress, supervisors
              manage their assigned students, and administrators have full visibility
              across all placements.
            </p>

            <div className="lp-about-pills">
              {['Django REST', 'React', 'JWT Auth', 'SQLite', 'CoCIS · 2025'].map(t => (
                <span key={t} className="lp-pill">{t}</span>
              ))}
            </div>
          </div>

          <div className="lp-about-features">
            {[
              { icon: '🔐', title: 'Role-based access', body: 'Every user sees only what they need. Students, supervisors, and admins have tailored dashboards.' },
              { icon: '📊', title: 'Live evaluation scores', body: 'Weighted grading (40/30/30) calculated automatically. Students see their grade the moment supervisors submit.' },
              { icon: '🔔', title: 'Notification system', body: 'In-app notifications for pending logbooks, open issues, and profile reminders.' },
              { icon: '📱', title: 'Mobile responsive', body: 'Works on any device. The sidebar collapses on mobile with a tap-to-dismiss overlay.' },
            ].map(f => (
              <div key={f.title} className="lp-feature-row">
                <div className="lp-feature-icon">{f.icon}</div>
                <div>
                  <div className="lp-feature-title">{f.title}</div>
                  <div className="lp-feature-body">{f.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="lp-section lp-section-alt" id="team">
        <div className="lp-section-inner">
          <div className="lp-section-label">The team</div>
          <h2 className="lp-section-title">Meet the developers</h2>
          <p className="lp-section-sub">
            Built with teh desire to achieve success. Reach out if you need help with the system.
          </p>

          <div className="lp-team-grid">
            {TEAM.map(m => (
              <div key={m.email} className="lp-team-card">
                <div className="lp-team-avatar" style={{ background: m.color }}>
                  {m.init}
                </div>
                <h3 className="lp-team-name">{m.name}</h3>
                <div className="lp-team-role">{m.role}</div>
                <a href={`mailto:${m.email}`} className="lp-team-email">
                  {m.email}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>




      <section className="lp-cta-banner">
        <div className="lp-cta-banner-inner">
          <h2>Ready to get started?</h2>
          <p>Create your account in under a minute. Students can submit their first logbook on the same day.</p>
          <button className="btn btn-primary lp-cta-primary" onClick={onGetStarted}>
            <Icon path="M13 10V3L4 14h7v7l9-11h-7z" size={16} />
            Create your account
          </button>
        </div>
      </section>



      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-nav-logo" style={{ width: 28, height: 28, fontSize: 11 }}><span>IL</span></div>
            <span>ILES</span>
          </div>
          <div className="lp-footer-text">
            © {new Date().getFullYear()} ILES · College of Computing and Information Sciences · Makerere University
          </div>
          <div className="lp-footer-links">
            <button className="lp-footer-link" onClick={onGetStarted}>Sign in</button>
            <button className="lp-footer-link" onClick={onGetStarted}>Register</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
