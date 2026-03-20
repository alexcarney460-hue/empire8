import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSupabaseServer } from '@/lib/supabase-server';
import { squareClient, SQUARE_LOCATION_ID } from '@/lib/square';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import PRODUCTS, { getCasePriceForQuantity } from '@/lib/products';

type Params = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// POST /api/subscriptions/:id/update-card
//
// Creates a Square checkout link for the subscription's next renewal amount.
// When the customer pays through it, the webhook captures the new card on file
// and updates the subscription. This also acts as the next renewal payment.
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ip = getClientIp(req);
  if (!rateLimit(`sub-update-card:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable.' }, { status: 500 });
  }

  // Require authenticated session
  const authHeader = req.headers.get('authorization');
  const sbCookieMatch = req.headers.get('cookie')?.match(/sb-[^=]+-auth-token=([^;]+)/);
  const token = sbCookieMatch?.[1] || authHeader?.replace('Bearer ', '') || null;
  if (!token) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user?.email) {
    return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 });
  }

  if (!squareClient || !SQUARE_LOCATION_ID) {
    return NextResponse.json({ error: 'Square not configured.' }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  // Verify subscription exists
  const { data: sub, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !sub) {
    return NextResponse.json({ error: 'Subscription not found.' }, { status: 404 });
  }

  // Verify the authenticated user owns this subscription
  if (user.email.toLowerCase() !== sub.email) {
    return NextResponse.json({ error: 'You can only update your own subscriptions.' }, { status: 403 });
  }

  if (sub.status === 'cancelled') {
    return NextResponse.json({ error: 'Cancelled subscriptions cannot update payment method.' }, { status: 400 });
  }

  // Build line items from subscription items for the checkout link
  const items = sub.items as Array<{
    slug: string;
    name: string;
    quantity: number;
    purchaseUnit: string;
  }>;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'Subscription has no items.' }, { status: 400 });
  }

  const totalCaseCount = items
    .filter((i) => i.purchaseUnit === 'case')
    .reduce((sum, i) => sum + i.quantity, 0);

  const discountMultiplier = 1 - sub.discount_pct / 100;

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
    const unitLabel = item.purchaseUnit === 'case' ? ' (Case of 10)' : ' (Box)';

    return {
      name: `${item.name}${unitLabel} — Subscribe & Save`,
      quantity: String(item.quantity),
      basePriceMoney: {
        amount: BigInt(Math.round(discountedPrice * 100)),
        currency: 'USD' as const,
      },
      note: `Subscription renewal — ${Math.round(sub.discount_pct)}% off`,
    };
  });

  const origin = 'https://empire8salesdirect.com';

  try {
    const response = await squareClient.checkout.paymentLinks.create({
      idempotencyKey: randomUUID(),
      order: {
        locationId: SQUARE_LOCATION_ID,
        lineItems,
        metadata: {
          autoship: 'true',
          subscription_id: sub.id,
          source: 'empire8salesdirect.com',
          renewal: 'true',
          update_card: 'true',
        },
      },
      checkoutOptions: {
        merchantSupportEmail: 'info@empire8salesdirect.com',
        allowTipping: false,
        redirectUrl: `${origin}/checkout/success?renewal=true&card_updated=true`,
        askForShippingAddress: true,
      },
    });

    const paymentLink = response.paymentLink;
    if (!paymentLink?.url) {
      throw new Error('Square did not return a payment link.');
    }

    return NextResponse.json({
      checkoutUrl: paymentLink.url,
      message: 'Complete this checkout to update your payment method and process your next renewal.',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[UpdateCard] Failed to create checkout link for subscription ${id}:`, msg);
    return NextResponse.json({ error: 'Failed to create checkout link.' }, { status: 500 });
  }
}
