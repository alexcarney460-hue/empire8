'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Summary {
  revenue: number;
  order_count: number;
  avg_order_value: number;
  active_dispensaries: number;
}

const COLORS = {
  bgPage: '#0F0520',
  bgCard: '#1A0830',
  purple: '#4A0E78',
  gold: '#C8A23C',
  textPrimary: '#F0EAF8',
  textSecondary: '#9B8AAE',
  border: 'rgba(200, 162, 60, 0.12)',
} as const;

const subNav = [
  { label: 'Orders', href: '/admin/orders', description: 'View and manage all sales orders' },
  { label: 'Dispensary Leaderboard', href: '/admin/accounting/customers', description: 'Top dispensaries ranked by total spend' },
  { label: 'Brand & Product Revenue', href: '/admin/accounting/products', description: 'Revenue breakdown by brand and product' },
  { label: 'Revenue Reports', href: '/admin/accounting/reports', description: 'Time-series revenue with date range filters' },
  { label: 'Export CSV', href: '/admin/accounting/reports', description: 'Download sales data as CSV from Reports' },
];

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export default function AccountingLanding() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_ADMIN_ANALYTICS_TOKEN || '';
    fetch('/api/admin/accounting/summary', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setSummary(json.data);
        else setError(json.error || 'Failed to load summary');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, []);

  const statCards = summary
    ? [
        { label: 'Total Revenue', value: fmt(summary.revenue), color: COLORS.gold },
        { label: 'Total Orders', value: summary.order_count.toLocaleString(), color: COLORS.textPrimary },
        { label: 'Avg Order Value', value: fmt(summary.avg_order_value), color: COLORS.gold },
        { label: 'Active Dispensaries', value: summary.active_dispensaries.toLocaleString(), color: COLORS.textPrimary },
      ]
    : [];

  return (
    <div style={{ maxWidth: 1024, margin: '0 auto', padding: '32px 24px 64px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: COLORS.textPrimary, margin: '0 0 4px' }}>
          Accounting
        </h1>
        <p style={{ fontSize: '0.85rem', color: COLORS.textSecondary, margin: 0 }}>
          Revenue, orders, and financial reports
        </p>
      </div>

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: COLORS.textSecondary, fontSize: '0.85rem' }}>
          Loading summary...
        </div>
      ) : error ? (
        <div
          style={{
            padding: 24,
            background: 'rgba(200, 60, 60, 0.08)',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            color: '#C83C3C',
            fontSize: '0.85rem',
            marginBottom: 24,
          }}
        >
          {error}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
          {statCards.map((card) => (
            <div
              key={card.label}
              style={{
                background: COLORS.bgCard,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 16,
                padding: '20px 24px',
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: COLORS.textSecondary,
                  marginBottom: 8,
                }}
              >
                {card.label}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: card.color }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {subNav.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            style={{
              display: 'block',
              background: COLORS.bgCard,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 14,
              padding: '20px 24px',
              textDecoration: 'none',
              transition: 'border-color 150ms, box-shadow 150ms',
            }}
          >
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: COLORS.textPrimary, marginBottom: 4 }}>
              {item.label}
            </div>
            <div style={{ fontSize: '0.8rem', color: COLORS.textSecondary }}>
              {item.description}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
