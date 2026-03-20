'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/* -- Theme tokens -- */
const BG = '#0F0520';
const CARD_BG = 'rgba(255,255,255,0.04)';
const GOLD = '#C8A23C';
const BORDER = 'rgba(200,162,60,0.12)';
const TEXT_PRIMARY = '#ffffff';
const TEXT_SECONDARY = 'rgba(255,255,255,0.55)';
const TEXT_MUTED = 'rgba(255,255,255,0.35)';

/* -- Types -- */
interface BrandAccount {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  license_number: string;
  license_type: string;
  is_approved: boolean;
  created_at: string;
}

type FilterTab = 'all' | 'pending' | 'approved';

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
  return lt
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* -- Skeleton row -- */
function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div
            style={{
              height: 14,
              borderRadius: 6,
              background: 'rgba(255,255,255,0.06)',
              width: i === 0 ? '70%' : i === 6 ? '60%' : '80%',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        </td>
      ))}
    </tr>
  );
}

/* -- Status Badge -- */
function StatusBadge({ approved }: { approved: boolean }) {
  const bg = approved ? 'rgba(34,197,94,0.12)' : 'rgba(200,162,60,0.15)';
  const color = approved ? '#22c55e' : GOLD;
  const label = approved ? 'Approved' : 'Pending';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 9999,
        fontSize: '0.72rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        background: bg,
        color,
        border: `1px solid ${approved ? 'rgba(34,197,94,0.2)' : 'rgba(200,162,60,0.25)'}`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}

/* -- Main Page -- */
export default function BrandAccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<BrandAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const limit = 25;

  // Debounce search input by 300ms
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.set('q', search);
      if (activeTab !== 'all') params.set('status', activeTab);

      const res = await adminFetch(`/api/admin/brand-accounts?${params}`);
      if (res.ok) {
        setAccounts(res.data);
        setTotal(res.total);
        setPendingCount(res.pending_count);
      } else {
        setError(res.error || 'Failed to load brand accounts');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  }, [page, search, activeTab]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, activeTab]);

  const totalPages = Math.ceil(total / limit);

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending Approval', count: pendingCount },
    { key: 'approved', label: 'Approved' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: BG, padding: '32px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: TEXT_PRIMARY,
              marginBottom: 4,
            }}
          >
            Brand Account Management
          </h1>
          <p style={{ fontSize: '0.85rem', color: TEXT_SECONDARY }}>
            {total} brand account{total === 1 ? '' : 's'} registered
          </p>
        </div>

        {/* Search + Filter Tabs */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            marginBottom: 20,
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 420 }}>
            <svg
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 16,
                height: 16,
                color: TEXT_MUTED,
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
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search company, email, or contact name..."
              style={{
                width: '100%',
                padding: '10px 14px 10px 36px',
                borderRadius: 10,
                border: `1px solid ${BORDER}`,
                background: CARD_BG,
                color: TEXT_PRIMARY,
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 16px',
                    borderRadius: 9999,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: `1px solid ${isActive ? GOLD : BORDER}`,
                    background: isActive ? 'rgba(200,162,60,0.12)' : 'transparent',
                    color: isActive ? GOLD : TEXT_SECONDARY,
                    cursor: 'pointer',
                    transition: 'all 150ms',
                  }}
                >
                  {tab.label}
                  {tab.count != null && tab.count > 0 && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 20,
                        height: 20,
                        borderRadius: 9999,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: GOLD,
                        color: '#0F0520',
                        padding: '0 6px',
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 20,
              color: '#f87171',
              fontSize: '0.85rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Table */}
        <div
          style={{
            background: CARD_BG,
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {['Company Name', 'Contact', 'Email', 'License #', 'License Type', 'Status', 'Created'].map(
                    (header) => (
                      <th
                        key={header}
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: TEXT_MUTED,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {header}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                ) : accounts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        padding: '48px 16px',
                        textAlign: 'center',
                        color: TEXT_MUTED,
                        fontSize: '0.9rem',
                      }}
                    >
                      {search
                        ? 'No brand accounts match your search.'
                        : activeTab === 'pending'
                          ? 'No pending approvals.'
                          : 'No brand accounts found.'}
                    </td>
                  </tr>
                ) : (
                  accounts.map((a) => (
                    <tr
                      key={a.id}
                      onClick={() => router.push(`/admin/brand-accounts/${a.id}`)}
                      style={{
                        borderBottom: `1px solid ${BORDER}`,
                        cursor: 'pointer',
                        transition: 'background 120ms',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      <td style={{ padding: '14px 16px', color: TEXT_PRIMARY, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {a.company_name}
                      </td>
                      <td style={{ padding: '14px 16px', color: TEXT_SECONDARY, whiteSpace: 'nowrap' }}>
                        {a.contact_name}
                      </td>
                      <td style={{ padding: '14px 16px', color: TEXT_SECONDARY }}>
                        {a.email}
                      </td>
                      <td style={{ padding: '14px 16px', color: TEXT_SECONDARY, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {a.license_number}
                      </td>
                      <td style={{ padding: '14px 16px', color: TEXT_SECONDARY }}>
                        {formatLicenseType(a.license_type)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <StatusBadge approved={a.is_approved} />
                      </td>
                      <td style={{ padding: '14px 16px', color: TEXT_MUTED, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {formatDate(a.created_at)}
                      </td>
                    </tr>
                  ))
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
                padding: '12px 16px',
                borderTop: `1px solid ${BORDER}`,
              }}
            >
              <span style={{ fontSize: '0.8rem', color: TEXT_MUTED }}>
                Page {page} of {totalPages} ({total} total)
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: `1px solid ${BORDER}`,
                    background: 'transparent',
                    color: page <= 1 ? TEXT_MUTED : TEXT_SECONDARY,
                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                    opacity: page <= 1 ? 0.5 : 1,
                  }}
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: `1px solid ${BORDER}`,
                    background: 'transparent',
                    color: page >= totalPages ? TEXT_MUTED : TEXT_SECONDARY,
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                    opacity: page >= totalPages ? 0.5 : 1,
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Skeleton pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
