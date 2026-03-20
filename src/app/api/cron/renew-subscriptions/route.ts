import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSupabaseServer } from '@/lib/supabase-server';
import { squareClient, SQUARE_LOCATION_ID } from '@/lib/square';
import PRODUCTS, { getCasePriceForQuantity } from '@/lib/products';
import {
  sendRenewalReminderEmail,
  sendAutoshipReceiptEmail,
  sendPaymentFailedEmail,
} from '@/lib/email';
import { computeNextRenewal, type SubscriptionFrequency } from '@/lib/subscriptions';

// ---------------------------------------------------------------------------
// GET /api/cron/renew-subscriptions
// Vercel Cron hits this daily. Protected by CRON_SECRET header.
//
// Primary flow: charge card on file directly, send receipt.
// Fallback flow: if no card stored, create a payment link and email it.
// ---------------------------------------------------------------------------

interface SubItem {
  readonly slug: string;
  readonly name: string;
  readonly quantity: number;
  readonly purchaseUnit: string;
}

/** Calculate line items and total for a subscription. */
function buildLineItemsAndTotal(
  items: readonly SubItem[],
  discountPct: number,
): {
  lineItems: Array<{
    name: string;
    quantity: string;
    basePriceMoney: { amount: bigint; currency: 'USD' };
    note: string;
  }>;
  totalCents: number;
} {
  const totalCaseCount = items
    .filter((i) => i.purchaseUnit === 'case')
    .reduce((sum, i) => sum + i.quantity, 0);

  const discountMultiplier = 1 - discountPct / 100;
  let totalCents = 0;

  const lineItems = items.map((item) => {
    const product = PRODUCTS.find((p) => p.slug === item.slug);
    if (!product) {
      throw new Error(`Unknown product slug: ${item.slug}`);
    }

    let basePrice: number;
    if (item.purchaseUnit === 'case' && product.casePrice != null) {
      basePrice = getCasePriceForQuantity(product, totalCaseCount);
    } else if (item.purchaseUnit === 'box' && product.boxPrice != null) {
      basePrice = product.boxPrice;
    } else {
      basePrice = product.price;
    }

    const discountedPrice = Math.round(basePrice * discountMultiplier * 100) / 100;
    const itemTotalCents = Math.round(discountedPrice * 100) * item.quantity;
    totalCents += itemTotalCents;

    const unitLabel = item.purchaseUnit === 'case' ? ' (Case of 10)' : ' (Box)';

    return {
      name: `${item.name}${unitLabel} — Subscribe & Save`,
      quantity: String(item.quantity),
      basePriceMoney: {
        amount: BigInt(Math.round(discountedPrice * 100)),
        currency: 'USD' as const,
      },
      note: `Subscription renewal — ${Math.round(discountPct)}% off`,
    };
  });

  return { lineItems, totalCents };
}

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sets this automatically for cron jobs)
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable.' }, { status: 500 });
  }

  if (!squareClient || !SQUARE_LOCATION_ID) {
    return NextResponse.json({ error: 'Square not configured.' }, { status: 500 });
  }

  const now = new Date().toISOString();

  // Fetch active subscriptions due for renewal
  const { data: dueSubs, error: queryError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('status', 'active')
    .lte('next_renewal_at', now)
    .limit(50); // Process in batches to stay within function timeout

  if (queryError) {
    console.error('[Cron] Failed to query subscriptions:', queryError.message);
    return NextResponse.json({ error: 'Query failed.' }, { status: 500 });
  }

  if (!dueSubs || dueSubs.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No subscriptions due.' });
  }

  let charged = 0;
  let linkedFallback = 0;
  let errors = 0;

  for (const sub of dueSubs) {
    try {
      const items = sub.items as SubItem[];

      if (!items || items.length === 0) {
        console.warn(`[Cron] Subscription ${sub.id} has no items, skipping.`);
        continue;
      }

      const { lineItems, totalCents } = buildLineItemsAndTotal(items, sub.discount_pct);
      const hasCardOnFile = sub.square_card_id && sub.square_customer_id;

      // -----------------------------------------------------------------------
      // PRIMARY FLOW: Auto-charge card on file
      // -----------------------------------------------------------------------
      if (hasCardOnFile) {
        try {
          const idempotencyKey = `renewal-${sub.id}-${new Date().toISOString().slice(0, 10)}`;

          const paymentResponse = await squareClient.payments.create({
            sourceId: sub.square_card_id,
            customerId: sub.square_customer_id,
            idempotencyKey,
            amountMoney: {
              amount: BigInt(totalCents),
              currency: 'USD',
            },
            locationId: SQUARE_LOCATION_ID,
            note: `Autoship renewal for subscription ${sub.id}`,
            referenceId: `sub-${sub.id}`,
          });

          const paymentResult = paymentResponse.payment;

          if (!paymentResult || paymentResult.status !== 'COMPLETED') {
            throw new Error(`Payment not completed: ${paymentResult?.status ?? 'no response'}`);
          }

          // Payment succeeded — advance renewal date
          const nextRenewal = computeNextRenewal(sub.frequency as SubscriptionFrequency);

          await supabase
            .from('subscriptions')
            .update({
              next_renewal_at: nextRenewal.toISOString(),
              last_renewed_at: now,
              square_order_id: paymentResult.orderId ?? null,
              payment_failed_at: null, // Clear any previous failure
            })
            .eq('id', sub.id);

          // Send receipt email (non-blocking)
          try {
            await sendAutoshipReceiptEmail(sub.email, {
              subscriptionId: sub.id,
              items: items.map((i) => ({
                name: i.name,
                quantity: i.quantity,
                purchaseUnit: i.purchaseUnit,
              })),
              totalCents,
              discountPct: sub.discount_pct,
              nextRenewalDate: nextRenewal.toISOString(),
              cardLast4: sub.card_last4 ?? undefined,
            });
          } catch (emailErr) {
            console.error(`[Cron] Receipt email failed for ${sub.email}:`, emailErr instanceof Error ? emailErr.message : 'unknown');
          }

          charged++;
          console.log(`[Cron] Auto-charged subscription ${sub.id} for ${sub.email}, $${(totalCents / 100).toFixed(2)}`);
          continue;
        } catch (chargeErr) {
          // Card declined or payment failed
          const errorMsg = chargeErr instanceof Error ? chargeErr.message : 'Unknown charge error';
          console.error(`[Cron] Card charge failed for subscription ${sub.id}:`, errorMsg);

          // Pause the subscription and record failure
          await supabase
            .from('subscriptions')
            .update({
              status: 'paused',
              payment_failed_at: now,
            })
            .eq('id', sub.id);

          // Send payment failed email with link to update card
          try {
            const origin = 'https://empire8ny.com';
            await sendPaymentFailedEmail(sub.email, {
              subscriptionId: sub.id,
              items: items.map((i) => ({
                name: i.name,
                quantity: i.quantity,
                purchaseUnit: i.purchaseUnit,
              })),
              accountUrl: `${origin}/account`,
              cardLast4: sub.card_last4 ?? undefined,
            });
          } catch (emailErr) {
            console.error(`[Cron] Payment-failed email failed for ${sub.email}:`, emailErr instanceof Error ? emailErr.message : 'unknown');
          }

          errors++;
          continue;
        }
      }

      // -----------------------------------------------------------------------
      // FALLBACK FLOW: No card on file — create a payment link (legacy)
      // -----------------------------------------------------------------------
      const origin = 'https://empire8ny.com';
      const response = await squareClient.checkout.paymentLinks.create({
        idempotencyKey: randomUUID(),
        order: {
          locationId: SQUARE_LOCATION_ID,
          lineItems,
          metadata: {
            autoship: 'true',
            subscription_id: sub.id,
            source: 'empire8ny.com',
            renewal: 'true',
          },
        },
        checkoutOptions: {
          merchantSupportEmail: 'info@empire8ny.com',
          allowTipping: false,
          redirectUrl: `${origin}/checkout/success?renewal=true`,
          askForShippingAddress: true,
        },
      });

      const paymentLink = response.paymentLink;
      if (!paymentLink?.url) {
        throw new Error('Square did not return a payment link.');
      }

      // Email the customer with the payment link
      await sendRenewalReminderEmail(sub.email, {
        subscriptionId: sub.id,
        items: items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          purchaseUnit: i.purchaseUnit,
        })),
        frequency: sub.frequency,
        discountPct: sub.discount_pct,
        checkoutUrl: paymentLink.url,
      });

      // Do NOT advance next_renewal_at yet — wait for the webhook to confirm payment.
      // Store the pending order ID so the webhook can match it back to this subscription.
      await supabase
        .from('subscriptions')
        .update({
          square_order_id: paymentLink.orderId ?? null,
        })
        .eq('id', sub.id);

      linkedFallback++;
      console.log(`[Cron] Sent payment link for subscription ${sub.id} (no card on file) to ${sub.email}. Renewal date will advance after payment.`);
    } catch (err) {
      errors++;
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[Cron] Failed to process subscription ${sub.id}:`, msg);
    }
  }

  return NextResponse.json({
    charged,
    linkedFallback,
    errors,
    total: dueSubs.length,
    message: `Processed ${charged + linkedFallback} of ${dueSubs.length} subscriptions (${charged} auto-charged, ${linkedFallback} payment links).`,
  });
}
