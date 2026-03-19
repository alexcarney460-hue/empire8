'use client';

import { useEffect, useState } from 'react';

interface ProductRow {
  product_name: string;
  units_sold: number;
  revenue: number;
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

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/admin/accounting/products')
      .then((json) => {
        if (json.ok) {
          const sorted = (json.data as ProductRow[]).sort((a, b) => b.revenue - a.revenue);
          setProducts(sorted);
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
        <div style={{ color: 'var(--color-warm-gray, #9A9590)', fontWeight: 600 }}>Loading products...</div>
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
          Product Sales
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-warm-gray, #9A9590)', margin: 0 }}>
          Leaderboard sorted by revenue
        </p>
      </div>

      <div style={CARD}>
        <div style={{ ...LABEL, marginBottom: 14 }}>Product Leaderboard</div>
        {products.length === 0 ? (
          <div style={{ fontSize: '0.82rem', color: 'var(--color-warm-gray, #9A9590)', padding: '12px 0' }}>No product data yet</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: ROW_BORDER }}>
                  <th style={{ ...TH_STYLE, textAlign: 'left' }}>#</th>
                  <th style={{ ...TH_STYLE, textAlign: 'left' }}>Product Name</th>
                  <th style={{ ...TH_STYLE, textAlign: 'right' }}>Units Sold</th>
                  <th style={{ ...TH_STYLE, textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={p.product_name} style={{ borderBottom: ROW_BORDER }}>
                    <td style={{ ...TD_STYLE, fontWeight: 600, color: 'var(--color-warm-gray, #9A9590)' }}>{i + 1}</td>
                    <td style={{ ...TD_STYLE, fontWeight: 700, color: 'var(--color-charcoal, #1C1C1C)' }}>{p.product_name}</td>
                    <td style={{ ...TD_STYLE, textAlign: 'right', color: 'var(--color-charcoal, #1C1C1C)' }}>{fmtNum(p.units_sold)}</td>
                    <td style={{ ...TD_STYLE, textAlign: 'right', fontWeight: 700, color: 'var(--color-royal, #4A0E78)' }}>{fmtCurrency(p.revenue)}</td>
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
