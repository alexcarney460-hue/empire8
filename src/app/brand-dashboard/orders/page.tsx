'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────── */

interface OrderItem {
  readonly id: string;
  readonly product_name: string;
  readonly quantity: number;
  readonly unit_price_cents: number;
  readonly line_total_cents: number;
}

interface Order {
  readonly id: string;
  readonly order_number: string;
  readonly status: string;
  readonly total_cents: number;
  readonly created_at: string;
  readonly dispensary_name: string;
  readonly items: readonly OrderItem[];
  readonly brand_total_cents: number;
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
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getStatusBadge(status: string) {
  return STATUS_BADGES[status] ?? { bg: 'rgba(255,255,255,0.08)', color: COLORS.textSecondary, label: status };
}

/* ── Page ──────────────────────────────────────────────────────────── */

export default function BrandOrdersPage() {
  const [orders, setOrders] = useState<readonly Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/brand-dashboard/orders');
        if (cancelled) return;

        if (!res.ok) {
          setError('Unable to load orders.');
          setLoading(false);
          return;
        }

        const json = await res.json();
        if (json.ok) setOrders(json.data ?? []);
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
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
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
          Orders containing your products. {orders.length} order{orders.length !== 1 ? 's' : ''} total.
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
          <ShoppingCart size={32} color={COLORS.textMuted} style={{ marginBottom: 16 }} />
          <p style={{ color: COLORS.textSecondary, fontSize: '0.9rem', margin: 0 }}>
            No orders yet. Orders from dispensaries will appear here.
          </p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: COLORS.card,
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '100px 1.5fr 1fr 120px 100px',
              gap: 8,
              padding: '12px 20px',
              borderBottom: `1px solid ${COLORS.cardBorder}`,
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: COLORS.textMuted,
              fontFamily: "'Barlow', Arial, sans-serif",
            }}
          >
            <span>Order #</span>
            <span>Dispensary</span>
            <span>Status</span>
            <span>Your Total</span>
            <span>Date</span>
          </div>

          {/* Rows */}
          {orders.map((order, idx) => {
            const badge = getStatusBadge(order.status);
            const isExpanded = expandedId === order.id;

            return (
              <div key={order.id}>
                <div
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 1.5fr 1fr 120px 100px',
                    gap: 8,
                    padding: '14px 20px',
                    borderBottom: isExpanded
                      ? 'none'
                      : idx < orders.length - 1
                        ? `1px solid ${COLORS.cardBorder}`
                        : 'none',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background-color 150ms ease',
                    fontSize: '0.85rem',
                  }}
                >
                  <span style={{ color: COLORS.textPrimary, fontWeight: 600 }}>
                    #{order.order_number}
                  </span>
                  <span style={{ color: COLORS.textSecondary }}>
                    {order.dispensary_name}
                  </span>
                  <span>
                    <span
                      style={{
                        fontSize: '0.62rem',
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
                  </span>
                  <span style={{ color: COLORS.textPrimary, fontWeight: 700 }}>
                    {formatCurrency(order.brand_total_cents)}
                  </span>
                  <span style={{ color: COLORS.textMuted, fontSize: '0.78rem' }}>
                    {formatDate(order.created_at)}
                  </span>
                </div>

                {/* Expanded items */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '0 20px 16px 20px',
                      borderBottom: idx < orders.length - 1 ? `1px solid ${COLORS.cardBorder}` : 'none',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.02)',
                        borderRadius: 10,
                        padding: '12px 16px',
                      }}
                    >
                      <p
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: COLORS.textMuted,
                          margin: '0 0 10px 0',
                          fontFamily: "'Barlow', Arial, sans-serif",
                        }}
                      >
                        Items from your brand
                      </p>
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '6px 0',
                            fontSize: '0.82rem',
                          }}
                        >
                          <span style={{ color: COLORS.textSecondary }}>
                            {item.product_name} x {item.quantity}
                          </span>
                          <span style={{ color: COLORS.textPrimary, fontWeight: 600 }}>
                            {formatCurrency(item.line_total_cents)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
