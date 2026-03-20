import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedDispensary } from '@/lib/dispensary-auth';
import { getSupabaseServer } from '@/lib/supabase-server';
import { rateLimit } from '@/lib/rate-limit';
import { createNotifications, formatCents } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// POST /api/marketplace/lots/[id]/bid -- Place a bid on a lot
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: lotId } = await params;

  // UUID format validation
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!lotId || !UUID_RE.test(lotId)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid lot ID' },
      { status: 400 },
    );
  }

  // ---- Auth ---------------------------------------------------------------
  const dispensary = await getAuthenticatedDispensary();
  if (!dispensary) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }

  // Rate limit: 30 bids per minute per user (prevents bid-sniping scripts)
  if (!rateLimit(`bid:${dispensary.id}`, 30, 60_000)) {
    return NextResponse.json(
      { ok: false, error: 'Too many bid requests. Please try again later.' },
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

  // ---- Parse body ---------------------------------------------------------
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const amountCents =
    typeof body.amount_cents === 'number' ? Math.floor(body.amount_cents) : NaN;
  if (isNaN(amountCents) || amountCents <= 0) {
    return NextResponse.json(
      { ok: false, error: 'amount_cents must be a positive integer' },
      { status: 400 },
    );
  }

  const maxAutoBidCents =
    body.max_auto_bid_cents != null
      ? typeof body.max_auto_bid_cents === 'number'
        ? Math.floor(body.max_auto_bid_cents)
        : NaN
      : null;
  if (maxAutoBidCents !== null && (isNaN(maxAutoBidCents) || maxAutoBidCents <= 0)) {
    return NextResponse.json(
      { ok: false, error: 'max_auto_bid_cents must be a positive integer when provided' },
      { status: 400 },
    );
  }
  if (maxAutoBidCents !== null && maxAutoBidCents < amountCents) {
    return NextResponse.json(
      { ok: false, error: 'max_auto_bid_cents must be >= amount_cents' },
      { status: 400 },
    );
  }

  // ---- Fetch the lot and validate state -----------------------------------
  const { data: lot, error: lotError } = await supabase
    .from('weedbay_lots')
    .select(
      'id, seller_id, title, status, current_bid_cents, bid_count, buy_now_price_cents, starting_price_cents, ends_at, reserve_price_cents',
    )
    .eq('id', lotId)
    .maybeSingle();

  if (lotError) {
    console.error('[marketplace/bid] Lot query error:', lotError.message);
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

  // Lot must be active
  if (lot.status !== 'active') {
    return NextResponse.json(
      { ok: false, error: 'This lot is no longer accepting bids.' },
      { status: 409 },
    );
  }

  // Lot must not have ended
  if (new Date(lot.ends_at).getTime() <= Date.now()) {
    return NextResponse.json(
      { ok: false, error: 'This auction has ended.' },
      { status: 409 },
    );
  }

  // Bidder cannot be the seller
  if (lot.seller_id === dispensary.id) {
    return NextResponse.json(
      { ok: false, error: 'You cannot bid on your own lot.' },
      { status: 403 },
    );
  }

  // First bid must be >= starting_price, subsequent bids must be > current_bid
  const minimumBid = lot.current_bid_cents > 0 ? lot.current_bid_cents : (lot.starting_price_cents || 0);
  if (lot.current_bid_cents > 0 ? amountCents <= minimumBid : amountCents < minimumBid) {
    return NextResponse.json(
      {
        ok: false,
        error: lot.current_bid_cents > 0
          ? `Bid must exceed the current bid of ${minimumBid} cents.`
          : `Bid must be at least the starting price of ${minimumBid} cents.`,
        current_bid_cents: minimumBid,
      },
      { status: 400 },
    );
  }

  // ---- Check for Buy Now -------------------------------------------------
  const isBuyNow =
    lot.buy_now_price_cents != null && amountCents >= lot.buy_now_price_cents;

  // ---- Insert the bid -----------------------------------------------------
  const isAutoBid = maxAutoBidCents !== null;

  const { data: bid, error: bidError } = await supabase
    .from('weedbay_bids')
    .insert({
      lot_id: lotId,
      bidder_id: dispensary.id,
      amount_cents: amountCents,
      is_auto_bid: isAutoBid,
      max_auto_bid_cents: maxAutoBidCents,
    })
    .select('id, amount_cents, created_at')
    .single();

  if (bidError) {
    console.error('[marketplace/bid] Insert error:', bidError.message);
    return NextResponse.json(
      { ok: false, error: 'Failed to place bid.' },
      { status: 500 },
    );
  }

  // ---- Update lot counters ------------------------------------------------
  const newBidCount = (lot.bid_count ?? 0) + 1;

  if (isBuyNow) {
    // Instant win via Buy Now -- status guard ensures lot is still active
    const { data: buyNowResult, error: updateError } = await supabase
      .from('weedbay_lots')
      .update({
        status: 'sold',
        current_bid_cents: amountCents,
        bid_count: newBidCount,
        winner_id: dispensary.id,
        winner_bid_cents: amountCents,
      })
      .eq('id', lotId)
      .eq('status', 'active')
      .select('id');

    if (updateError) {
      console.error('[marketplace/bid] Buy-now update error:', updateError.message);
      return NextResponse.json(
        { ok: false, error: 'Failed to complete buy-now.' },
        { status: 500 },
      );
    }

    if (!buyNowResult || buyNowResult.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'This lot is no longer available for purchase.' },
        { status: 409 },
      );
    }

    // Notify winner and seller about the buy-now sale
    const buyNowNotifs = [
      {
        user_id: dispensary.id,
        title: `You won the auction for ${lot.title}!`,
        body: `Final price: ${formatCents(amountCents)}`,
        url: `/marketplace/lots/${lotId}`,
        type: 'lot_won',
      },
      {
        user_id: lot.seller_id,
        title: `Your lot ${lot.title} has sold`,
        body: `Sold for ${formatCents(amountCents)} via Buy Now`,
        url: `/marketplace/my-lots`,
        type: 'lot_sold',
      },
    ];
    createNotifications(buyNowNotifs).catch((err) => {
      console.error('[marketplace/bid] Buy-now notification error:', err);
    });

    return NextResponse.json({
      ok: true,
      data: {
        bid_id: bid.id,
        amount_cents: bid.amount_cents,
        status: 'won',
        buy_now: true,
        lot_status: 'sold',
      },
    });
  }

  // Standard bid -- optimistic concurrency check on current_bid_cents
  let updateQuery = supabase
    .from('weedbay_lots')
    .update({
      current_bid_cents: amountCents,
      bid_count: newBidCount,
    })
    .eq('id', lotId);

  // Supabase .eq() does not match null -- use .is() for first-bid scenario
  if (lot.current_bid_cents == null) {
    updateQuery = updateQuery.is('current_bid_cents', null);
  } else {
    updateQuery = updateQuery.eq('current_bid_cents', lot.current_bid_cents);
  }

  const { data: updateResult, error: updateError } = await updateQuery.select('id');

  if (updateError) {
    console.error('[marketplace/bid] Lot update error:', updateError.message);
  }

  if (!updateResult || updateResult.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'Another bid was placed. Please retry.' },
      { status: 409 },
    );
  }

  // ---- Notify seller and outbid users ------------------------------------

  const bidNotifs: Array<{ user_id: string; title: string; body?: string; url?: string; type?: string }> = [
    {
      user_id: lot.seller_id,
      title: `New bid of ${formatCents(amountCents)} on your lot: ${lot.title}`,
      body: `Bid count: ${newBidCount}`,
      url: `/marketplace/my-lots`,
      type: 'new_bid',
    },
  ];

  // Find the previous highest bidder to notify them they've been outbid
  if (lot.current_bid_cents != null && lot.current_bid_cents > 0) {
    const { data: prevBids } = await supabase
      .from('weedbay_bids')
      .select('bidder_id')
      .eq('lot_id', lotId)
      .eq('amount_cents', lot.current_bid_cents)
      .neq('bidder_id', dispensary.id)
      .limit(1);

    if (prevBids && prevBids.length > 0) {
      bidNotifs.push({
        user_id: prevBids[0].bidder_id,
        title: `You've been outbid on ${lot.title}`,
        body: `Current bid: ${formatCents(amountCents)}`,
        url: `/marketplace/lots/${lotId}`,
        type: 'outbid',
      });
    }
  }

  createNotifications(bidNotifs).catch((err) => {
    console.error('[marketplace/bid] Notification error:', err);
  });

  return NextResponse.json({
    ok: true,
    data: {
      bid_id: bid.id,
      amount_cents: bid.amount_cents,
      status: 'leading',
      buy_now: false,
      current_bid_cents: amountCents,
      bid_count: newBidCount,
    },
  });
}
