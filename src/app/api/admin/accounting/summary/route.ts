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
    // Total revenue + order count
    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('total, status');

    if (ordersErr) throw ordersErr;

    const allOrders = orders ?? [];
    const nonRefunded = allOrders.filter((o) => o.status !== 'refunded' && o.status !== 'cancelled');
    const revenue = nonRefunded.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const orderCount = nonRefunded.length;
    const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;

    const refundedOrders = allOrders.filter((o) => o.status === 'refunded');
    const refundCount = refundedOrders.length;
    const refundAmount = refundedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    return NextResponse.json({
      ok: true,
      data: {
        revenue: Math.round(revenue * 100) / 100,
        order_count: orderCount,
        avg_order_value: Math.round(avgOrderValue * 100) / 100,
        refund_count: refundCount,
        refund_amount: Math.round(refundAmount * 100) / 100,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
