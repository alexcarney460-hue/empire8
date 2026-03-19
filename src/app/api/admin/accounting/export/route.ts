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
    const status = url.searchParams.get('status') || '';

    let query = supabase
      .from('orders')
      .select('id, email, status, total, shipping_address_line1, shipping_city, shipping_state, shipping_zip, shipping_country, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data: orders, error } = await query;
    if (error) throw error;

    const rows = orders ?? [];

    const headers = ['Order ID', 'Email', 'Status', 'Total', 'Address Line 1', 'City', 'State', 'ZIP', 'Country', 'Created At', 'Updated At'];
    const csvLines = [headers.join(',')];

    for (const row of rows) {
      const address = [
        row.shipping_address_line1,
        row.shipping_city,
        row.shipping_state,
        row.shipping_zip,
        row.shipping_country,
      ].filter(Boolean).join(', ');

      csvLines.push([
        row.id,
        `"${(row.email || '').replace(/"/g, '""')}"`,
        row.status,
        row.total,
        `"${(row.shipping_address_line1 || '').replace(/"/g, '""')}"`,
        `"${(row.shipping_city || '').replace(/"/g, '""')}"`,
        `"${(row.shipping_state || '').replace(/"/g, '""')}"`,
        `"${(row.shipping_zip || '').replace(/"/g, '""')}"`,
        `"${(row.shipping_country || '').replace(/"/g, '""')}"`,
        row.created_at,
        row.updated_at,
      ].join(','));
    }

    const csv = csvLines.join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="orders-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
