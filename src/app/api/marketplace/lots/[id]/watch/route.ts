import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedDispensary } from '@/lib/dispensary-auth';
import { getSupabaseServer } from '@/lib/supabase-server';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// POST /api/marketplace/lots/[id]/watch -- Add lot to watchlist
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: lotId } = await params;

  const dispensary = await getAuthenticatedDispensary();
  if (!dispensary) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }

  if (!rateLimit(`watch:${dispensary.id}`, 60, 60_000)) {
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

  // Verify the lot exists
  const { data: lot, error: lotError } = await supabase
    .from('weedbay_lots')
    .select('id')
    .eq('id', lotId)
    .maybeSingle();

  if (lotError) {
    console.error('[marketplace/watch] Lot query error:', lotError.message);
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

  // Check for existing watchlist entry (upsert-safe)
  const { data: existing } = await supabase
    .from('weedbay_watchlist')
    .select('id')
    .eq('lot_id', lotId)
    .eq('user_id', dispensary.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      ok: true,
      data: { watching: true, message: 'Already watching this lot.' },
    });
  }

  const { error: insertError } = await supabase
    .from('weedbay_watchlist')
    .insert({
      lot_id: lotId,
      user_id: dispensary.id,
    });

  if (insertError) {
    console.error('[marketplace/watch] Insert error:', insertError.message);
    return NextResponse.json(
      { ok: false, error: 'Failed to add to watchlist.' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: { watching: true },
  });
}

// ---------------------------------------------------------------------------
// DELETE /api/marketplace/lots/[id]/watch -- Remove lot from watchlist
// ---------------------------------------------------------------------------

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: lotId } = await params;

  const dispensary = await getAuthenticatedDispensary();
  if (!dispensary) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }

  if (!rateLimit(`watch:${dispensary.id}`, 60, 60_000)) {
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

  const { error: deleteError } = await supabase
    .from('weedbay_watchlist')
    .delete()
    .eq('lot_id', lotId)
    .eq('user_id', dispensary.id);

  if (deleteError) {
    console.error('[marketplace/watch] Delete error:', deleteError.message);
    return NextResponse.json(
      { ok: false, error: 'Failed to remove from watchlist.' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: { watching: false },
  });
}
