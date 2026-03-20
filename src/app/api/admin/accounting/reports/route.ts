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
    const url = new URL(req.url);
    const from = url.searchParams.get('from') || '';
    const to = url.searchParams.get('to') || '';
    const groupBy = url.searchParams.get('group_by') || 'day';

    let query = supabase
      .from('sales_orders')
      .select('total_cents, created_at, status')
      .not('status', 'in', '("cancelled","voided")');

    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to + 'T23:59:59.999Z');

    const { data: orders, error } = await query.order('created_at', { ascending: true });
    if (error) throw error;

    // Group by period
    const grouped: Record<string, { period: string; revenue: number; order_count: number }> = {};

    for (const order of orders ?? []) {
      const date = new Date(order.created_at);
      let periodKey: string;

      if (groupBy === 'month') {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (groupBy === 'week') {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        periodKey = d.toISOString().slice(0, 10);
      } else {
        periodKey = date.toISOString().slice(0, 10);
      }

      if (!grouped[periodKey]) {
        grouped[periodKey] = { period: periodKey, revenue: 0, order_count: 0 };
      }
      grouped[periodKey].revenue += (Number(order.total_cents) || 0) / 100;
      grouped[periodKey].order_count += 1;
    }

    const periods = Object.values(grouped)
      .sort((a, b) => a.period.localeCompare(b.period))
      .map((p) => ({
        ...p,
        revenue: Math.round(p.revenue * 100) / 100,
      }));

    const totalRevenue = periods.reduce((s, p) => s + p.revenue, 0);
    const totalOrders = periods.reduce((s, p) => s + p.order_count, 0);

    return NextResponse.json({
      ok: true,
      data: periods,
      summary: {
        total_revenue: Math.round(totalRevenue * 100) / 100,
        total_orders: totalOrders,
        avg_order_value: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0,
      },
    });
  } catch (err: unknown) {
    console.error('[accounting/reports] error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
  }
}
