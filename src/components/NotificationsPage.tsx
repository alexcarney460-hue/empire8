'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  ShoppingCart,
  Store,
  Settings as SettingsIcon,
  Package,
  CheckCheck,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────── */

interface Notification {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  readonly body: string | null;
  readonly url: string | null;
  readonly is_read: boolean;
  readonly created_at: string;
}

interface NotificationsData {
  readonly notifications: readonly Notification[];
  readonly unread_count: number;
}

type FilterTab = 'all' | 'unread' | 'order' | 'marketplace' | 'system';

/* ── Constants ─────────────────────────────────────────────────────── */

const COLORS = {
  card: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(200,162,60,0.12)',
  gold: '#C8A23C',
  goldSubtle: 'rgba(200,162,60,0.10)',
  textPrimary: '#fff',
  textSecondary: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.4)',
  unreadDot: '#C8A23C',
  hoverBg: 'rgba(255,255,255,0.03)',
} as const;

const FILTER_TABS: readonly { readonly key: FilterTab; readonly label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'order', label: 'Orders' },
  { key: 'marketplace', label: 'Marketplace' },
  { key: 'system', label: 'System' },
] as const;

const TYPE_ICONS: Record<string, typeof Bell> = {
  order: ShoppingCart,
  marketplace: Store,
  system: SettingsIcon,
  lot: Package,
};

/* ── Helpers ───────────────────────────────────────────────────────── */

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 5) return `${diffWeek}w ago`;

  return new Date(dateStr).toLocaleDateString();
}

function getIcon(type: string) {
  return TYPE_ICONS[type] ?? Bell;
}

/* ── Component ─────────────────────────────────────────────────────── */

export default function NotificationsPage() {
  const router = useRouter();
  const [data, setData] = useState<NotificationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async (filter: FilterTab) => {
    try {
      const param = filter === 'all' ? '' : `?filter=${filter}`;
      const res = await fetch(`/api/user-notifications${param}`);
      if (!res.ok) {
        if (res.status === 401) {
          setError('Please sign in to view notifications.');
          return;
        }
        setError('Failed to load notifications.');
        return;
      }
      const json = await res.json();
      if (json.ok) {
        setData(json.data);
      } else {
        setError(json.error || 'Failed to load notifications.');
      }
    } catch {
      setError('Unable to reach the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchNotifications(activeFilter);
  }, [activeFilter, fetchNotifications]);

  const handleMarkAllRead = useCallback(async () => {
    setMarkingAll(true);
    try {
      const res = await fetch('/api/user-notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all: true }),
      });
      if (res.ok) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                unread_count: 0,
                notifications: prev.notifications.map((n) => ({ ...n, is_read: true })),
              }
            : prev,
        );
      }
    } catch {
      // Silent fail
    } finally {
      setMarkingAll(false);
    }
  }, []);

  const handleClickNotification = useCallback(
    async (notification: Notification) => {
      // Mark as read
      if (!notification.is_read) {
        fetch('/api/user-notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notification_id: notification.id }),
        }).catch(() => {});

        setData((prev) =>
          prev
            ? {
                ...prev,
                unread_count: Math.max(0, prev.unread_count - 1),
                notifications: prev.notifications.map((n) =>
                  n.id === notification.id ? { ...n, is_read: true } : n,
                ),
              }
            : prev,
        );
      }

      // Navigate if URL exists
      if (notification.url) {
        router.push(notification.url);
      }
    },
    [router],
  );

  /* ── Render ────────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: `3px solid ${COLORS.cardBorder}`,
            borderTopColor: COLORS.gold,
            animation: 'e8-spin 0.7s linear infinite',
          }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          backgroundColor: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 12,
          padding: '20px 24px',
          color: '#f87171',
          fontSize: '0.88rem',
        }}
      >
        {error}
      </div>
    );
  }

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unread_count ?? 0;

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'clamp(1.3rem, 3vw, 1.75rem)',
              fontWeight: 700,
              color: COLORS.textPrimary,
              margin: '0 0 4px 0',
            }}
          >
            Notifications
          </h1>
          <p style={{ fontSize: '0.85rem', color: COLORS.textSecondary, margin: 0 }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 9999,
              border: `1px solid ${COLORS.cardBorder}`,
              backgroundColor: 'transparent',
              color: COLORS.gold,
              cursor: markingAll ? 'not-allowed' : 'pointer',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontFamily: "'Barlow', Arial, sans-serif",
              transition: 'background-color 150ms ease',
              opacity: markingAll ? 0.6 : 1,
            }}
          >
            <CheckCheck size={15} />
            {markingAll ? 'Marking...' : 'Mark All Read'}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 20,
          overflowX: 'auto',
          paddingBottom: 2,
        }}
      >
        {FILTER_TABS.map((tab) => {
          const active = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              style={{
                padding: '8px 16px',
                borderRadius: 9999,
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: active ? 600 : 400,
                color: active ? '#1A0633' : COLORS.textSecondary,
                backgroundColor: active ? COLORS.gold : 'rgba(255,255,255,0.06)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                whiteSpace: 'nowrap',
                fontFamily: 'inherit',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Notification list */}
      <div
        style={{
          backgroundColor: COLORS.card,
          border: `1px solid ${COLORS.cardBorder}`,
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {notifications.length === 0 ? (
          <div
            style={{
              padding: '60px 24px',
              textAlign: 'center',
            }}
          >
            <Bell
              size={36}
              strokeWidth={1.4}
              style={{ color: COLORS.textMuted, marginBottom: 12 }}
            />
            <p style={{ color: COLORS.textMuted, fontSize: '0.88rem', margin: 0 }}>
              No notifications yet
            </p>
          </div>
        ) : (
          notifications.map((notification, index) => {
            const Icon = getIcon(notification.type);
            const isLast = index === notifications.length - 1;
            return (
              <button
                key={notification.id}
                onClick={() => handleClickNotification(notification)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '16px 20px',
                  width: '100%',
                  textAlign: 'left',
                  background: notification.is_read ? 'transparent' : 'rgba(200,162,60,0.03)',
                  border: 'none',
                  borderBottom: isLast ? 'none' : `1px solid ${COLORS.cardBorder}`,
                  cursor: notification.url ? 'pointer' : 'default',
                  transition: 'background-color 150ms ease',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = COLORS.hoverBg;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = notification.is_read
                    ? 'transparent'
                    : 'rgba(200,162,60,0.03)';
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: 'rgba(200,162,60,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <Icon size={17} strokeWidth={1.8} style={{ color: COLORS.gold }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span
                      style={{
                        fontSize: '0.88rem',
                        fontWeight: notification.is_read ? 400 : 600,
                        color: COLORS.textPrimary,
                        lineHeight: 1.3,
                      }}
                    >
                      {notification.title}
                    </span>
                    {!notification.is_read && (
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          backgroundColor: COLORS.unreadDot,
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                  {notification.body && (
                    <p
                      style={{
                        fontSize: '0.82rem',
                        color: COLORS.textSecondary,
                        margin: '0 0 4px 0',
                        lineHeight: 1.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {notification.body}
                    </p>
                  )}
                  <span style={{ fontSize: '0.72rem', color: COLORS.textMuted }}>
                    {getTimeAgo(notification.created_at)}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
