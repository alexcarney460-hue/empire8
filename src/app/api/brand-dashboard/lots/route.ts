import { NextResponse } from 'next/server';
import { getAuthenticatedBrand } from '@/lib/brand-auth';
import { getSupabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET /api/brand-dashboard/lots -- Marketplace lots for this brand account
// ---------------------------------------------------------------------------

export async function GET() {
  const brand = await getAuthenticatedBrand();
  if (!brand) {
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

  const { data: lots, error } = await supabase
    .from('weedbay_lots')
    .select(
      'id, title, category, current_bid_cents, bid_count, status, ends_at, starting_price_cents, created_at',
    )
    .eq('seller_id', brand.brandAccount.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[brand-dashboard/lots] query error:', error.message);
    return NextResponse.json(
      { ok: false, error: 'An internal error occurred.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, data: lots ?? [] });
}
