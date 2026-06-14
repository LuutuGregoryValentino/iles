
import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import './NotificationBell.css';

const TYPE_COLORS = {
  info:    { bg: 'var(--status-info-bg)',    dot: 'var(--status-info)' },
  success: { bg: 'var(--status-success-bg)', dot: 'var(--brand-green-light)' },
  warn:    { bg: 'var(--status-warn-bg)',    dot: 'var(--status-warn)' },
  danger:  { bg: 'var(--status-danger-bg)',  dot: 'var(--brand-red-light)' },
};

function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60)   return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function NotificationBell({ onNavigate }) {
  const { notifications, unreadCount, markRead, markAllRead, dismiss } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  /* Close on outside click */
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = (notif) => {
    markRead(notif.id);
    if (notif.action?.sectionId && onNavigate) {
      onNavigate(notif.action.sectionId);
      setOpen(false);
    }
  };

  return (
    <div className="nb-wrap" ref={ref}>
      <button
        className={`btn-icon nb-btn ${open ? 'nb-open' : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Notifications"
      >
        {/* Bell icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="nb-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="nb-dropdown">
          <div className="nb-header">
            <span className="nb-title">Notifications</span>
            {unreadCount > 0 && (
              <button className="nb-mark-all" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="nb-list">
            {notifications.length === 0 ? (
              <div className="nb-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const colors = TYPE_COLORS[n.type] || TYPE_COLORS.info;
                return (
                  <div
                    key={n.id}
                    className={`nb-item ${n.read ? 'nb-read' : 'nb-unread'}`}
                    onClick={() => handleClick(n)}
                    style={{ cursor: n.action ? 'pointer' : 'default' }}
                  >
                    <div className="nb-dot" style={{ background: colors.dot }} />
                    <div className="nb-item-body">
                      <div className="nb-item-title">{n.title}</div>
                      {n.body && <div className="nb-item-body-text">{n.body}</div>}
                      <div className="nb-item-time">{timeAgo(n.ts)}</div>
                      {n.action && (
                        <span className="nb-item-action">{n.action.label} →</span>
                      )}
                    </div>
                    <button
                      className="nb-dismiss"
                      onClick={e => { e.stopPropagation(); dismiss(n.id); }}
                      title="Dismiss"
                    >×</button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
