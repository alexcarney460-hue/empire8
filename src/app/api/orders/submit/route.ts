import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { getAuthenticatedDispensary } from '@/lib/dispensary-auth';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { sendBrandOrderEmails } from '@/lib/order-emails';

/* -- Types ----------------------------------------------------------------- */

interface SubmitCartItem {
  productId: string;
  brandId: string;
  brandName: string;
  productName: string;
  unitPriceCents: number;
  quantity: number;
  imageUrl: string | null;
  unitType: string;
}

/* -- Helpers --------------------------------------------------------------- */

/**
 * Generate a unique order number in the format E8-YYYYMMDD-XXXX.
 * The 4-char suffix is a random alphanumeric string.
 */
function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `E8-${y}${m}${d}-${suffix}`;
}

function isValidCartItem(item: unknown): item is SubmitCartItem {
  if (typeof item !== 'object' || item === null) return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.productId === 'string' &&
    obj.productId.length > 0 &&
    typeof obj.brandId === 'string' &&
    obj.brandId.length > 0 &&
    typeof obj.brandName === 'string' &&
    typeof obj.productName === 'string' &&
    typeof obj.unitPriceCents === 'number' &&
    Number.isInteger(obj.unitPriceCents) &&
    obj.unitPriceCents >= 0 &&
    typeof obj.quantity === 'number' &&
    Number.isInteger(obj.quantity) &&
    obj.quantity >= 1 &&
    obj.quantity <= 10_000 &&
    typeof obj.unitType === 'string' &&
    (obj.imageUrl === null || typeof obj.imageUrl === 'string')
  );
}

/* -- Route Handler --------------------------------------------------------- */

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(req);
    if (!rateLimit(`dispensary-order:${ip}`, 5, 60_000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      );
    }

    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 },
      );
    }

    // Authenticate -- session required
    const dispensary = await getAuthenticatedDispensary();
    if (!dispensary) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 },
      );
    }

    // Parse body
    const body = await req.json();
    const rawItems = body?.items;

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty.' },
        { status: 400 },
      );
    }

    if (rawItems.length > 200) {
      return NextResponse.json(
        { error: 'Too many items in cart.' },
        { status: 400 },
      );
    }

    // Validate each item
    const items: SubmitCartItem[] = [];
    for (const raw of rawItems) {
      if (!isValidCartItem(raw)) {
        return NextResponse.json(
          { error: 'Invalid cart item data.' },
          { status: 400 },
        );
      }
      items.push(raw);
    }

    // Server-side price verification: query brand_products for real prices
    const productIds = items.map((item) => item.productId);
    const { data: dbProducts, error: productsError } = await supabase
      .from('brand_products')
      .select('id, unit_price_cents, is_active')
      .in('id', productIds);

    if (productsError) {
      console.error('[orders/submit] Failed to fetch product prices:', productsError.message);
      return NextResponse.json(
        { error: 'Failed to verify product prices. Please try again.' },
        { status: 500 },
      );
    }

    // Build a price lookup map from the database
    const priceMap = new Map<string, number>();
    for (const p of dbProducts ?? []) {
      if (p.is_active) {
        priceMap.set(p.id, p.unit_price_cents);
      }
    }

    // Filter items to only those with valid, active products and use server prices
    const warnings: string[] = [];
    const verifiedItems = items.filter((item) => {
      const serverPrice = priceMap.get(item.productId);
      if (serverPrice === undefined) {
        warnings.push(`Product "${item.productName}" is unavailable and was skipped.`);
        return false;
      }
      return true;
    });

    if (verifiedItems.length === 0) {
      return NextResponse.json(
        { error: 'None of the products in your cart are currently available.' },
        { status: 400 },
      );
    }

    // Calculate order total using server-side prices
    const totalCents = verifiedItems.reduce((sum, item) => {
      const serverPrice = priceMap.get(item.productId)!;
      return sum + serverPrice * item.quantity;
    }, 0);

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Insert sales_orders row using dispensary_id
    const { data: orderRow, error: orderError } = await supabase
      .from('sales_orders')
      .insert({
        order_number: orderNumber,
        dispensary_id: dispensary.id,
        status: 'submitted',
        total_cents: totalCents,
        item_count: verifiedItems.reduce((s, i) => s + i.quantity, 0),
        notes: null,
      })
      .select('id, order_number')
      .single();

    if (orderError || !orderRow) {
      console.error('[orders/submit] Failed to create sales_orders row:', orderError?.message);
      return NextResponse.json(
        { error: 'Failed to create order. Please try again.' },
        { status: 500 },
      );
    }

    // Insert sales_order_items rows using server-side prices
    const orderItems = verifiedItems.map((item) => {
      const serverPrice = priceMap.get(item.productId)!;
      return {
        order_id: orderRow.id,
        product_id: item.productId,
        brand_id: item.brandId,
        brand_name: item.brandName,
        product_name: item.productName,
        unit_price_cents: serverPrice,
        quantity: item.quantity,
        line_total_cents: serverPrice * item.quantity,
        image_url: item.imageUrl,
        unit_type: item.unitType,
      };
    });

    const { error: itemsError } = await supabase
      .from('sales_order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('[orders/submit] Failed to create order items:', itemsError.message);
      // Rollback: delete the sales_orders row since items failed
      const { error: deleteError } = await supabase
        .from('sales_orders')
        .delete()
        .eq('id', orderRow.id);
      if (deleteError) {
        console.error('[orders/submit] Failed to rollback order row:', deleteError.message);
      }
      return NextResponse.json(
        { error: 'Failed to save order items. Please try again.' },
        { status: 500 },
      );
    }

    // Send brand-split order emails (fire-and-forget to avoid blocking response)
    sendBrandOrderEmails(orderRow.id).then((emailResult) => {
      const failedBrands = emailResult.brandResults.filter((r) => !r.success);
      if (failedBrands.length > 0) {
        console.error(
          '[orders/submit] Brand emails failed:',
          failedBrands.map((f) => `${f.brandName}: ${f.error}`).join(', '),
        );
      }
      if (!emailResult.dispensaryResult.success) {
        console.error('[orders/submit] Dispensary confirmation failed:', emailResult.dispensaryResult.error);
      }
      if (!emailResult.adminResult.success) {
        console.error('[orders/submit] Admin notification failed:', emailResult.adminResult.error);
      }
      console.log(`[orders/submit] Order emails processed for ${orderRow.order_number}`);
    }).catch((err) => {
      console.error('[orders/submit] Email sending threw:', err instanceof Error ? err.message : err);
    });

    return NextResponse.json({
      ok: true,
      orderId: orderRow.id,
      orderNumber: orderRow.order_number,
      ...(warnings.length > 0 ? { warnings } : {}),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    console.error('[orders/submit] Unexpected error:', msg);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
