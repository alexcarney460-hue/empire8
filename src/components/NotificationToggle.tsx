'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';

/* ── Constants ────────────────────────────────────────────────────── */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

const COLORS = {
  gold: '#C8A23C',
  goldSubtle: 'rgba(200,162,60,0.10)',
  textSecondary: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.4)',
  error: '#ef4444',
} as const;

type NotifState = 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed';

/* ── Helpers ──────────────────────────────────────────────────────── */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/* ── Component ────────────────────────────────────────────────────── */

export default function NotificationToggle() {
  const [state, setState] = useState<NotifState>('loading');
  const [busy, setBusy] = useState(false);

  // Check current state on mount
  useEffect(() => {
    async function checkState() {
      // No Push API support
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setState('unsupported');
        return;
      }

      // No VAPID key configured
      if (!VAPID_PUBLIC_KEY) {
        setState('unsupported');
        return;
      }

      // Permission denied
      if (Notification.permission === 'denied') {
        setState('denied');
        return;
      }

      // Check for existing subscription
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setState(subscription ? 'subscribed' : 'unsubscribed');
      } catch {
        setState('unsubscribed');
      }
    }

    checkState();
  }, []);

  const handleToggle = useCallback(async () => {
    if (busy) return;
    setBusy(true);

    try {
      const registration = await navigator.serviceWorker.ready;

      if (state === 'subscribed') {
        // Unsubscribe
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          // Remove from server
          await fetch('/api/notifications/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
          await subscription.unsubscribe();
        }
        setState('unsubscribed');
      } else {
        // Subscribe
        const permission = await Notification.requestPermission();
        if (permission === 'denied') {
          setState('denied');
          return;
        }
        if (permission !== 'granted') {
          return;
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
        });

        // Send subscription to server
        const res = await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        });

        if (res.ok) {
          setState('subscribed');
        } else {
          console.error('[NotificationToggle] Subscribe API failed:', await res.text());
        }
      }
    } catch (err) {
      console.error('[NotificationToggle] Error:', err);
    } finally {
      setBusy(false);
    }
  }, [state, busy]);

  // Don't render if push is unsupported
  if (state === 'loading' || state === 'unsupported') return null;

  const isActive = state === 'subscribed';
  const isDenied = state === 'denied';

  const Icon = isDenied ? BellOff : isActive ? BellRing : Bell;
  const label = isDenied
    ? 'Notifications blocked'
    : isActive
      ? 'Notifications on'
      : 'Enable notifications';

  return (
    <button
      onClick={isDenied ? undefined : handleToggle}
      disabled={busy || isDenied}
      aria-label={label}
      title={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 14px',
        borderRadius: 10,
        width: '100%',
        textAlign: 'left',
        background: isActive ? COLORS.goldSubtle : 'none',
        border: 'none',
        fontSize: '0.85rem',
        fontWeight: isActive ? 600 : 400,
        color: isDenied
          ? COLORS.error
          : isActive
            ? COLORS.gold
            : COLORS.textSecondary,
        cursor: isDenied ? 'not-allowed' : busy ? 'wait' : 'pointer',
        transition: 'background-color 150ms ease, color 150ms ease',
        opacity: busy ? 0.6 : 1,
        fontFamily: 'inherit',
      }}
    >
      <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
      <span>{label}</span>
    </button>
  );
}
