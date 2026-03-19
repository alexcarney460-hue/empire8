'use client';

import { useEffect, useState } from 'react';

interface RefundRow {
  order_id: number | string;
  email: string;
  amount: number;
  date: string;
}

interface RefundsData {
  total_count: number;
  total_amount: number;
  refunds: RefundRow[];
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

const BIG_NUM: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 900,
  color: 'var(--color-charcoal, #1C1C1C)',
  lineHeight: 1.1,
  marginTop: 4,
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

export default function RefundsPage() {
  const [data, setData] = useState<RefundsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/admin/accounting/refunds')
      .then((json) => {
        if (json.ok) {
          setData(json.data);
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
        <div style={{ color: 'var(--color-warm-gray, #9A9590)', fontWeight: 600 }}>Loading refunds...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 80, minHeight: '60vh' }}>
        <div style={{ color: '#dc2626', fontWeight: 600 }}>{error || 'Failed to load data'}</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1024, margin: '0 auto', padding: '32px 24px 64px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-charcoal, #1C1C1C)', margin: '0 0 4px' }}>
          Refunds
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-warm-gray, #9A9590)', margin: 0 }}>
          Refund history and totals
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={CARD}>
          <div style={LABEL}>Total Refunds</div>
          <div style={BIG_NUM}>{fmtNum(data.total_count)}</div>
        </div>
        <div style={CARD}>
          <div style={LABEL}>Total Refund Amount</div>
          <div style={{ ...BIG_NUM, color: 'var(--color-gold, #C8A23C)' }}>{fmtCurrency(data.total_amount)}</div>
        </div>
      </div>

      {/* Refunds table */}
      <div style={CARD}>
        <div style={{ ...LABEL, marginBottom: 14 }}>Refund Details</div>
        {data.refunds.length === 0 ? (
          <div style={{ fontSize: '0.82rem', color: 'var(--color-warm-gray, #9A9590)', padding: '12px 0' }}>No refunds recorded</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: ROW_BORDER }}>
                  <th style={{ ...TH_STYLE, textAlign: 'left' }}>Order ID</th>
                  <th style={{ ...TH_STYLE, textAlign: 'left' }}>Email</th>
                  <th style={{ ...TH_STYLE, textAlign: 'right' }}>Amount</th>
                  <th style={{ ...TH_STYLE, textAlign: 'right' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.refunds.map((r, i) => (
                  <tr key={`${r.order_id}-${i}`} style={{ borderBottom: ROW_BORDER }}>
                    <td style={{ ...TD_STYLE, fontWeight: 700, color: 'var(--color-charcoal, #1C1C1C)' }}>#{r.order_id}</td>
                    <td style={{ ...TD_STYLE, color: 'var(--color-charcoal, #1C1C1C)' }}>{r.email}</td>
                    <td style={{ ...TD_STYLE, textAlign: 'right', fontWeight: 700, color: 'var(--color-gold, #C8A23C)' }}>{fmtCurrency(r.amount)}</td>
                    <td style={{ ...TD_STYLE, textAlign: 'right', color: 'var(--color-warm-gray, #9A9590)', whiteSpace: 'nowrap' }}>{fmtDate(r.date)}</td>
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
