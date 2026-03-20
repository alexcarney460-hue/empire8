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
    // Fetch all sales orders with dispensary info
    const { data: orders, error: ordersErr } = await supabase
      .from('sales_orders')
      .select('dispensary_id, total, status, created_at');

    if (ordersErr) throw ordersErr;

    // Fetch dispensary names
    const { data: dispensaries, error: dispErr } = await supabase
      .from('dispensary_accounts')
      .select('id, name');

    if (dispErr) throw dispErr;

    const nameMap: Record<string, string> = {};
    for (const d of dispensaries ?? []) {
      nameMap[d.id] = d.name || 'Unknown';
    }

    // Group by dispensary_id
    const grouped: Record<string, {
      dispensary_id: string;
      dispensary_name: string;
      order_count: number;
      total_spent: number;
      last_order_date: string;
    }> = {};

    for (const order of orders ?? []) {
      if (!order.dispensary_id) continue;
      const isActive = order.status !== 'cancelled' && order.status !== 'voided';

      if (!grouped[order.dispensary_id]) {
        grouped[order.dispensary_id] = {
          dispensary_id: order.dispensary_id,
          dispensary_name: nameMap[order.dispensary_id] || 'Unknown',
          order_count: 0,
          total_spent: 0,
          last_order_date: '',
        };
      }

      if (isActive) {
        grouped[order.dispensary_id].total_spent += Number(order.total) || 0;
        grouped[order.dispensary_id].order_count += 1;
      }

      if (order.created_at > (grouped[order.dispensary_id].last_order_date || '')) {
        grouped[order.dispensary_id].last_order_date = order.created_at;
      }
    }

    const rows = Object.values(grouped)
      .sort((a, b) => b.total_spent - a.total_spent)
      .map((row) => ({
        ...row,
        total_spent: Math.round(row.total_spent * 100) / 100,
        avg_order: row.order_count > 0
          ? Math.round((row.total_spent / row.order_count) * 100) / 100
          : 0,
      }));

    return NextResponse.json({ ok: true, data: rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
