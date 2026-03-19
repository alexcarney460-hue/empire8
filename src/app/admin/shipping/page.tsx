'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Package, Truck, Printer, ExternalLink, RefreshCw, CheckCircle } from 'lucide-react';

interface Order {
  id: string;
  email: string;
  status: string;
  total: number;
  shipping_name: string | null;
  shipping_address_line1: string | null;
  shipping_address_line2: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_zip: string | null;
  shipping_country: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  label_url: string | null;
  shipping_carrier: string | null;
  shipping_service: string | null;
  shipped_at: string | null;
  created_at: string;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  sku: string | null;
}

const token = process.env.NEXT_PUBLIC_ADMIN_ANALYTICS_TOKEN ?? '';
const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
const internalSecret = token; // Same token used for internal API auth

async function apiFetch(path: string) {
  const res = await fetch(path, { headers: authHeaders });
  return res.json();
}

function fmtDate(iso: string) {
  if (!iso) return '--';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function timeSince(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ShippingPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [unprintedCount, setUnprintedCount] = useState(0);
  const [creatingLabel, setCreatingLabel] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    // Fetch both paid (needs shipping) and shipped orders
    const params = new URLSearchParams({ limit: '50' });
    const json = await apiFetch(`/api/admin/accounting/orders?${params}`);

    if (json.ok) {
      // "ready" = shipped but we show newest first for packing
      // "shipped" = same data, older orders
      setOrders(json.data ?? []);

      // Fetch line items for each order
      const orderItems: Record<string, OrderItem[]> = {};
      for (const o of (json.data ?? []) as Order[]) {
        try {
          const itemsRes = await apiFetch(`/api/admin/crm/orders/${o.id}`);
          if (itemsRes.ok && itemsRes.data?.items) {
            orderItems[o.id] = itemsRes.data.items;
          }
        } catch { /* skip */ }
      }
      setItems(orderItems);
    }

    // Fetch unprinted label count for the badge
    try {
      const queueRes = await apiFetch('/api/admin/shipping/print-queue?limit=1');
      if (queueRes.ok) {
        setUnprintedCount(queueRes.total ?? 0);
      }
    } catch { /* skip */ }

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createLabel(order: Order) {
    if (!order.shipping_address_line1 || !order.shipping_city) {
      alert('Order is missing a shipping address. Cannot create label.');
      return;
    }
    setCreatingLabel(order.id);
    try {
      const res = await fetch('/api/shipping/auto-ship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': internalSecret },
        body: JSON.stringify({
          orderId: order.id,
          email: order.email,
          shippingAddr: {
            address_line_1: order.shipping_address_line1,
            address_line_2: order.shipping_address_line2 || '',
            locality: order.shipping_city,
            administrative_district_level_1: order.shipping_state || '',
            postal_code: order.shipping_zip || '',
            country: order.shipping_country || 'US',
            first_name: order.shipping_name || 'Customer',
            last_name: '',
          },
          totalCents: Math.round((order.total || 0) * 100),
          currency: 'USD',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        await load(); // Refresh to show new label
      } else {
        alert(`Label creation failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Label creation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setCreatingLabel(null);
    }
  }

  // Split: orders with labels (ready to pack) vs paid without labels (pending shippo)
  const readyToPack = orders.filter((o) => o.label_url);
  const pendingLabel = orders.filter((o) => !o.label_url && (o.status === 'paid' || o.status === 'pending' || o.status === 'processing'));

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid var(--color-border, #e4e1db)',
    borderRadius: 16,
    overflow: 'hidden',
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-charcoal, #1c1c1c)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Package size={24} /> Packing &amp; Shipping
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-warm-gray, #9a9590)', margin: '4px 0 0' }}>
            Labels auto-purchased via Shippo. Print and pack.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link
            href="/admin/shipping/print-batch"
            style={{
              position: 'relative',
              padding: '8px 16px', borderRadius: 8,
              border: unprintedCount > 0 ? '1px solid #4A0E78' : '1px solid var(--color-border)',
              fontSize: '0.82rem', cursor: 'pointer',
              backgroundColor: unprintedCount > 0 ? '#4A0E78' : '#fff',
              color: unprintedCount > 0 ? '#fff' : 'var(--color-charcoal)',
              display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <Printer size={13} /> Print Queue
            {unprintedCount > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -6,
                background: '#dc2626', color: '#fff',
                fontSize: '0.68rem', fontWeight: 800,
                minWidth: 18, height: 18, borderRadius: 9,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}>
                {unprintedCount}
              </span>
            )}
          </Link>
          <button
            onClick={load}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)',
              fontSize: '0.82rem', cursor: 'pointer', backgroundColor: '#fff',
              display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600,
            }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Pending label warning */}
      {pendingLabel.length > 0 && (
        <div style={{
          background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 12,
          padding: '12px 16px', marginBottom: 16, fontSize: '0.82rem', color: '#92400e',
        }}>
          <strong>{pendingLabel.length} order{pendingLabel.length > 1 ? 's' : ''} pending label</strong> — Shippo may still be processing, or there was an address issue.
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--color-warm-gray)' }}>Loading...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--color-warm-gray)' }}>
          <CheckCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>All caught up!</p>
          <p style={{ fontSize: '0.85rem' }}>No orders to pack right now.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[...pendingLabel, ...readyToPack].map((order) => {
            const orderItems = items[order.id] ?? [];
            return (
              <div key={order.id} style={cardStyle}>
                {/* Top bar */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px', background: '#f8faf8',
                  borderBottom: '1px solid var(--color-border, #e4e1db)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-charcoal)' }}>
                      Order #{String(order.id).slice(-8)}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-warm-gray)' }}>
                      {timeSince(order.created_at)}
                    </span>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 9999,
                      background: order.label_url ? '#dcfce7' : '#fef3c7',
                      color: order.label_url ? '#166534' : '#92400e',
                    }}>
                      {order.label_url ? 'Label Ready' : order.status === 'paid' ? 'Needs Label' : order.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {order.label_url ? (
                      <a
                        href={`/admin/shipping/print/${order.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '7px 16px', borderRadius: 8, border: 'none',
                          backgroundColor: 'var(--color-royal, #4A0E78)', color: '#fff',
                          fontWeight: 700, fontSize: '0.78rem', textDecoration: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <Printer size={13} /> Print Label
                      </a>
                    ) : order.shipping_address_line1 ? (
                      <button
                        onClick={() => createLabel(order)}
                        disabled={creatingLabel === order.id}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '7px 16px', borderRadius: 8, border: 'none',
                          backgroundColor: creatingLabel === order.id ? '#9a9590' : '#f59e0b', color: '#fff',
                          fontWeight: 700, fontSize: '0.78rem',
                          cursor: creatingLabel === order.id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <Package size={13} /> {creatingLabel === order.id ? 'Creating...' : 'Create Label'}
                      </button>
                    ) : null}
                    {order.tracking_url && (
                      <a
                        href={order.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '7px 14px', borderRadius: 8,
                          border: '1px solid var(--color-border)', backgroundColor: '#fff',
                          fontWeight: 600, fontSize: '0.78rem', textDecoration: 'none',
                          color: 'var(--color-charcoal)', cursor: 'pointer',
                        }}
                      >
                        <Truck size={13} /> Track
                      </a>
                    )}
                  </div>
                </div>

                {/* Body: two columns */}
                <div style={{ display: 'flex', gap: 0 }}>
                  {/* Left: Ship to + carrier info */}
                  <div style={{ flex: 1, padding: '16px 20px', borderRight: '1px solid var(--color-border, #e4e1db)' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-warm-gray)', marginBottom: 6 }}>
                      Ship To
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-charcoal)', lineHeight: 1.7, fontWeight: 600 }}>
                      {order.shipping_name || 'N/A'}<br />
                      {order.shipping_address_line1}<br />
                      {order.shipping_address_line2 && <>{order.shipping_address_line2}<br /></>}
                      {order.shipping_city}, {order.shipping_state} {order.shipping_zip}
                    </div>

                    {/* Carrier + tracking */}
                    {order.tracking_number && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-warm-gray)', marginBottom: 4 }}>
                          Carrier
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-charcoal)' }}>
                          <strong>{order.shipping_carrier}</strong> — {order.shipping_service}
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#6d28d9', marginTop: 2 }}>
                          {order.tracking_number}
                        </div>
                        {order.shipped_at && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-warm-gray)', marginTop: 4 }}>
                            Shipped {fmtDate(order.shipped_at)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: What to pack */}
                  <div style={{ flex: 1, padding: '16px 20px' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-warm-gray)', marginBottom: 6 }}>
                      Pack List
                    </div>
                    {orderItems.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {orderItems.map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.88rem', color: 'var(--color-charcoal)' }}>{item.product_name}</span>
                            <span style={{
                              fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-royal, #4A0E78)',
                              background: '#f0fdf4', padding: '2px 10px', borderRadius: 6,
                            }}>
                              x{item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-warm-gray)' }}>
                        ${order.total?.toFixed(2)} order — check Square for details
                      </div>
                    )}

                    <div style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--color-warm-gray)' }}>
                      {order.email}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
