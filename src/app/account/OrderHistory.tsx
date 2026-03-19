'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: number;
  status: string;
  total: number;
  created_at: string;
  tracking_number: string | null;
  tracking_url: string | null;
  shipping_carrier: string | null;
  order_items: OrderItem[];
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  paid: { bg: '#dbeafe', color: '#1e40af', label: 'Paid' },
  processing: { bg: '#fef3c7', color: '#92400e', label: 'Processing' },
  shipped: { bg: '#dcfce7', color: '#166534', label: 'Shipped' },
  delivered: { bg: '#d1fae5', color: '#065f46', label: 'Delivered' },
  cancelled: { bg: '#fef2f2', color: '#991b1b', label: 'Cancelled' },
  paused: { bg: '#f3f4f6', color: '#6b7280', label: 'Paused' },
};

function getStatusStyle(status: string) {
  return STATUS_STYLES[status] ?? { bg: '#f3f4f6', color: '#6b7280', label: status };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default function OrderHistory({ email }: { email: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchOrders() {
      try {
        const supabase = getSupabase();
        const { data, error: fetchError } = await supabase
          .from('orders')
          .select('id, status, total, created_at, tracking_number, tracking_url, shipping_carrier, order_items(product_name, quantity, unit_price, total_price)')
          .eq('email', email)
          .order('created_at', { ascending: false })
          .limit(20);

        if (cancelled) return;

        if (fetchError) {
          setError('Unable to load order history.');
          console.error('[OrderHistory]', fetchError.message);
        } else {
          setOrders((data as unknown as Order[]) ?? []);
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load order history.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchOrders();
    return () => { cancelled = true; };
  }, [email]);

  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 20,
        padding: '28px 28px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <p
        className="label-caps"
        style={{ color: 'var(--color-warm-gray)', fontSize: '0.6rem', marginBottom: 16 }}
      >
        Order History
      </p>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: '3px solid var(--color-border)',
              borderTopColor: 'var(--color-royal)',
              animation: 'e8-spin 0.7s linear infinite',
            }}
          />
          <style>{`@keyframes e8-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {error && !loading && (
        <p style={{ fontSize: '0.82rem', color: '#dc2626', padding: '8px 0' }}>{error}</p>
      )}

      {!loading && !error && orders.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-warm-gray)', marginBottom: 14 }}>
            No orders yet.
          </p>
          <Link
            href="/catalog"
            style={{
              display: 'inline-block',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--color-royal)',
              textDecoration: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 9999,
              padding: '6px 14px',
            }}
          >
            Browse Catalog
          </Link>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map((order) => {
            const statusStyle = getStatusStyle(order.status);
            return (
              <div
                key={order.id}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 14,
                  padding: '18px 20px',
                  backgroundColor: '#fafaf9',
                }}
              >
                {/* Header row: date + status + total */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: 'var(--color-charcoal)',
                      }}
                    >
                      {formatDate(order.created_at)}
                    </span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                        borderRadius: 9999,
                        padding: '3px 10px',
                      }}
                    >
                      {statusStyle.label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'var(--color-charcoal)',
                    }}
                  >
                    {formatCurrency(order.total)}
                  </span>
                </div>

                {/* Line items */}
                {order.order_items.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      marginBottom: order.tracking_number ? 10 : 0,
                    }}
                  >
                    {order.order_items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--color-warm-gray)',
                          }}
                        >
                          {item.product_name}
                          {item.quantity > 1 ? ` x${item.quantity}` : ''}
                        </span>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--color-warm-gray)',
                            flexShrink: 0,
                          }}
                        >
                          {formatCurrency(item.total_price)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tracking link */}
                {order.tracking_number && (
                  <div
                    style={{
                      paddingTop: 10,
                      borderTop: '1px solid var(--color-border)',
                    }}
                  >
                    {order.tracking_url ? (
                      <a
                        href={order.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'var(--color-royal)',
                          textDecoration: 'none',
                        }}
                      >
                        {order.shipping_carrier ? `${order.shipping_carrier}: ` : ''}
                        {order.tracking_number} →
                      </a>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-warm-gray)',
                        }}
                      >
                        {order.shipping_carrier ? `${order.shipping_carrier}: ` : 'Tracking: '}
                        {order.tracking_number}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
