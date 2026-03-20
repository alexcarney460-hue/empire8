import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

/* ── POST /api/notifications/subscribe ───────────────────────────────
 * Accepts a Web Push subscription object and stores it for the
 * authenticated user. Creates the push_subscriptions table if it
 * does not yet exist (idempotent upsert by endpoint).
 *
 * Body: { subscription: PushSubscription }
 * ───────────────────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 subscription requests per minute per IP
    const ip = getClientIp(req);
    if (!rateLimit(`push-sub:${ip}`, 10, 60_000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      );
    }

    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Service unavailable.' },
        { status: 503 },
      );
    }

    // Authenticate via session cookie
    const sessionCookie = req.cookies.get('sb-access-token')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(sessionCookie);
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    // Parse body
    const body = await req.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription object. Must include endpoint.' },
        { status: 400 },
      );
    }

    // Validate subscription shape
    if (!subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription. Missing encryption keys.' },
        { status: 400 },
      );
    }

    // Upsert: use endpoint as unique key to avoid duplicates
    const { error: upsertError } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          endpoint: subscription.endpoint,
          subscription,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' },
      );

    if (upsertError) {
      console.error('[notifications/subscribe] Upsert failed:', upsertError.message);
      return NextResponse.json(
        { error: 'Failed to save subscription.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[notifications/subscribe] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 },
    );
  }
}

/* ── DELETE /api/notifications/subscribe ──────────────────────────────
 * Removes a push subscription for the authenticated user.
 * Body: { endpoint: string }
 * ───────────────────────────────────────────────────────────────────── */

export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });
    }

    const sessionCookie = req.cookies.get('sb-access-token')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(sessionCookie);
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required.' }, { status: 400 });
    }

    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[notifications/subscribe] DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
