import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { sendBrandOrderEmails } from '@/lib/order-emails';

/* ── Types ─────────────────────────────────────────────────────────── */

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

/* ── Helpers ───────────────────────────────────────────────────────── */

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

/* ── Route Handler ─────────────────────────────────────────────────── */

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

    // Authenticate the dispensary user via Authorization header or cookie
    const authHeader = req.headers.get('authorization');
    const accessToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    let userId: string | null = null;
    let userEmail: string | null = null;

    if (accessToken) {
      const { data, error } = await supabase.auth.getUser(accessToken);
      if (!error && data.user) {
        userId = data.user.id;
        userEmail = data.user.email ?? null;
      }
    }

    // If no auth header, try to extract from cookie (Supabase client-side auth)
    if (!userId) {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const projectRef = supabaseUrl.match(/\/\/([\w-]+)\.supabase/)?.[1] ?? 'app';
      const cookieName = `sb-${projectRef}-auth-token`;
      const cookieToken = req.cookies.get(cookieName)?.value;

      if (cookieToken) {
        const { data, error } = await supabase.auth.getUser(cookieToken);
        if (!error && data.user) {
          userId = data.user.id;
          userEmail = data.user.email ?? null;
        }
      }
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

    // Calculate order total in cents
    const totalCents = items.reduce(
      (sum, item) => sum + item.unitPriceCents * item.quantity,
      0,
    );

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Insert sales_orders row
    const { data: orderRow, error: orderError } = await supabase
      .from('sales_orders')
      .insert({
        order_number: orderNumber,
        user_id: userId,
        user_email: userEmail,
        status: 'pending',
        total_cents: totalCents,
        item_count: items.reduce((s, i) => s + i.quantity, 0),
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

    // Insert sales_order_items rows
    const orderItems = items.map((item) => ({
      order_id: orderRow.id,
      product_id: item.productId,
      brand_id: item.brandId,
      brand_name: item.brandName,
      product_name: item.productName,
      unit_price_cents: item.unitPriceCents,
      quantity: item.quantity,
      line_total_cents: item.unitPriceCents * item.quantity,
      image_url: item.imageUrl,
      unit_type: item.unitType,
    }));

    const { error: itemsError } = await supabase
      .from('sales_order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('[orders/submit] Failed to create order items:', itemsError.message);
      // Still return the order since the header was created
      // Items can be reconciled manually if needed
    }

    // Send brand-split order emails (fire-and-forget to avoid blocking response)
    if (!itemsError) {
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
    }

    return NextResponse.json({
      ok: true,
      orderId: orderRow.id,
      orderNumber: orderRow.order_number,
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
