// ---------------------------------------------------------------------------
// Subscription helper utilities
// ---------------------------------------------------------------------------

export type SubscriptionFrequency = 'monthly' | 'biweekly' | 'quarterly';

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

export interface SubscriptionItem {
  readonly slug: string;
  readonly name: string;
  readonly quantity: number;
  readonly purchaseUnit: 'box' | 'case';
}

export interface Subscription {
  readonly id: string;
  readonly email: string;
  readonly contact_id: number | null;
  readonly status: SubscriptionStatus;
  readonly items: readonly SubscriptionItem[];
  readonly frequency: SubscriptionFrequency;
  readonly discount_pct: number;
  readonly next_renewal_at: string;
  readonly last_renewed_at: string | null;
  readonly square_order_id: string | null;
  readonly square_customer_id: string | null;
  readonly square_card_id: string | null;
  readonly card_last4: string | null;
  readonly payment_failed_at: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

/** Compute the next renewal date from now based on frequency. */
export function computeNextRenewal(
  frequency: SubscriptionFrequency,
  from: Date = new Date(),
): Date {
  const next = new Date(from);
  switch (frequency) {
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'monthly':
    default:
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
}

/** Human-readable frequency label. */
export function frequencyLabel(frequency: SubscriptionFrequency): string {
  switch (frequency) {
    case 'biweekly':
      return 'Every 2 Weeks';
    case 'quarterly':
      return 'Every 3 Months';
    case 'monthly':
    default:
      return 'Monthly';
  }
}

const VALID_FREQUENCIES: readonly string[] = ['monthly', 'biweekly', 'quarterly'];
const VALID_STATUSES: readonly string[] = ['active', 'paused', 'cancelled'];

export function isValidFrequency(v: unknown): v is SubscriptionFrequency {
  return typeof v === 'string' && VALID_FREQUENCIES.includes(v);
}

export function isValidStatus(v: unknown): v is SubscriptionStatus {
  return typeof v === 'string' && VALID_STATUSES.includes(v);
}
