'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

/* ── Types ─────────────────────────────────────────────────────────── */

interface LineItem {
  id: string;
  product_id: string;
  brand_id: string;
  brand_name: string;
  product_name: string;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
  image_url: string | null;
  unit_type: string;
}

interface BrandGroup {
  brandId: string;
  brandName: string;
  items: ReadonlyArray<LineItem>;
  subtotalCents: number;
}

interface Dispensary {
  id: string;
  company_name: string;
  license_number: string;
  license_type: string;
  contact_name: string;
  email: string;
  phone: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  is_approved: boolean;
}

interface OrderDetail {
  id: string;
  order_number: string;
  dispensary_id: string;
  status: string;
  total_cents: number;
  item_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  dispensary_accounts: Dispensary | null;
  items: ReadonlyArray<LineItem>;
}

type OrderStatus = 'submitted' | 'processing' | 'shipped' | 'delivered';

/* ── Constants ─────────────────────────────────────────────────────── */

const STATUSES: ReadonlyArray<OrderStatus> = [
  'submitted',
  'processing',
  'shipped',
  'delivered',
];

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  submitted:  { bg: 'rgba(200, 162, 60, 0.15)', text: '#C8A23C', border: 'rgba(200, 162, 60, 0.3)' },
  processing: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.3)' },
  shipped:    { bg: 'rgba(147, 51, 234, 0.15)', text: '#A78BFA', border: 'rgba(147, 51, 234, 0.3)' },
  delivered:  { bg: 'rgba(34, 197, 94, 0.15)',  text: '#4ADE80', border: 'rgba(34, 197, 94, 0.3)' },
};

/* ── Helpers ───────────────────────────────────────────────────────── */

const token = process.env.NEXT_PUBLIC_ADMIN_ANALYTICS_TOKEN ?? '';
const authHeaders: Record<string, string> = token
  ? { Authorization: `Bearer ${token}` }
  : {};

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  if (!iso) return '--';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function groupByBrand(items: ReadonlyArray<LineItem>): ReadonlyArray<BrandGroup> {
  const map = new Map<string, BrandGroup>();
  for (const item of items) {
    const existing = map.get(item.brand_id);
    if (existing) {
      map.set(item.brand_id, {
        ...existing,
        items: [...existing.items, item],
        subtotalCents: existing.subtotalCents + item.line_total_cents,
      });
    } else {
      map.set(item.brand_id, {
        brandId: item.brand_id,
        brandName: item.brand_name,
        items: [item],
        subtotalCents: item.line_total_cents,
      });
    }
  }
  return Array.from(map.values());
}

/* ── Component ─────────────────────────────────────────────────────── */

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('submitted');
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesMessage, setNotesMessage] = useState('');

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        headers: authHeaders,
      });
      const json = await res.json();

      if (json.ok && json.data) {
        const data = json.data as OrderDetail;
        setOrder(data);
        setSelectedStatus(data.status as OrderStatus);
        setNotes(data.notes ?? '');
      } else {
        setError(String(json.error || 'Order not found'));
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  async function handleStatusUpdate() {
    if (!order || selectedStatus === order.status) return;
    setStatusSaving(true);
    setStatusMessage('');

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus }),
      });
      const json = await res.json();

      if (json.ok) {
        setOrder((prev) => prev ? { ...prev, status: selectedStatus } : prev);
        setStatusMessage('Status updated');
        setTimeout(() => setStatusMessage(''), 3000);
      } else {
        setStatusMessage(`Error: ${json.error}`);
      }
    } catch {
      setStatusMessage('Network error');
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleNotesSave() {
    setNotesSaving(true);
    setNotesMessage('');

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      const json = await res.json();

      if (json.ok) {
        setOrder((prev) => prev ? { ...prev, notes } : prev);
        setNotesMessage('Notes saved');
        setTimeout(() => setNotesMessage(''), 3000);
      } else {
        setNotesMessage(`Error: ${json.error}`);
      }
    } catch {
      setNotesMessage('Network error');
    } finally {
      setNotesSaving(false);
    }
  }

  /* ── Styles ──────────────────────────────────────────────────────── */

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: '#0F0520',
    padding: '32px 24px',
  };

  const innerStyle: React.CSSProperties = {
    maxWidth: 960,
    margin: '0 auto',
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: '24px',
    marginBottom: 20,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.68rem',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 6,
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    color: '#FFFFFF',
    lineHeight: 1.6,
  };

  /* ── Render ──────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ ...innerStyle, textAlign: 'center', paddingTop: 80, color: 'rgba(255,255,255,0.3)' }}>
          Loading order...
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={containerStyle}>
        <div style={{ ...innerStyle, textAlign: 'center', paddingTop: 80 }}>
          <p style={{ color: '#F87171', fontSize: '1rem', marginBottom: 16 }}>
            {error || 'Order not found'}
          </p>
          <button
            onClick={() => router.push('/admin/orders')}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.06)',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const dispensary = order.dispensary_accounts;
  const brandGroups = groupByBrand(order.items);
  const sc = STATUS_COLORS[order.status] ?? STATUS_COLORS.submitted;

  return (
    <div style={containerStyle}>
      <div style={innerStyle}>
        {/* Back button */}
        <button
          onClick={() => router.push('/admin/orders')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 0',
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 20,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Orders
        </button>

        {/* Order Header Card */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h1 style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#C8A23C',
                margin: '0 0 4px',
                fontFamily: 'monospace',
                letterSpacing: '0.02em',
              }}>
                {order.order_number}
              </h1>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                Placed {formatDate(order.created_at)}
                {order.updated_at && order.updated_at !== order.created_at && (
                  <span> -- Updated {formatDate(order.updated_at)}</span>
                )}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '5px 14px',
                  borderRadius: 9999,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'capitalize',
                  background: sc.bg,
                  color: sc.text,
                  border: `1px solid ${sc.border}`,
                }}
              >
                {order.status}
              </span>
            </div>
          </div>

          {/* Status Update */}
          <div style={{
            marginTop: 20,
            paddingTop: 20,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ ...labelStyle, marginBottom: 0 }}>Update Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)',
                color: '#FFFFFF',
                fontSize: '0.82rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s} style={{ background: '#1A0A30', color: '#FFFFFF' }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <button
              onClick={handleStatusUpdate}
              disabled={statusSaving || selectedStatus === order.status}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: 'none',
                background: selectedStatus === order.status
                  ? 'rgba(255,255,255,0.06)'
                  : '#C8A23C',
                color: selectedStatus === order.status
                  ? 'rgba(255,255,255,0.3)'
                  : '#0F0520',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: selectedStatus === order.status ? 'not-allowed' : 'pointer',
                transition: 'all 150ms',
              }}
            >
              {statusSaving ? 'Saving...' : 'Update'}
            </button>
            {statusMessage && (
              <span style={{
                fontSize: '0.78rem',
                color: statusMessage.startsWith('Error') ? '#F87171' : '#4ADE80',
                fontWeight: 600,
              }}>
                {statusMessage}
              </span>
            )}
          </div>
        </div>

        {/* Two-column layout: Line Items + Dispensary Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
          {/* Line Items */}
          <div style={{ minWidth: 0 }}>
            <div style={cardStyle}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 16px' }}>
                Line Items
              </h2>

              {brandGroups.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
                  No items found
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {brandGroups.map((group) => (
                    <div key={group.brandId}>
                      {/* Brand header */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 10,
                        paddingBottom: 8,
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                      }}>
                        <span style={{
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: '#C8A23C',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}>
                          {group.brandName}
                        </span>
                        <span style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: 'rgba(255,255,255,0.6)',
                        }}>
                          Subtotal: {formatCents(group.subtotalCents)}
                        </span>
                      </div>

                      {/* Items in brand */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {group.items.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              borderRadius: 8,
                              background: 'rgba(255,255,255,0.02)',
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ color: '#FFFFFF', fontSize: '0.85rem', fontWeight: 500 }}>
                                {item.product_name}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
                              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                                {formatCents(item.unit_price_cents)} x {item.quantity}
                              </span>
                              <span style={{
                                color: '#FFFFFF',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                minWidth: 70,
                                textAlign: 'right',
                              }}>
                                {formatCents(item.line_total_cents)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Order Total */}
              <div style={{
                marginTop: 20,
                paddingTop: 16,
                borderTop: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Order Total
                </span>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#C8A23C' }}>
                  {formatCents(order.total_cents)}
                </span>
              </div>
            </div>

            {/* Notes Card */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 12px' }}>
                Notes
              </h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add internal notes about this order..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                  resize: 'vertical',
                  outline: 'none',
                  lineHeight: 1.6,
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <button
                  onClick={handleNotesSave}
                  disabled={notesSaving || notes === (order.notes ?? '')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 8,
                    border: 'none',
                    background: notes === (order.notes ?? '')
                      ? 'rgba(255,255,255,0.06)'
                      : '#C8A23C',
                    color: notes === (order.notes ?? '')
                      ? 'rgba(255,255,255,0.3)'
                      : '#0F0520',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: notes === (order.notes ?? '') ? 'not-allowed' : 'pointer',
                    transition: 'all 150ms',
                  }}
                >
                  {notesSaving ? 'Saving...' : 'Save Notes'}
                </button>
                {notesMessage && (
                  <span style={{
                    fontSize: '0.78rem',
                    color: notesMessage.startsWith('Error') ? '#F87171' : '#4ADE80',
                    fontWeight: 600,
                  }}>
                    {notesMessage}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Dispensary Info Sidebar */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 16px' }}>
              Dispensary
            </h2>

            {dispensary ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={labelStyle}>Company</div>
                  <div style={{ ...valueStyle, fontWeight: 700 }}>
                    {dispensary.company_name}
                  </div>
                </div>

                <div>
                  <div style={labelStyle}>License</div>
                  <div style={valueStyle}>
                    {dispensary.license_number}
                    <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 8, fontSize: '0.78rem' }}>
                      ({dispensary.license_type})
                    </span>
                  </div>
                </div>

                <div>
                  <div style={labelStyle}>Contact</div>
                  <div style={valueStyle}>{dispensary.contact_name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                    {dispensary.email}
                  </div>
                  {dispensary.phone && (
                    <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                      {dispensary.phone}
                    </div>
                  )}
                </div>

                {dispensary.address_street && (
                  <div>
                    <div style={labelStyle}>Address</div>
                    <div style={valueStyle}>
                      {dispensary.address_street}
                      <br />
                      {[dispensary.address_city, dispensary.address_state].filter(Boolean).join(', ')}{' '}
                      {dispensary.address_zip}
                    </div>
                  </div>
                )}

                <div>
                  <div style={labelStyle}>Approved</div>
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: 9999,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: dispensary.is_approved
                      ? 'rgba(34, 197, 94, 0.15)'
                      : 'rgba(239, 68, 68, 0.15)',
                    color: dispensary.is_approved ? '#4ADE80' : '#F87171',
                    border: dispensary.is_approved
                      ? '1px solid rgba(34, 197, 94, 0.3)'
                      : '1px solid rgba(239, 68, 68, 0.3)',
                  }}>
                    {dispensary.is_approved ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
                Dispensary info unavailable
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
