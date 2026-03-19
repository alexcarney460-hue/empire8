/**
 * Analytics utility — Google Analytics 4 (GA4) + Meta Pixel
 *
 * All functions are safe to call server-side (they no-op when window is unavailable).
 * GA4 events follow the recommended e-commerce event schema:
 *   https://developers.google.com/analytics/devguides/collection/ga4/reference/events
 * Meta Pixel events follow the standard event spec:
 *   https://developers.facebook.com/docs/meta-pixel/reference
 */

/* ── Types ─────────────────────────────────────────────────────────────── */

type GtagParams = Record<string, unknown>;

interface ProductItem {
  id: string;
  name: string;
  price: number;
  category?: string;
  variant?: string;
  brand?: string;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function hasGtag(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

function hasFbq(): boolean {
  return typeof window !== 'undefined' && typeof window.fbq === 'function';
}

/* ── GA4 Events ─────────────────────────────────────────────────────────── */

/** Generic GA4 event wrapper */
export function trackEvent(name: string, params?: GtagParams): void {
  if (!hasGtag()) return;
  window.gtag!('event', name, params ?? {});
}

/** GA4 `view_item` — fire on product page load */
export function trackViewItem(item: ProductItem): void {
  if (!hasGtag()) return;
  window.gtag!('event', 'view_item', {
    currency: 'USD',
    value: item.price,
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        item_category: item.category,
        item_variant: item.variant,
        item_brand: item.brand ?? 'Empire 8 Sales Direct',
        quantity: 1,
      },
    ],
  });
}

/** GA4 `add_to_cart` — fire when an item is added to cart */
export function trackAddToCart(
  item: ProductItem,
  quantity: number,
  value: number,
): void {
  if (!hasGtag()) return;
  window.gtag!('event', 'add_to_cart', {
    currency: 'USD',
    value,
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        item_category: item.category,
        item_variant: item.variant,
        item_brand: item.brand ?? 'Empire 8 Sales Direct',
        quantity,
      },
    ],
  });
}

/** GA4 `purchase` — fire on checkout success */
export function trackPurchase(
  orderId: string,
  total: number,
  items: Array<ProductItem & { quantity: number }>,
): void {
  if (!hasGtag()) return;
  window.gtag!('event', 'purchase', {
    transaction_id: orderId,
    currency: 'USD',
    value: total,
    items: items.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      item_category: item.category,
      item_variant: item.variant,
      item_brand: item.brand ?? 'Empire 8 Sales Direct',
      quantity: item.quantity,
    })),
  });
}

/* ── Meta Pixel Events ──────────────────────────────────────────────────── */

/** Generic Meta Pixel event wrapper */
export function fbTrackEvent(name: string, params?: Record<string, unknown>): void {
  if (!hasFbq()) return;
  if (params) {
    window.fbq!('track', name, params);
  } else {
    window.fbq!('track', name);
  }
}

/** Meta Pixel `ViewContent` — fire on product page load */
export function fbTrackViewContent(item: ProductItem): void {
  fbTrackEvent('ViewContent', {
    content_ids: [item.id],
    content_name: item.name,
    content_type: 'product',
    value: item.price,
    currency: 'USD',
  });
}

/** Meta Pixel `AddToCart` */
export function fbTrackAddToCart(
  item: ProductItem,
  quantity: number,
  value: number,
): void {
  fbTrackEvent('AddToCart', {
    content_ids: [item.id],
    content_name: item.name,
    content_type: 'product',
    value,
    currency: 'USD',
    num_items: quantity,
  });
}

/** Meta Pixel `InitiateCheckout` */
export function fbTrackInitiateCheckout(
  value: number,
  numItems: number,
): void {
  fbTrackEvent('InitiateCheckout', {
    value,
    currency: 'USD',
    num_items: numItems,
  });
}

/** Meta Pixel `Purchase` */
export function fbTrackPurchase(
  orderId: string,
  total: number,
  items: Array<ProductItem & { quantity: number }>,
): void {
  fbTrackEvent('Purchase', {
    content_ids: items.map((i) => i.id),
    content_type: 'product',
    value: total,
    currency: 'USD',
    num_items: items.reduce((sum, i) => sum + i.quantity, 0),
    order_id: orderId,
  });
}
