import { NextRequest, NextResponse } from 'next/server';
import { purchaseLabel } from '@/lib/shippo';
import { getSupabaseServer } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import {
  sendOrderShippedEmail,
  type OrderData,
  type OrderItem,
} from '@/lib/email';

/**
 * POST /api/shipping/label
 * Body: { orderId, rateId, shipmentId, carrier, servicelevel }
 * Purchases a shipping label and updates the order in Supabase.
 */
export async function POST(req: NextRequest) {
  try {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    const body = await req.json();
    const { orderId, rateId, shipmentId, carrier, servicelevel } = body;

    if (!orderId || !rateId) {
      return NextResponse.json({ error: 'Missing orderId or rateId' }, { status: 400 });
    }

    const label = await purchaseLabel(rateId);
    if (!label) {
      return NextResponse.json({ error: 'Shippo is not configured' }, { status: 500 });
    }

    // Update order with shipping details
    const supabase = getSupabaseServer();
    if (supabase) {
      await supabase.from('orders').update({
        status: 'shipped',
        tracking_number: label.trackingNumber,
        tracking_url: label.trackingUrl,
        label_url: label.labelUrl,
        shippo_shipment_id: shipmentId || null,
        shippo_transaction_id: label.transactionId,
        shipping_carrier: carrier || null,
        shipping_service: servicelevel || null,
        shipped_at: new Date().toISOString(),
      }).eq('id', orderId);

      // Send shipping notification email to customer
      try {
        const { data: orderRecord } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', orderId)
          .single();

        if (orderRecord?.email) {
          const emailOrderData: OrderData = {
            id: orderRecord.id,
            email: orderRecord.email,
            total: orderRecord.total,
            currency: orderRecord.currency || 'USD',
            items: (orderRecord.order_items || []) as OrderItem[],
            shipping_name: orderRecord.shipping_name,
            shipping_address_line1: orderRecord.shipping_address_line1,
            shipping_address_line2: orderRecord.shipping_address_line2,
            shipping_city: orderRecord.shipping_city,
            shipping_state: orderRecord.shipping_state,
            shipping_zip: orderRecord.shipping_zip,
            shipping_country: orderRecord.shipping_country,
          };

          await sendOrderShippedEmail(orderRecord.email, emailOrderData, {
            tracking_number: label.trackingNumber,
            shipping_carrier: carrier || 'Unknown',
            tracking_url: label.trackingUrl,
            shipping_service: servicelevel || null,
          });
        }
      } catch (emailErr) {
        console.error('[Email] Shipped notification failed for order', orderId, emailErr instanceof Error ? emailErr.message : 'unknown');
      }
    }

    return NextResponse.json({
      ok: true,
      trackingNumber: label.trackingNumber,
      trackingUrl: label.trackingUrl,
      labelUrl: label.labelUrl,
      eta: label.eta,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to purchase label';
    console.error('[Shipping] label purchase error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
