import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

/* ── GET /api/admin/marketplace/lots ──────────────────────────────────
 * List ALL marketplace lots (admins see every status).
 *
 * Query params:
 *   page   (default 1)
 *   limit  (default 25, max 100)
 *   search (ilike on title)
 *   status (active | ended | sold | removed)
 *   lot_id (single lot with bid history for expand view)
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

  const url = new URL(req.url);
  const lotId = url.searchParams.get('lot_id');

  // ── Single lot detail with bid history ──
  if (lotId) {
    return getSingleLot(supabase, lotId);
  }

  // ── Paginated list ──
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || '25')));
  const search = (url.searchParams.get('search') || '').trim();
  const status = (url.searchParams.get('status') || '').trim();
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('weedbay_lots')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && ['active', 'ended', 'sold', 'removed'].includes(status)) {
      query = query.eq('status', status);
    }

    if (search) {
      const sanitized = search.replace(/[^a-zA-Z0-9\s\-_#]/g, '');
      if (sanitized) {
        query = query.ilike('title', `%${sanitized}%`);
      }
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('[admin/marketplace/lots] Query error:', error.message);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch lots' },
        { status: 500 },
      );
    }

    // Resolve seller brand names where seller_type = 'brand'
    const lots = data ?? [];
    const brandIds = [
      ...new Set(
        lots
          .filter((l) => l.seller_type === 'brand' && l.seller_id)
          .map((l) => l.seller_id as string),
      ),
    ];

    let brandMap: Record<string, string> = {};
    if (brandIds.length > 0) {
      const { data: brands } = await supabase
        .from('brands')
        .select('id, name')
        .in('id', brandIds);

      if (brands) {
        brandMap = Object.fromEntries(brands.map((b) => [b.id, b.name]));
      }
    }

    const enriched = lots.map((lot) => ({
      ...lot,
      seller_name:
        lot.seller_type === 'brand'
          ? brandMap[lot.seller_id] ?? 'Anonymous'
          : 'Anonymous',
    }));

    return NextResponse.json({
      ok: true,
      data: enriched,
      total: count ?? 0,
      page,
      limit,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[admin/marketplace/lots] Unexpected error:', msg);
    return NextResponse.json(
      { ok: false, error: 'Unexpected error' },
      { status: 500 },
    );
  }
}

/* ── Single lot detail helper ──────────────────────────────────────── */

async function getSingleLot(supabase: ReturnType<typeof getSupabaseServer>, lotId: string) {
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 503 });
  }

  try {
    const [lotRes, bidsRes] = await Promise.all([
      supabase.from('weedbay_lots').select('*').eq('id', lotId).maybeSingle(),
      supabase
        .from('weedbay_bids')
        .select('id, bidder_id, bidder_type, amount_cents, is_winning, created_at')
        .eq('lot_id', lotId)
        .order('amount_cents', { ascending: false }),
    ]);

    if (lotRes.error || !lotRes.data) {
      return NextResponse.json(
        { ok: false, error: 'Lot not found' },
        { status: 404 },
      );
    }

    // Anonymise bidders: assign stable "Bidder #N" labels
    const bids = bidsRes.data ?? [];
    const bidderMap = new Map<string, string>();
    let counter = 0;
    const sortedByTime = [...bids].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    for (const bid of sortedByTime) {
      if (!bidderMap.has(bid.bidder_id)) {
        counter += 1;
        bidderMap.set(bid.bidder_id, `Bidder #${counter}`);
      }
    }

    const anonymisedBids = bids.map((bid) => ({
      id: bid.id,
      label: bidderMap.get(bid.bidder_id) ?? 'Unknown',
      amount_cents: bid.amount_cents,
      is_winning: bid.is_winning,
      created_at: bid.created_at,
    }));

    return NextResponse.json({
      ok: true,
      data: {
        lot: lotRes.data,
        bids: anonymisedBids,
        winner_label: lotRes.data.winner_id
          ? bidderMap.get(lotRes.data.winner_id) ?? null
          : null,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[admin/marketplace/lots] Detail error:', msg);
    return NextResponse.json(
      { ok: false, error: 'Unexpected error' },
      { status: 500 },
    );
  }
}

/* ── PATCH /api/admin/marketplace/lots ────────────────────────────────
 * Admin can update a lot's status:
 *   { id: string, action: 'end_early' | 'remove' }
 *
 * - end_early: resolves the auction immediately (finds winner or marks ended)
 * - remove:    sets status = 'removed' (admin moderation)
 * ──────────────────────────────────────────────────────────────────── */

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Database unavailable' },
      { status: 503 },
    );
  }

  let body: { id?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const { id, action } = body;

  if (!id || typeof id !== 'string') {
    return NextResponse.json(
      { ok: false, error: 'Missing lot id' },
      { status: 400 },
    );
  }

  if (!action || !['end_early', 'remove'].includes(action)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid action. Use "end_early" or "remove".' },
      { status: 400 },
    );
  }

  try {
    // Verify lot exists and is active
    const { data: lot, error: lotError } = await supabase
      .from('weedbay_lots')
      .select('id, status, reserve_price_cents')
      .eq('id', id)
      .maybeSingle();

    if (lotError || !lot) {
      return NextResponse.json(
        { ok: false, error: 'Lot not found' },
        { status: 404 },
      );
    }

    if (lot.status !== 'active') {
      return NextResponse.json(
        { ok: false, error: `Lot is already "${lot.status}". Only active lots can be modified.` },
        { status: 409 },
      );
    }

    if (action === 'remove') {
      const { error: updateError } = await supabase
        .from('weedbay_lots')
        .update({ status: 'removed', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) {
        console.error('[admin/marketplace/lots] Remove error:', updateError.message);
        return NextResponse.json(
          { ok: false, error: 'Failed to remove lot' },
          { status: 500 },
        );
      }

      return NextResponse.json({ ok: true, status: 'removed' });
    }

    // action === 'end_early'
    // Find highest bid
    const { data: topBid } = await supabase
      .from('weedbay_bids')
      .select('bidder_id, amount_cents')
      .eq('lot_id', id)
      .order('amount_cents', { ascending: false })
      .limit(1)
      .maybeSingle();

    const reserveMet =
      topBid &&
      (lot.reserve_price_cents == null || topBid.amount_cents >= lot.reserve_price_cents);

    const newStatus = reserveMet ? 'sold' : 'ended';
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      ends_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (reserveMet && topBid) {
      updatePayload.winner_id = topBid.bidder_id;
      updatePayload.winner_bid_cents = topBid.amount_cents;
    }

    const { error: updateError } = await supabase
      .from('weedbay_lots')
      .update(updatePayload)
      .eq('id', id);

    if (updateError) {
      console.error('[admin/marketplace/lots] End early error:', updateError.message);
      return NextResponse.json(
        { ok: false, error: 'Failed to end lot early' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, status: newStatus });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[admin/marketplace/lots] PATCH error:', msg);
    return NextResponse.json(
      { ok: false, error: 'Unexpected error' },
      { status: 500 },
    );
  }
}
