import { NextResponse } from 'next/server';
import { getAuthenticatedBrand } from '@/lib/brand-auth';
import { getSupabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await getAuthenticatedBrand();
  if (!auth) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { brandId } = auth;
  if (!brandId) {
    return NextResponse.json({ ok: true, data: [] });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 503 });
  }

  // Get order items for this brand's products, joined with order and dispensary info
  const { data: items, error } = await supabase
    .from('sales_order_items')
    .select(`
      id,
      product_name,
      brand_name,
      quantity,
      unit_price_cents,
      line_total_cents,
      sales_order_id,
      sales_orders (
        id,
        order_number,
        status,
        total_cents,
        created_at,
        dispensary_accounts (
          company_name
        )
      )
    `)
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false, referencedTable: 'sales_orders' });

  if (error) {
    console.error('[brand-dashboard/orders] error:', error.message);
    return NextResponse.json({ ok: false, error: 'Failed to load orders' }, { status: 500 });
  }

  // Group items by order
  const ordersMap = new Map<string, {
    id: string;
    order_number: string;
    status: string;
    total_cents: number;
    created_at: string;
    dispensary_name: string;
    items: Array<{
      id: string;
      product_name: string;
      quantity: number;
      unit_price_cents: number;
      line_total_cents: number;
    }>;
    brand_total_cents: number;
  }>();

  for (const item of items ?? []) {
    const order = item.sales_orders as unknown as {
      id: string;
      order_number: string;
      status: string;
      total_cents: number;
      created_at: string;
      dispensary_accounts: { company_name: string } | null;
    } | null;

    if (!order) continue;

    const existing = ordersMap.get(order.id);
    const orderItem = {
      id: item.id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price_cents: item.unit_price_cents,
      line_total_cents: item.line_total_cents,
    };

    if (existing) {
      ordersMap.set(order.id, {
        ...existing,
        items: [...existing.items, orderItem],
        brand_total_cents: existing.brand_total_cents + (item.line_total_cents ?? 0),
      });
    } else {
      ordersMap.set(order.id, {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        total_cents: order.total_cents,
        created_at: order.created_at,
        dispensary_name: order.dispensary_accounts?.company_name ?? 'Unknown',
        items: [orderItem],
        brand_total_cents: item.line_total_cents ?? 0,
      });
    }
  }

  const orders = Array.from(ordersMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return NextResponse.json({ ok: true, data: orders });
}
