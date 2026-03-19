import { NextRequest, NextResponse } from 'next/server';
import { getRatesForZip } from '@/lib/shippo';
import { DEFAULT_WEIGHTS } from '@/lib/shipping';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * POST /api/shipping/estimate
 * Public endpoint — returns live Shippo rates for a zip + cart items.
 * Body: { zip, items: [{ id, quantity, price }] }
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!rateLimit(`ship-est:${ip}`, 15, 60_000)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }
    const body = await req.json();
    const { zip, items } = body;

    if (!zip || typeof zip !== 'string' || !/^\d{5}(-\d{4})?$/.test(zip.trim())) {
      return NextResponse.json({ error: 'Valid US zip code required (e.g., 93727)' }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }
    if (items.length > 100) {
      return NextResponse.json({ error: 'Too many items' }, { status: 400 });
    }

    // Calculate total weight from cart items using slug to match DEFAULT_WEIGHTS keys
    const weightLbs = items.reduce((sum: number, item: { id?: string; slug?: string; quantity?: number }) => {
      const key = item.slug || item.id || '';
      const w = DEFAULT_WEIGHTS[key] ?? 5;
      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      return sum + w * qty;
    }, 0);

    const rates = await getRatesForZip(zip.trim(), Math.max(1, weightLbs));

    return NextResponse.json({
      ok: true,
      weightLbs: Math.round(weightLbs * 10) / 10,
      rates: rates.map((r) => ({
        id: r.objectId,
        carrier: r.provider,
        service: r.servicelevel,
        price: parseFloat(r.amount),
        estimatedDays: r.estimatedDays,
        description: r.durationTerms,
      })),
    });
  } catch (err) {
    console.error('[Shipping] estimate error:', err instanceof Error ? err.message : 'unknown error');
    return NextResponse.json({ error: 'Failed to get shipping rates' }, { status: 500 });
  }
}
