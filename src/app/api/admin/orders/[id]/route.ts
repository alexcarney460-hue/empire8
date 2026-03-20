import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

type OrderStatus = 'submitted' | 'processing' | 'shipped' | 'delivered';

const VALID_STATUSES: ReadonlyArray<OrderStatus> = [
  'submitted',
  'processing',
  'shipped',
  'delivered',
];

/* ── GET /api/admin/orders/[id] ───────────────────────────────────────
 * Fetch a single sales order with all line items and dispensary info.
 * ──────────────────────────────────────────────────────────────────── */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Database unavailable' },
      { status: 503 },
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { ok: false, error: 'Missing order ID' },
      { status: 400 },
    );
  }

  try {
    // Fetch order with dispensary info
    const { data: order, error: orderError } = await supabase
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
        dispensary_accounts (
          id,
          company_name,
          license_number,
          license_type,
          contact_name,
          email,
          phone,
          address_street,
          address_city,
          address_state,
          address_zip,
          is_approved
        )
        `,
      )
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { ok: false, error: 'Order not found' },
        { status: 404 },
      );
    }

    // Fetch line items
    const { data: items, error: itemsError } = await supabase
      .from('sales_order_items')
      .select(
        `
        id,
        product_id,
        brand_id,
        brand_name,
        product_name,
        unit_price_cents,
        quantity,
        line_total_cents,
        image_url,
        unit_type
        `,
      )
      .eq('order_id', id)
      .order('brand_name', { ascending: true });

    if (itemsError) {
      console.error('[admin/orders/id] Items query error:', itemsError.message);
    }

    return NextResponse.json({
      ok: true,
      data: {
        ...order,
        items: items ?? [],
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[admin/orders/id] Unexpected error:', msg);
    return NextResponse.json(
      { ok: false, error: 'Unexpected error' },
      { status: 500 },
    );
  }
}

/* ── PATCH /api/admin/orders/[id] ─────────────────────────────────────
 * Update order status and/or notes.
 *
 * Body: { status?: OrderStatus, notes?: string }
 * ──────────────────────────────────────────────────────────────────── */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Database unavailable' },
      { status: 503 },
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { ok: false, error: 'Missing order ID' },
      { status: 400 },
    );
  }

  try {
    const body = await req.json();

    // Build update payload -- only allow status and notes
    const updates: Record<string, unknown> = {};

    if (typeof body.status === 'string') {
      if (!VALID_STATUSES.includes(body.status as OrderStatus)) {
        return NextResponse.json(
          { ok: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
          { status: 400 },
        );
      }
      updates.status = body.status;
    }

    if (body.notes !== undefined) {
      updates.notes = typeof body.notes === 'string' ? body.notes : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No valid fields to update' },
        { status: 400 },
      );
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('sales_orders')
      .update(updates)
      .eq('id', id)
      .select('id, order_number, status, notes, updated_at')
      .single();

    if (error) {
      console.error('[admin/orders/id] Update error:', error.message);
      return NextResponse.json(
        { ok: false, error: 'Failed to update order' },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: 'Order not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[admin/orders/id] Unexpected error:', msg);
    return NextResponse.json(
      { ok: false, error: 'Unexpected error' },
      { status: 500 },
    );
  }
}
