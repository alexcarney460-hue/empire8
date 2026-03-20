import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { getAuthenticatedDispensary } from '@/lib/dispensary-auth';
import { getAuthenticatedBrand } from '@/lib/brand-auth';

export const dynamic = 'force-dynamic';

/* ---------------------------------------------------------------------------
 * Resolve the current user's account ID.
 * Notifications are keyed by dispensary_accounts.id or brand_accounts.id,
 * matching the IDs used across marketplace and order flows.
 * Returns null if unauthenticated.
 * -------------------------------------------------------------------------- */
async function getAuthenticatedAccountId(): Promise<string | null> {
  const dispensary = await getAuthenticatedDispensary();
  if (dispensary) return dispensary.id;

  const brand = await getAuthenticatedBrand();
  if (brand) return brand.brandAccount.id;

  return null;
}

/* ---------------------------------------------------------------------------
 * GET /api/user-notifications
 *
 * Query params:
 *   count_only=true  -> returns just { ok, unread_count }
 *   limit=N          -> max notifications (default 20, max 50)
 *   filter=unread    -> only unread
 *   filter=<type>    -> filter by notification type
 * -------------------------------------------------------------------------- */
export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedAccountId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const countOnly = searchParams.get('count_only') === 'true';

  // Always fetch unread count
  const { count: unreadCount, error: countError } = await supabase
    .from('user_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (countError) {
    console.error('[user-notifications] Count error:', countError.message);
    return NextResponse.json({ ok: false, error: 'Failed to fetch notifications' }, { status: 500 });
  }

  if (countOnly) {
    return NextResponse.json({ ok: true, unread_count: unreadCount ?? 0 });
  }

  // Fetch recent notifications
  const limitParam = parseInt(searchParams.get('limit') ?? '20', 10);
  const limit = Math.max(1, Math.min(50, isNaN(limitParam) ? 20 : limitParam));
  const filter = searchParams.get('filter') ?? 'all';

  let query = supabase
    .from('user_notifications')
    .select('id, title, body, url, type, is_read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filter === 'unread') {
    query = query.eq('is_read', false);
  } else if (filter !== 'all') {
    query = query.eq('type', filter);
  }

  const { data: notifications, error: fetchError } = await query;

  if (fetchError) {
    console.error('[user-notifications] Fetch error:', fetchError.message);
    return NextResponse.json({ ok: false, error: 'Failed to fetch notifications' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    data: {
      notifications: notifications ?? [],
      unread_count: unreadCount ?? 0,
    },
  });
}

/* ---------------------------------------------------------------------------
 * PATCH /api/user-notifications
 *
 * Body: { ids: string[] }  -> mark specific notifications as read
 *    or { all: true }      -> mark all as read
 *    or { notification_id: string } -> mark single as read (legacy compat)
 * -------------------------------------------------------------------------- */
export async function PATCH(req: NextRequest) {
  const userId = await getAuthenticatedAccountId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  // Mark all unread as read
  if (body.all === true || body.mark_all === true) {
    const { error } = await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('[user-notifications] Mark-all error:', error.message);
      return NextResponse.json({ ok: false, error: 'Failed to update.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  // Mark specific IDs as read (batch)
  if (Array.isArray(body.ids) && body.ids.length > 0) {
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validIds = (body.ids as unknown[]).filter(
      (id): id is string => typeof id === 'string' && UUID_RE.test(id),
    );

    if (validIds.length === 0) {
      return NextResponse.json({ ok: false, error: 'No valid notification IDs provided' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .in('id', validIds);

    if (error) {
      console.error('[user-notifications] Mark-ids error:', error.message);
      return NextResponse.json({ ok: false, error: 'Failed to update.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  // Mark single notification as read (legacy compat)
  if (typeof body.notification_id === 'string' && body.notification_id.length > 0) {
    const { error } = await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('id', body.notification_id)
      .eq('user_id', userId);

    if (error) {
      console.error('[user-notifications] Mark-single error:', error.message);
      return NextResponse.json({ ok: false, error: 'Failed to update.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    { ok: false, error: 'Provide { ids: [...] }, { all: true }, or { notification_id: "..." }' },
    { status: 400 },
  );
}
