'use client';

import React from 'react';
import { useState, useCallback } from 'react';

interface ReportRow {
  period: string;
  revenue: number;
  order_count: number;
}

const token = process.env.NEXT_PUBLIC_ADMIN_ANALYTICS_TOKEN ?? '';
async function apiFetch(path: string) {
  const h: Record<string, string> = {};
  if (token) h['Authorization'] = `Bearer ${token}`;
  return fetch(path, { headers: h }).then(r => r.json());
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

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalOrders = rows.reduce((s, r) => s + r.order_count, 0);
  const maxRevenue = Math.max(...rows.map(r => r.revenue), 1);

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid var(--color-border)',
    borderRadius: 16,
    padding: 24,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--color-charcoal)',
    marginBottom: 6,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: 14,
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    color: 'var(--color-charcoal)',
    background: '#fff',
    outline: 'none',
  };

  return (
    <div style={{ padding: 32, maxWidth: 960, margin: '0 auto', fontFamily: 'inherit' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-charcoal)', margin: '0 0 24px' }}>
        Accounting Reports
      </h1>

      {/* Filters */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 160px' }}>
            <label style={labelStyle}>From</label>
            <input
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ flex: '1 1 160px' }}>
            <label style={labelStyle}>To</label>
            <input
              type="date"
              value={to}
              onChange={e => setTo(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <label style={labelStyle}>Group By</label>
            <select
              value={groupBy}
              onChange={e => setGroupBy(e.target.value as 'day' | 'week' | 'month')}
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
                color: '#fff',
                background: 'var(--color-royal)',
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
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-charcoal)' }}>
          Loading report data...
        </div>
      )}

      {/* Results */}
      {!loading && generated && (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-charcoal)', marginBottom: 8 }}>
                Total Revenue
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-royal)' }}>
                {fmtCurrency(totalRevenue)}
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-charcoal)', marginBottom: 8 }}>
                Total Orders
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-gold)' }}>
                {totalOrders.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          {rows.length > 0 && (
            <div style={{ ...cardStyle, marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-charcoal)', margin: '0 0 16px' }}>
                Revenue by Period
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {rows.map(row => {
                  const pct = (row.revenue / maxRevenue) * 100;
                  return (
                    <div key={row.period} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 100, fontSize: 13, fontWeight: 500, color: 'var(--color-charcoal)', flexShrink: 0, textAlign: 'right' }}>
                        {row.period}
                      </div>
                      <div style={{ flex: 1, background: '#f5f5f5', borderRadius: 6, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            minWidth: pct > 0 ? 4 : 0,
                            height: 28,
                            background: 'var(--color-royal)',
                            borderRadius: 6,
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                      <div style={{ width: 100, fontSize: 13, fontWeight: 500, color: 'var(--color-charcoal)', flexShrink: 0 }}>
                        {fmtCurrency(row.revenue)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {rows.length === 0 && (
            <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--color-charcoal)' }}>
              No data found for the selected period.
            </div>
          )}

          {/* Export CSV */}
          {rows.length > 0 && (
            <div style={{ textAlign: 'right' }}>
              <a
                href={`/api/admin/accounting/export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '9px 24px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--color-royal)',
                  background: '#fff',
                  border: '1px solid var(--color-royal)',
                  borderRadius: 8,
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
              >
                Export CSV
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
