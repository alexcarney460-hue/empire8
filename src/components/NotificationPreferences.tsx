'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff } from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────── */

interface Preferences {
  readonly new_orders: boolean;
  readonly marketplace_bids: boolean;
  readonly lot_updates: boolean;
  readonly system_updates: boolean;
}

/* ── Constants ─────────────────────────────────────────────────────── */

const STORAGE_KEY = 'e8_notification_prefs';

const DEFAULT_PREFS: Preferences = {
  new_orders: true,
  marketplace_bids: true,
  lot_updates: true,
  system_updates: true,
};

const COLORS = {
  card: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(200,162,60,0.12)',
  gold: '#C8A23C',
  textPrimary: '#fff',
  textSecondary: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.4)',
  toggleTrackOn: '#C8A23C',
  toggleTrackOff: 'rgba(255,255,255,0.12)',
  toggleThumb: '#fff',
} as const;

const PREF_LABELS: readonly { readonly key: keyof Preferences; readonly label: string; readonly description: string }[] = [
  { key: 'new_orders', label: 'New Orders', description: 'Get notified when a new order is placed or updated' },
  { key: 'marketplace_bids', label: 'Marketplace Bids', description: 'Alerts for new bids on your lots or bid updates' },
  { key: 'lot_updates', label: 'Lot Updates', description: 'Notifications when lots you follow are modified' },
  { key: 'system_updates', label: 'System Updates', description: 'Platform announcements and maintenance notices' },
] as const;

/* ── Toggle Switch ─────────────────────────────────────────────────── */

function ToggleSwitch({
  checked,
  onChange,
}: {
  readonly checked: boolean;
  readonly onChange: (val: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: 'none',
        backgroundColor: checked ? COLORS.toggleTrackOn : COLORS.toggleTrackOff,
        cursor: 'pointer',
        position: 'relative',
        transition: 'background-color 200ms ease',
        flexShrink: 0,
        padding: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          backgroundColor: COLORS.toggleThumb,
          transition: 'left 200ms ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      />
    </button>
  );
}

/* ── Component ─────────────────────────────────────────────────────── */

export default function NotificationPreferences() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Preferences>;
        setPrefs({ ...DEFAULT_PREFS, ...parsed });
      }
    } catch {
      // Use defaults
    }

    // Check push notification support
    if (!('Notification' in window)) {
      setPushStatus('unsupported');
    } else {
      setPushStatus(Notification.permission as 'default' | 'granted' | 'denied');
    }
  }, []);

  const handleToggle = useCallback((key: keyof Preferences, value: boolean) => {
    setPrefs((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Storage full or unavailable
      }
      return updated;
    });
  }, []);

  const handleEnablePush = useCallback(async () => {
    if (!('Notification' in window)) return;

    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission as 'default' | 'granted' | 'denied');
    } catch {
      // Permission request failed
    }
  }, []);

  return (
    <div
      style={{
        backgroundColor: COLORS.card,
        border: `1px solid ${COLORS.cardBorder}`,
        borderRadius: 16,
        padding: '28px 24px',
        marginTop: 20,
      }}
    >
      <p
        style={{
          fontSize: '0.68rem',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: COLORS.gold,
          margin: '0 0 8px 0',
          fontFamily: "'Barlow', Arial, sans-serif",
        }}
      >
        Notification Preferences
      </p>
      <p
        style={{
          fontSize: '0.82rem',
          color: COLORS.textSecondary,
          margin: '0 0 24px 0',
          lineHeight: 1.5,
        }}
      >
        Control which notifications you receive. Preferences are saved locally.
      </p>

      {/* Toggles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {PREF_LABELS.map((pref, index) => {
          const isLast = index === PREF_LABELS.length - 1;
          return (
            <div
              key={pref.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                padding: '16px 0',
                borderBottom: isLast ? 'none' : `1px solid ${COLORS.cardBorder}`,
              }}
            >
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 500,
                    color: COLORS.textPrimary,
                    margin: '0 0 2px 0',
                  }}
                >
                  {pref.label}
                </p>
                <p
                  style={{
                    fontSize: '0.78rem',
                    color: COLORS.textMuted,
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {pref.description}
                </p>
              </div>
              <ToggleSwitch checked={prefs[pref.key]} onChange={(val) => handleToggle(pref.key, val)} />
            </div>
          );
        })}
      </div>

      {/* Push notifications */}
      <div
        style={{
          marginTop: 20,
          padding: '16px 18px',
          borderRadius: 12,
          backgroundColor: 'rgba(255,255,255,0.03)',
          border: `1px solid ${COLORS.cardBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {pushStatus === 'granted' ? (
            <Bell size={18} style={{ color: COLORS.gold }} />
          ) : (
            <BellOff size={18} style={{ color: COLORS.textMuted }} />
          )}
          <div>
            <p
              style={{
                fontSize: '0.85rem',
                fontWeight: 500,
                color: COLORS.textPrimary,
                margin: '0 0 2px 0',
              }}
            >
              Push Notifications
            </p>
            <p style={{ fontSize: '0.75rem', color: COLORS.textMuted, margin: 0 }}>
              {pushStatus === 'granted'
                ? 'Browser push notifications are enabled'
                : pushStatus === 'denied'
                  ? 'Push notifications are blocked. Update your browser settings to enable.'
                  : pushStatus === 'unsupported'
                    ? 'Push notifications are not supported in this browser'
                    : 'Enable browser push notifications for real-time alerts'}
            </p>
          </div>
        </div>

        {pushStatus === 'default' && (
          <button
            onClick={handleEnablePush}
            style={{
              padding: '9px 20px',
              borderRadius: 9999,
              border: 'none',
              backgroundColor: COLORS.gold,
              color: '#1A0633',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: "'Barlow', Arial, sans-serif",
              transition: 'opacity 150ms ease',
              whiteSpace: 'nowrap',
            }}
          >
            Enable Push Notifications
          </button>
        )}

        {pushStatus === 'granted' && (
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#4ade80',
              whiteSpace: 'nowrap',
            }}
          >
            Enabled
          </span>
        )}
      </div>
    </div>
  );
}
