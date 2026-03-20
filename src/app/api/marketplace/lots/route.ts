import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedDispensary } from '@/lib/dispensary-auth';
import { getSupabaseServer } from '@/lib/supabase-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { secondsRemaining } from '@/lib/marketplace/auction';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const ALLOWED_CATEGORIES = [
  'flower',
  'concentrate',
  'edible',
  'vape',
  'pre-roll',
  'topical',
  'tincture',
  'other',
] as const;

const ALLOWED_SORT = ['ending_soon', 'newest', 'price_low', 'most_bids'] as const;

const ALLOWED_GROW_METHODS = ['indoor', 'outdoor', 'greenhouse', 'mixed-light'] as const;

function isValidCategory(v: unknown): v is (typeof ALLOWED_CATEGORIES)[number] {
  return typeof v === 'string' && (ALLOWED_CATEGORIES as readonly string[]).includes(v);
}

function isValidSort(v: unknown): v is (typeof ALLOWED_SORT)[number] {
  return typeof v === 'string' && (ALLOWED_SORT as readonly string[]).includes(v);
}

// ---------------------------------------------------------------------------
// GET /api/marketplace/lots -- Public listing of active lots
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  // Rate limit public endpoint
  const ip = getClientIp(req);
  if (!rateLimit(`marketplace-lots:${ip}`, 60, 60_000)) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests. Please try again later.' },
      { status: 429 },
    );
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Database unavailable' },
      { status: 503 },
    );
  }

  const url = new URL(req.url);

  // Parse query params
  const category = url.searchParams.get('category');
  const sort = url.searchParams.get('sort') ?? 'ending_soon';
  const search = url.searchParams.get('search');
  const pageParam = parseInt(url.searchParams.get('page') ?? '1', 10);
  const limitParam = parseInt(url.searchParams.get('limit') ?? '20', 10);
  const page = Math.max(1, isNaN(pageParam) ? 1 : pageParam);
  const limit = Math.min(100, Math.max(1, isNaN(limitParam) ? 20 : limitParam));
  const offset = (page - 1) * limit;

  // Validate sort
  if (!isValidSort(sort)) {
    return NextResponse.json(
      { ok: false, error: `Invalid sort. Allowed: ${ALLOWED_SORT.join(', ')}` },
      { status: 400 },
    );
  }

  // Validate category if provided
  if (category && !isValidCategory(category)) {
    return NextResponse.json(
      { ok: false, error: `Invalid category. Allowed: ${ALLOWED_CATEGORIES.join(', ')}` },
      { status: 400 },
    );
  }

  // Build query -- only active lots whose end time is in the future
  const now = new Date().toISOString();
  let query = supabase
    .from('weedbay_lots')
    .select(
      'id, title, category, quantity, unit, starting_price_cents, current_bid_cents, bid_count, buy_now_price_cents, ends_at, strain_name, thc_percentage, grow_method, images, created_at',
      { count: 'exact' },
    )
    .eq('status', 'active')
    .gt('ends_at', now);

  // Filters
  if (category) {
    query = query.eq('category', category);
  }

  if (search) {
    // Sanitize search input -- only allow alphanumeric, spaces, hyphens, underscores, and hash
    const sanitized = search.replace(/[^a-zA-Z0-9\s\-_#]/g, '');
    if (sanitized.length > 0) {
      query = query.or(`title.ilike.%${sanitized}%,strain_name.ilike.%${sanitized}%`);
    }
  }

  // Sorting
  switch (sort) {
    case 'ending_soon':
      query = query.order('ends_at', { ascending: true });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'price_low':
      query = query.order('current_bid_cents', { ascending: true, nullsFirst: true });
      break;
    case 'most_bids':
      query = query.order('bid_count', { ascending: false });
      break;
  }

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data: lots, error, count } = await query;

  if (error) {
    console.error('[marketplace/lots] Database error:', error.message);
    return NextResponse.json(
      { ok: false, error: 'An internal error occurred.' },
      { status: 500 },
    );
  }

  // Enrich each lot with time_remaining
  const enriched = (lots ?? []).map((lot) => ({
    ...lot,
    time_remaining_seconds: secondsRemaining(lot.ends_at),
  }));

  return NextResponse.json({
    ok: true,
    data: enriched,
    meta: {
      page,
      limit,
      total: count ?? 0,
    },
  });
}

// ---------------------------------------------------------------------------
// POST /api/marketplace/lots -- Create a new lot (authenticated sellers)
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // Try dispensary auth first, then fall back to admin auth
  let dispensary = await getAuthenticatedDispensary();

  if (!dispensary) {
    // Allow admins to post lots too — look up their dispensary account
    const { requireAdmin } = await import('@/lib/admin/requireAdmin');
    const denied = await requireAdmin(req);
    if (!denied) {
      // Admin authenticated — look up their dispensary account via Supabase session
      const { cookies } = await import('next/headers');
      const { createClient } = await import('@supabase/supabase-js');
      const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (url && key) {
        const sb = createClient(url, key, { auth: { persistSession: false } });
        const cookieStore = await cookies();
        const authCookie = cookieStore.getAll().find((c) => c.name.match(/^sb-.*-auth-token$/));
        if (authCookie) {
          try {
            const raw = decodeURIComponent(authCookie.value);
            let token: string | null = null;
            if (raw.startsWith('[')) { token = JSON.parse(raw)[0]; }
            else { const p = JSON.parse(raw); token = p.access_token ?? p[0] ?? null; }
            if (token) {
              const { data: u } = await sb.auth.getUser(token);
              if (u?.user) {
                const { data: d } = await sb.from('dispensary_accounts').select('*').eq('user_id', u.user.id).maybeSingle();
                if (d) dispensary = d as unknown as typeof dispensary;
              }
            }
          } catch { /* fall through */ }
        }
      }
    }
  }

  if (!dispensary) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized. Please log in to create a lot.' },
      { status: 401 },
    );
  }

  // Rate limit lot creation: 10 per 15 minutes
  if (!rateLimit(`create-lot:${dispensary.id}`, 10, 900_000)) {
    return NextResponse.json(
      { ok: false, error: 'Too many lot creation requests. Please try again later.' },
      { status: 429 },
    );
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Database unavailable' },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  // ---- Validate required fields ------------------------------------------

  const errors: string[] = [];

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) errors.push('title is required');
  if (title.length > 200) errors.push('title must be 200 characters or fewer');

  const description = typeof body.description === 'string' ? body.description.trim() : '';

  const category = body.category;
  if (!isValidCategory(category)) {
    errors.push(`category is required and must be one of: ${ALLOWED_CATEGORIES.join(', ')}`);
  }

  const quantity = typeof body.quantity === 'number' ? body.quantity : NaN;
  if (isNaN(quantity) || quantity <= 0) errors.push('quantity must be a positive number');

  const unit = typeof body.unit === 'string' ? body.unit.trim() : '';
  if (!unit) errors.push('unit is required');

  const startingPriceCents =
    typeof body.starting_price_cents === 'number' ? body.starting_price_cents : NaN;
  if (isNaN(startingPriceCents) || startingPriceCents <= 0) {
    errors.push('starting_price_cents must be a positive integer');
  }

  const reservePriceCents =
    body.reserve_price_cents != null
      ? typeof body.reserve_price_cents === 'number'
        ? body.reserve_price_cents
        : NaN
      : null;
  if (reservePriceCents !== null && (isNaN(reservePriceCents) || reservePriceCents <= 0)) {
    errors.push('reserve_price_cents must be a positive integer when provided');
  }

  const buyNowPriceCents =
    body.buy_now_price_cents != null
      ? typeof body.buy_now_price_cents === 'number'
        ? body.buy_now_price_cents
        : NaN
      : null;
  if (buyNowPriceCents !== null && (isNaN(buyNowPriceCents) || buyNowPriceCents <= 0)) {
    errors.push('buy_now_price_cents must be a positive integer when provided');
  }

  const endsAtRaw = typeof body.ends_at === 'string' ? body.ends_at : '';
  const endsAt = new Date(endsAtRaw);
  if (isNaN(endsAt.getTime())) {
    errors.push('ends_at must be a valid ISO 8601 date');
  } else if (endsAt.getTime() <= Date.now()) {
    errors.push('ends_at must be in the future');
  }

  const strainName = typeof body.strain_name === 'string' ? body.strain_name.trim() : '';
  const thcPercentage =
    body.thc_percentage != null
      ? typeof body.thc_percentage === 'number'
        ? body.thc_percentage
        : NaN
      : null;
  if (thcPercentage !== null && (isNaN(thcPercentage) || thcPercentage < 0 || thcPercentage > 100)) {
    errors.push('thc_percentage must be between 0 and 100');
  }

  const cbdPercentage =
    body.cbd_percentage != null
      ? typeof body.cbd_percentage === 'number'
        ? body.cbd_percentage
        : NaN
      : null;
  if (cbdPercentage !== null && (isNaN(cbdPercentage) || cbdPercentage < 0 || cbdPercentage > 100)) {
    errors.push('cbd_percentage must be between 0 and 100');
  }

  const growMethod =
    body.grow_method != null
      ? typeof body.grow_method === 'string'
        ? body.grow_method
        : ''
      : null;
  if (growMethod !== null && !(ALLOWED_GROW_METHODS as readonly string[]).includes(growMethod)) {
    errors.push(`grow_method must be one of: ${ALLOWED_GROW_METHODS.join(', ')}`);
  }

  const labResultsUrl =
    typeof body.lab_results_url === 'string' ? body.lab_results_url.trim() : null;

  if (errors.length > 0) {
    return NextResponse.json(
      { ok: false, error: 'Validation failed', details: errors },
      { status: 400 },
    );
  }

  // ---- Insert the lot ----------------------------------------------------

  const { data: lot, error: insertError } = await supabase
    .from('weedbay_lots')
    .insert({
      seller_id: dispensary.id,
      title,
      description: description || null,
      category,
      quantity,
      unit,
      starting_price_cents: startingPriceCents,
      current_bid_cents: null,
      reserve_price_cents: reservePriceCents,
      buy_now_price_cents: buyNowPriceCents,
      ends_at: endsAt.toISOString(),
      strain_name: strainName || null,
      thc_percentage: thcPercentage,
      cbd_percentage: cbdPercentage,
      grow_method: growMethod,
      lab_results_url: labResultsUrl,
      images: Array.isArray(body.images) ? body.images.filter((u: unknown) => typeof u === 'string') : [],
      platform_fee_pct: 5.0,
      status: 'active',
      bid_count: 0,
    })
    .select('id, title, status, ends_at, created_at')
    .single();

  if (insertError) {
    console.error('[marketplace/lots] Insert error:', insertError.message);
    return NextResponse.json(
      { ok: false, error: 'Failed to create lot.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, data: lot }, { status: 201 });
}
