'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ShoppingCart, DollarSign, ArrowRight } from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────── */

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  totalSpentCents: number;
  companyName: string;
}

interface OrderItem {
  id: string;
  brand_name: string;
  product_name: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  status: string;
  total_cents: number;
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

/* ── StatCard ──────────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Package;
}) {
  return (
    <div
      style={{
        backgroundColor: COLORS.card,
        border: `1px solid ${COLORS.cardBorder}`,
        borderRadius: 16,
        padding: '24px 22px',
        flex: '1 1 200px',
        minWidth: 180,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: COLORS.goldSubtle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Icon size={20} color={COLORS.gold} />
      </div>
      <p
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: COLORS.textMuted,
          margin: '0 0 6px 0',
          fontFamily: "'Barlow', Arial, sans-serif",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: COLORS.textPrimary,
          margin: 0,
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────── */

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/orders?limit=5'),
        ]);

        if (cancelled) return;

        if (!statsRes.ok || !ordersRes.ok) {
          setError('Unable to load dashboard data. Please sign in again.');
          setLoading(false);
          return;
        }

        const [statsJson, ordersJson] = await Promise.all([
          statsRes.json(),
          ordersRes.json(),
        ]);

        if (cancelled) return;

        if (statsJson.ok) setStats(statsJson.data);
        if (ordersJson.ok) setRecentOrders(ordersJson.data ?? []);
      } catch {
        if (!cancelled) setError('Unable to load dashboard data.');
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
      {/* Welcome */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 700,
            color: COLORS.textPrimary,
            margin: '0 0 6px 0',
          }}
        >
          Welcome back{stats?.companyName ? `, ${stats.companyName}` : ''}
        </h1>
        <p style={{ fontSize: '0.92rem', color: COLORS.textSecondary, margin: 0 }}>
          Here is an overview of your account activity.
        </p>
      </div>

      {/* Stats cards */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 36,
        }}
      >
        <StatCard
          label="Total Orders"
          value={String(stats?.totalOrders ?? 0)}
          icon={ShoppingCart}
        />
        <StatCard
          label="Pending Orders"
          value={String(stats?.pendingOrders ?? 0)}
          icon={Package}
        />
        <StatCard
          label="Total Spent"
          value={formatCurrency(stats?.totalSpentCents ?? 0)}
          icon={DollarSign}
        />
      </div>

      {/* Quick actions */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 36,
        }}
      >
        <Link
          href="/brands"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: COLORS.gold,
            color: '#1A0633',
            padding: '12px 24px',
            borderRadius: 9999,
            fontFamily: "'Barlow', Arial, sans-serif",
            fontWeight: 700,
            fontSize: '0.78rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            boxShadow: '0 4px 24px rgba(200,162,60,0.25)',
          }}
        >
          Browse Brands <ArrowRight size={14} />
        </Link>
        <Link
          href="/dashboard/orders"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'transparent',
            color: COLORS.gold,
            padding: '12px 24px',
            borderRadius: 9999,
            fontFamily: "'Barlow', Arial, sans-serif",
            fontWeight: 700,
            fontSize: '0.78rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            border: `1px solid ${COLORS.cardBorder}`,
          }}
        >
          View Orders <ArrowRight size={14} />
        </Link>
      </div>

      {/* Recent orders */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: COLORS.textPrimary,
              margin: 0,
            }}
          >
            Recent Orders
          </h2>
          {recentOrders.length > 0 && (
            <Link
              href="/dashboard/orders"
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: COLORS.gold,
                textDecoration: 'none',
              }}
            >
              View all
            </Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div
            style={{
              backgroundColor: COLORS.card,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 16,
              padding: '40px 24px',
              textAlign: 'center',
            }}
          >
            <p style={{ color: COLORS.textSecondary, fontSize: '0.9rem', margin: '0 0 16px' }}>
              No orders yet. Browse our brand catalog to get started.
            </p>
            <Link
              href="/brands"
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: COLORS.gold,
                textDecoration: 'none',
                border: `1px solid ${COLORS.cardBorder}`,
                borderRadius: 9999,
                padding: '8px 18px',
              }}
            >
              Browse Brands
            </Link>
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
            {recentOrders.map((order, idx) => {
              const badge = getStatusBadge(order.status);
              const itemCount = order.sales_order_items?.length ?? 0;
              return (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: idx < recentOrders.length - 1 ? `1px solid ${COLORS.cardBorder}` : 'none',
                    textDecoration: 'none',
                    transition: 'background-color 150ms ease',
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
                    <ArrowRight size={14} color={COLORS.textMuted} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
