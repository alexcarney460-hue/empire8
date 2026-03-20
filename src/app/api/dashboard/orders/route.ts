import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedDispensary } from '@/lib/dispensary-auth';
import { getSupabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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

  const url = new URL(req.url);
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : 100;

  const { data: orders, error } = await supabase
    .from('sales_orders')
    .select('id, order_number, status, total_cents, notes, created_at, sales_order_items(id, product_id, brand_id, brand_name, brand_logo_url, product_name, quantity, unit_price_cents, line_total_cents, image_url, unit_type)')
    .eq('dispensary_id', dispensary.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[dashboard/orders] Database error:', error.message);
    return NextResponse.json(
      { ok: false, error: 'An internal error occurred.' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: orders ?? [],
  });
}
