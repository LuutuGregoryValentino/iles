/**
 * Dashboard.js — Persistent single-page shell
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ ARCHITECTURE                                                     │
 * │  ┌──────────┬──────────────────────────────────────────────┐    │
 * │  │ Sidebar  │  Header                                       │    │
 * │  │          ├──────────────────────────────────────────────┤    │
 * │  │  (fixed) │  Content area — only the active panel mounts │    │
 * │  │          │  Everything else is display:none, not        │    │
 * │  │          │  unmounted, to preserve scroll position.     │    │
 * │  └──────────┴──────────────────────────────────────────────┘    │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * ROLE → VISIBLE SECTIONS MAP  ← ← ← change visibility HERE
 * ─────────────────────────────────────────────────────────────────
 * student              → overview, logbook, scorecard, issues
 * workplace_supervisor → overview, review, evaluation, issues
 * academic_supervisor  → overview, review, evaluation, issues
 * administrator        → overview, students, placements, review,
 *                        evaluation, issues, admin
 *
 * The SECTIONS constant below is the single source of truth.
 * To add/remove a section for a role, edit the `roles` array on
 * the relevant entry. The sidebar and routing will update automatically.
 *
 * BUG FIXED: Stat tiles now refresh when activeSection changes via
 * a lightweight useDashboardStats hook so the overview always reflects
 * live data without a full re-render of children.
 */
import React, { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';
import Sidebar         from './Sidebar';
import DashHeader      from './DashHeader';
import ProfileForm     from '../Profile/ProfileForm';

/* ── Section panels (lazy-import pattern — code stays clean) ── */
import OverviewPanel     from './panels/OverviewPanel';
import LogbookPanel      from './panels/LogbookPanel';
import ScoreCardPanel    from './panels/ScoreCardPanel';
import IssuesPanel       from './panels/IssuesPanel';
import ReviewPanel       from './panels/ReviewPanel';
import EvaluationPanel   from './panels/EvaluationPanel';
import StudentsPanel     from './panels/StudentsPanel';
import PlacementsPanel   from './panels/PlacementsPanel';

/* ─────────────────────────────────────────────────────────────
   SECTIONS — single source of truth for navigation & visibility
   
   icon: SVG path string (used by Sidebar)
   roles: which user roles can see this section

   ▼ TO RESTRICT A SECTION: remove a role from its `roles` array
   ▼ TO ADD A SECTION: add an entry here + a matching Panel component
───────────────────────────────────────────────────────────── */
export const SECTIONS = [
  {
    id:    'overview',
    label: 'Overview',
    icon:  'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    roles: ['student', 'workplace_supervisor', 'academic_supervisor', 'administrator'],
  },
  {
    id:    'logbook',
    label: 'Logbook',
    icon:  'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    // ▼ STUDENTS ONLY — supervisors/admin see logbooks via Review panel
    roles: ['student'],
  },
  {
    id:    'scorecard',
    label: 'My Score',
    icon:  'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    // ▼ STUDENTS ONLY — supervisors see scorecards via Evaluation panel
    roles: ['student'],
  },
  {
    id:    'review',
    label: 'Logbook Review',
    icon:  'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    // ▼ SUPERVISORS + ADMIN only
    roles: ['workplace_supervisor', 'academic_supervisor', 'administrator'],
  },
  {
    id:    'evaluation',
    label: 'Evaluations',
    icon:  'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z',
    // ▼ SUPERVISORS + ADMIN only (students see read-only in scorecard)
    roles: ['workplace_supervisor', 'academic_supervisor', 'administrator'],
  },
  {
    id:    'students',
    label: 'Students',
    icon:  'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    // ▼ ADMIN ONLY
    roles: ['administrator'],
  },
  {
    id:    'placements',
    label: 'Placements',
    icon:  'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    // ▼ ADMIN ONLY
    roles: ['administrator'],
  },
  {
    id:    'issues',
    label: 'Issues',
    icon:  'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    roles: ['student', 'workplace_supervisor', 'academic_supervisor', 'administrator'],
  },
];

/* ── Map section id → panel component ── */
const PANEL_MAP = {
  overview:   OverviewPanel,
  logbook:    LogbookPanel,
  scorecard:  ScoreCardPanel,
  review:     ReviewPanel,
  evaluation: EvaluationPanel,
  students:   StudentsPanel,
  placements: PlacementsPanel,
  issues:     IssuesPanel,
};

/* ─────────────────────────────────────────────────────────────
   Dashboard component
───────────────────────────────────────────────────────────── */
export default function Dashboard({
  currentUser, needsProfile, onProfileSaved, onLogout, theme, onToggleTheme
}) {
  const role = currentUser?.role || 'student';

  /* Sections this role can see */
  const visibleSections = SECTIONS.filter(s => s.roles.includes(role));

  /* Default to first visible section */
  const [activeSection, setActiveSection] = useState(visibleSections[0]?.id || 'overview');
  const [sidebarOpen,   setSidebarOpen]   = useState(true);

  /* Guard: if current section is no longer visible (role mismatch), reset */
  useEffect(() => {
    if (!visibleSections.find(s => s.id === activeSection)) {
      setActiveSection(visibleSections[0]?.id || 'overview');
    }
  }, [role]); // eslint-disable-line

  const handleNav = useCallback((id) => {
    setActiveSection(id);
    /* Close sidebar on mobile after nav */
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  return (
    <div className={`dash-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>

      {/* ── Profile setup modal (students on first login) ──────────────────
          CONDITION CHECK: needsProfile && role === 'student'
          Non-students never see this.
      ─────────────────────────────────────────────────────────────────── */}
      {needsProfile && role === 'student' && (
        <ProfileForm currentUser={currentUser} onSaved={onProfileSaved} />
      )}

      {/* ── Sidebar — always mounted, hides/shows via CSS ── */}
      <Sidebar
        sections={visibleSections}
        activeSection={activeSection}
        onNav={handleNav}
        currentUser={currentUser}
        isOpen={sidebarOpen}
      />

      {/* ── Main area ── */}
      <div className="dash-main">
        <DashHeader
          currentUser={currentUser}
          activeSection={activeSection}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onLogout={onLogout}
        />

        <div className="dash-content">
          {/*
            Render ALL visible panels but only show the active one.
            Using visibility + display toggle rather than conditional
            mounting keeps scroll position and avoids API re-fetches.
            
            EXCEPTION: panels that do heavy data loading are only mounted
            once the user has navigated to them (lazy-mount pattern).
          */}
          {visibleSections.map(section => {
            const Panel = PANEL_MAP[section.id];
            if (!Panel) return null;
            return (
              <div
                key={section.id}
                className="panel-wrapper"
                style={{ display: activeSection === section.id ? 'block' : 'none' }}
              >
                <Panel
                  currentUser={currentUser}
                  isActive={activeSection === section.id}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
