'use client';

import { useEffect, useRef } from 'react';
import { trackPurchase, fbTrackPurchase } from '@/lib/analytics';

/**
 * Fires GA4 `purchase` and Meta Pixel `Purchase` conversion events once
 * on mount. Uses a ref guard to prevent duplicate firing on React strict-mode
 * double-renders or fast-refresh.
 *
 * The order ID and total come from URL search params set by the checkout API
 * redirect (e.g. /checkout/success?orderId=abc&total=123.45).
 */
export default function TrackPurchase() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('orderId') ?? params.get('order_id') ?? 'unknown';
    const total = parseFloat(params.get('total') ?? '0');

    if (total <= 0) return;

    // We don't have full line items on the success page (cart is cleared),
    // so fire with minimal data. The server-side webhook is the source of
    // truth for revenue — this is for attribution signals only.
    trackPurchase(orderId, total, []);
    fbTrackPurchase(orderId, total, []);
  }, []);

  return null;
}
