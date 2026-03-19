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
    const { data: orders, error } = await supabase
      .from('orders')
      .select('email, total, created_at, status');

    if (error) throw error;

    const customerMap: Record<string, {
      email: string;
      total_spent: number;
      order_count: number;
      last_order: string;
    }> = {};

    for (const order of orders ?? []) {
      if (!order.email) continue;
      const email = order.email.toLowerCase();
      const isActive = order.status !== 'cancelled' && order.status !== 'refunded';

      if (!customerMap[email]) {
        customerMap[email] = { email, total_spent: 0, order_count: 0, last_order: '' };
      }

      if (isActive) {
        customerMap[email].total_spent += Number(order.total) || 0;
        customerMap[email].order_count += 1;
      }

      if (order.created_at > (customerMap[email].last_order || '')) {
        customerMap[email].last_order = order.created_at;
      }
    }

    const customers = Object.values(customerMap)
      .sort((a, b) => b.total_spent - a.total_spent)
      .map((c) => ({
        ...c,
        total_spent: Math.round(c.total_spent * 100) / 100,
      }));

    return NextResponse.json({ ok: true, data: customers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
