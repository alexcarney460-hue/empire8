'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

/* ── Types ─────────────────────────────────────────────────────────── */

interface SalesOrder {
  id: string;
  order_number: string;
  dispensary_id: string;
  dispensary_name: string;
  status: string;
  total_cents: number;
  item_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

type StatusFilter = '' | 'submitted' | 'processing' | 'shipped' | 'delivered';

/* ── Constants ─────────────────────────────────────────────────────── */

const STATUS_TABS: ReadonlyArray<{ label: string; value: StatusFilter }> = [
  { label: 'All', value: '' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  submitted:  { bg: 'rgba(200, 162, 60, 0.15)', text: '#C8A23C', border: 'rgba(200, 162, 60, 0.3)' },
  processing: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.3)' },
  shipped:    { bg: 'rgba(147, 51, 234, 0.15)', text: '#A78BFA', border: 'rgba(147, 51, 234, 0.3)' },
  delivered:  { bg: 'rgba(34, 197, 94, 0.15)',  text: '#4ADE80', border: 'rgba(34, 197, 94, 0.3)' },
};

const LIMIT = 25;

/* ── Helpers ───────────────────────────────────────────────────────── */

const token = process.env.NEXT_PUBLIC_ADMIN_ANALYTICS_TOKEN ?? '';
const authHeaders: Record<string, string> = token
  ? { Authorization: `Bearer ${token}` }
  : {};

async function apiFetch(path: string): Promise<Record<string, unknown>> {
  const res = await fetch(path, { headers: authHeaders });
  return res.json() as Promise<Record<string, unknown>>;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  if (!iso) return '--';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ── Component ─────────────────────────────────────────────────────── */

export default function AdminOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams({
      page: String(page),
      limit: String(LIMIT),
    });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (statusFilter) params.set('status', statusFilter);

    try {
      const res = await apiFetch(`/api/admin/orders?${params}`);
      if (res.ok) {
        setOrders(res.data as SalesOrder[]);
        setTotal(res.total as number);
      } else {
        setError(String(res.error || 'Failed to fetch orders'));
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  /* ── Styles ──────────────────────────────────────────────────────── */

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: '#0F0520',
    padding: '32px 24px',
  };

  const innerStyle: React.CSSProperties = {
    maxWidth: 1200,
    margin: '0 auto',
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    overflow: 'hidden',
  };

  return (
    <div style={containerStyle}>
      <div style={innerStyle}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#FFFFFF',
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            Sales Orders
          </h1>
          <p style={{
            fontSize: '0.85rem',
            color: 'rgba(255,255,255,0.45)',
            margin: '6px 0 0',
          }}>
            {total} order{total !== 1 ? 's' : ''} total
          </p>
        </div>

        {/* Search + Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 420 }}>
            <svg
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 16,
                height: 16,
                color: 'rgba(255,255,255,0.3)',
              }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order number or dispensary..."
              style={{
                width: '100%',
                padding: '10px 14px 10px 40px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                color: '#FFFFFF',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  padding: 0,
                  lineHeight: 1,
                }}
                aria-label="Clear search"
              >
                x
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.value;
              const statusColor = tab.value ? STATUS_COLORS[tab.value] : null;
              return (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 9999,
                    border: active
                      ? `1px solid ${statusColor?.border ?? '#C8A23C'}`
                      : '1px solid rgba(255,255,255,0.1)',
                    background: active
                      ? (statusColor?.bg ?? 'rgba(200,162,60,0.15)')
                      : 'transparent',
                    color: active
                      ? (statusColor?.text ?? '#C8A23C')
                      : 'rgba(255,255,255,0.5)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 150ms',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 16,
            fontSize: '0.85rem',
            color: '#F87171',
          }}>
            {error}
          </div>
        )}

        {/* Table Card */}
        <div style={cardStyle}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['Order #', 'Dispensary', 'Items', 'Total', 'Status', 'Date'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '14px 16px',
                        textAlign: 'left',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'rgba(255,255,255,0.4)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: '64px 16px',
                        textAlign: 'center',
                        color: 'rgba(255,255,255,0.3)',
                      }}
                    >
                      Loading orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: '64px 16px',
                        textAlign: 'center',
                        color: 'rgba(255,255,255,0.3)',
                      }}
                    >
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const sc = STATUS_COLORS[order.status] ?? STATUS_COLORS.submitted;
                    return (
                      <tr
                        key={order.id}
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          cursor: 'pointer',
                          transition: 'background 150ms',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                        }}
                      >
                        <td style={{ padding: '14px 16px', color: '#C8A23C', fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                          {order.order_number}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: 500 }}>
                          {order.dispensary_name}
                        </td>
                        <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
                          {order.item_count}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {formatCents(order.total_cents)}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: 9999,
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              textTransform: 'capitalize',
                              background: sc.bg,
                              color: sc.text,
                              border: `1px solid ${sc.border}`,
                            }}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                Showing {Math.min((page - 1) * LIMIT + 1, total)}-{Math.min(page * LIMIT, total)} of {total}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)',
                    color: page <= 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Prev
                </button>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)',
                    color: page >= totalPages ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
