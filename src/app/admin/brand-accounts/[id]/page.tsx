'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

/* -- Theme tokens -- */
const BG = '#0F0520';
const CARD_BG = 'rgba(255,255,255,0.04)';
const GOLD = '#C8A23C';
const BORDER = 'rgba(200,162,60,0.12)';
const TEXT_PRIMARY = '#ffffff';
const TEXT_SECONDARY = 'rgba(255,255,255,0.55)';
const TEXT_MUTED = 'rgba(255,255,255,0.35)';

/* -- Types -- */
interface LinkedBrand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
}

interface BrandAccountDetail {
  id: string;
  user_id: string;
  company_name: string;
  license_number: string;
  license_type: string;
  contact_name: string;
  email: string;
  phone: string | null;
  website: string | null;
  description: string | null;
  brand_id: string | null;
  is_approved: boolean;
  approved_at: string | null;
  created_at: string;
  notes: string | null;
  brand: LinkedBrand | null;
  product_count: number;
}

/* -- Helpers -- */
function adminFetch(path: string, opts: RequestInit = {}) {
  const token = process.env.NEXT_PUBLIC_ADMIN_ANALYTICS_TOKEN || '';
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

/* -- Info Row -- */
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

/* -- Status Badge -- */
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

/* -- Skeleton -- */
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

/* -- Main Page -- */
export default function BrandAccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [account, setAccount] = useState<BrandAccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminFetch(`/api/admin/brand-accounts/${id}`);
      if (res.ok) {
        setAccount(res.data);
      } else {
        setError(res.error || 'Failed to load brand account');
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
    if (!confirm('Approve this brand account? A brand record will be created if one does not exist.')) return;
    setApproving(true);
    try {
      const res = await adminFetch(`/api/admin/brand-accounts/${id}/approve`, {
        method: 'POST',
      });
      if (res.ok) {
        // Refresh to get updated data including linked brand
        await fetchDetail();
      } else {
        alert(res.error || 'Failed to approve');
      }
    } catch {
      alert('Network error');
    }
    setApproving(false);
  }

  async function handleReject() {
    const reason = prompt('Reject this brand account application?\n\nEnter a rejection reason (optional):');
    if (reason === null) return; // user cancelled the prompt
    setRejecting(true);
    try {
      const rejectionNote = reason.trim()
        ? `REJECTED by admin: ${reason.trim()}`
        : 'REJECTED by admin';
      const existingNotes = account?.notes ? `${account.notes}\n` : '';
      const res = await adminFetch(`/api/admin/brand-accounts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          notes: `${existingNotes}${rejectionNote} (${new Date().toISOString()})`,
        }),
      });
      if (res.ok) {
        router.push('/admin/brand-accounts');
      } else {
        alert(res.error || 'Failed to reject');
      }
    } catch {
      alert('Network error');
    }
    setRejecting(false);
  }

  if (loading) return <DetailSkeleton />;

  if (error || !account) {
    return (
      <div style={{ minHeight: '100vh', background: BG, padding: '32px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <button
            onClick={() => router.push('/admin/brand-accounts')}
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
            Back to Brand Accounts
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
            {error || 'Brand account not found.'}
          </div>
        </div>
      </div>
    );
  }

  const isPending = !account.is_approved;

  return (
    <div style={{ minHeight: '100vh', background: BG, padding: '32px 24px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Back button */}
        <button
          onClick={() => router.push('/admin/brand-accounts')}
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
          Back to Brand Accounts
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
              {account.company_name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  fontSize: '0.84rem',
                  color: TEXT_SECONDARY,
                  fontFamily: 'monospace',
                }}
              >
                {account.license_number}
              </span>
              <StatusBadge approved={account.is_approved} />
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
            Brand Account Information
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 20,
            }}
          >
            <InfoRow label="Company Name" value={account.company_name} />
            <InfoRow label="License Number" value={account.license_number} />
            <InfoRow label="License Type" value={formatLicenseType(account.license_type)} />
            <InfoRow label="Contact Name" value={account.contact_name} />
            <InfoRow label="Email" value={account.email} />
            <InfoRow label="Phone" value={account.phone || '--'} />
            <InfoRow label="Website" value={account.website || '--'} />
            <InfoRow label="Created" value={formatDate(account.created_at)} />
            <InfoRow
              label="Approved At"
              value={account.approved_at ? formatDate(account.approved_at) : '--'}
            />
          </div>
          {account.description && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
              <InfoRow label="Description" value={account.description} />
            </div>
          )}
          {account.notes && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
              <InfoRow label="Notes" value={account.notes} />
            </div>
          )}
        </div>

        {/* Linked Brand Info */}
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
              Linked Brand
            </h2>
          </div>

          {account.brand ? (
            <div style={{ padding: 24 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 20,
                }}
              >
                <InfoRow label="Brand Name" value={account.brand.name} />
                <InfoRow label="Slug" value={account.brand.slug} />
                <InfoRow label="Active" value={account.brand.is_active ? 'Yes' : 'No'} />
                <InfoRow label="Products" value={String(account.product_count)} />
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '40px 24px',
                textAlign: 'center',
                color: TEXT_MUTED,
                fontSize: '0.88rem',
              }}
            >
              No brand linked yet. A brand record will be created upon approval.
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }`}</style>
    </div>
  );
}
