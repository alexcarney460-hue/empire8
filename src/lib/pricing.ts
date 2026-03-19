import type { AccountType } from '@/lib/account';

// Discount tiers — Wholesale saves $10/case, Distribution saves $20/case off $80 retail
export const DISCOUNTS: Record<AccountType, number> = {
  retail:       0,      // full price ($80/case, $8/box)
  wholesale:    0.125,  // $70/case ($7/box) — save $10/case
  distribution: 0.25,   // $60/case ($6/box) — save $20/case
};

export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function priceForAccount(baseRetailPrice: number, accountType: AccountType): number {
  const discount = DISCOUNTS[accountType] ?? 0;
  return roundMoney(baseRetailPrice * (1 - discount));
}

export function formatPrice(n: number): string {
  return `$${n.toFixed(2)}`;
}

// Minimum order quantities per tier
export const MIN_ORDER: Record<AccountType, number> = {
  retail:       1,     // 1–29 cases
  wholesale:    30,    // 30+ cases
  distribution: 120,   // 120+ cases
};

// Qualification thresholds (case volume to qualify for each tier)
export const TIER_THRESHOLDS = {
  wholesale:    { min: 30,  label: '30+ cases' },
  distribution: { min: 120, label: '120+ cases' },
};
