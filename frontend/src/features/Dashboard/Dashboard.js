
import React, { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';
import Sidebar from './Sidebar';
import DashHeader from './DashHeader';
import ProfileModal from '../Profile/ProfileModal';
import { useProfileStatus } from '../../hooks/useProfileStatus';
import { useNotifications } from '../../context/NotificationContext';

import OverviewPanel from './panels/OverviewPanel';
import LogbookPanel from './panels/LogbookPanel';
import ScoreCardPanel from './panels/ScoreCardPanel';
import IssuesPanel from './panels/IssuesPanel';
import ReviewPanel from './panels/ReviewPanel';
import EvaluationPanel from './panels/EvaluationPanel';
import StudentsPanel from './panels/StudentsPanel';
import PlacementsPanel from './panels/PlacementsPanel';

/*
   SECTIONS ; single source of truth for navigation + access
   TO RESTRICT: remove a role from `roles`
   TO ADD: add entry + matching Panel in PANEL_MAP below
*/
export const SECTIONS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    roles: ['student', 'workplace_supervisor', 'academic_supervisor', 'administrator'],
  },
  {
    id: 'logbook',
    label: 'Logbook',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    roles: ['student'],  // ← students only
  },
  {
    id: 'scorecard',
    label: 'My Score',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    roles: ['student'],  // ← students only
  },
  {
    id: 'review',
    label: 'Logbook Review',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    roles: ['workplace_supervisor', 'academic_supervisor', 'administrator'],
  },
  {
    id: 'evaluation',
    label: 'Evaluations',
    icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z',
    roles: ['workplace_supervisor', 'academic_supervisor', 'administrator'],
  },
  {
    id: 'students',
    label: 'Students',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    roles: ['administrator'],  // ← admin only
  },
  {
    id: 'placements',
    label: 'Placements',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    roles: ['administrator'],  // ← admin only
  },
  {
    id: 'issues',
    label: 'Issues',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    roles: ['student', 'workplace_supervisor', 'academic_supervisor', 'administrator'],
  },
];

const PANEL_MAP = {
  overview: OverviewPanel,
  logbook: LogbookPanel,
  scorecard: ScoreCardPanel,
  review: ReviewPanel,
  evaluation: EvaluationPanel,
  students: StudentsPanel,
  placements: PlacementsPanel,
  issues: IssuesPanel,
};

const MOBILE_BP = 768;

export default function Dashboard({ currentUser, onLogout, theme, onToggleTheme }) {
  const role = currentUser?.role || 'student';
  const visibleSections = SECTIONS.filter(s => s.roles.includes(role));

  /*detect mobile  */
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BP);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= MOBILE_BP);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  /*Sidebar: open on desktop, closed on mobile*/
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > MOBILE_BP);

  /* Keep sidebar closed when resizing into mobile, open when going to desktop */
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
    else setSidebarOpen(true);
  }, [isMobile]);

  const [activeSection, setActiveSection] = useState(visibleSections[0]?.id || 'overview');

  /*Profile status hook*/
  const {
    profileComplete,
    showProfileModal,
    profileData,
    openProfileModal,
    closeProfileModal,
    onProfileSaved,
  } = useProfileStatus(currentUser);

  /*Notifications*/
  const { push } = useNotifications();

  useEffect(() => {
    if (role === 'student' && !profileComplete) {
      push({
        type: 'warn',
        title: 'Profile incomplete',
        body: 'Some profile fields are missing. Click your avatar → Edit Profile.',
      });
    }
  }, [profileComplete, role]); // eslint-disable-line

  /*Guard: reset active section if role changes */
  useEffect(() => {
    if (!visibleSections.find(s => s.id === activeSection)) {
      setActiveSection(visibleSections[0]?.id || 'overview');
    }
  }, [role]); // eslint-disable-line

  /*Navigation handler ; On mobile: close sidebar after navigation so content is revealed.
     The backdrop tap also calls closeSidebar() below.
*/
  const handleNav = useCallback((id) => {
    setActiveSection(id);
    if (window.innerWidth <= MOBILE_BP) {
      setSidebarOpen(false);
    }
  }, []);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  /* Shell clas.. drives CSS for mobile overlay state */
  const shellClass = [
    'dash-shell',
    sidebarOpen ? 'sidebar-open' : 'sidebar-closed',
    isMobile && sidebarOpen ? 'mobile-sidebar-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={shellClass}>

      {/* Profile modal*/}
      {showProfileModal && (
        <ProfileModal
          currentUser={currentUser}
          prefillData={profileData}
          onSaved={onProfileSaved}
          onClose={closeProfileModal}
        />
      )}

      {/*Mobile backdrop overlay
          Rendered when sidebar is open on mobile.
          Clicking it calls closeSidebar()> sidebar slides out> content revealed.
          The 'sb-backdrop' div lives INSIDE .dash-shell so it covers only the app.*/}
      {isMobile && sidebarOpen && (
        <div
          className="sb-backdrop"
          onClick={closeSidebar}
          aria-label="Close navigation"
          role="button"
          style={{ display: 'block' }} /* override display:none from CSS default */
        />
      )}

      {/*  Sidebar; persistent, slides in/out via CSS transform on mobile ── */}
      <Sidebar
        sections={visibleSections}
        activeSection={activeSection}
        onNav={handleNav}
        currentUser={currentUser}
        isOpen={sidebarOpen}
      />

      {/*Main area  always rendered, stays in DOM*/}
      <div className="dash-main">
        <DashHeader
          currentUser={currentUser}
          activeSection={activeSection}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onLogout={onLogout}
          profileComplete={profileComplete}
          onOpenProfile={openProfileModal}
          onNavigate={handleNav}
        />

        <div className="dash-content">
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
                  onNavigate={handleNav}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
