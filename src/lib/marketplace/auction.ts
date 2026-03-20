// ---------------------------------------------------------------------------
// Weedbay Auction Helpers
// ---------------------------------------------------------------------------
// Contains the logic for closing expired auctions and computing derived
// auction fields (time remaining, anonymised bidder labels, etc.).
// ---------------------------------------------------------------------------

import { SupabaseClient } from '@supabase/supabase-js';

// ---- Types ----------------------------------------------------------------

export interface AuctionCloseResult {
  readonly lotId: string;
  readonly outcome: 'sold' | 'ended';
  readonly winnerId: string | null;
  readonly winningBidCents: number | null;
}

// ---- Time helpers ---------------------------------------------------------

/**
 * Compute seconds remaining until a lot closes.
 * Returns 0 when the lot has already ended.
 */
export function secondsRemaining(endsAt: string): number {
  const diff = new Date(endsAt).getTime() - Date.now();
  return diff > 0 ? Math.ceil(diff / 1000) : 0;
}

// ---- Bidder anonymisation -------------------------------------------------

/**
 * Given an ordered list of bids (newest first), assign stable anonymous labels
 * like "Bidder #1", "Bidder #2" based on the order each unique bidder_id first
 * appeared (earliest bid = lowest number).
 */
export function anonymiseBids(
  bids: readonly { bidder_id: string; [key: string]: unknown }[],
): readonly { label: string; [key: string]: unknown }[] {
  // Walk oldest-first to assign stable numbers
  const reversed = [...bids].reverse();
  const labelMap = new Map<string, string>();
  let counter = 0;

  for (const bid of reversed) {
    if (!labelMap.has(bid.bidder_id)) {
      counter += 1;
      labelMap.set(bid.bidder_id, `Bidder #${counter}`);
    }
  }

  // Return in original order (newest first) with anonymised labels
  return bids.map((bid) => {
    const { bidder_id, ...rest } = bid;
    return { ...rest, label: labelMap.get(bidder_id) ?? 'Unknown' };
  });
}

// ---- Close expired auctions -----------------------------------------------

/**
 * Find all lots whose auction period has elapsed and resolve them.
 *
 * - If the highest bid meets or exceeds the reserve price (or there is no
 *   reserve), the lot is marked `sold` with the winner recorded.
 * - Otherwise the lot is marked `ended` (no sale).
 *
 * Intended to be called from a cron route or background job.
 */
export async function closeExpiredAuctions(
  supabase: SupabaseClient,
): Promise<readonly AuctionCloseResult[]> {
  const now = new Date().toISOString();

  // Fetch all active lots whose end time has passed
  const { data: expiredLots, error: lotsError } = await supabase
    .from('weedbay_lots')
    .select('id, reserve_price_cents')
    .eq('status', 'active')
    .lte('ends_at', now);

  if (lotsError) {
    console.error('[auction] Failed to fetch expired lots:', lotsError.message);
    return [];
  }

  if (!expiredLots || expiredLots.length === 0) {
    return [];
  }

  const results: AuctionCloseResult[] = [];

  for (const lot of expiredLots) {
    // Find the highest bid for this lot
    const { data: topBid, error: bidError } = await supabase
      .from('weedbay_bids')
      .select('id, bidder_id, amount_cents')
      .eq('lot_id', lot.id)
      .order('amount_cents', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (bidError) {
      console.error(`[auction] Failed to fetch bids for lot ${lot.id}:`, bidError.message);
      continue;
    }

    const reserveMet =
      topBid &&
      (lot.reserve_price_cents == null || topBid.amount_cents >= lot.reserve_price_cents);

    if (reserveMet && topBid) {
      // Lot sold -- update with winner details
      const { error: updateError } = await supabase
        .from('weedbay_lots')
        .update({
          status: 'sold',
          winner_id: topBid.bidder_id,
          winner_bid_cents: topBid.amount_cents,
        })
        .eq('id', lot.id);

      if (updateError) {
        console.error(`[auction] Failed to close lot ${lot.id} as sold:`, updateError.message);
        continue;
      }

      results.push({
        lotId: lot.id,
        outcome: 'sold',
        winnerId: topBid.bidder_id,
        winningBidCents: topBid.amount_cents,
      });
    } else {
      // No bids or reserve not met -- mark ended
      const { error: updateError } = await supabase
        .from('weedbay_lots')
        .update({ status: 'ended' })
        .eq('id', lot.id);

      if (updateError) {
        console.error(`[auction] Failed to close lot ${lot.id} as ended:`, updateError.message);
        continue;
      }

      results.push({
        lotId: lot.id,
        outcome: 'ended',
        winnerId: null,
        winningBidCents: null,
      });
    }
  }

  return results;
}
