'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────── */

interface OrderItem {
  id: string;
  brand_id: string;
  brand_name: string;
  brand_logo_url: string | null;
  product_name: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
}

interface SalesOrder {
  id: string;
  order_number: string;
  status: string;
  total_cents: number;
  notes: string | null;
  created_at: string;
  sales_order_items: OrderItem[];
}

/* ── Constants ─────────────────────────────────────────────────────── */

const COLORS = {
  card: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(200,162,60,0.12)',
  gold: '#C8A23C',
  goldSubtle: 'rgba(200,162,60,0.10)',
  textPrimary: '#fff',
  textSecondary: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.4)',
} as const;

const STATUS_BADGES: Record<string, { bg: string; color: string; label: string }> = {
  submitted: { bg: 'rgba(200,162,60,0.15)', color: '#C8A23C', label: 'Submitted' },
  processing: { bg: 'rgba(147,51,234,0.15)', color: '#a78bfa', label: 'Processing' },
  shipped: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', label: 'Shipped' },
  delivered: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80', label: 'Delivered' },
  cancelled: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', label: 'Cancelled' },
};

/* ── Helpers ───────────────────────────────────────────────────────── */

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getStatusBadge(status: string) {
  return STATUS_BADGES[status] ?? { bg: 'rgba(255,255,255,0.08)', color: COLORS.textSecondary, label: status };
}

/* ── Brand group helper ────────────────────────────────────────────── */

interface BrandGroup {
  brandId: string;
  brandName: string;
  brandLogoUrl: string | null;
  items: OrderItem[];
  subtotalCents: number;
}

function groupByBrand(items: OrderItem[]): BrandGroup[] {
  const map = new Map<string, BrandGroup>();
  for (const item of items) {
    const existing = map.get(item.brand_id);
    if (existing) {
      map.set(item.brand_id, {
        ...existing,
        items: [...existing.items, item],
        subtotalCents: existing.subtotalCents + item.line_total_cents,
      });
    } else {
      map.set(item.brand_id, {
        brandId: item.brand_id,
        brandName: item.brand_name,
        brandLogoUrl: item.brand_logo_url,
        items: [item],
        subtotalCents: item.line_total_cents,
      });
    }
  }
  return Array.from(map.values());
}

/* ── Page ──────────────────────────────────────────────────────────── */

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/dashboard/orders/${orderId}`);
        if (cancelled) return;

        if (!res.ok) {
          setError(res.status === 404 ? 'Order not found.' : 'Unable to load order.');
          setLoading(false);
          return;
        }

        const json = await res.json();
        if (cancelled) return;

        if (json.ok) {
          setOrder(json.data);
        } else {
          setError(json.error || 'Failed to load order.');
        }
      } catch {
        if (!cancelled) setError('Unable to load order.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [orderId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: `3px solid ${COLORS.cardBorder}`,
            borderTopColor: COLORS.gold,
            animation: 'e8-spin 0.7s linear infinite',
          }}
        />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <Link
          href="/dashboard/orders"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.82rem',
            color: COLORS.gold,
            textDecoration: 'none',
            marginBottom: 20,
          }}
        >
          <ArrowLeft size={14} /> Back to Orders
        </Link>
        <div
          style={{
            backgroundColor: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 12,
            padding: '20px 24px',
            color: '#f87171',
            fontSize: '0.88rem',
          }}
        >
          {error || 'Order not found.'}
        </div>
      </div>
    );
  }

  const badge = getStatusBadge(order.status);
  const brandGroups = groupByBrand(order.sales_order_items ?? []);

  return (
    <div>
      {/* Back link */}
      <Link
        href="/dashboard/orders"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: '0.82rem',
          color: COLORS.gold,
          textDecoration: 'none',
          marginBottom: 24,
        }}
      >
        <ArrowLeft size={14} /> Back to Orders
      </Link>

      {/* Order header */}
      <div
        style={{
          backgroundColor: COLORS.card,
          border: `1px solid ${COLORS.cardBorder}`,
          borderRadius: 16,
          padding: '28px 24px',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 'clamp(1.3rem, 3vw, 1.75rem)',
                fontWeight: 700,
                color: COLORS.textPrimary,
                margin: '0 0 8px 0',
              }}
            >
              Order #{order.order_number}
            </h1>
            <p style={{ fontSize: '0.88rem', color: COLORS.textSecondary, margin: 0 }}>
              Placed on {formatDate(order.created_at)}
            </p>
          </div>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              backgroundColor: badge.bg,
              color: badge.color,
              borderRadius: 9999,
              padding: '5px 14px',
            }}
          >
            {badge.label}
          </span>
        </div>

        {order.notes && (
          <div
            style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 10,
              padding: '12px 16px',
            }}
          >
            <p
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: COLORS.textMuted,
                margin: '0 0 6px 0',
                fontFamily: "'Barlow', Arial, sans-serif",
              }}
            >
              Notes
            </p>
            <p style={{ fontSize: '0.85rem', color: COLORS.textSecondary, margin: 0, lineHeight: 1.6 }}>
              {order.notes}
            </p>
          </div>
        )}
      </div>

      {/* Line items grouped by brand */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {brandGroups.map((group) => (
          <div
            key={group.brandId}
            style={{
              backgroundColor: COLORS.card,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            {/* Brand header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: `1px solid ${COLORS.cardBorder}`,
                backgroundColor: COLORS.goldSubtle,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {group.brandLogoUrl && (
                  <img
                    src={group.brandLogoUrl}
                    alt={group.brandName}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      objectFit: 'cover',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                    }}
                  />
                )}
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: COLORS.textPrimary }}>
                  {group.brandName}
                </span>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: COLORS.gold }}>
                {formatCurrency(group.subtotalCents)}
              </span>
            </div>

            {/* Items */}
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ padding: '4px 0', minWidth: 420 }}>
              {/* Column headers */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 60px 90px 90px',
                  gap: 8,
                  padding: '10px 20px',
                  borderBottom: `1px solid ${COLORS.cardBorder}`,
                }}
              >
                {['Product', 'Qty', 'Unit Price', 'Total'].map((header) => (
                  <span
                    key={header}
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: COLORS.textMuted,
                      fontFamily: "'Barlow', Arial, sans-serif",
                      textAlign: header !== 'Product' ? 'right' : 'left',
                    }}
                  >
                    {header}
                  </span>
                ))}
              </div>

              {group.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 60px 90px 90px',
                    gap: 8,
                    padding: '12px 20px',
                    borderBottom: `1px solid rgba(200,162,60,0.06)`,
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', color: COLORS.textPrimary }}>
                    {item.product_name}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: COLORS.textSecondary, textAlign: 'right' }}>
                    {item.quantity}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: COLORS.textMuted, textAlign: 'right' }}>
                    {formatCurrency(item.unit_price_cents)}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: COLORS.textPrimary, textAlign: 'right' }}>
                    {formatCurrency(item.line_total_cents)}
                  </span>
                </div>
              ))}
            </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order total */}
      <div
        style={{
          backgroundColor: COLORS.card,
          border: `1px solid ${COLORS.cardBorder}`,
          borderRadius: 16,
          padding: '20px 24px',
          marginTop: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: '0.92rem',
            fontWeight: 700,
            color: COLORS.textPrimary,
          }}
        >
          Order Total
        </span>
        <span
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: COLORS.gold,
          }}
        >
          {formatCurrency(order.total_cents)}
        </span>
      </div>
    </div>
  );
}
