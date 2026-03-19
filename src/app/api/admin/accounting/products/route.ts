import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

interface OrderItemRow {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  order_id: string;
}

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase)
    return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  try {
    const { data: items, error } = await supabase
      .from('order_items')
      .select('product_name, quantity, unit_price, total_price, order_id');

    if (error) throw error;

    const productMap: Record<string, { name: string; units_sold: number; revenue: number }> = {};

    for (const item of (items ?? []) as OrderItemRow[]) {
      const name = item.product_name || 'Unknown Product';
      const qty = item.quantity || 1;
      const revenue = item.total_price || qty * (item.unit_price || 0);

      if (!productMap[name]) {
        productMap[name] = { name, units_sold: 0, revenue: 0 };
      }
      productMap[name].units_sold += qty;
      productMap[name].revenue += revenue;
    }

    const products = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .map((p) => ({
        ...p,
        revenue: Math.round(p.revenue * 100) / 100,
      }));

    return NextResponse.json({ ok: true, data: products });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
