import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * POST /api/shipping/lookup
 * Public endpoint: look up an order by email + tracking_number.
 * Returns sanitized order info (no internal IDs, no admin fields).
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!rateLimit(`ship-lookup:${ip}`, 10, 60_000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 },
      );
    }

    let body: { email?: string; tracking_number?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const email = body.email?.trim().toLowerCase();
    const trackingNumber = body.tracking_number?.trim();

    if (!email || !trackingNumber) {
      return NextResponse.json(
        { error: 'Both email and tracking number are required.' },
        { status: 400 },
      );
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 },
      );
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('status, total, currency, tracking_number, tracking_url, shipping_carrier, shipping_service, shipping_name, created_at, order_items(product_name, quantity, unit_price)')
      .ilike('email', email)
      .eq('tracking_number', trackingNumber)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: 'No order found matching that email and tracking number.' },
        { status: 404 },
      );
    }

    // Return sanitized order data (no internal IDs)
    return NextResponse.json({
      ok: true,
      order: {
        status: order.status,
        total: order.total,
        currency: order.currency || 'USD',
        tracking_number: order.tracking_number,
        tracking_url: order.tracking_url,
        shipping_carrier: order.shipping_carrier,
        shipping_service: order.shipping_service,
        shipping_name: order.shipping_name,
        created_at: order.created_at,
        items: (order.order_items || []).map((item: { product_name: string; quantity: number; unit_price: number }) => ({
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      },
    });
  } catch (err) {
    console.error('[Shipping Lookup] error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
