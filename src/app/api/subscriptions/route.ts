import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { getSupabase } from '@/lib/supabase';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import {
  computeNextRenewal,
  isValidFrequency,
  type SubscriptionFrequency,
  type SubscriptionItem,
} from '@/lib/subscriptions';

// ---------------------------------------------------------------------------
// POST /api/subscriptions — Create a new subscription after autoship checkout
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(`sub-create:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable.' }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const items = body.items as SubscriptionItem[] | undefined;
  const frequency = (body.frequency as string) ?? 'monthly';
  const squareOrderId = typeof body.squareOrderId === 'string' ? body.squareOrderId : null;

  // Validate email
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
  }

  // Validate items
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'At least one item is required.' }, { status: 400 });
  }
  for (const item of items) {
    if (!item.slug || typeof item.slug !== 'string') {
      return NextResponse.json({ error: 'Each item must have a slug.' }, { status: 400 });
    }
    if (typeof item.quantity !== 'number' || item.quantity < 1) {
      return NextResponse.json({ error: 'Each item must have a positive quantity.' }, { status: 400 });
    }
  }

  // Validate frequency
  if (!isValidFrequency(frequency)) {
    return NextResponse.json({ error: 'Invalid frequency.' }, { status: 400 });
  }

  // Find contact by email
  const { data: contact } = await supabase
    .from('contacts')
    .select('id')
    .eq('email', email)
    .limit(1)
    .single();

  const nextRenewal = computeNextRenewal(frequency as SubscriptionFrequency);

  const { data: subscription, error: insertError } = await supabase
    .from('subscriptions')
    .insert({
      email,
      contact_id: contact?.id ?? null,
      items,
      frequency,
      discount_pct: 10,
      next_renewal_at: nextRenewal.toISOString(),
      square_order_id: squareOrderId,
    })
    .select()
    .single();

  if (insertError) {
    console.error('[Subscriptions] Insert error:', insertError.message);
    return NextResponse.json({ error: 'Failed to create subscription.' }, { status: 500 });
  }

  return NextResponse.json({ subscription }, { status: 201 });
}

// ---------------------------------------------------------------------------
// GET /api/subscriptions?email=... — List subscriptions for a customer
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(`sub-list:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable.' }, { status: 500 });
  }

  // Require authenticated session — user can only see their own subscriptions
  const authHeader = req.headers.get('authorization');
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: 'Email parameter is required.' }, { status: 400 });
  }

  // Verify the caller owns this email via Supabase session
  // Extract the Supabase access token from cookie or authorization header
  const sbCookieMatch = req.headers.get('cookie')?.match(/sb-[^=]+-auth-token=([^;]+)/);
  const token = sbCookieMatch?.[1] || authHeader?.replace('Bearer ', '') || null;
  if (!token) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  // Verify the token and check email matches the requested email
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user?.email) {
    return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 });
  }
  if (user.email.toLowerCase() !== email) {
    return NextResponse.json({ error: 'You can only view your own subscriptions.' }, { status: 403 });
  }

  const { data: subscriptions, error: queryError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: false });

  if (queryError) {
    console.error('[Subscriptions] Query error:', queryError.message);
    return NextResponse.json({ error: 'Failed to fetch subscriptions.' }, { status: 500 });
  }

  return NextResponse.json({ subscriptions: subscriptions ?? [] });
}
