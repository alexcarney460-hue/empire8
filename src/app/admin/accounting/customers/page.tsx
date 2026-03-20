'use client';

import { useEffect, useState } from 'react';

interface DispensaryRow {
  dispensary_id: string;
  dispensary_name: string;
  order_count: number;
  total_spent: number;
  avg_order: number;
  last_order_date: string;
}

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

function fmtDate(iso: string): string {
  if (!iso) return '--';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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

export default function DispensaryLeaderboardPage() {
  const [rows, setRows] = useState<DispensaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/admin/accounting/customers')
      .then((json) => {
        if (json.ok) {
          setRows(json.data as DispensaryRow[]);
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
        <div style={{ color: COLORS.textSecondary, fontWeight: 600 }}>Loading dispensaries...</div>
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

  return (
    <div style={{ maxWidth: 1024, margin: '0 auto', padding: '32px 24px 64px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: COLORS.textPrimary, margin: '0 0 4px' }}>
          Dispensary Leaderboard
        </h1>
        <p style={{ fontSize: '0.82rem', color: COLORS.textSecondary, margin: 0 }}>
          Ranked by total spend
        </p>
      </div>

      <div
        style={{
          background: COLORS.bgCard,
          borderRadius: 16,
          border: `1px solid ${COLORS.border}`,
          padding: 24,
        }}
      >
        {rows.length === 0 ? (
          <div style={{ fontSize: '0.82rem', color: COLORS.textSecondary, padding: '12px 0' }}>
            No dispensary data yet
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: ROW_BORDER }}>
                  <th style={{ ...TH_STYLE, textAlign: 'center', width: 50 }}>Rank</th>
                  <th style={{ ...TH_STYLE, textAlign: 'left' }}>Dispensary Name</th>
                  <th style={{ ...TH_STYLE, textAlign: 'right' }}>Orders</th>
                  <th style={{ ...TH_STYLE, textAlign: 'right' }}>Total Spent</th>
                  <th style={{ ...TH_STYLE, textAlign: 'right' }}>Avg Order</th>
                  <th style={{ ...TH_STYLE, textAlign: 'right' }}>Last Order</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.dispensary_id} style={{ borderBottom: ROW_BORDER }}>
                    <td style={{ ...TD_STYLE, textAlign: 'center', fontWeight: 700, color: COLORS.textSecondary }}>
                      {i + 1}
                    </td>
                    <td style={{ ...TD_STYLE, fontWeight: 700, color: COLORS.textPrimary }}>
                      {row.dispensary_name}
                    </td>
                    <td style={{ ...TD_STYLE, textAlign: 'right', color: COLORS.textPrimary }}>
                      {fmtNum(row.order_count)}
                    </td>
                    <td style={{ ...TD_STYLE, textAlign: 'right', fontWeight: 700, color: COLORS.gold }}>
                      {fmtCurrency(row.total_spent)}
                    </td>
                    <td style={{ ...TD_STYLE, textAlign: 'right', color: COLORS.textPrimary }}>
                      {fmtCurrency(row.avg_order)}
                    </td>
                    <td style={{ ...TD_STYLE, textAlign: 'right', color: COLORS.textSecondary, whiteSpace: 'nowrap' }}>
                      {fmtDate(row.last_order_date)}
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
