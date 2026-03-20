import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';
import {
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  type OrderData,
  type OrderItem,
} from '@/lib/email';

type NotificationType = 'confirmation' | 'shipped';

const VALID_TYPES: ReadonlyArray<NotificationType> = ['confirmation', 'shipped'];

/**
 * POST /api/admin/orders/[id]/send-notification
 * Body: { type: 'confirmation' | 'shipped' }
 *
 * Admin-only: manually resend an order confirmation or shipping notification email.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });
    }

    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (Number.isNaN(orderId)) {
      return NextResponse.json({ ok: false, error: 'Invalid order ID' }, { status: 400 });
    }

    // Parse and validate request body
    let body: { type?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const notificationType = body.type as NotificationType | undefined;
    if (!notificationType || !VALID_TYPES.includes(notificationType)) {
      return NextResponse.json(
        { ok: false, error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 },
      );
    }

    // Fetch the order with line items
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
    }

    if (!order.email) {
      return NextResponse.json(
        { ok: false, error: 'Order has no customer email address' },
        { status: 422 },
      );
    }

    // Build the order data for the email
    const emailOrderData: OrderData = {
      id: order.id,
      email: order.email,
      total: order.total,
      currency: order.currency || 'USD',
      items: (order.order_items || []) as OrderItem[],
      shipping_name: order.shipping_name,
      shipping_address_line1: order.shipping_address_line1,
      shipping_address_line2: order.shipping_address_line2,
      shipping_city: order.shipping_city,
      shipping_state: order.shipping_state,
      shipping_zip: order.shipping_zip,
      shipping_country: order.shipping_country,
      notes: order.notes,
      created_at: order.created_at,
    };

    if (notificationType === 'confirmation') {
      const result = await sendOrderConfirmationEmail(order.email, emailOrderData);
      if (!result.success) {
        console.error('[send-notification] Confirmation email failed:', result.error);
        return NextResponse.json(
          { ok: false, error: 'An internal error occurred.' },
          { status: 500 },
        );
      }
      return NextResponse.json({ ok: true, message: 'Order confirmation email sent' });
    }

    // notificationType === 'shipped'
    if (!order.tracking_number || !order.tracking_url) {
      return NextResponse.json(
        { ok: false, error: 'Order has no tracking information. Ship the order first.' },
        { status: 422 },
      );
    }

    const result = await sendOrderShippedEmail(order.email, emailOrderData, {
      tracking_number: order.tracking_number,
      shipping_carrier: order.shipping_carrier || 'Unknown',
      tracking_url: order.tracking_url,
      shipping_service: order.shipping_service || null,
    });

    if (!result.success) {
      console.error('[send-notification] Shipped email failed:', result.error);
      return NextResponse.json(
        { ok: false, error: 'An internal error occurred.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, message: 'Shipping notification email sent' });
  } catch (err) {
    console.error('[send-notification] Unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
  }
}
