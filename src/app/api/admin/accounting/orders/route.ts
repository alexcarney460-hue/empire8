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
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '25', 10)));
    const email = url.searchParams.get('email') || url.searchParams.get('q') || '';
    const status = url.searchParams.get('status') || '';
    const offset = (page - 1) * limit;

    let query = supabase
      .from('orders')
      .select(
        [
          'id', 'contact_id', 'email', 'status', 'total',
          'shipping_name', 'shipping_address_line1', 'shipping_address_line2',
          'shipping_city', 'shipping_state', 'shipping_zip', 'shipping_country',
          'label_url', 'tracking_number', 'tracking_url',
          'shipping_carrier', 'shipping_service',
          'shipped_at',
          'created_at', 'updated_at',
          'order_items(product_name, quantity)',
        ].join(', '),
        { count: 'exact' },
      );

    if (email) {
      const safeEmail = email.replace(/[,()*\\"]/g, '');
      if (safeEmail) {
        query = query.ilike('email', `%${safeEmail}%`);
      }
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      data: data ?? [],
      total: count ?? 0,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        total_pages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
