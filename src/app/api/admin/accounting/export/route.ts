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

    // Fetch sales orders
    let ordersQuery = supabase
      .from('sales_orders')
      .select('id, dispensary_id, status, total, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (from) ordersQuery = ordersQuery.gte('created_at', from);
    if (to) ordersQuery = ordersQuery.lte('created_at', to + 'T23:59:59.999Z');

    const { data: orders, error: ordersErr } = await ordersQuery;
    if (ordersErr) throw ordersErr;

    // Fetch dispensary names for mapping
    const { data: dispensaries, error: dispErr } = await supabase
      .from('dispensary_accounts')
      .select('id, name');

    if (dispErr) throw dispErr;

    const nameMap: Record<string, string> = {};
    for (const d of dispensaries ?? []) {
      nameMap[d.id] = d.name || '';
    }

    // Fetch all line items for these orders
    const orderIds = (orders ?? []).map((o) => o.id);
    let itemsByOrder: Record<string, Array<{ product_name: string; brand_name: string; quantity: number; unit_price: number; total_price: number }>> = {};

    if (orderIds.length > 0) {
      const { data: items, error: itemsErr } = await supabase
        .from('sales_order_items')
        .select('sales_order_id, product_name, brand_name, quantity, unit_price, total_price')
        .in('sales_order_id', orderIds);

      if (itemsErr) throw itemsErr;

      for (const item of items ?? []) {
        const key = item.sales_order_id;
        if (!itemsByOrder[key]) itemsByOrder[key] = [];
        itemsByOrder[key].push(item);
      }
    }

    // Build CSV
    const headers = [
      'Order ID',
      'Dispensary',
      'Status',
      'Order Total',
      'Product',
      'Brand',
      'Quantity',
      'Unit Price',
      'Line Total',
      'Created At',
    ];
    const csvLines = [headers.join(',')];

    function escCsv(val: string | number | null | undefined): string {
      const s = String(val ?? '');
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    }

    for (const order of orders ?? []) {
      const dispensaryName = nameMap[order.dispensary_id] || '';
      const lineItems = itemsByOrder[order.id] ?? [];

      if (lineItems.length === 0) {
        csvLines.push(
          [
            escCsv(order.id),
            escCsv(dispensaryName),
            escCsv(order.status),
            escCsv(order.total),
            '',
            '',
            '',
            '',
            '',
            escCsv(order.created_at),
          ].join(',')
        );
      } else {
        for (const item of lineItems) {
          csvLines.push(
            [
              escCsv(order.id),
              escCsv(dispensaryName),
              escCsv(order.status),
              escCsv(order.total),
              escCsv(item.product_name),
              escCsv(item.brand_name),
              escCsv(item.quantity),
              escCsv(item.unit_price),
              escCsv(item.total_price),
              escCsv(order.created_at),
            ].join(',')
          );
        }
      }
    }

    const csv = csvLines.join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="sales-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
