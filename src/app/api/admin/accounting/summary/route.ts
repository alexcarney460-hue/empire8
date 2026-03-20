import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase)
    return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  try {
    // Total revenue + order count from sales_orders
    const { data: orders, error: ordersErr } = await supabase
      .from('sales_orders')
      .select('total, status');

    if (ordersErr) throw ordersErr;

    const allOrders = orders ?? [];
    const activeOrders = allOrders.filter(
      (o) => o.status !== 'cancelled' && o.status !== 'voided'
    );
    const revenue = activeOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const orderCount = activeOrders.length;
    const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;

    // Active dispensaries count
    const { count: dispensaryCount, error: dispErr } = await supabase
      .from('dispensary_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    if (dispErr) throw dispErr;

    return NextResponse.json({
      ok: true,
      data: {
        revenue: Math.round(revenue * 100) / 100,
        order_count: orderCount,
        avg_order_value: Math.round(avgOrderValue * 100) / 100,
        active_dispensaries: dispensaryCount ?? 0,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
