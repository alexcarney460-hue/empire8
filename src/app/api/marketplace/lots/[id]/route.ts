import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { secondsRemaining, anonymiseBids } from '@/lib/marketplace/auction';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET /api/marketplace/lots/[id] -- Single lot with full details + bid history
// ---------------------------------------------------------------------------

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // UUID format validation
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid lot ID' },
      { status: 400 },
    );
  }

  // Rate limit
  const ip = getClientIp(req);
  if (!rateLimit(`lot-detail:${ip}`, 120, 60_000)) {
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

  // Fetch the lot
  const { data: lot, error: lotError } = await supabase
    .from('weedbay_lots')
    .select(
      'id, seller_id, title, description, category, quantity, unit, starting_price_cents, current_bid_cents, bid_count, reserve_price_cents, buy_now_price_cents, ends_at, strain_name, thc_percentage, cbd_percentage, grow_method, lab_results_url, platform_fee_pct, status, winner_id, winner_bid_cents, created_at',
    )
    .eq('id', id)
    .maybeSingle();

  if (lotError) {
    console.error('[marketplace/lots/[id]] Database error:', lotError.message);
    return NextResponse.json(
      { ok: false, error: 'An internal error occurred.' },
      { status: 500 },
    );
  }

  if (!lot) {
    return NextResponse.json(
      { ok: false, error: 'Lot not found' },
      { status: 404 },
    );
  }

  // Fetch bid history (newest first)
  const { data: rawBids, error: bidsError } = await supabase
    .from('weedbay_bids')
    .select('id, bidder_id, amount_cents, is_auto_bid, created_at')
    .eq('lot_id', id)
    .order('created_at', { ascending: false });

  if (bidsError) {
    console.error('[marketplace/lots/[id]] Bids query error:', bidsError.message);
    // Non-fatal -- return lot without bids
  }

  // Anonymise bidder identities
  const bids = rawBids ? anonymiseBids(rawBids) : [];

  // Determine if reserve has been met
  const reserveMet =
    lot.reserve_price_cents == null ||
    (lot.current_bid_cents != null && lot.current_bid_cents >= lot.reserve_price_cents);

  // Strip sensitive fields that would break anonymity
  const { seller_id, winner_id, reserve_price_cents, ...publicLot } = lot;

  return NextResponse.json({
    ok: true,
    data: {
      ...publicLot,
      time_remaining_seconds: secondsRemaining(lot.ends_at),
      reserve_met: reserveMet,
      bids,
    },
  });
}
