/**
 * Shipping calculator for Empire 8 Sales Direct.
 *
 * Rates are weight-based. Actual carrier rates are determined by Shippo
 * at fulfillment time — these tiers are used as estimates in the cart.
 */

export type ShippingTier = {
  maxLbs: number;
  rate: number;    // flat rate estimate in USD
  label: string;
};

// Shipping estimate tiers for cart display
export const SHIPPING_TIERS: ShippingTier[] = [
  { maxLbs: 5,   rate: 7.99,  label: 'Light Package' },
  { maxLbs: 15,  rate: 12.99, label: 'Standard Package' },
  { maxLbs: 30,  rate: 18.99, label: 'Heavy Package' },
  { maxLbs: 60,  rate: 29.99, label: 'Freight — Small' },
  { maxLbs: 999, rate: 49.99, label: 'Freight — Large' },
];

// Default product weights (lbs per unit/case/box)
// Used as fallback when DB doesn't have weight_lbs
export const DEFAULT_WEIGHTS: Record<string, number> = {
  'nitrile-5mil-box':          6.5,
  'nitrile-5mil-case':        65.0,
};

export type ShippingEstimate = {
  subtotal: number;
  totalWeight: number;
  shippingCost: number;
  tierLabel: string;
};

export function calculateShipping(
  items: { slug: string; quantity: number; price: number; weightLbs?: number }[],
): ShippingEstimate {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const totalWeight = items.reduce((sum, i) => {
    const w = i.weightLbs ?? DEFAULT_WEIGHTS[i.slug] ?? 5;
    return sum + w * i.quantity;
  }, 0);

  const tier = SHIPPING_TIERS.find((t) => totalWeight <= t.maxLbs)
    ?? SHIPPING_TIERS[SHIPPING_TIERS.length - 1];

  return {
    subtotal,
    totalWeight: Math.round(totalWeight * 10) / 10,
    shippingCost: tier.rate,
    tierLabel: tier.label,
  };
}
