import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { squareClient, SQUARE_LOCATION_ID } from '@/lib/square';
import type { CartItem } from '@/context/CartContext';
import PRODUCTS, { getCasePriceForQuantity } from '@/lib/products';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!rateLimit(`checkout:${ip}`, 10, 60_000)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    if (!squareClient) {
      return NextResponse.json({ error: 'Square is not configured.' }, { status: 500 });
    }
    if (!SQUARE_LOCATION_ID) {
      return NextResponse.json({ error: 'Square location not configured.' }, { status: 500 });
    }

    const body = await req.json();
    const items: CartItem[] = body.items;
    const shipping: { carrier: string; service: string; price: number; estimatedDays: number | null } | undefined = body.shipping;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
    }
    if (!shipping || typeof shipping.price !== 'number' || shipping.price < 0) {
      return NextResponse.json({ error: 'Please select a shipping option.' }, { status: 400 });
    }

    // ── Validate every item has required fields and sane quantities ──
    for (const item of items) {
      if (!item.id || typeof item.id !== 'string') {
        return NextResponse.json({ error: 'Invalid item: missing product id.' }, { status: 400 });
      }
      if (typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity < 1) {
        return NextResponse.json({ error: `Invalid quantity for "${item.id}". Must be a positive integer.` }, { status: 400 });
      }
      if (item.quantity > 10000) {
        return NextResponse.json({ error: `Quantity for "${item.id}" exceeds maximum allowed (10,000).` }, { status: 400 });
      }
      if (item.plan && item.plan !== 'one-time' && item.plan !== 'autoship') {
        return NextResponse.json({ error: `Invalid plan "${item.plan}" for "${item.id}".` }, { status: 400 });
      }
      if (item.purchaseUnit && item.purchaseUnit !== 'box' && item.purchaseUnit !== 'case') {
        return NextResponse.json({ error: `Invalid purchaseUnit "${item.purchaseUnit}" for "${item.id}".` }, { status: 400 });
      }
    }

    // ── Server-side price validation ──
    // Reject any item whose product slug doesn't exist in our catalog
    for (const item of items) {
      const product = PRODUCTS.find((p) => p.slug === item.id);
      if (!product) {
        return NextResponse.json({ error: `Unknown product "${item.id}".` }, { status: 400 });
      }
    }

    // ── Inventory check ──
    const supabase = getSupabaseServer();
    if (supabase) {
      const { data: stockRows } = await supabase
        .from('products')
        .select('slug, quantity_on_hand');

      if (stockRows && stockRows.length > 0) {
        const stockMap = new Map(stockRows.map((r) => [r.slug, r.quantity_on_hand ?? 0]));

        for (const item of items) {
          const available = stockMap.get(item.id);
          if (available !== undefined && available < item.quantity) {
            const product = PRODUCTS.find((p) => p.slug === item.id);
            const name = product?.shortName ?? item.id;
            if (available <= 0) {
              return NextResponse.json(
                { error: `"${name}" is currently out of stock.` },
                { status: 400 },
              );
            }
            return NextResponse.json(
              { error: `Insufficient stock for "${name}". Only ${available} available.` },
              { status: 400 },
            );
          }
        }
      }
    }

    // Calculate total case count across all case items for tier pricing
    const totalCaseCount = items
      .filter((i) => i.purchaseUnit === 'case')
      .reduce((sum, i) => sum + i.quantity, 0);

    // Validate and compute canonical prices for each item
    const validatedItems = items.map((item) => {
      // Product existence already validated above, safe to assert non-null
      const product = PRODUCTS.find((p) => p.slug === item.id)!;

      let canonicalPrice: number;
      if (item.purchaseUnit === 'case' && product.casePrice != null) {
        // Use tier pricing based on total case quantity in the order
        canonicalPrice = getCasePriceForQuantity(product, totalCaseCount);
      } else if (item.purchaseUnit === 'box' && product.boxPrice != null) {
        canonicalPrice = product.boxPrice;
      } else {
        canonicalPrice = product.price;
      }

      // Apply autoship discount (10% off)
      if (item.plan === 'autoship') {
        canonicalPrice = Math.round(canonicalPrice * 0.9 * 100) / 100;
      }

      return { ...item, price: canonicalPrice };
    });

    const hasAutoship = validatedItems.some((i) => i.plan === 'autoship');
    const hasOneTime  = validatedItems.some((i) => i.plan === 'one-time');

    if (hasAutoship && hasOneTime) {
      return NextResponse.json(
        { error: 'One-time and subscription items must be purchased separately.' },
        { status: 400 }
      );
    }

    const origin = req.headers.get('origin') ?? 'https://empire8ny.com';

    // Build Square order line items using server-validated prices
    const lineItems = validatedItems.map((item) => {
      // Build descriptive name with unit and plan info
      const unitLabel = item.purchaseUnit === 'case'
        ? ' (Case of 10)'
        : item.purchaseUnit === 'box'
          ? ' (Box)'
          : '';
      const planLabel = item.plan === 'autoship' ? ' — Subscribe & Save' : '';
      const itemName = `${item.name}${unitLabel}${planLabel}`;

      const notes: string[] = [];
      if (item.plan === 'autoship') notes.push('Monthly autoship — 10% off');
      if (item.purchaseUnit === 'case') notes.push('1 case = 10 boxes (1000 gloves)');

      return {
        name: itemName,
        quantity: String(item.quantity),
        basePriceMoney: {
          amount: BigInt(Math.round(item.price * 100)),
          currency: 'USD' as const,
        },
        note: notes.length > 0 ? notes.join(' | ') : undefined,
      };
    });

    // Add customer-selected shipping rate as a line item
    const shippingLabel = `Shipping — ${shipping.carrier} ${shipping.service}`;
    lineItems.push({
      name: shippingLabel,
      quantity: '1',
      basePriceMoney: {
        amount: BigInt(Math.round(shipping.price * 100)),
        currency: 'USD' as const,
      },
      note: shipping.estimatedDays
        ? `Est. ${shipping.estimatedDays} business day${shipping.estimatedDays !== 1 ? 's' : ''}`
        : undefined,
    });

    // Create Square payment link
    const response = await squareClient.checkout.paymentLinks.create({
      idempotencyKey: randomUUID(),
      order: {
        locationId: SQUARE_LOCATION_ID,
        lineItems,
        metadata: {
          autoship: hasAutoship ? 'true' : 'false',
          source: 'empire8ny.com',
          shipping_carrier: shipping.carrier,
          shipping_service: shipping.service,
        },
      },
      checkoutOptions: {
        merchantSupportEmail: 'info@empire8ny.com',
        allowTipping: false,
        redirectUrl: `${origin}/checkout/success`,
        askForShippingAddress: true,
      },
    });

    const paymentLink = response.paymentLink;
    if (!paymentLink?.url) {
      throw new Error('Square did not return a payment link URL.');
    }

    return NextResponse.json({ url: paymentLink.url, id: paymentLink.id });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'unknown error';
    console.error('[Square] checkout error:', errMsg);
    return NextResponse.json({ error: 'Unable to start checkout.' }, { status: 500 });
  }
}
