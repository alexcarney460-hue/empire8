import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

/**
 * GET /api/admin/shipping/print-queue
 * Returns orders (paid/processing/shipped) that haven't been printed yet.
 * Query params:
 *   - from: ISO date string (filter created_at >= from)
 *   - to:   ISO date string (filter created_at <= to)
 *   - limit: max results (default 50)
 *   - include_printed: if "true", also return printed orders
 */
export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });
  }

  try {
    const url = new URL(req.url);
    const from = url.searchParams.get('from') || '';
    const to = url.searchParams.get('to') || '';
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
    const includePrinted = url.searchParams.get('include_printed') === 'true';

    let query = supabase
      .from('orders')
      .select(
        [
          'id', 'email', 'status', 'total',
          'shipping_name', 'shipping_address_line1', 'shipping_address_line2',
          'shipping_city', 'shipping_state', 'shipping_zip', 'shipping_country',
          'label_url', 'tracking_number', 'tracking_url',
          'shipping_carrier', 'shipping_service',
          'shipped_at', 'printed_at', 'created_at',
        ].join(', '),
        { count: 'exact' },
      )
      .in('status', ['paid', 'processing', 'shipped']);

    if (!includePrinted) {
      query = query.is('printed_at', null);
    }

    if (from) {
      query = query.gte('created_at', from);
    }
    if (to) {
      query = query.lte('created_at', to);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      data: data ?? [],
      total: count ?? 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/shipping/print-queue
 * Mark orders as printed (or unmark).
 * Body: { order_ids: number[], printed: boolean }
 */
export async function PATCH(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { order_ids, printed } = body as { order_ids: number[]; printed: boolean };

    if (!Array.isArray(order_ids) || order_ids.length === 0) {
      return NextResponse.json({ ok: false, error: 'order_ids required' }, { status: 400 });
    }

    if (order_ids.length > 100) {
      return NextResponse.json({ ok: false, error: 'Max 100 orders per batch' }, { status: 400 });
    }

    const timestamp = printed ? new Date().toISOString() : null;

    const { data, error } = await supabase
      .from('orders')
      .update({ printed_at: timestamp })
      .in('id', order_ids)
      .select('id, printed_at');

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      data: data ?? [],
      updated: data?.length ?? 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
