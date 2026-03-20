import webpush from 'web-push';
import { getSupabaseServer } from '@/lib/supabase-server';

/* ── VAPID configuration ─────────────────────────────────────────────
 * Generate keys once with: npx web-push generate-vapid-keys
 * Then set in .env.local:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
 *   VAPID_PRIVATE_KEY=...
 *   VAPID_SUBJECT=mailto:info@empire8salesdirect.com
 * ───────────────────────────────────────────────────────────────────── */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? 'mailto:info@empire8salesdirect.com';

function ensureVapidConfigured(): boolean {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error('[push-notifications] VAPID keys not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.');
    return false;
  }
  return true;
}

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

/* ── Types ────────────────────────────────────────────────────────── */

interface PushPayload {
  readonly title: string;
  readonly body: string;
  readonly url?: string;
  readonly tag?: string;
  readonly icon?: string;
}

interface SendResult {
  readonly ok: boolean;
  readonly sent: number;
  readonly failed: number;
  readonly errors: readonly string[];
}

/* ── Send push notification to a specific user ───────────────────── */

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  url?: string,
): Promise<SendResult> {
  if (!ensureVapidConfigured()) {
    return { ok: false, sent: 0, failed: 0, errors: ['VAPID keys not configured'] };
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return { ok: false, sent: 0, failed: 0, errors: ['Supabase not available'] };
  }

  // Fetch all subscriptions for this user
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id, subscription')
    .eq('user_id', userId);

  if (error) {
    console.error('[push-notifications] Failed to fetch subscriptions:', error.message);
    return { ok: false, sent: 0, failed: 0, errors: [error.message] };
  }

  if (!subscriptions || subscriptions.length === 0) {
    return { ok: true, sent: 0, failed: 0, errors: [] };
  }

  const payload: PushPayload = {
    title,
    body,
    url: url ?? '/dashboard',
    tag: `empire8-${Date.now()}`,
    icon: '/icon-192.png',
  };

  const payloadString = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];
  const expiredIds: string[] = [];

  // Send to each subscription
  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, payloadString);
        sent += 1;
      } catch (err: unknown) {
        const pushError = err as { statusCode?: number; message?: string };
        // 404 or 410 means the subscription is expired/invalid -- remove it
        if (pushError.statusCode === 404 || pushError.statusCode === 410) {
          expiredIds.push(sub.id);
        }
        failed += 1;
        errors.push(pushError.message ?? 'Unknown push error');
      }
    })
  );

  // Clean up expired subscriptions
  if (expiredIds.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('id', expiredIds);
  }

  return { ok: sent > 0 || results.length === 0, sent, failed, errors };
}

/* ── Send push notification to multiple users ────────────────────── */

export async function sendPushNotificationBulk(
  userIds: readonly string[],
  title: string,
  body: string,
  url?: string,
): Promise<SendResult> {
  const results = await Promise.allSettled(
    userIds.map((uid) => sendPushNotification(uid, title, body, url))
  );

  let totalSent = 0;
  let totalFailed = 0;
  const allErrors: string[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      totalSent += result.value.sent;
      totalFailed += result.value.failed;
      allErrors.push(...result.value.errors);
    } else {
      totalFailed += 1;
      allErrors.push(result.reason?.message ?? 'Unknown error');
    }
  }

  return { ok: totalSent > 0, sent: totalSent, failed: totalFailed, errors: allErrors };
}
