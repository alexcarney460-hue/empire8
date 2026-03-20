import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    const { id } = await params;

    if (!UUID_RE.test(id)) {
      return NextResponse.json({ ok: false, error: 'Invalid ID format' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });
    }

    // Fetch dispensary
    const { data: dispensary, error: dispError } = await supabase
      .from('dispensary_accounts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (dispError) {
      console.error('[Admin] dispensary detail error:', dispError.message);
      return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
    }

    if (!dispensary) {
      return NextResponse.json({ ok: false, error: 'Dispensary not found' }, { status: 404 });
    }

    // Fetch recent orders for this dispensary
    const { data: orders, error: ordersError } = await supabase
      .from('sales_orders')
      .select('id, order_number, status, total_cents, notes, created_at')
      .eq('dispensary_id', id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (ordersError) {
      console.error('[Admin] dispensary orders error:', ordersError.message);
    }

    return NextResponse.json({
      ok: true,
      data: {
        ...dispensary,
        orders: orders ?? [],
      },
    });
  } catch (err) {
    console.error('[dispensary-detail] Unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
  }
}

const ALLOWED_FIELDS = new Set([
  'contact_name',
  'phone',
  'address_street',
  'address_city',
  'address_state',
  'address_zip',
  'notes',
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    const { id } = await params;

    if (!UUID_RE.test(id)) {
      return NextResponse.json({ ok: false, error: 'Invalid ID format' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
    }

    // Whitelist fields
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (ALLOWED_FIELDS.has(key) && typeof value === 'string') {
        updates[key] = value.trim() || null;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: false, error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('dispensary_accounts')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[Admin] dispensary update error:', error.message);
      return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error('[dispensary-patch] Unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
  }
}
