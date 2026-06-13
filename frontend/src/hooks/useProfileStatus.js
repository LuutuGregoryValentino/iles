/**
 * useProfileStatus.js
 *
 * Determines whether the profile setup modal should appear.
 *
 * RULES (replaces the naive needsProfile flag in App.js):
 *
 * 1. Only runs for 'student' role — all other roles skip entirely.
 * 2. Checks localStorage key 'iles_profile_checked_{userId}'.
 *    - If the key exists AND was set < RECHECK_DAYS days ago → skip check.
 *    - Otherwise → call GET /students/ and look at the fields.
 * 3. If the student record exists and core fields are filled → profileComplete = true.
 * 4. If the record is missing or incomplete → show notification (not modal popup)
 *    unless it's the very first login (flag 'iles_first_login_{userId}' not yet set).
 *
 * This means:
 *   - First ever login after signup          → modal pops up
 *   - Every subsequent login (within 7 days) → silent notification badge only
 *   - After 7 days                           → re-checks DB silently
 *
 * The modal can always be opened manually via the user avatar menu.
 */
import { useState, useEffect } from 'react';
import { studentsAPI } from '../services/api';

const RECHECK_DAYS = 7;

export function useProfileStatus(currentUser) {
  const role   = currentUser?.role;
  const userId = currentUser?.id;

  const [profileComplete,  setProfileComplete]  = useState(true);   // assume complete until proven otherwise
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData,      setProfileData]      = useState(null);   // filled student record if found
  const [checking,         setChecking]         = useState(false);

  useEffect(() => {
    // Only students need profile completion
    if (role !== 'student' || !userId) return;

    const checkedKey    = `iles_profile_checked_${userId}`;
    const firstLoginKey = `iles_first_login_${userId}`;
    const lastChecked   = localStorage.getItem(checkedKey);
    const isFirstLogin  = !localStorage.getItem(firstLoginKey);

    const needsRecheck = !lastChecked ||
      (Date.now() - parseInt(lastChecked, 10)) > RECHECK_DAYS * 86_400_000;

    if (!needsRecheck && !isFirstLogin) {
      // Within the recheck window and not first login — use cached state
      const cached = localStorage.getItem(`iles_profile_ok_${userId}`);
      setProfileComplete(cached === 'true');
      return;
    }

    setChecking(true);
    studentsAPI.list()
      .then(res => {
        const student = res.data[0] || null;
        setProfileData(student);

        const isComplete = Boolean(
          student &&
          currentUser?.first_name &&
          currentUser?.last_name &&
          currentUser?.username &&
          // Check profile fields
          student.student_name &&
          student.student_id &&
          student.course &&
          student.year_of_study &&
          student.semester
        );

        setProfileComplete(isComplete);
        localStorage.setItem(checkedKey, Date.now().toString());
        localStorage.setItem(`iles_profile_ok_${userId}`, String(isComplete));

        // First login ever → show modal immediately
        if (isFirstLogin) {
          localStorage.setItem(firstLoginKey, 'true');
          if (!isComplete) setShowProfileModal(true);
        }
        // Subsequent login with incomplete profile → notification only (no modal)
      })
      .catch(() => {
        // Don't block the user if check fails
        setProfileComplete(true);
      })
      .finally(() => setChecking(false));
  }, [role, userId]); // eslint-disable-line

  const openProfileModal  = () => setShowProfileModal(true);
  const closeProfileModal = () => setShowProfileModal(false);

  const onProfileSaved = () => {
    setShowProfileModal(false);
    setProfileComplete(true);
    if (userId) {
      localStorage.setItem(`iles_profile_ok_${userId}`, 'true');
      localStorage.setItem(`iles_profile_checked_${currentUser.id}`, Date.now().toString());
    }
  };

  return {
    profileComplete,
    showProfileModal,
    profileData,       // pre-filled student data for the form
    checking,
    openProfileModal,
    closeProfileModal,
    onProfileSaved,
  };
}
