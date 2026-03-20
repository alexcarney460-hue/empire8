'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';

/* -- Types ----------------------------------------------------------------- */

interface Notification {
  readonly id: string;
  readonly title: string;
  readonly body: string | null;
  readonly url: string | null;
  readonly type: string;
  readonly is_read: boolean;
  readonly created_at: string;
}

/* -- Constants ------------------------------------------------------------- */

const POLL_INTERVAL_MS = 30_000;

const COLORS = {
  gold: '#C8A23C',
  goldSubtle: 'rgba(200,162,60,0.10)',
  bg: '#1A0E30',
  dropdownBg: '#1E1238',
  border: 'rgba(200,162,60,0.15)',
  textPrimary: '#fff',
  textSecondary: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.4)',
  unreadDot: '#C8A23C',
  badgeBg: '#C8A23C',
  badgeText: '#0F0520',
} as const;

/* -- Helpers --------------------------------------------------------------- */

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/* -- Component ------------------------------------------------------------- */

export default function NotificationBell() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<readonly Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  // Poll for unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/user-notifications?count_only=true');
      if (res.ok) {
        const json = await res.json();
        if (json.ok) {
          setUnreadCount(json.unread_count ?? 0);
        }
      }
    } catch {
      // Silent -- polling failure is non-critical
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch full notification list when dropdown opens
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/user-notifications?limit=20');
      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.data) {
          setNotifications(json.data.notifications ?? []);
          setUnreadCount(json.data.unread_count ?? 0);
        }
      }
    } catch {
      // Silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Toggle dropdown
  const handleToggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        fetchNotifications();
      }
      return next;
    });
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Click on a notification
  const handleNotificationClick = useCallback(
    async (notif: Notification) => {
      // Mark as read
      if (!notif.is_read) {
        try {
          await fetch('/api/user-notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: [notif.id] }),
          });
          setNotifications((prev) =>
            prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)),
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch {
          // Silent
        }
      }

      setIsOpen(false);

      // Navigate if URL provided
      if (notif.url) {
        router.push(notif.url);
      }
    },
    [router],
  );

  // Mark all as read
  const handleMarkAllRead = useCallback(async () => {
    try {
      await fetch('/api/user-notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // Silent
    }
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        ref={bellRef}
        onClick={handleToggle}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          color: COLORS.textSecondary,
          cursor: 'pointer',
          padding: 6,
          borderRadius: 8,
          transition: 'color 150ms ease, background-color 150ms ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = COLORS.gold;
          e.currentTarget.style.backgroundColor = COLORS.goldSubtle;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = COLORS.textSecondary;
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Bell size={20} strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: COLORS.badgeBg,
              color: COLORS.badgeText,
              fontSize: '0.65rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              lineHeight: 1,
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 360,
            maxHeight: 440,
            backgroundColor: COLORS.dropdownBg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            overflow: 'hidden',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: `1px solid ${COLORS.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: COLORS.textPrimary,
              }}
            >
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: COLORS.gold,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: 4,
                  transition: 'opacity 150ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
            }}
          >
            {isLoading && notifications.length === 0 && (
              <div
                style={{
                  padding: 32,
                  textAlign: 'center',
                  color: COLORS.textMuted,
                  fontSize: '0.8rem',
                }}
              >
                Loading...
              </div>
            )}

            {!isLoading && notifications.length === 0 && (
              <div
                style={{
                  padding: 32,
                  textAlign: 'center',
                  color: COLORS.textMuted,
                  fontSize: '0.8rem',
                }}
              >
                No notifications yet
              </div>
            )}

            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '12px 16px',
                  width: '100%',
                  textAlign: 'left',
                  background: notif.is_read ? 'transparent' : 'rgba(200,162,60,0.04)',
                  border: 'none',
                  borderBottom: `1px solid ${COLORS.border}`,
                  cursor: 'pointer',
                  transition: 'background-color 150ms ease',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(200,162,60,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = notif.is_read
                    ? 'transparent'
                    : 'rgba(200,162,60,0.04)';
                }}
              >
                {/* Unread indicator */}
                <div
                  style={{
                    width: 8,
                    minWidth: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: notif.is_read ? 'transparent' : COLORS.unreadDot,
                    marginTop: 5,
                  }}
                />

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.82rem',
                      fontWeight: notif.is_read ? 400 : 600,
                      color: COLORS.textPrimary,
                      lineHeight: 1.35,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {notif.title}
                  </p>
                  {notif.body && (
                    <p
                      style={{
                        margin: '3px 0 0',
                        fontSize: '0.75rem',
                        color: COLORS.textSecondary,
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {notif.body}
                    </p>
                  )}
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: '0.68rem',
                      color: COLORS.textMuted,
                    }}
                  >
                    {timeAgo(notif.created_at)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
