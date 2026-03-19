'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Summary {
  revenue: number;
  order_count: number;
  avg_order_value: number;
  refund_count: number;
  refund_amount: number;
}

const subNav = [
  { label: 'Orders', href: '/admin/accounting/orders', description: 'View and manage all orders' },
  { label: 'Products', href: '/admin/accounting/products', description: 'Product sales leaderboard' },
  { label: 'Customers', href: '/admin/accounting/customers', description: 'Top customers by spend' },
  { label: 'Refunds', href: '/admin/accounting/refunds', description: 'Refund history and totals' },
  { label: 'Reports', href: '/admin/accounting/reports', description: 'Revenue reports by date range' },
];

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export default function AccountingLanding() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_ADMIN_ANALYTICS_TOKEN;
    fetch('/api/admin/accounting/summary', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setSummary(json.data);
        else setError(json.error || 'Failed to load');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, []);

  const statCards = summary
    ? [
        { label: 'Total Revenue', value: fmt(summary.revenue), color: '#4A0E78' },
        { label: 'Total Orders', value: summary.order_count.toLocaleString(), color: '#1C1C1C' },
        { label: 'Avg Order Value', value: fmt(summary.avg_order_value), color: '#C8A23C' },
        { label: 'Refunds', value: `${summary.refund_count} (${fmt(summary.refund_amount)})`, color: '#9A9590' },
      ]
    : [];

  return (
    <div style={{ maxWidth: 1024, margin: '0 auto', padding: '32px 24px 64px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1C1C1C', margin: '0 0 4px' }}>
          Accounting
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#9A9590', margin: 0 }}>
          Revenue, orders, refunds, and financial reports
        </p>
      </div>

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#9A9590', fontSize: '0.85rem' }}>
          Loading summary...
        </div>
      ) : error ? (
        <div style={{ padding: 24, background: '#FFF8F0', border: '1px solid #E4E1DB', borderRadius: 12, color: '#C8A23C', fontSize: '0.85rem', marginBottom: 24 }}>
          {error}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
          {statCards.map((card) => (
            <div
              key={card.label}
              style={{
                background: '#ffffff',
                border: '1px solid #E4E1DB',
                borderRadius: 16,
                padding: '20px 24px',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9A9590', marginBottom: 8 }}>
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
            key={item.href}
            href={item.href}
            style={{
              display: 'block',
              background: '#ffffff',
              border: '1px solid #E4E1DB',
              borderRadius: 14,
              padding: '20px 24px',
              textDecoration: 'none',
              transition: 'border-color 150ms, box-shadow 150ms',
            }}
          >
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1C1C1C', marginBottom: 4 }}>
              {item.label}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#9A9590' }}>
              {item.description}
            </div>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 32, textAlign: 'right' }}>
        <button
          onClick={() => {
            const token = process.env.NEXT_PUBLIC_ADMIN_ANALYTICS_TOKEN;
            const url = '/api/admin/accounting/export';
            fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
              .then((r) => r.blob())
              .then((blob) => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(a.href);
              });
          }}
          style={{
            padding: '10px 24px',
            borderRadius: 9999,
            border: '1px solid #E4E1DB',
            background: '#ffffff',
            color: '#4A0E78',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          Export Orders CSV
        </button>
      </div>
    </div>
  );
}
