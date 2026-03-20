import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

/* ── GET /api/admin/marketplace/stats ─────────────────────────────────
 * Returns aggregate marketplace statistics:
 *   - activeLots:        count of lots with status = 'active'
 *   - totalBids:         count of all bids
 *   - completedAuctions: count of lots with status = 'sold'
 *   - platformRevenue:   sum of 5% fees on winning bid amounts (cents)
 * ──────────────────────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Database unavailable' },
      { status: 503 },
    );
  }

  try {
    // Run all queries in parallel
    const [activeRes, bidsRes, soldRes] = await Promise.all([
      supabase
        .from('weedbay_lots')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase
        .from('weedbay_bids')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('weedbay_lots')
        .select('winner_bid_cents, platform_fee_pct')
        .eq('status', 'sold'),
    ]);

    if (activeRes.error || bidsRes.error || soldRes.error) {
      const msg =
        activeRes.error?.message ??
        bidsRes.error?.message ??
        soldRes.error?.message ??
        'Unknown query error';
      console.error('[admin/marketplace/stats] Query error:', msg);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch stats' },
        { status: 500 },
      );
    }

    const activeLots = activeRes.count ?? 0;
    const totalBids = bidsRes.count ?? 0;
    const soldLots = soldRes.data ?? [];
    const completedAuctions = soldLots.length;

    // Compute total platform revenue in cents
    const platformRevenueCents = soldLots.reduce((sum, lot) => {
      const winBid = lot.winner_bid_cents ?? 0;
      const feePct = lot.platform_fee_pct ?? 5;
      return sum + Math.round(winBid * (feePct / 100));
    }, 0);

    return NextResponse.json({
      ok: true,
      data: {
        activeLots,
        totalBids,
        completedAuctions,
        platformRevenueCents,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[admin/marketplace/stats] Unexpected error:', msg);
    return NextResponse.json(
      { ok: false, error: 'Unexpected error' },
      { status: 500 },
    );
  }
}
