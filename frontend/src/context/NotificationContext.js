/**
 * NotificationContext.js
 *
 * Global notification system. Any component can push a notification.
 * The bell in DashHeader subscribes to this context.
 *
 * Notification shape:
 * {
 *   id:       string   (auto-generated)
 *   type:     'info' | 'success' | 'warn' | 'danger'
 *   title:    string
 *   body:     string   (optional)
 *   read:     boolean
 *   ts:       Date
 *   action?:  { label: string, sectionId: string }  — nav shortcut
 * }
 *
 * USAGE (in any component):
 *   const { push } = useNotifications();
 *   push({ type: 'warn', title: 'Logbook pending', body: '3 logbooks need review.' });
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

const NotifCtx = createContext(null);

let _id = 0;
const uid = () => `n_${++_id}_${Date.now()}`;

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const push = useCallback((notif) => {
    setNotifications(prev => [
      { id: uid(), read: false, ts: new Date(), ...notif },
      ...prev,
    ].slice(0, 50)); // cap at 50
  }, []);

  const markRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const dismiss = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotifCtx.Provider value={{ notifications, push, markRead, markAllRead, dismiss, clearNotifications, unreadCount }}>
      {children}
    </NotifCtx.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotifCtx);
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider');
  return ctx;
}
