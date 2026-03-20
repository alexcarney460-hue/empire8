import { NextResponse } from 'next/server';
import { getAuthenticatedDispensary } from '@/lib/dispensary-auth';
import { getSupabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET /api/marketplace/my-bids -- List lots the authenticated user has bid on
// ---------------------------------------------------------------------------

interface BidRow {
  readonly lot_id: string;
  readonly amount_cents: number;
}

interface LotRow {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly current_bid_cents: number | null;
  readonly starting_price_cents: number;
  readonly bid_count: number;
  readonly status: string;
  readonly ends_at: string;
  readonly winner_id: string | null;
}

interface MyBidEntry {
  readonly lot_id: string;
  readonly title: string;
  readonly category: string;
  readonly your_bid_cents: number;
  readonly current_bid_cents: number | null;
  readonly starting_price_cents: number;
  readonly bid_count: number;
  readonly lot_status: string;
  readonly ends_at: string;
  readonly bid_status: 'winning' | 'outbid' | 'won' | 'lost';
}

export async function GET() {
  const dispensary = await getAuthenticatedDispensary();
  if (!dispensary) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Database unavailable' },
      { status: 503 },
    );
  }

  // Fetch all bids by this user
  const { data: bids, error: bidsError } = await supabase
    .from('weedbay_bids')
    .select('lot_id, amount_cents')
    .eq('bidder_id', dispensary.id)
    .order('amount_cents', { ascending: false })
    .limit(50);

  if (bidsError) {
    console.error('[marketplace/my-bids] Bids query error:', bidsError.message);
    return NextResponse.json(
      { ok: false, error: 'An internal error occurred.' },
      { status: 500 },
    );
  }

  if (!bids || bids.length === 0) {
    return NextResponse.json({ ok: true, data: [] });
  }

  // Compute highest bid per lot (bids are ordered by amount desc, so first per lot wins)
  const highestBidByLot = new Map<string, number>();
  for (const bid of bids as BidRow[]) {
    if (!highestBidByLot.has(bid.lot_id)) {
      highestBidByLot.set(bid.lot_id, bid.amount_cents);
    }
  }

  const lotIds = Array.from(highestBidByLot.keys());

  // Fetch lot details for all bid-on lots
  const { data: lots, error: lotsError } = await supabase
    .from('weedbay_lots')
    .select(
      'id, title, category, current_bid_cents, starting_price_cents, bid_count, status, ends_at, winner_id',
    )
    .in('id', lotIds)
    .order('created_at', { ascending: false })
    .limit(50);

  if (lotsError) {
    console.error('[marketplace/my-bids] Lots query error:', lotsError.message);
    return NextResponse.json(
      { ok: false, error: 'An internal error occurred.' },
      { status: 500 },
    );
  }

  // Build response with bid status
  const entries: MyBidEntry[] = (lots ?? []).map((lot: LotRow) => {
    const yourBid = highestBidByLot.get(lot.id) ?? 0;
    const isEnded = lot.status === 'sold' || lot.status === 'ended';
    const isHighest =
      lot.current_bid_cents != null && yourBid >= lot.current_bid_cents;

    let bidStatus: MyBidEntry['bid_status'];
    if (isEnded) {
      bidStatus = lot.winner_id === dispensary.id ? 'won' : 'lost';
    } else {
      bidStatus = isHighest ? 'winning' : 'outbid';
    }

    return {
      lot_id: lot.id,
      title: lot.title,
      category: lot.category,
      your_bid_cents: yourBid,
      current_bid_cents: lot.current_bid_cents,
      starting_price_cents: lot.starting_price_cents,
      bid_count: lot.bid_count,
      lot_status: lot.status,
      ends_at: lot.ends_at,
      bid_status: bidStatus,
    };
  });

  return NextResponse.json({ ok: true, data: entries });
}
