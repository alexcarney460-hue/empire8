import { NextRequest, NextResponse } from 'next/server';
import { getTracking } from '@/lib/shippo';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * GET /api/shipping/track?carrier=usps&tracking=1234567890
 * Returns tracking status for a shipment.
 */
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!rateLimit(`ship-track:${ip}`, 20, 60_000)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }
    const carrier = req.nextUrl.searchParams.get('carrier');
    const tracking = req.nextUrl.searchParams.get('tracking');

    if (!carrier || !tracking) {
      return NextResponse.json({ error: 'Missing carrier or tracking number' }, { status: 400 });
    }

    const status = await getTracking(carrier, tracking);
    if (!status) {
      return NextResponse.json({ error: 'Shippo is not configured' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, ...status });
  } catch (err) {
    console.error('[Shipping] tracking error:', err);
    return NextResponse.json({ error: 'Failed to get tracking' }, { status: 500 });
  }
}
