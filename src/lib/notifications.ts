import { getSupabaseServer } from '@/lib/supabase-server';

/* -- Types ----------------------------------------------------------------- */

export interface CreateNotificationInput {
  readonly user_id: string;
  readonly title: string;
  readonly body?: string;
  readonly url?: string;
  readonly type?: string;
}

/* -- Helpers --------------------------------------------------------------- */

/**
 * Insert one or more notifications into the user_notifications table.
 * Silently logs errors rather than throwing -- notifications are non-critical
 * and should never break the main flow.
 */
export async function createNotifications(
  notifications: readonly CreateNotificationInput[],
): Promise<void> {
  if (notifications.length === 0) return;

  const supabase = getSupabaseServer();
  if (!supabase) {
    console.error('[notifications] Supabase client unavailable');
    return;
  }

  const rows = notifications.map((n) => ({
    user_id: n.user_id,
    title: n.title,
    body: n.body ?? null,
    url: n.url ?? null,
    type: n.type ?? 'general',
    is_read: false,
  }));

  const { error } = await supabase.from('user_notifications').insert(rows);

  if (error) {
    console.error('[notifications] Failed to insert notifications:', error.message);
  }
}

/**
 * Format cents as a dollar string, e.g. 12345 -> "$123.45"
 */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
