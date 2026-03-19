'use client';

import { useEffect, useState } from 'react';

interface CustomerRow {
  email: string;
  total_spent: number;
  order_count: number;
  last_order_date: string;
}

const token = process.env.NEXT_PUBLIC_ADMIN_ANALYTICS_TOKEN ?? '';
async function apiFetch(path: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(path, { headers });
  return res.json();
}

function fmtCurrency(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtNum(n: number): string {
  return n.toLocaleString('en-US');
}

function fmtDate(iso: string): string {
  if (!iso) return '--';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const CARD: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 16,
  border: '1px solid var(--color-border, #E4E1DB)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  padding: 24,
};

const LABEL: React.CSSProperties = {
  fontSize: '0.72rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--color-warm-gray, #9A9590)',
};

const TH_STYLE: React.CSSProperties = {
  padding: '6px 8px',
  fontWeight: 700,
  color: 'var(--color-warm-gray, #9A9590)',
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const TD_STYLE: React.CSSProperties = { padding: '8px 8px' };
const ROW_BORDER = '1px solid var(--color-border, #E4E1DB)';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/admin/accounting/customers')
      .then((json) => {
        if (json.ok) {
          const sorted = (json.data as CustomerRow[]).sort((a, b) => b.total_spent - a.total_spent);
          setCustomers(sorted);
        } else {
          setError(json.error || 'Failed to load');
        }
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 80, minHeight: '60vh' }}>
        <div style={{ color: 'var(--color-warm-gray, #9A9590)', fontWeight: 600 }}>Loading customers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 80, minHeight: '60vh' }}>
        <div style={{ color: '#dc2626', fontWeight: 600 }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1024, margin: '0 auto', padding: '32px 24px 64px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-charcoal, #1C1C1C)', margin: '0 0 4px' }}>
          Top Customers
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-warm-gray, #9A9590)', margin: 0 }}>
          Ranked by total spend
        </p>
      </div>

      <div style={CARD}>
        <div style={{ ...LABEL, marginBottom: 14 }}>Customer Leaderboard</div>
        {customers.length === 0 ? (
          <div style={{ fontSize: '0.82rem', color: 'var(--color-warm-gray, #9A9590)', padding: '12px 0' }}>No customer data yet</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: ROW_BORDER }}>
                  <th style={{ ...TH_STYLE, textAlign: 'left' }}>Email</th>
                  <th style={{ ...TH_STYLE, textAlign: 'right' }}>Total Spent</th>
                  <th style={{ ...TH_STYLE, textAlign: 'right' }}>Order Count</th>
                  <th style={{ ...TH_STYLE, textAlign: 'right' }}>Last Order</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.email} style={{ borderBottom: ROW_BORDER }}>
                    <td style={{ ...TD_STYLE, fontWeight: 700, color: 'var(--color-charcoal, #1C1C1C)' }}>{c.email}</td>
                    <td style={{ ...TD_STYLE, textAlign: 'right', fontWeight: 700, color: 'var(--color-royal, #4A0E78)' }}>{fmtCurrency(c.total_spent)}</td>
                    <td style={{ ...TD_STYLE, textAlign: 'right', color: 'var(--color-charcoal, #1C1C1C)' }}>{fmtNum(c.order_count)}</td>
                    <td style={{ ...TD_STYLE, textAlign: 'right', color: 'var(--color-warm-gray, #9A9590)', whiteSpace: 'nowrap' }}>{fmtDate(c.last_order_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
