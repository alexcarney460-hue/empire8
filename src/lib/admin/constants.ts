/** Canonical list of admin email addresses. Import this everywhere instead of inline arrays. */
export const ADMIN_EMAILS: readonly string[] = [
  'gardenablaze@gmail.com',
  'bee@empire8ny.com',
  'mikesutherlandconsulting@gmail.com',
];

/** Product categories for the brand catalog. */
export const BRAND_CATEGORIES = [
  'Flower',
  'Concentrates',
  'Vapes',
  'Pre-Rolls',
  'Edibles',
  'Beverages',
  'Tinctures',
  'Capsules',
] as const;

/** Sequential statuses an order moves through. */
export const ORDER_STATUSES = [
  'submitted',
  'processing',
  'shipped',
  'delivered',
] as const;

/** New York cannabis license types. */
export const LICENSE_TYPES = [
  'adult_use_retail',
  'caurd_dispensary',
  'registered_organization',
] as const;

/** CRM deal pipeline stages. */
export const DEAL_STAGES = [
  'lead',
  'qualified',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
] as const;
