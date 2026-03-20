import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { computeNextRenewal, isValidStatus, isValidFrequency } from '@/lib/subscriptions';

type Params = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/subscriptions/:id — Get a single subscription
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ip = getClientIp(req);
  if (!rateLimit(`sub-get:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable.' }, { status: 500 });
  }

  // Require authenticated session
  const authHeader = req.headers.get('authorization');
  const sbCookieMatch = req.headers.get('cookie')?.match(/sb-[^=]+-auth-token=([^;]+)/);
  const token = sbCookieMatch?.[1] || authHeader?.replace('Bearer ', '') || null;
  if (!token) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user?.email) {
    return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Subscription not found.' }, { status: 404 });
  }

  // Verify the authenticated user owns this subscription
  if (user.email.toLowerCase() !== data.email) {
    return NextResponse.json({ error: 'You can only view your own subscriptions.' }, { status: 403 });
  }

  return NextResponse.json({ subscription: data });
}

// ---------------------------------------------------------------------------
// PATCH /api/subscriptions/:id — Update subscription status or frequency
// ---------------------------------------------------------------------------

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ip = getClientIp(req);
  if (!rateLimit(`sub-update:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable.' }, { status: 500 });
  }

  // Require authenticated session
  const authHeader = req.headers.get('authorization');
  const sbCookieMatch = req.headers.get('cookie')?.match(/sb-[^=]+-auth-token=([^;]+)/);
  const token = sbCookieMatch?.[1] || authHeader?.replace('Bearer ', '') || null;
  if (!token) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user?.email) {
    return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  // Verify the subscription exists and get current email for ownership check
  const { data: existing, error: fetchError } = await supabase
    .from('subscriptions')
    .select('id, email, status, frequency')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Subscription not found.' }, { status: 404 });
  }

  // Verify the authenticated user owns this subscription
  if (user.email.toLowerCase() !== existing.email) {
    return NextResponse.json({ error: 'You can only modify your own subscriptions.' }, { status: 403 });
  }

  // Build update payload (immutable — we construct a new object)
  const updates: Record<string, unknown> = {};

  if (body.status !== undefined) {
    if (!isValidStatus(body.status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    }
    // Cancelled subscriptions cannot be reactivated via this endpoint
    if (existing.status === 'cancelled') {
      return NextResponse.json({ error: 'Cancelled subscriptions cannot be modified.' }, { status: 400 });
    }
    updates.status = body.status;

    // When resuming from paused, recalculate next renewal
    if (body.status === 'active' && existing.status === 'paused') {
      updates.next_renewal_at = computeNextRenewal(
        existing.frequency as 'monthly' | 'biweekly' | 'quarterly',
      ).toISOString();
    }
  }

  if (body.frequency !== undefined) {
    if (!isValidFrequency(body.frequency)) {
      return NextResponse.json({ error: 'Invalid frequency.' }, { status: 400 });
    }
    updates.frequency = body.frequency;
    // Recalculate next renewal for the new frequency
    updates.next_renewal_at = computeNextRenewal(
      body.frequency as 'monthly' | 'biweekly' | 'quarterly',
    ).toISOString();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
  }

  const { data: updated, error: updateError } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('[Subscriptions] Update error:', updateError.message);
    return NextResponse.json({ error: 'Failed to update subscription.' }, { status: 500 });
  }

  return NextResponse.json({ subscription: updated });
}
