'use client';

import { useEffect, useState } from 'react';

interface BrandRow {
  brand_name: string;
  total_revenue: number;
  order_count: number;
  top_product: string;
}

interface ProductRow {
  product_name: string;
  brand_name: string;
  total_revenue: number;
  units_sold: number;
}

type ViewMode = 'brand' | 'product';

const COLORS = {
  bgCard: '#1A0830',
  purple: '#4A0E78',
  gold: '#C8A23C',
  textPrimary: '#F0EAF8',
  textSecondary: '#9B8AAE',
  border: 'rgba(200, 162, 60, 0.12)',
} as const;

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

const TH_STYLE: React.CSSProperties = {
  padding: '6px 8px',
  fontWeight: 700,
  color: COLORS.textSecondary,
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const TD_STYLE: React.CSSProperties = { padding: '8px 8px' };
const ROW_BORDER = `1px solid ${COLORS.border}`;

export default function BrandProductRevenuePage() {
  const [view, setView] = useState<ViewMode>('brand');
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/admin/accounting/products')
      .then((json) => {
        if (json.ok) {
          setBrands(json.data.brands as BrandRow[]);
          setProducts(json.data.products as ProductRow[]);
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
        <div style={{ color: COLORS.textSecondary, fontWeight: 600 }}>Loading revenue data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 80, minHeight: '60vh' }}>
        <div style={{ color: '#C83C3C', fontWeight: 600 }}>{error}</div>
      </div>
    );
  }

  const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '7px 20px',
    borderRadius: 9999,
    border: `1px solid ${active ? COLORS.gold : COLORS.border}`,
    background: active ? COLORS.gold : 'transparent',
    color: active ? '#1A0830' : COLORS.textSecondary,
    fontWeight: 700,
    fontSize: '0.82rem',
    cursor: 'pointer',
    transition: 'all 150ms',
  });

  return (
    <div style={{ maxWidth: 1024, margin: '0 auto', padding: '32px 24px 64px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: COLORS.textPrimary, margin: '0 0 4px' }}>
          Brand & Product Revenue
        </h1>
        <p style={{ fontSize: '0.82rem', color: COLORS.textSecondary, margin: 0 }}>
          Revenue breakdown by brand and individual product
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setView('brand')} style={toggleBtnStyle(view === 'brand')}>
          By Brand
        </button>
        <button onClick={() => setView('product')} style={toggleBtnStyle(view === 'product')}>
          By Product
        </button>
      </div>

      <div
        style={{
          background: COLORS.bgCard,
          borderRadius: 16,
          border: `1px solid ${COLORS.border}`,
          padding: 24,
        }}
      >
        {view === 'brand' ? (
          brands.length === 0 ? (
            <div style={{ fontSize: '0.82rem', color: COLORS.textSecondary, padding: '12px 0' }}>
              No brand data yet
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: ROW_BORDER }}>
                    <th style={{ ...TH_STYLE, textAlign: 'left' }}>Brand</th>
                    <th style={{ ...TH_STYLE, textAlign: 'right' }}>Total Revenue</th>
                    <th style={{ ...TH_STYLE, textAlign: 'right' }}>Order Count</th>
                    <th style={{ ...TH_STYLE, textAlign: 'left' }}>Top Product</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map((b) => (
                    <tr key={b.brand_name} style={{ borderBottom: ROW_BORDER }}>
                      <td style={{ ...TD_STYLE, fontWeight: 700, color: COLORS.textPrimary }}>{b.brand_name}</td>
                      <td style={{ ...TD_STYLE, textAlign: 'right', fontWeight: 700, color: COLORS.gold }}>
                        {fmtCurrency(b.total_revenue)}
                      </td>
                      <td style={{ ...TD_STYLE, textAlign: 'right', color: COLORS.textPrimary }}>
                        {fmtNum(b.order_count)}
                      </td>
                      <td style={{ ...TD_STYLE, color: COLORS.textSecondary }}>{b.top_product}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : products.length === 0 ? (
          <div style={{ fontSize: '0.82rem', color: COLORS.textSecondary, padding: '12px 0' }}>
            No product data yet
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: ROW_BORDER }}>
                  <th style={{ ...TH_STYLE, textAlign: 'left' }}>Product</th>
                  <th style={{ ...TH_STYLE, textAlign: 'left' }}>Brand</th>
                  <th style={{ ...TH_STYLE, textAlign: 'right' }}>Total Revenue</th>
                  <th style={{ ...TH_STYLE, textAlign: 'right' }}>Units Sold</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={`${p.brand_name}-${p.product_name}`} style={{ borderBottom: ROW_BORDER }}>
                    <td style={{ ...TD_STYLE, fontWeight: 700, color: COLORS.textPrimary }}>{p.product_name}</td>
                    <td style={{ ...TD_STYLE, color: COLORS.textSecondary }}>{p.brand_name}</td>
                    <td style={{ ...TD_STYLE, textAlign: 'right', fontWeight: 700, color: COLORS.gold }}>
                      {fmtCurrency(p.total_revenue)}
                    </td>
                    <td style={{ ...TD_STYLE, textAlign: 'right', color: COLORS.textPrimary }}>
                      {fmtNum(p.units_sold)}
                    </td>
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
