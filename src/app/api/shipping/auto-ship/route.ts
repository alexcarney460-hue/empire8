import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { autoShipOrder } from '@/lib/shippo';
import { sendOrderShippedEmail } from '@/lib/email';
import { DEFAULT_WEIGHTS } from '@/lib/shipping';

// ---------------------------------------------------------------------------
// POST /api/shipping/auto-ship
// Called internally by the Square webhook to trigger Shippo label purchase
// in a separate function invocation (avoids webhook timeout).
// Protected by an internal secret — not a public endpoint.
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // Verify internal call via secret header
  const secret = process.env.INTERNAL_API_SECRET || process.env.CRON_SECRET || process.env.ADMIN_ANALYTICS_TOKEN;
  const authHeader = req.headers.get('x-internal-secret');
  if (!secret || authHeader !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const orderId = body.orderId as string;
  const email = body.email as string;
  const shippingAddr = body.shippingAddr as Record<string, string>;
  const totalCents = body.totalCents as number;
  const currency = body.currency as string;

  if (!orderId || !shippingAddr?.address_line_1 || !shippingAddr?.locality) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  console.log(`[Auto-Ship] Starting for order ${orderId} to ${shippingAddr.locality}, ${shippingAddr.administrative_district_level_1} ${shippingAddr.postal_code}`);

  try {
    // Calculate weight from order items
    let weightLbs = 0;
    const { data: items } = await supabase
      .from('order_items')
      .select('product_name, quantity')
      .eq('order_id', orderId);

    if (items && items.length > 0) {
      for (const item of items) {
        const nameLower = (item.product_name || '').toLowerCase();
        let w = 5;
        if (nameLower.includes('case')) w = DEFAULT_WEIGHTS['nitrile-5mil-case'] ?? 65;
        else if (nameLower.includes('box')) w = DEFAULT_WEIGHTS['nitrile-5mil-box'] ?? 6.5;
        else if (nameLower.includes('scissor')) w = 0.5;
        else if (nameLower.includes('tray')) w = 2;
        else if (nameLower.includes('spray') || nameLower.includes('bottle')) w = 0.5;
        weightLbs += w * (item.quantity || 1);
      }
    }

    if (weightLbs <= 0) {
      weightLbs = Math.max(5, Math.round((totalCents / 100) * 0.5));
    }

    console.log(`[Auto-Ship] Weight: ${weightLbs} lbs, items: ${items?.length ?? 0}`);

    const shipToName = `${shippingAddr.first_name || ''} ${shippingAddr.last_name || ''}`.trim();

    const shipResult = await autoShipOrder(
      {
        name: shipToName || 'Customer',
        street1: shippingAddr.address_line_1,
        street2: shippingAddr.address_line_2 || '',
        city: shippingAddr.locality,
        state: shippingAddr.administrative_district_level_1 || '',
        zip: shippingAddr.postal_code || '',
        country: shippingAddr.country || 'US',
        email: email,
      },
      weightLbs,
    );

    if (shipResult) {
      console.log(`[Auto-Ship] Label purchased: ${shipResult.carrier} ${shipResult.service} $${shipResult.rate} — tracking: ${shipResult.trackingNumber}`);

      await supabase.from('orders').update({
        status: 'shipped',
        tracking_number: shipResult.trackingNumber,
        tracking_url: shipResult.trackingUrl,
        label_url: shipResult.labelUrl,
        shippo_shipment_id: shipResult.shipmentId,
        shippo_transaction_id: shipResult.transactionId,
        shipping_carrier: shipResult.carrier,
        shipping_service: shipResult.service,
        shipped_at: new Date().toISOString(),
      }).eq('id', orderId);

      // Send shipped notification email
      if (email) {
        try {
          const { data: savedItems } = await supabase
            .from('order_items')
            .select('product_name, quantity, unit_price, total_price')
            .eq('order_id', orderId);

          await sendOrderShippedEmail(email, {
            id: orderId as unknown as number,
            email,
            total: totalCents / 100,
            currency,
            items: (savedItems || []) as Array<{ product_name: string; quantity: number; unit_price: number; total_price: number }>,
            shipping_name: shipToName || null,
            shipping_address_line1: shippingAddr.address_line_1 || null,
            shipping_address_line2: shippingAddr.address_line_2 || null,
            shipping_city: shippingAddr.locality || null,
            shipping_state: shippingAddr.administrative_district_level_1 || null,
            shipping_zip: shippingAddr.postal_code || null,
            shipping_country: shippingAddr.country || 'US',
          }, {
            tracking_number: shipResult.trackingNumber,
            shipping_carrier: shipResult.carrier,
            tracking_url: shipResult.trackingUrl,
            shipping_service: shipResult.service,
          });
          console.log(`[Auto-Ship] Shipped email sent to ${email}`);
        } catch (emailErr) {
          console.error('[Auto-Ship] Shipped email failed:', emailErr instanceof Error ? emailErr.message : 'unknown');
        }
      }

      return NextResponse.json({ ok: true, tracking: shipResult.trackingNumber, carrier: shipResult.carrier });
    } else {
      console.error(`[Auto-Ship] No rates available for order ${orderId}`);
      return NextResponse.json({ ok: false, error: 'No shipping rates available' }, { status: 500 });
    }
  } catch (err) {
    console.error(`[Auto-Ship] Failed for order ${orderId}:`, err instanceof Error ? err.message : 'unknown');
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'Auto-ship failed' }, { status: 500 });
  }
}
