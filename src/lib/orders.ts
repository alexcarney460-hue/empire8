import type { CartItem } from '@/context/DispensaryCartContext';

/* ── Types ─────────────────────────────────────────────────────────── */

export interface SubmitOrderResult {
  orderId: string;
  orderNumber: string;
}

export interface OrderLineItem {
  productId: string;
  brandId: string;
  brandName: string;
  productName: string;
  unitPriceCents: number;
  quantity: number;
  imageUrl: string | null;
  unitType: string;
}

export interface OrderBrandGroup {
  brandId: string;
  brandName: string;
  items: ReadonlyArray<OrderLineItem>;
  subtotalCents: number;
}

export type OrderStatus = 'submitted' | 'processing' | 'shipped' | 'delivered';

export interface OrderDetails {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  items: ReadonlyArray<OrderLineItem>;
  totalCents: number;
  notes: string | null;
  brands: ReadonlyArray<{ brandId: string; brandName: string }>;
  createdAt: string;
  updatedAt: string;
  statusHistory: ReadonlyArray<{
    status: OrderStatus;
    date: string;
  }>;
}

/* ── Helpers ───────────────────────────────────────────────────────── */

/** Format cents as "$X.XX" */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Group order items by brand (immutable) */
export function groupItemsByBrand(
  items: ReadonlyArray<OrderLineItem>,
): ReadonlyArray<OrderBrandGroup> {
  const brandMap = new Map<string, OrderBrandGroup>();

  for (const item of items) {
    const existing = brandMap.get(item.brandId);
    if (existing) {
      brandMap.set(item.brandId, {
        ...existing,
        items: [...existing.items, item],
        subtotalCents:
          existing.subtotalCents + item.unitPriceCents * item.quantity,
      });
    } else {
      brandMap.set(item.brandId, {
        brandId: item.brandId,
        brandName: item.brandName,
        items: [item],
        subtotalCents: item.unitPriceCents * item.quantity,
      });
    }
  }

  return Array.from(brandMap.values());
}

/* ── Client API ────────────────────────────────────────────────────── */

/**
 * Submit a sales order to the backend.
 *
 * POSTs to `/api/orders/submit` with the cart items and optional notes.
 * Returns the new order ID and formatted order number on success.
 * Throws an Error with a user-friendly message on failure.
 *
 * Usage in DispensaryCartDrawer (or any component):
 * ```tsx
 * import { submitOrder } from '@/lib/orders';
 * import { useDispensaryCart } from '@/context/DispensaryCartContext';
 * import { useRouter } from 'next/navigation';
 *
 * const { items, clearCart, closeCart } = useDispensaryCart();
 * const router = useRouter();
 *
 * async function handleSubmit() {
 *   setLoading(true);
 *   try {
 *     const { orderId } = await submitOrder(items, notes);
 *     clearCart();
 *     closeCart();
 *     router.push(`/order-confirmation?order=${orderId}`);
 *   } catch (err) {
 *     setError(err instanceof Error ? err.message : 'Order submission failed');
 *   } finally {
 *     setLoading(false);
 *   }
 * }
 * ```
 */
export async function submitOrder(
  items: ReadonlyArray<CartItem>,
  notes?: string,
): Promise<SubmitOrderResult> {
  if (items.length === 0) {
    throw new Error('Cannot submit an empty order.');
  }

  const res = await fetch('/api/orders/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: items.map((i) => ({
        productId: i.productId,
        brandId: i.brandId,
        brandName: i.brandName,
        productName: i.productName,
        unitPriceCents: i.unitPriceCents,
        quantity: i.quantity,
        imageUrl: i.imageUrl,
        unitType: i.unitType,
      })),
      notes: notes ?? null,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.error ?? `Order submission failed (${res.status})`,
    );
  }

  if (!data.orderId || !data.orderNumber) {
    throw new Error('Invalid response from order submission.');
  }

  return {
    orderId: data.orderId as string,
    orderNumber: data.orderNumber as string,
  };
}

/**
 * Fetch order details by ID from the dashboard API.
 * Returns null if the order is not found or the user is unauthorized.
 *
 * The API returns `{ ok, data }` where data has `sales_order_items` nested.
 * This function normalizes it into the `OrderDetails` shape.
 */
export async function fetchOrderDetails(
  orderId: string,
): Promise<OrderDetails | null> {
  if (!orderId) return null;

  try {
    const res = await fetch(`/api/dashboard/orders/${orderId}`);
    if (!res.ok) return null;

    const json = await res.json();
    if (!json.ok || !json.data) return null;

    const raw = json.data;

    // Normalize line items from the sales_order_items join
    const rawItems: ReadonlyArray<Record<string, unknown>> =
      Array.isArray(raw.sales_order_items) ? raw.sales_order_items : [];

    const items: OrderLineItem[] = rawItems.map((row) => ({
      productId: String(row.product_id ?? ''),
      brandId: String(row.brand_id ?? ''),
      brandName: String(row.brand_name ?? ''),
      productName: String(row.product_name ?? ''),
      unitPriceCents: Number(row.unit_price_cents ?? 0),
      quantity: Number(row.quantity ?? 0),
      imageUrl: typeof row.image_url === 'string' ? row.image_url : null,
      unitType: String(row.unit_type ?? 'unit'),
    }));

    // Build unique brands list from items
    const brandsMap = new Map<string, string>();
    for (const item of items) {
      brandsMap.set(item.brandId, item.brandName);
    }
    const brands = Array.from(brandsMap.entries()).map(
      ([brandId, brandName]) => ({ brandId, brandName }),
    );

    // Map DB status to frontend status
    const statusMap: Record<string, OrderStatus> = {
      pending: 'submitted',
      submitted: 'submitted',
      processing: 'processing',
      shipped: 'shipped',
      delivered: 'delivered',
    };
    const status: OrderStatus = statusMap[raw.status] ?? 'submitted';

    // Build status history (synthesize if not available)
    const statusHistory: ReadonlyArray<{ status: OrderStatus; date: string }> =
      Array.isArray(raw.status_history) && raw.status_history.length > 0
        ? raw.status_history.map((h: { status: string; date: string }) => ({
            status: statusMap[h.status] ?? (h.status as OrderStatus),
            date: h.date,
          }))
        : [{ status, date: raw.created_at }];

    return {
      id: raw.id,
      orderNumber: raw.order_number,
      status,
      items,
      totalCents: raw.total_cents,
      notes: raw.notes ?? null,
      brands,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at ?? raw.created_at,
      statusHistory,
    };
  } catch {
    return null;
  }
}
