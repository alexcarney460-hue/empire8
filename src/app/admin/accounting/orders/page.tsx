'use client';

import { useEffect, useState, useCallback } from 'react';

interface OrderItem {
  product_name: string;
  quantity: number;
}

interface Order {
  id: string;
  email: string;
  shipping_name: string | null;
  status: string;
  total: number;
  created_at: string;
  order_items: OrderItem[];
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#fef3c7', color: '#92400e' },
  processing: { bg: '#dbeafe', color: '#1e40af' },
  shipped: { bg: '#ede9fe', color: '#6d28d9' },
  delivered: { bg: '#dcfce7', color: '#166534' },
  cancelled: { bg: '#f3f4f6', color: '#6b7280' },
  refunded: { bg: '#fef2f2', color: '#dc2626' },
};

const token = process.env.NEXT_PUBLIC_ADMIN_ANALYTICS_TOKEN ?? '';
async function apiFetch(path: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(path, { headers });
  return res.json();
}

function fmtCurrency(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  if (!iso) return '--';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (status) params.set('status', status);
    params.set('page', String(page));
    params.set('limit', String(limit));
    const json = await apiFetch(`/api/admin/accounting/orders?${params}`);
    if (json.ok) {
      setOrders(json.data ?? []);
      setTotal(json.total ?? 0);
    }
    setLoading(false);
  }, [search, status, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit) || 1;

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid var(--color-border, #e4e1db)',
    borderRadius: 16,
    padding: 24,
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-charcoal, #1c1c1c)', margin: 0 }}>Orders</h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-warm-gray, #9a9590)', margin: '4px 0 0' }}>View and manage customer orders</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          placeholder="Search by email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{
            flex: 1, minWidth: 200, border: '1px solid var(--color-border)', borderRadius: 10,
            padding: '9px 14px', fontSize: '0.85rem', outline: 'none', backgroundColor: '#fafaf9',
          }}
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          style={{
            border: '1px solid var(--color-border)', borderRadius: 10, padding: '9px 14px',
            fontSize: '0.85rem', outline: 'none', backgroundColor: '#fafaf9', cursor: 'pointer',
          }}
        >
          <option value="">All Statuses</option>
          {['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={cardStyle}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-warm-gray)' }}>Loading...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-warm-gray)' }}>No orders found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-warm-gray)', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const sc = STATUS_COLORS[o.status] ?? STATUS_COLORS.pending;
                const items = o.order_items ?? [];
                const itemCount = items.reduce((sum, i) => sum + (i.quantity || 1), 0);
                const itemSummary = items.length > 0
                  ? items.map((i) => `${i.product_name}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`).join(', ')
                  : '—';
                return (
                  <tr key={String(o.id)} style={{ borderBottom: '1px solid var(--color-border, #e4e1db)' }}>
                    <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>#{String(o.id).slice(-8)}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>{o.shipping_name || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-warm-gray)', marginTop: 2 }}>{o.email}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>{itemCount} item{itemCount !== 1 ? 's' : ''}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-warm-gray)', marginTop: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{itemSummary}</div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-royal, #4A0E78)' }}>{fmtCurrency(o.total ?? 0)}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 9999, background: sc.bg, color: sc.color }}>{o.status}</span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.82rem', color: 'var(--color-warm-gray)' }}>{fmtDate(o.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20 }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '0.8rem', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1, background: '#fff' }}
          >
            Previous
          </button>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-warm-gray)' }}>Page {page} of {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '0.8rem', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1, background: '#fff' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
