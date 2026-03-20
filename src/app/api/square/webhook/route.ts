import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServer } from '@/lib/supabase-server';
import { autoShipOrder } from '@/lib/shippo';
import { DEFAULT_WEIGHTS } from '@/lib/shipping';
import { squareClient } from '@/lib/square';
import {
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  type OrderData,
  type OrderItem,
} from '@/lib/email';

type SquareEvent = { type: string; event_id?: string; data?: { object?: Record<string, unknown> } };

function verifySquareSignature(
  body: string,
  signature: string | null,
  signatureKey: string,
  notificationUrl: string
): boolean {
  if (!signature) return false;
  const hmac = createHmac('sha256', signatureKey);
  hmac.update(notificationUrl + body);
  const expected = hmac.digest('base64');
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

/** Find or create a contact by email, return contact_id */
async function findOrCreateContact(
  supabase: SupabaseClient,
  email: string,
  name?: string,
  phone?: string
): Promise<number | null> {
  if (!email) return null;

  const { data: existing } = await supabase
    .from('contacts')
    .select('id')
    .eq('email', email.toLowerCase())
    .limit(1)
    .single();

  if (existing) return existing.id;

  const nameParts = (name || '').split(' ');
  const { data: newContact } = await supabase.from('contacts').insert({
    email: email.toLowerCase(),
    firstname: nameParts[0] || null,
    lastname: nameParts.slice(1).join(' ') || null,
    phone: phone || null,
    source: 'purchase',
    lead_status: 'CUSTOMER',
    lifecycle_stage: 'customer',
  }).select('id').single();

  return newContact?.id ?? null;
}

// ---------------------------------------------------------------------------
// Store webhook event for resilience — returns 'already_processed' if
// this event_id was already handled successfully (idempotent guard).
// ---------------------------------------------------------------------------
async function storeWebhookEvent(
  supabase: SupabaseClient,
  eventId: string,
  eventType: string,
  payload: unknown,
): Promise<'stored' | 'already_processed' | 'store_failed'> {
  // Check if already processed (idempotent)
  const { data: existing } = await supabase
    .from('webhook_events')
    .select('id, status')
    .eq('event_id', eventId)
    .limit(1)
    .single();

  if (existing) {
    if (existing.status === 'processed') {
      return 'already_processed';
    }
    // Event exists but failed/pending — update attempts and re-process
    await supabase
      .from('webhook_events')
      .update({ status: 'pending', attempts: (existing as { attempts?: number }).attempts ?? 0 })
      .eq('id', existing.id);
    return 'stored';
  }

  // Insert new event
  const { error } = await supabase.from('webhook_events').insert({
    event_id: eventId,
    event_type: eventType,
    payload,
    status: 'pending',
    attempts: 0,
  });

  if (error) {
    console.error('[Webhook Events] Failed to store event:', error.message);
    return 'store_failed';
  }
  return 'stored';
}

async function markEventProcessed(supabase: SupabaseClient, eventId: string): Promise<void> {
  await supabase
    .from('webhook_events')
    .update({ status: 'processed', processed_at: new Date().toISOString() })
    .eq('event_id', eventId);
}

async function markEventFailed(
  supabase: SupabaseClient,
  eventId: string,
  errorMessage: string,
): Promise<void> {
  // Increment attempts and store error
  const { data: current } = await supabase
    .from('webhook_events')
    .select('attempts')
    .eq('event_id', eventId)
    .limit(1)
    .single();

  await supabase
    .from('webhook_events')
    .update({
      status: 'failed',
      error_message: errorMessage,
      attempts: ((current as { attempts?: number })?.attempts ?? 0) + 1,
    })
    .eq('event_id', eventId);
}

// ---------------------------------------------------------------------------
// Core event processing logic — extracted so it can be called from both the
// webhook handler and the admin retry endpoint.
// ---------------------------------------------------------------------------
export async function processSquareEvent(
  event: SquareEvent,
  supabase: SupabaseClient,
): Promise<void> {
  switch (event.type) {
    case 'payment.created':
    case 'payment.updated': {
      const paymentObj = event.data?.object as Record<string, unknown> | undefined;
      const payment = paymentObj?.payment as Record<string, unknown> | undefined;
      if (!payment) break;

      // Only process completed payments
      const paymentStatus = (payment.status as string) || '';
      if (paymentStatus !== 'COMPLETED') {
        break;
      }

      const orderId = payment.order_id as string | undefined;
      const amountMoney = payment.amount_money as { amount?: number; currency?: string } | undefined;
      const totalCents = amountMoney?.amount ?? 0;
      const currency = amountMoney?.currency ?? 'USD';
      const buyerEmail = (payment.buyer_email_address as string) || '';
      const receiptUrl = payment.receipt_url as string | undefined;

      // Deduplicate — skip if we already processed this payment
      const paymentId = payment.id as string;
      if (paymentId) {
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('square_payment_id', paymentId)
          .limit(1)
          .single();
        if (existingOrder) {
          break;
        }
      }

      // Shipping address — Square puts it on the ORDER (fulfillments), NOT the payment.
      // We'll extract it from the Square order API below. Initialize as null.
      let shippingAddr: Record<string, string> | null = null;

      // Fetch the full Square order once — we need it for line items, shipping
      // address (from fulfillments), and subscription metadata.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let squareOrderData: any = null;
      const squareToken = process.env.SQUARE_ACCESS_TOKEN?.trim();
      if (orderId && squareToken) {
        try {
          const orderRes = await fetch(`https://connect.squareup.com/v2/orders/${orderId}`, {
            headers: { 'Authorization': `Bearer ${squareToken}`, 'Content-Type': 'application/json' },
          });
          if (orderRes.ok) {
            squareOrderData = await orderRes.json();
          } else {
            console.error('[Square] Failed to fetch order:', orderRes.status, await orderRes.text().catch(() => ''));
          }
        } catch (err) {
          console.error('[Square] Failed to fetch order:', err instanceof Error ? err.message : 'unknown');
        }
      }

      // Extract shipping address from Square order fulfillments.
      // Square stores it at: order.fulfillments[].shipment_details.recipient
      if (squareOrderData?.order?.fulfillments) {
        const fulfillments = squareOrderData.order.fulfillments as Array<Record<string, unknown>>;
        for (const f of fulfillments) {
          const shipDetails = f.shipment_details as Record<string, unknown> | undefined;
          const recipient = shipDetails?.recipient as Record<string, unknown> | undefined;
          const addr = recipient?.address as Record<string, string> | undefined;
          if (addr?.address_line_1) {
            shippingAddr = {
              address_line_1: addr.address_line_1 || '',
              address_line_2: addr.address_line_2 || '',
              locality: addr.locality || '',
              administrative_district_level_1: addr.administrative_district_level_1 || '',
              postal_code: addr.postal_code || '',
              country: addr.country || 'US',
              // Recipient name fields
              first_name: (recipient?.display_name as string) || '',
              last_name: '',
            };
            // If display_name isn't set, fall back to email_address
            if (!shippingAddr.first_name && recipient?.email_address) {
              shippingAddr.first_name = recipient.email_address as string;
            }
            break; // Use first fulfillment with an address
          }
        }
      }

      // Fallback: also check payment.shipping_address (some Square integrations put it here)
      if (!shippingAddr) {
        const paymentShipAddr = payment.shipping_address as Record<string, string> | undefined;
        if (paymentShipAddr?.address_line_1) {
          shippingAddr = paymentShipAddr;
        }
      }

      if (shippingAddr) {
        console.log(`[Webhook] Shipping address found: ${shippingAddr.locality}, ${shippingAddr.administrative_district_level_1} ${shippingAddr.postal_code}`);
      } else {
        console.warn(`[Webhook] No shipping address found for order ${orderId}. Auto-ship will be skipped.`);
      }

      // Find or create CRM contact
      const contactId = await findOrCreateContact(supabase, buyerEmail);

      // Update contact to customer status if they were a lead
      if (contactId) {
        await supabase.from('contacts').update({
          lead_status: 'CUSTOMER',
          lifecycle_stage: 'customer',
        }).eq('id', contactId);
      }

      // Create order record
      const { data: order } = await supabase.from('orders').insert({
        contact_id: contactId,
        square_order_id: orderId || null,
        square_payment_id: payment.id as string || null,
        status: 'paid',
        total: totalCents / 100,
        currency,
        email: buyerEmail,
        shipping_name: shippingAddr ? `${shippingAddr.first_name || ''} ${shippingAddr.last_name || ''}`.trim() || null : null,
        shipping_address_line1: shippingAddr?.address_line_1 || null,
        shipping_address_line2: shippingAddr?.address_line_2 || null,
        shipping_city: shippingAddr?.locality || null,
        shipping_state: shippingAddr?.administrative_district_level_1 || null,
        shipping_zip: shippingAddr?.postal_code || null,
        shipping_country: shippingAddr?.country || 'US',
        notes: receiptUrl ? `Receipt: ${receiptUrl}` : null,
      }).select('id').single();

      // Insert line items from the Square order
      if (squareOrderData?.order?.line_items && order) {
        try {
          const lineItems = squareOrderData.order.line_items as Array<Record<string, unknown>>;
          for (const item of lineItems) {
            // Skip shipping line item — it's not a product
            if (((item.name as string) || '').toLowerCase().startsWith('shipping')) continue;

            const parsedQty = parseInt((item.quantity as string) || '1', 10);
            await supabase.from('order_items').insert({
              order_id: order.id,
              product_name: (item.name as string) || 'Unknown',
              sku: (item.catalog_object_id as string) || null,
              quantity: Number.isNaN(parsedQty) || parsedQty < 1 ? 1 : parsedQty,
              unit_price: ((item.base_price_money as Record<string, number>)?.amount || 0) / 100,
              total_price: ((item.total_money as Record<string, number>)?.amount || 0) / 100,
            });
          }
        } catch (err) {
          console.error('[Square] Failed to insert order line items:', err instanceof Error ? err.message : 'unknown error');
        }
      }

      // Decrement inventory for each order item
      if (order) {
        try {
          const { data: orderItems } = await supabase
            .from('order_items')
            .select('product_name, quantity')
            .eq('order_id', order.id);

          if (orderItems && orderItems.length > 0) {
            for (const oi of orderItems) {
              const nameLower = (oi.product_name || '').toLowerCase();
              // Match product slug by keyword from Square item name
              let slug: string | null = null;
              if (nameLower.includes('case')) slug = 'nitrile-5mil-case';
              else if (nameLower.includes('box')) slug = 'nitrile-5mil-box';

              if (slug) {
                const { data: result } = await supabase.rpc('decrement_stock', {
                  p_slug: slug,
                  p_qty: oi.quantity || 1,
                });

                const newQty = typeof result === 'number' ? result : null;
                if (newQty !== null && newQty >= 0) {
                  // Check if below threshold
                  const { data: productRow } = await supabase
                    .from('products')
                    .select('low_stock_threshold')
                    .eq('slug', slug)
                    .single();
                  const threshold = productRow?.low_stock_threshold ?? 10;
                  if (newQty <= threshold) {
                    console.warn(`[Inventory] Low stock warning: ${slug} now at ${newQty} (threshold: ${threshold})`);
                  }
                }
                if (newQty !== null && newQty < 0) {
                  console.warn(`[Inventory] Negative stock for ${slug}: ${newQty}. Manual correction needed.`);
                }
              }
            }
          }
        } catch (invErr) {
          console.error('[Inventory] Failed to decrement stock:', invErr instanceof Error ? invErr.message : 'unknown');
        }
      }

      // Handle autoship subscriptions: create new or update existing
      if (order && orderId && squareOrderData?.order) {
        try {
          const metadata = squareOrderData.order?.metadata ?? {};
          const isAutoship = metadata.autoship === 'true';
          const subscriptionId = metadata.subscription_id;
          const isRenewal = metadata.renewal === 'true';

          // Extract Square customer ID and card-on-file from the payment
          const squareCustomerId = payment.customer_id as string | undefined;
          let squareCardId: string | null = null;
          let cardLast4: string | null = null;

          if (squareCustomerId && squareClient) {
            try {
              const cardsPage = await squareClient.cards.list({
                customerId: squareCustomerId,
              });
              const allCards = cardsPage.data ?? [];
              const enabledCards = allCards.filter(
                (c) => c.enabled !== false,
              );
              if (enabledCards.length > 0) {
                const latestCard = enabledCards[enabledCards.length - 1];
                squareCardId = latestCard.id ?? null;
                cardLast4 = latestCard.last4 ?? null;
              }
              console.log(`[Webhook] Found ${enabledCards.length} card(s) for customer ${squareCustomerId}`);
            } catch (cardErr) {
              console.error('[Webhook] Failed to list cards for customer:', cardErr instanceof Error ? cardErr.message : 'unknown');
            }
          }

          if (isAutoship && subscriptionId && isRenewal) {
            // This is a renewal payment — update the existing subscription
            const renewalUpdate: Record<string, unknown> = {
              last_renewed_at: new Date().toISOString(),
              square_order_id: orderId,
              payment_failed_at: null, // Clear any previous failure
            };
            if (squareCustomerId) renewalUpdate.square_customer_id = squareCustomerId;
            if (squareCardId) renewalUpdate.square_card_id = squareCardId;
            if (cardLast4) renewalUpdate.card_last4 = cardLast4;

            await supabase
              .from('subscriptions')
              .update(renewalUpdate)
              .eq('id', subscriptionId);
            console.log(`[Webhook] Updated subscription ${subscriptionId} last_renewed_at, card: ****${cardLast4 ?? 'none'}`);
          } else if (isAutoship && !isRenewal && buyerEmail) {
            // This is a first-time autoship purchase — create a subscription
            const { computeNextRenewal } = await import('@/lib/subscriptions');
            const nextRenewal = computeNextRenewal('monthly');

            // Build items from order line items (reuse already-fetched data)
            const orderLineItems = squareOrderData.order?.line_items || [];
            const subItems = orderLineItems
              .filter((li: Record<string, unknown>) => {
                const name = (li.name as string) || '';
                return !name.toLowerCase().startsWith('shipping') && name.includes('Subscribe & Save');
              })
              .map((li: Record<string, unknown>) => {
                const name = (li.name as string) || 'Unknown';
                const qty = parseInt(li.quantity as string || '1', 10);
                const isCase = name.toLowerCase().includes('case');
                const baseName = name.replace(/\s*\((?:Case of 10|Box)\).*$/, '').trim();
                return {
                  slug: baseName.toLowerCase().replace(/\s+/g, '-'),
                  name: baseName,
                  quantity: Number.isNaN(qty) || qty < 1 ? 1 : qty,
                  purchaseUnit: isCase ? 'case' : 'box',
                };
              });

            if (subItems.length > 0) {
              await supabase.from('subscriptions').insert({
                email: buyerEmail.toLowerCase(),
                contact_id: contactId,
                items: subItems,
                frequency: 'monthly',
                discount_pct: 10,
                next_renewal_at: nextRenewal.toISOString(),
                square_order_id: orderId,
                square_customer_id: squareCustomerId ?? null,
                square_card_id: squareCardId,
                card_last4: cardLast4,
              });
              console.log(`[Webhook] Created subscription for ${buyerEmail} from order ${orderId}, card: ****${cardLast4 ?? 'none'}`);
            }
          }
        } catch (subErr) {
          // Non-blocking: don't fail webhook on subscription errors
          console.error('[Webhook] Subscription handling failed:', subErr instanceof Error ? subErr.message : 'unknown');
        }
      }

      // Auto-ship: dispatch to a separate endpoint (runs Shippo in its own invocation).
      // We AWAIT the fetch to guarantee the request is sent before the function exits.
      // The fetch itself is fast (<1s) — the heavy Shippo work runs in the other function.
      if (order && shippingAddr?.address_line_1 && shippingAddr?.locality) {
        const internalSecret = process.env.INTERNAL_API_SECRET || process.env.CRON_SECRET;
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://empire8salesdirect.com';

        try {
          const autoShipRes = await fetch(`${siteUrl}/api/shipping/auto-ship`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-secret': internalSecret || '',
            },
            body: JSON.stringify({
              orderId: order.id,
              email: buyerEmail,
              shippingAddr,
              totalCents,
              currency,
            }),
          });
          console.log(`[Webhook] Auto-ship dispatched for order ${order.id}: ${autoShipRes.status}`);
        } catch (err) {
          console.error('[Webhook] Failed to dispatch auto-ship:', err instanceof Error ? err.message : 'unknown');
        }
      }

      // Send order confirmation email — don't await, let it run in background.
      // If the function exits before it completes, the customer still gets the
      // shipped email from the auto-ship endpoint.
      if (order && buyerEmail) {
        (async () => {
          try {
            const { data: savedItems } = await supabase
              .from('order_items')
              .select('product_name, quantity, unit_price, total_price')
              .eq('order_id', order.id);

            const emailOrderData: OrderData = {
              id: order.id,
              email: buyerEmail,
              total: totalCents / 100,
              currency,
              items: (savedItems || []) as OrderItem[],
              shipping_name: shippingAddr ? `${shippingAddr.first_name || ''} ${shippingAddr.last_name || ''}`.trim() : null,
              shipping_address_line1: shippingAddr?.address_line_1 || null,
              shipping_address_line2: shippingAddr?.address_line_2 || null,
              shipping_city: shippingAddr?.locality || null,
              shipping_state: shippingAddr?.administrative_district_level_1 || null,
              shipping_zip: shippingAddr?.postal_code || null,
              shipping_country: shippingAddr?.country || 'US',
            };

            await sendOrderConfirmationEmail(buyerEmail, emailOrderData);
          } catch (emailErr) {
            console.error('[Email] Order confirmation failed for order', order.id, emailErr instanceof Error ? emailErr.message : 'unknown');
          }
        })();
      }

      break;
    }

    case 'order.fulfillment.updated': {
      const orderObj = event.data?.object as Record<string, unknown> | undefined;
      const fulfillment = orderObj?.order_fulfillment_updated as Record<string, unknown> | undefined;
      const sqOrderId = fulfillment?.order_id as string | undefined;

      if (sqOrderId) {
        const fulfillments = fulfillment?.fulfillment_update as Array<{ new_state?: string }> | undefined;
        const latestState = fulfillments?.[0]?.new_state;
        const statusMap: Record<string, string> = {
          PROPOSED: 'processing',
          RESERVED: 'processing',
          PREPARED: 'processing',
          COMPLETED: 'shipped',
          CANCELED: 'cancelled',
          FAILED: 'cancelled',
        };
        const newStatus = statusMap[latestState || ''] || 'processing';

        await supabase.from('orders').update({ status: newStatus }).eq('square_order_id', sqOrderId);
      }
      break;
    }

    case 'subscription.created':
    case 'subscription.updated': {
      const subObj = event.data?.object as Record<string, unknown> | undefined;
      const subscription = subObj?.subscription as Record<string, unknown> | undefined;
      if (subscription) {
        const subId = subscription.id as string;
        const status = subscription.status as string;

        // Update any orders linked to this subscription
        if (status === 'CANCELED' || status === 'PAUSED') {
          await supabase.from('orders').update({
            status: status === 'CANCELED' ? 'cancelled' : 'paused',
          }).eq('subscription_id', subId);
        }
      }
      break;
    }

    case 'invoice.payment_made': {
      // Subscription renewal processed
      break;
    }

    case 'invoice.payment_failed': {
      console.error('[Square] invoice.payment_failed — dunning needed');
      break;
    }

    default:
      // Unhandled event type — no action required
  }
}

// ---------------------------------------------------------------------------
// POST handler — store event first, then process, always return 200
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY?.trim();
  const notificationUrl = (process.env.SQUARE_WEBHOOK_URL?.trim()) ?? 'https://empire8salesdirect.com/api/square/webhook';

  const rawBody = await req.text();
  const signature = req.headers.get('x-square-hmacsha256-signature');

  if (!signatureKey) {
    console.error('[Square Webhook] SQUARE_WEBHOOK_SIGNATURE_KEY not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }
  if (!verifySquareSignature(rawBody, signature, signatureKey, notificationUrl)) {
    console.error('[Square Webhook] Signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: SquareEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    // Cannot store or process — return 500 so Square retries
    console.error('[Square Webhook] Supabase unavailable, returning 500 for Square retry');
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  // Generate a deterministic event ID (Square sends event_id in the payload)
  const eventId = event.event_id || `fallback-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  // Step 1: Store the raw event immediately — this is the critical resilience layer
  const storeResult = await storeWebhookEvent(supabase, eventId, event.type, event);

  if (storeResult === 'already_processed') {
    // Idempotent: we already handled this event successfully
    return NextResponse.json({ received: true, status: 'already_processed' });
  }

  // Step 2: Process the event. Even if processing fails, we have the payload stored.
  try {
    await processSquareEvent(event, supabase);
    await markEventProcessed(supabase, eventId);
  } catch (processingError) {
    const errorMsg = processingError instanceof Error ? processingError.message : 'Unknown processing error';
    console.error('[Square Webhook] Processing failed for event', eventId, errorMsg);
    await markEventFailed(supabase, eventId, errorMsg);
    // Still return 200 — we have the event stored and can retry via admin
  }

  // Always return 200 after storing the event. Square does not need to retry
  // because we have the full payload persisted for our own retry mechanism.
  return NextResponse.json({ received: true });
}
