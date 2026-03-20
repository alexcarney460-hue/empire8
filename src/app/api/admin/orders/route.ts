import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

/* ── GET /api/admin/orders ────────────────────────────────────────────
 * List sales orders with pagination, search, and status filtering.
 *
 * Query params:
 *   page   (default 1)
 *   limit  (default 25, max 100)
 *   search (ilike on order_number or dispensary company_name)
 *   status (submitted | processing | shipped | delivered)
 * ──────────────────────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Database unavailable' },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || '25')));
  const search = (url.searchParams.get('search') || '').trim();
  const status = (url.searchParams.get('status') || '').trim();
  const offset = (page - 1) * limit;

  try {
    // Build query: sales_orders joined with dispensary_accounts for company_name
    let query = supabase
      .from('sales_orders')
      .select(
        `
        id,
        order_number,
        dispensary_id,
        status,
        total_cents,
        item_count,
        notes,
        created_at,
        updated_at,
        dispensary_accounts!inner ( id, company_name )
        `,
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by status
    if (status && ['submitted', 'processing', 'shipped', 'delivered'].includes(status)) {
      query = query.eq('status', status);
    }

    // Search by order number or dispensary company name
    if (search) {
      query = query.or(
        `order_number.ilike.%${search}%,dispensary_accounts.company_name.ilike.%${search}%`,
      );
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('[admin/orders] Query error:', error.message);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch orders' },
        { status: 500 },
      );
    }

    // Flatten dispensary_accounts join into each row for the frontend
    const orders = (data ?? []).map((row: Record<string, unknown>) => {
      const dispensary = row.dispensary_accounts as
        | { id: string; company_name: string }
        | null;
      return {
        id: row.id,
        order_number: row.order_number,
        dispensary_id: row.dispensary_id,
        status: row.status,
        total_cents: row.total_cents,
        item_count: row.item_count,
        notes: row.notes,
        created_at: row.created_at,
        updated_at: row.updated_at,
        dispensary_name: dispensary?.company_name ?? 'Unknown',
      };
    });

    return NextResponse.json({
      ok: true,
      data: orders,
      total: count ?? 0,
      page,
      limit,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[admin/orders] Unexpected error:', msg);
    return NextResponse.json(
      { ok: false, error: 'Unexpected error' },
      { status: 500 },
    );
  }
}
