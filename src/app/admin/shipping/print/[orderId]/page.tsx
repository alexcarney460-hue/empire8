'use client';

import { useEffect, useState, use } from 'react';

interface OrderData {
  id: number;
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
  printed_at: string | null;
  created_at: string;
  order_items?: Array<{
    product_name: string;
    quantity: number;
    sku: string | null;
    unit_price: number;
    total_price: number;
  }>;
}

const token = process.env.NEXT_PUBLIC_ADMIN_ANALYTICS_TOKEN ?? '';
const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

export default function PrintLabelPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState('');
  const [printTriggered, setPrintTriggered] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/crm/orders/${orderId}`, { headers: authHeaders });
        const json = await res.json();
        if (json.ok && json.data) {
          setOrder(json.data);
        } else {
          setError(json.error || 'Order not found');
        }
      } catch {
        setError('Failed to load order');
      }
    })();
  }, [orderId]);

  // Auto-trigger print dialog once order loads
  useEffect(() => {
    if (order?.label_url && !printTriggered) {
      setPrintTriggered(true);
      // Small delay so the page renders fully before print dialog
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [order, printTriggered]);

  // Mark as printed
  useEffect(() => {
    if (order && !order.printed_at) {
      fetch('/api/admin/shipping/print-queue', {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_ids: [order.id], printed: true }),
      }).catch(() => { /* best-effort */ });
    }
  }, [order]);

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ color: '#dc2626', fontSize: '1.2rem' }}>Error</h1>
        <p>{error}</p>
        <a href="/admin/shipping" style={{ color: '#2d5016', fontWeight: 600 }}>Back to Shipping</a>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: 80, textAlign: 'center', fontFamily: 'system-ui, sans-serif', color: '#888' }}>
        Loading order...
      </div>
    );
  }

  const items = order.order_items ?? [];

  return (
    <>
      {/* Print-specific styles — optimized for 4x6 thermal label printers */}
      <style>{`
        @page {
          size: 6in 4in;
          margin: 0;
        }
        @media print {
          /* Hide everything except the label */
          nav, header, footer, .no-print { display: none !important; }
          body { margin: 0; padding: 0; background: #fff !important; }
          .print-container { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
          .print-actions { display: none !important; }
          .order-summary { display: none !important; }
          .label-wrapper {
            width: 6in !important;
            height: 4in !important;
            display: flex !important;
            align-items: center;
            justify-content: center;
            padding: 0 !important;
            margin: 0 !important;
            overflow: hidden;
          }
          .label-frame {
            width: 6in !important;
            height: 4in !important;
            border: none !important;
          }
        }
        @media screen {
          .print-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 32px 24px;
            font-family: system-ui, -apple-system, sans-serif;
          }
        }
      `}</style>

      <div className="print-container">
        {/* Screen-only action bar */}
        <div className="print-actions" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 24, padding: '16px 20px',
          background: '#f8faf8', borderRadius: 12,
          border: '1px solid #e4e1db',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a
              href="/admin/shipping"
              style={{ fontSize: '0.82rem', color: '#2d5016', fontWeight: 600, textDecoration: 'none' }}
            >
              &larr; Back to Shipping
            </a>
            <span style={{ color: '#ccc' }}>|</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1c1c1c' }}>
              Order #{String(order.id).slice(-8)}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => window.print()}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                backgroundColor: '#4A0E78', color: '#fff',
                fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
              }}
            >
              Print Label
            </button>
            {order.label_url && (
              <a
                href={order.label_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '8px 16px', borderRadius: 8,
                  border: '1px solid #e4e1db', backgroundColor: '#fff',
                  fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none',
                  color: '#1c1c1c', cursor: 'pointer',
                }}
              >
                Open PDF
              </a>
            )}
          </div>
        </div>

        {/* Shipping Label (rotated PDF via our proxy for print-ready alignment) */}
        {order.label_url && (
          <div className="label-wrapper" style={{ marginBottom: 24 }}>
            <iframe
              className="label-frame"
              src={`/api/shipping/label-pdf?url=${encodeURIComponent(order.label_url)}&rotate=90`}
              title="Shipping Label"
              style={{
                width: '100%',
                height: 500,
                border: '1px solid #e4e1db',
                borderRadius: 12,
                backgroundColor: '#fff',
              }}
            />
          </div>
        )}

        {/* Order Summary (prints on second page) */}
        <div className="order-summary" style={{
          background: '#fff',
          border: '1px solid #e4e1db',
          borderRadius: 12,
          padding: '20px 24px',
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 16px', color: '#1c1c1c' }}>
            Order #{String(order.id).slice(-8)} &mdash; Packing Slip
          </h2>

          {/* Ship-to address */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.06em', color: '#9a9590', marginBottom: 4,
            }}>
              Ship To
            </div>
            <div style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#1c1c1c' }}>
              {order.shipping_name || 'N/A'}<br />
              {order.shipping_address_line1}<br />
              {order.shipping_address_line2 && <>{order.shipping_address_line2}<br /></>}
              {order.shipping_city}, {order.shipping_state} {order.shipping_zip}
              {order.shipping_country && order.shipping_country !== 'US' && (
                <><br />{order.shipping_country}</>
              )}
            </div>
          </div>

          {/* Carrier info */}
          {order.tracking_number && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.06em', color: '#9a9590', marginBottom: 4,
              }}>
                Carrier
              </div>
              <div style={{ fontSize: '0.88rem', color: '#1c1c1c' }}>
                <strong>{order.shipping_carrier}</strong> &mdash; {order.shipping_service}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#6d28d9', marginTop: 2 }}>
                {order.tracking_number}
              </div>
            </div>
          )}

          {/* Line items */}
          <div>
            <div style={{
              fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.06em', color: '#9a9590', marginBottom: 8,
            }}>
              Items ({items.length})
            </div>
            {items.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e4e1db' }}>
                    <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 700, color: '#1c1c1c' }}>Product</th>
                    <th style={{ textAlign: 'center', padding: '6px 8px', fontWeight: 700, color: '#1c1c1c' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 700, color: '#1c1c1c' }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f0eeeb' }}>
                      <td style={{ padding: '8px 0', color: '#1c1c1c' }}>
                        {item.product_name}
                        {item.sku && <span style={{ color: '#9a9590', marginLeft: 8, fontSize: '0.78rem' }}>({item.sku})</span>}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px', fontWeight: 700, color: '#4A0E78' }}>
                        x{item.quantity}
                      </td>
                      <td style={{ textAlign: 'right', padding: '8px 0', color: '#1c1c1c' }}>
                        ${item.total_price?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} style={{ padding: '10px 0', fontWeight: 800, color: '#1c1c1c' }}>Total</td>
                    <td style={{ textAlign: 'right', padding: '10px 0', fontWeight: 800, color: '#1c1c1c' }}>
                      ${order.total?.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <div style={{ fontSize: '0.85rem', color: '#9a9590' }}>
                ${order.total?.toFixed(2)} order &mdash; check Square for item details
              </div>
            )}
          </div>

          {/* Customer email */}
          <div style={{ marginTop: 16, fontSize: '0.78rem', color: '#9a9590' }}>
            Customer: {order.email}
          </div>
        </div>
      </div>
    </>
  );
}
