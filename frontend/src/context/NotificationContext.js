/**
 * NotificationContext.js
 *
 * Global notification system for the entire app.
 * Any component can push notifications that appear
 * in the dashboard bell/header.
 *
 * Notification shape:
 * {
 *   id: string,
 *   type: 'info' | 'success' | 'warn' | 'danger',
 *   title: string,
 *   body?: string,
 *   read: boolean,
 *   ts: string,
 *   action?: {
 *      label: string,
 *      sectionId: string
 *   }
 * }
 *
 * Usage:
 * const { push } = useNotifications();
 *
 * push({
 *   type: 'warn',
 *   title: 'Pending Reviews',
 *   body: '3 logbooks need review.'
 * });
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';

const NotificationContext = createContext(null);

const STORAGE_KEY = 'iles_notifications';

/* ─────────────────────────────────────────────
   Generate Unique Notification ID
───────────────────────────────────────────── */
const generateId = () =>
  `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

/* ─────────────────────────────────────────────
   Provider
───────────────────────────────────────────── */
export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load notifications:', error);
      return [];
    }
  });

  /* ──────────────────────────────────────────
     Persist notifications to localStorage
  ─────────────────────────────────────────── */
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(notifications)
      );
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }, [notifications]);

  /* ──────────────────────────────────────────
     Push Notification
  ─────────────────────────────────────────── */
  const push = useCallback((notif) => {
    const newNotification = {
      id: generateId(),
      type: 'info',
      read: false,
      ts: new Date().toISOString(),
      ...notif,
    };

    setNotifications(prev => [
      newNotification,
      ...prev,
    ].slice(0, 50)); // Keep latest 50
  }, []);

  /* ──────────────────────────────────────────
     Mark One As Read
  ─────────────────────────────────────────── */
  const markRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  /* ──────────────────────────────────────────
     Mark All As Read
  ─────────────────────────────────────────── */
  const markAllRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({
        ...notification,
        read: true,
      }))
    );
  }, []);

  /* ──────────────────────────────────────────
     Remove Notification
  ─────────────────────────────────────────── */
  const dismiss = useCallback((id) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    );
  }, []);

  /* ──────────────────────────────────────────
     Clear Everything
  ─────────────────────────────────────────── */
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  /* ──────────────────────────────────────────
     Unread Count
  ─────────────────────────────────────────── */
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  /* ──────────────────────────────────────────
     Context Value
  ─────────────────────────────────────────── */
  const value = {
    notifications,
    unreadCount,
    push,
    markRead,
    markAllRead,
    dismiss,
    clearNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/* ─────────────────────────────────────────────
   Custom Hook
───────────────────────────────────────────── */
export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      'useNotifications must be used inside NotificationProvider'
    );
  }

  return context;
}