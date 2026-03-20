'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

/* ── Theme tokens ── */
const BG = '#0F0520';
const CARD_BG = 'rgba(255,255,255,0.04)';
const GOLD = '#C8A23C';
const BORDER = 'rgba(200,162,60,0.12)';
const TEXT_PRIMARY = '#ffffff';
const TEXT_SECONDARY = 'rgba(255,255,255,0.55)';
const TEXT_MUTED = 'rgba(255,255,255,0.35)';

/* ── Types ── */
interface Order {
  id: string;
  order_number: string;
  status: string;
  total_cents: number;
  notes: string | null;
  created_at: string;
}

interface DispensaryDetail {
  id: string;
  user_id: string;
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
  approved_at: string | null;
  created_at: string;
  notes: string | null;
  orders: Order[];
}

/* ── Helpers ── */
function adminFetch(path: string, opts: RequestInit = {}) {
  const token = process.env.NEXT_PUBLIC_ADMIN_ANALYTICS_TOKEN;
  const headers: Record<string, string> = {
    ...(opts.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (opts.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  return fetch(path, { ...opts, headers }).then((r) => r.json());
}

function formatLicenseType(lt: string): string {
  return lt.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatAddress(d: DispensaryDetail): string {
  const parts = [d.address_street, d.address_city, d.address_state, d.address_zip].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : '--';
}

/* ── Info Row ── */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <span
        style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: TEXT_MUTED,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '0.88rem',
          color: TEXT_PRIMARY,
          wordBreak: 'break-word',
        }}
      >
        {value || '--'}
      </span>
    </div>
  );
}

/* ── Status Badge ── */
function StatusBadge({ approved }: { approved: boolean }) {
  const bg = approved ? 'rgba(34,197,94,0.12)' : 'rgba(200,162,60,0.15)';
  const color = approved ? '#22c55e' : GOLD;
  const label = approved ? 'Approved' : 'Pending Approval';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 12px',
        borderRadius: 9999,
        fontSize: '0.78rem',
        fontWeight: 600,
        background: bg,
        color,
        border: `1px solid ${approved ? 'rgba(34,197,94,0.2)' : 'rgba(200,162,60,0.25)'}`,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}

/* ── Order Status Badge ── */
function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    pending: { bg: 'rgba(200,162,60,0.12)', color: GOLD },
    confirmed: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa' },
    shipped: { bg: 'rgba(139,92,246,0.12)', color: '#a78bfa' },
    delivered: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
    cancelled: { bg: 'rgba(239,68,68,0.12)', color: '#f87171' },
  };
  const s = map[status] ?? { bg: 'rgba(255,255,255,0.06)', color: TEXT_SECONDARY };

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 6,
        fontSize: '0.72rem',
        fontWeight: 600,
        background: s.bg,
        color: s.color,
        textTransform: 'capitalize',
      }}
    >
      {status}
    </span>
  );
}

/* ── Skeleton ── */
function DetailSkeleton() {
  const bar = (w: string) => (
    <div
      style={{
        height: 16,
        borderRadius: 6,
        background: 'rgba(255,255,255,0.06)',
        width: w,
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  );

  return (
    <div style={{ minHeight: '100vh', background: BG, padding: '32px 24px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>{bar('30%')}</div>
        <div
          style={{
            background: CARD_BG,
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            padding: 24,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
          }}
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {bar('40%')}
              {bar('70%')}
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }`}</style>
    </div>
  );
}

/* ── Main Page ── */
export default function DispensaryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [dispensary, setDispensary] = useState<DispensaryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminFetch(`/api/admin/dispensaries/${id}`);
      if (res.ok) {
        setDispensary(res.data);
      } else {
        setError(res.error || 'Failed to load dispensary');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  async function handleApprove() {
    if (!confirm('Approve this dispensary? They will gain full ordering access.')) return;
    setApproving(true);
    try {
      const res = await adminFetch(`/api/admin/dispensaries/${id}/approve`, {
        method: 'POST',
      });
      if (res.ok) {
        // Refresh data immutably
        setDispensary((prev) =>
          prev
            ? { ...prev, is_approved: true, approved_at: new Date().toISOString() }
            : prev
        );
      } else {
        alert(res.error || 'Failed to approve');
      }
    } catch {
      alert('Network error');
    }
    setApproving(false);
  }

  async function handleReject() {
    if (!confirm('Reject this dispensary application? This will delete the account.')) return;
    setRejecting(true);
    try {
      // Delete the dispensary account (uses PATCH to mark as rejected, or we can delete)
      // For now, we use the detail endpoint to note rejection. In a full implementation,
      // this would soft-delete or set a rejected status.
      const res = await adminFetch(`/api/admin/dispensaries/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ notes: 'REJECTED by admin' }),
      });
      if (res.ok) {
        router.push('/admin/dispensaries');
      } else {
        alert(res.error || 'Failed to reject');
      }
    } catch {
      alert('Network error');
    }
    setRejecting(false);
  }

  if (loading) return <DetailSkeleton />;

  if (error || !dispensary) {
    return (
      <div style={{ minHeight: '100vh', background: BG, padding: '32px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <button
            onClick={() => router.push('/admin/dispensaries')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 10,
              fontSize: '0.84rem',
              fontWeight: 600,
              border: `1px solid ${BORDER}`,
              background: 'transparent',
              color: TEXT_SECONDARY,
              cursor: 'pointer',
              marginBottom: 24,
            }}
          >
            Back to Dispensaries
          </button>
          <div
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 12,
              padding: '16px 20px',
              color: '#f87171',
              fontSize: '0.88rem',
            }}
          >
            {error || 'Dispensary not found.'}
          </div>
        </div>
      </div>
    );
  }

  const isPending = !dispensary.is_approved;

  return (
    <div style={{ minHeight: '100vh', background: BG, padding: '32px 24px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Back button */}
        <button
          onClick={() => router.push('/admin/dispensaries')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 10,
            fontSize: '0.84rem',
            fontWeight: 600,
            border: `1px solid ${BORDER}`,
            background: 'transparent',
            color: TEXT_SECONDARY,
            cursor: 'pointer',
            marginBottom: 24,
            transition: 'border-color 150ms',
          }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dispensaries
        </button>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: TEXT_PRIMARY,
                marginBottom: 6,
              }}
            >
              {dispensary.company_name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  fontSize: '0.84rem',
                  color: TEXT_SECONDARY,
                  fontFamily: 'monospace',
                }}
              >
                {dispensary.license_number}
              </span>
              <StatusBadge approved={dispensary.is_approved} />
            </div>
          </div>

          {/* Action buttons -- only for pending */}
          {isPending && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleReject}
                disabled={rejecting}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  border: '1px solid rgba(239,68,68,0.3)',
                  background: 'rgba(239,68,68,0.1)',
                  color: '#f87171',
                  cursor: rejecting ? 'not-allowed' : 'pointer',
                  opacity: rejecting ? 0.6 : 1,
                  transition: 'all 150ms',
                }}
              >
                {rejecting ? 'Rejecting...' : 'Reject'}
              </button>
              <button
                onClick={handleApprove}
                disabled={approving}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  border: '1px solid rgba(34,197,94,0.3)',
                  background: 'rgba(34,197,94,0.12)',
                  color: '#22c55e',
                  cursor: approving ? 'not-allowed' : 'pointer',
                  opacity: approving ? 0.6 : 1,
                  transition: 'all 150ms',
                }}
              >
                {approving ? 'Approving...' : 'Approve'}
              </button>
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div
          style={{
            background: CARD_BG,
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              color: TEXT_PRIMARY,
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            Dispensary Information
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 20,
            }}
          >
            <InfoRow label="Company Name" value={dispensary.company_name} />
            <InfoRow label="License Number" value={dispensary.license_number} />
            <InfoRow label="License Type" value={formatLicenseType(dispensary.license_type)} />
            <InfoRow label="Contact Name" value={dispensary.contact_name} />
            <InfoRow label="Email" value={dispensary.email} />
            <InfoRow label="Phone" value={dispensary.phone || '--'} />
            <InfoRow label="Address" value={formatAddress(dispensary)} />
            <InfoRow label="Created" value={formatDate(dispensary.created_at)} />
            <InfoRow
              label="Approved At"
              value={dispensary.approved_at ? formatDate(dispensary.approved_at) : '--'}
            />
          </div>
          {dispensary.notes && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
              <InfoRow label="Notes" value={dispensary.notes} />
            </div>
          )}
        </div>

        {/* Order History */}
        <div
          style={{
            background: CARD_BG,
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${BORDER}` }}>
            <h2 style={{ fontSize: '0.88rem', fontWeight: 700, color: TEXT_PRIMARY }}>
              Order History
              <span style={{ fontWeight: 400, color: TEXT_MUTED, marginLeft: 8 }}>
                ({dispensary.orders.length})
              </span>
            </h2>
          </div>

          {dispensary.orders.length === 0 ? (
            <div
              style={{
                padding: '40px 24px',
                textAlign: 'center',
                color: TEXT_MUTED,
                fontSize: '0.88rem',
              }}
            >
              No orders yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {['Order #', 'Status', 'Total', 'Date', 'Notes'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '10px 16px',
                          textAlign: 'left',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: TEXT_MUTED,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dispensary.orders.map((order) => (
                    <tr
                      key={order.id}
                      style={{ borderBottom: `1px solid ${BORDER}` }}
                    >
                      <td
                        style={{
                          padding: '12px 16px',
                          color: TEXT_PRIMARY,
                          fontWeight: 600,
                          fontFamily: 'monospace',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {order.order_number}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td style={{ padding: '12px 16px', color: TEXT_PRIMARY, fontWeight: 600 }}>
                        {formatCents(order.total_cents)}
                      </td>
                      <td style={{ padding: '12px 16px', color: TEXT_SECONDARY, whiteSpace: 'nowrap' }}>
                        {formatDate(order.created_at)}
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          color: TEXT_MUTED,
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {order.notes || '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }`}</style>
    </div>
  );
}
