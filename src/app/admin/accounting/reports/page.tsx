'use client';

import React from 'react';
import { useState, useCallback } from 'react';

interface ReportRow {
  period: string;
  revenue: number;
  order_count: number;
}

const COLORS = {
  bgCard: '#1A0830',
  purple: '#4A0E78',
  gold: '#C8A23C',
  textPrimary: '#F0EAF8',
  textSecondary: '#9B8AAE',
  border: 'rgba(200, 162, 60, 0.12)',
  barBg: 'rgba(74, 14, 120, 0.3)',
} as const;

const token = process.env.NEXT_PUBLIC_ADMIN_ANALYTICS_TOKEN ?? '';

async function apiFetch(path: string) {
  const h: Record<string, string> = {};
  if (token) h['Authorization'] = `Bearer ${token}`;
  return fetch(path, { headers: h }).then((r) => r.json());
}

function fmtCurrency(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function defaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function defaultTo(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('month');
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(
        `/api/admin/accounting/reports?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&group_by=${groupBy}`
      );
      if (data.ok) {
        setRows(data.data);
      } else {
        setRows([]);
      }
      setGenerated(true);
    } catch {
      setRows([]);
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  }, [from, to, groupBy]);

  const [exportError, setExportError] = useState('');

  const handleExport = useCallback(() => {
    setExportError('');
    const h: Record<string, string> = {};
    if (token) h['Authorization'] = `Bearer ${token}`;
    const url = `/api/admin/accounting/export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    fetch(url, { headers: h })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Export failed (HTTP ${res.status})`);
        }
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `sales-export-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch((err) => {
        setExportError(err instanceof Error ? err.message : 'Failed to export CSV');
      });
  }, [from, to]);

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalOrders = rows.reduce((s, r) => s + r.order_count, 0);
  const maxRevenue = Math.max(...rows.map((r) => r.revenue), 1);

  const cardStyle: React.CSSProperties = {
    background: COLORS.bgCard,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 16,
    padding: 24,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: COLORS.textSecondary,
    marginBottom: 6,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: 14,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    color: COLORS.textPrimary,
    background: '#0F0520',
    outline: 'none',
  };

  return (
    <div style={{ padding: 32, maxWidth: 960, margin: '0 auto', fontFamily: 'inherit' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary, margin: '0 0 24px' }}>
        Revenue Reports
      </h1>

      {/* Filters */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 160px' }}>
            <label style={labelStyle}>From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ flex: '1 1 160px' }}>
            <label style={labelStyle}>To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ flex: '1 1 140px' }}>
            <label style={labelStyle}>Group By</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'day' | 'week' | 'month')}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>

          <div style={{ flex: '0 0 auto' }}>
            <button
              onClick={generate}
              disabled={loading}
              style={{
                padding: '9px 24px',
                fontSize: 14,
                fontWeight: 600,
                color: '#1A0830',
                background: COLORS.gold,
                border: 'none',
                borderRadius: 8,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 48, color: COLORS.textSecondary }}>
          Loading report data...
        </div>
      )}

      {/* Results */}
      {!loading && generated && (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.textSecondary, marginBottom: 8 }}>
                Total Revenue
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.gold }}>
                {fmtCurrency(totalRevenue)}
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.textSecondary, marginBottom: 8 }}>
                Total Orders
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.textPrimary }}>
                {totalOrders.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          {rows.length > 0 && (
            <div style={{ ...cardStyle, marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: COLORS.textPrimary, margin: '0 0 16px' }}>
                Revenue by Period
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {rows.map((row) => {
                  const pct = (row.revenue / maxRevenue) * 100;
                  return (
                    <div key={row.period} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 100,
                          fontSize: 13,
                          fontWeight: 500,
                          color: COLORS.textSecondary,
                          flexShrink: 0,
                          textAlign: 'right',
                        }}
                      >
                        {row.period}
                      </div>
                      <div style={{ flex: 1, background: COLORS.barBg, borderRadius: 6, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            minWidth: pct > 0 ? 4 : 0,
                            height: 28,
                            background: COLORS.purple,
                            borderRadius: 6,
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                      <div
                        style={{
                          width: 100,
                          fontSize: 13,
                          fontWeight: 500,
                          color: COLORS.gold,
                          flexShrink: 0,
                        }}
                      >
                        {fmtCurrency(row.revenue)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Data Table */}
          {rows.length > 0 && (
            <div style={{ ...cardStyle, marginBottom: 24 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700, color: COLORS.textSecondary, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Period
                      </th>
                      <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: COLORS.textSecondary, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Revenue
                      </th>
                      <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: COLORS.textSecondary, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Orders
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.period} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        <td style={{ padding: '8px', fontWeight: 600, color: COLORS.textPrimary }}>{row.period}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: COLORS.gold }}>
                          {fmtCurrency(row.revenue)}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', color: COLORS.textPrimary }}>
                          {row.order_count.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {rows.length === 0 && (
            <div style={{ ...cardStyle, textAlign: 'center', color: COLORS.textSecondary }}>
              No data found for the selected period.
            </div>
          )}

          {/* Export CSV */}
          {rows.length > 0 && (
            <div style={{ textAlign: 'right' }}>
              {exportError && (
                <div
                  style={{
                    display: 'inline-block',
                    marginRight: 12,
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    color: '#f87171',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.25)',
                  }}
                >
                  {exportError}
                </div>
              )}
              <button
                onClick={handleExport}
                style={{
                  display: 'inline-block',
                  padding: '9px 24px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: COLORS.gold,
                  background: 'transparent',
                  border: `1px solid ${COLORS.gold}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                Export CSV
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
