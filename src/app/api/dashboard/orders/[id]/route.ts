import { NextResponse } from 'next/server';
import { getAuthenticatedDispensary } from '@/lib/dispensary-auth';
import { getSupabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
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

  const { id } = await ctx.params;

  const { data: order, error } = await supabase
    .from('sales_orders')
    .select('id, order_number, status, total_cents, notes, created_at, sales_order_items(id, brand_id, brand_name, brand_logo_url, product_name, quantity, unit_price_cents, line_total_cents)')
    .eq('id', id)
    .eq('dispensary_id', dispensary.id)
    .single();

  if (error || !order) {
    return NextResponse.json(
      { ok: false, error: 'Order not found' },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, data: order });
}
