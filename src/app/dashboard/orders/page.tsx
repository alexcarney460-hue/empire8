'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

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
  bg: '#0F0520',
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
    month: 'short',
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

/* ── OrderRow ──────────────────────────────────────────────────────── */

function OrderRow({ order }: { order: SalesOrder }) {
  const [expanded, setExpanded] = useState(false);
  const badge = getStatusBadge(order.status);
  const itemCount = order.sales_order_items?.length ?? 0;
  const brandGroups = expanded ? groupByBrand(order.sales_order_items ?? []) : [];

  const toggleExpand = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <div
      style={{
        backgroundColor: COLORS.card,
        border: `1px solid ${COLORS.cardBorder}`,
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      {/* Summary row */}
      <button
        onClick={toggleExpand}
        aria-expanded={expanded}
        aria-label={`Order ${order.order_number}, ${badge.label}, ${formatCurrency(order.total_cents)}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '16px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: COLORS.textPrimary }}>
            #{order.order_number}
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              backgroundColor: badge.bg,
              color: badge.color,
              borderRadius: 9999,
              padding: '3px 10px',
            }}
          >
            {badge.label}
          </span>
          <span style={{ fontSize: '0.78rem', color: COLORS.textMuted }}>
            {formatDate(order.created_at)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: '0.78rem', color: COLORS.textMuted }}>
            {itemCount} item{itemCount !== 1 ? 's' : ''}
          </span>
          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: COLORS.textPrimary }}>
            {formatCurrency(order.total_cents)}
          </span>
          {expanded ? (
            <ChevronUp size={16} color={COLORS.textMuted} />
          ) : (
            <ChevronDown size={16} color={COLORS.textMuted} />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div
          style={{
            borderTop: `1px solid ${COLORS.cardBorder}`,
            padding: '16px 20px',
          }}
        >
          {brandGroups.map((group) => (
            <div key={group.brandId} style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                {group.brandLogoUrl && (
                  <img
                    src={group.brandLogoUrl}
                    alt={group.brandName}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      objectFit: 'cover',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                    }}
                  />
                )}
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: COLORS.gold }}>
                  {group.brandName}
                </span>
              </div>
              {group.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 0 6px 38px',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: '0.82rem', color: COLORS.textSecondary }}>
                    {item.product_name}
                    {item.quantity > 1 && (
                      <span style={{ color: COLORS.textMuted }}> x{item.quantity}</span>
                    )}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: COLORS.textSecondary, flexShrink: 0 }}>
                    {formatCurrency(item.line_total_cents)}
                  </span>
                </div>
              ))}
            </div>
          ))}

          <div style={{ textAlign: 'right', paddingTop: 8 }}>
            <Link
              href={`/dashboard/orders/${order.id}`}
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: COLORS.gold,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              View full details <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────── */

export default function OrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/dashboard/orders');
        if (cancelled) return;

        if (!res.ok) {
          setError('Unable to load orders. Please sign in again.');
          setLoading(false);
          return;
        }

        const json = await res.json();
        if (cancelled) return;

        if (json.ok) {
          setOrders(json.data ?? []);
        } else {
          setError(json.error || 'Failed to load orders.');
        }
      } catch {
        if (!cancelled) setError('Unable to load orders.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

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
        <style>{`@keyframes e8-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
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
        {error}
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 'clamp(1.3rem, 3vw, 1.75rem)',
            fontWeight: 700,
            color: COLORS.textPrimary,
            margin: '0 0 6px 0',
          }}
        >
          Orders
        </h1>
        <p style={{ fontSize: '0.88rem', color: COLORS.textSecondary, margin: 0 }}>
          View and track all your sales orders. Click an order to expand line items.
        </p>
      </div>

      {orders.length === 0 ? (
        <div
          style={{
            backgroundColor: COLORS.card,
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 16,
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <p style={{ color: COLORS.textSecondary, fontSize: '0.9rem', margin: '0 0 16px' }}>
            You have not placed any orders yet.
          </p>
          <Link
            href="/brands"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#1A0633',
              backgroundColor: COLORS.gold,
              textDecoration: 'none',
              borderRadius: 9999,
              padding: '10px 22px',
              fontFamily: "'Barlow', Arial, sans-serif",
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Browse Brands <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Table header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 20px 8px',
              gap: 12,
            }}
          >
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: COLORS.textMuted,
                fontFamily: "'Barlow', Arial, sans-serif",
              }}
            >
              Order
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: COLORS.textMuted,
                fontFamily: "'Barlow', Arial, sans-serif",
              }}
            >
              Total
            </span>
          </div>

          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
