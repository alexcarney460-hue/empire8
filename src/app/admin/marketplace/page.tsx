'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/* ── Types ─────────────────────────────────────────────────────────── */

interface MarketplaceStats {
  activeLots: number;
  totalBids: number;
  completedAuctions: number;
  platformRevenueCents: number;
}

interface WeedbayLot {
  id: string;
  title: string;
  category: string;
  seller_name: string;
  current_bid_cents: number;
  bid_count: number;
  status: string;
  ends_at: string;
  starting_price_cents: number;
  reserve_price_cents: number | null;
  winner_id: string | null;
  winner_bid_cents: number | null;
  created_at: string;
}

interface BidEntry {
  id: string;
  label: string;
  amount_cents: number;
  is_winning: boolean;
  created_at: string;
}

interface LotDetail {
  lot: WeedbayLot;
  bids: BidEntry[];
  winner_label: string | null;
}

type StatusFilter = '' | 'active' | 'ended' | 'sold' | 'removed';

/* ── Constants ─────────────────────────────────────────────────────── */

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  active:  { bg: 'rgba(34, 197, 94, 0.15)',  text: '#4ADE80', border: 'rgba(34, 197, 94, 0.3)' },
  ended:   { bg: 'rgba(148, 163, 184, 0.15)', text: '#94A3B8', border: 'rgba(148, 163, 184, 0.3)' },
  sold:    { bg: 'rgba(200, 162, 60, 0.15)',  text: '#C8A23C', border: 'rgba(200, 162, 60, 0.3)' },
  removed: { bg: 'rgba(239, 68, 68, 0.15)',  text: '#F87171', border: 'rgba(239, 68, 68, 0.3)' },
};

const STATUS_TABS: ReadonlyArray<{ label: string; value: StatusFilter }> = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Ended', value: 'ended' },
  { label: 'Sold', value: 'sold' },
  { label: 'Removed', value: 'removed' },
];

const LIMIT = 25;

/* ── Helpers ───────────────────────────────────────────────────────── */

const token = process.env.NEXT_PUBLIC_ADMIN_ANALYTICS_TOKEN ?? '';
const authHeaders: Record<string, string> = token
  ? { Authorization: `Bearer ${token}` }
  : {};

async function apiFetch(path: string, options?: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(path, {
    ...options,
    headers: { ...authHeaders, ...options?.headers },
  });
  return res.json() as Promise<Record<string, unknown>>;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  if (!iso) return '--';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(iso: string): string {
  if (!iso) return '--';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function timeRemaining(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${mins}m`;
}

/* ── Component ─────────────────────────────────────────────────────── */

export default function AdminMarketplacePage() {
  // Stats
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [statsError, setStatsError] = useState('');

  // Lots list
  const [lots, setLots] = useState<WeedbayLot[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Expanded lot detail
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<LotDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Action state
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Debounced search
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

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

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  // ── Fetch stats ──
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/api/admin/marketplace/stats');
        if (res.ok) {
          setStats(res.data as MarketplaceStats);
        } else {
          setStatsError(String(res.error || 'Failed to load stats'));
        }
      } catch {
        setStatsError('Network error loading stats');
      }
    })();
  }, []);

  // ── Fetch lots ──
  const fetchLots = useCallback(async () => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams({
      page: String(page),
      limit: String(LIMIT),
    });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (statusFilter) params.set('status', statusFilter);

    try {
      const res = await apiFetch(`/api/admin/marketplace/lots?${params}`);
      if (res.ok) {
        setLots(res.data as WeedbayLot[]);
        setTotal(res.total as number);
      } else {
        setError(String(res.error || 'Failed to fetch lots'));
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchLots();
  }, [fetchLots]);

  // ── Fetch lot detail on expand ──
  useEffect(() => {
    if (!expandedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setDetailLoading(true);
      try {
        const res = await apiFetch(`/api/admin/marketplace/lots?lot_id=${expandedId}`);
        if (!cancelled && res.ok) {
          setDetail(res.data as LotDetail);
        }
      } catch {
        // silently fail detail
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [expandedId]);

  // ── Admin actions ──
  const handleAction = async (lotId: string, action: 'end_early' | 'remove') => {
    const confirmMsg = action === 'end_early'
      ? 'End this auction early? If there is a qualifying bid, the lot will be sold.'
      : 'Remove this listing? This cannot be undone.';

    if (!confirm(confirmMsg)) return;

    setActionLoading(lotId);
    try {
      const res = await apiFetch('/api/admin/marketplace/lots', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: lotId, action }),
      });
      if (res.ok) {
        // Refresh both lots and stats
        fetchLots();
        const statsRes = await apiFetch('/api/admin/marketplace/stats');
        if (statsRes.ok) setStats(statsRes.data as MarketplaceStats);
        if (expandedId === lotId) setExpandedId(null);
      } else {
        alert(String(res.error || 'Action failed'));
      }
    } catch {
      alert('Network error');
    } finally {
      setActionLoading(null);
    }
  };

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
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#FFFFFF',
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            Weedbay Marketplace
          </h1>
          <p style={{
            fontSize: '0.85rem',
            color: 'rgba(255,255,255,0.45)',
            margin: '6px 0 0',
          }}>
            Manage auction lots, bids, and platform revenue
          </p>
        </div>

        {/* Stats Section */}
        {statsError && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 16,
            fontSize: '0.85rem',
            color: '#F87171',
          }}>
            {statsError}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}>
          {STAT_CARDS.map((card) => {
            const value = stats ? card.getValue(stats) : '--';
            return (
              <div
                key={card.label}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  padding: '20px 20px 18px',
                }}
              >
                <p style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  margin: '0 0 6px',
                }}>
                  {card.label}
                </p>
                <p style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: card.color,
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}>
                  {stats === null ? (
                    <span style={{
                      display: 'inline-block',
                      width: 80,
                      height: 28,
                      background: '#1A0830',
                      borderRadius: 6,
                      animation: 'e8pulse 1.5s ease-in-out infinite',
                    }} />
                  ) : value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Search + Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
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
              placeholder="Search by lot title..."
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

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.value;
              const sc = tab.value ? STATUS_COLORS[tab.value] : null;
              return (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 9999,
                    border: active
                      ? `1px solid ${sc?.border ?? '#C8A23C'}`
                      : '1px solid rgba(255,255,255,0.1)',
                    background: active
                      ? (sc?.bg ?? 'rgba(200,162,60,0.15)')
                      : 'transparent',
                    color: active
                      ? (sc?.text ?? '#C8A23C')
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

        {/* Table */}
        <div style={cardStyle}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['Title', 'Category', 'Seller', 'Current Bid', 'Bids', 'Ends At', 'Status', 'Actions'].map((h) => (
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
                      colSpan={8}
                      style={{
                        padding: '64px 16px',
                        textAlign: 'center',
                        color: 'rgba(255,255,255,0.3)',
                      }}
                    >
                      Loading lots...
                    </td>
                  </tr>
                ) : lots.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        padding: '64px 16px',
                        textAlign: 'center',
                        color: 'rgba(255,255,255,0.3)',
                      }}
                    >
                      No lots found
                    </td>
                  </tr>
                ) : (
                  lots.map((lot) => {
                    const sc = STATUS_COLORS[lot.status] ?? STATUS_COLORS.ended;
                    const isExpanded = expandedId === lot.id;
                    const isActionTarget = actionLoading === lot.id;

                    return (
                      <LotRow
                        key={lot.id}
                        lot={lot}
                        sc={sc}
                        isExpanded={isExpanded}
                        isActionTarget={isActionTarget}
                        detail={isExpanded ? detail : null}
                        detailLoading={isExpanded && detailLoading}
                        onToggle={() => setExpandedId(isExpanded ? null : lot.id)}
                        onAction={handleAction}
                      />
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

        {/* Pulse animation for skeleton loading */}
        <style>{`@keyframes e8pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }`}</style>
      </div>
    </div>
  );
}

/* ── Stat Card Definitions ─────────────────────────────────────────── */

const STAT_CARDS: ReadonlyArray<{
  label: string;
  color: string;
  getValue: (s: MarketplaceStats) => string;
}> = [
  {
    label: 'Active Lots',
    color: '#4ADE80',
    getValue: (s) => String(s.activeLots),
  },
  {
    label: 'Total Bids',
    color: '#60A5FA',
    getValue: (s) => String(s.totalBids),
  },
  {
    label: 'Revenue (5% Fees)',
    color: '#C8A23C',
    getValue: (s) => formatCents(s.platformRevenueCents),
  },
  {
    label: 'Completed Auctions',
    color: '#A78BFA',
    getValue: (s) => String(s.completedAuctions),
  },
];

/* ── Lot Row Sub-component ─────────────────────────────────────────── */

interface LotRowProps {
  lot: WeedbayLot;
  sc: { bg: string; text: string; border: string };
  isExpanded: boolean;
  isActionTarget: boolean;
  detail: LotDetail | null;
  detailLoading: boolean;
  onToggle: () => void;
  onAction: (lotId: string, action: 'end_early' | 'remove') => void;
}

function LotRow({
  lot,
  sc,
  isExpanded,
  isActionTarget,
  detail,
  detailLoading,
  onToggle,
  onAction,
}: LotRowProps) {
  return (
    <>
      <tr
        onClick={onToggle}
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          cursor: 'pointer',
          transition: 'background 150ms',
          background: isExpanded ? 'rgba(74, 14, 120, 0.12)' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = isExpanded
            ? 'rgba(74, 14, 120, 0.12)'
            : 'transparent';
        }}
      >
        <td style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: 600, maxWidth: 240 }}>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {lot.title}
          </div>
        </td>
        <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
          {lot.category}
        </td>
        <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>
          {lot.seller_name}
        </td>
        <td style={{ padding: '14px 16px', color: '#C8A23C', fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
          {lot.current_bid_cents > 0 ? formatCents(lot.current_bid_cents) : formatCents(lot.starting_price_cents)}
        </td>
        <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
          {lot.bid_count}
        </td>
        <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
          {lot.status === 'active' ? (
            <span title={formatDateTime(lot.ends_at)}>{timeRemaining(lot.ends_at)}</span>
          ) : (
            formatDate(lot.ends_at)
          )}
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
            {lot.status}
          </span>
        </td>
        <td style={{ padding: '14px 12px' }} onClick={(e) => e.stopPropagation()}>
          {lot.status === 'active' && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => onAction(lot.id, 'end_early')}
                disabled={isActionTarget}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(200, 162, 60, 0.3)',
                  background: 'rgba(200, 162, 60, 0.1)',
                  color: '#C8A23C',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: isActionTarget ? 'not-allowed' : 'pointer',
                  opacity: isActionTarget ? 0.5 : 1,
                  whiteSpace: 'nowrap',
                }}
                title="End this auction early"
              >
                End Early
              </button>
              <button
                onClick={() => onAction(lot.id, 'remove')}
                disabled={isActionTarget}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#F87171',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: isActionTarget ? 'not-allowed' : 'pointer',
                  opacity: isActionTarget ? 0.5 : 1,
                  whiteSpace: 'nowrap',
                }}
                title="Remove this listing"
              >
                Remove
              </button>
            </div>
          )}
        </td>
      </tr>

      {/* Expanded Detail Row */}
      {isExpanded && (
        <tr>
          <td colSpan={8} style={{ padding: 0 }}>
            <div style={{
              background: 'rgba(74, 14, 120, 0.06)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              padding: '20px 24px',
            }}>
              {detailLoading ? (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                  Loading bid history...
                </p>
              ) : detail ? (
                <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                  {/* Bid History */}
                  <div style={{ flex: '1 1 400px', minWidth: 300 }}>
                    <h3 style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      margin: '0 0 12px',
                    }}>
                      Bid History ({detail.bids.length})
                    </h3>
                    {detail.bids.length === 0 ? (
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
                        No bids placed
                      </p>
                    ) : (
                      <div style={{
                        maxHeight: 240,
                        overflowY: 'auto',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                              <th style={{ padding: '8px 12px', textAlign: 'left', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Bidder</th>
                              <th style={{ padding: '8px 12px', textAlign: 'right', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Amount</th>
                              <th style={{ padding: '8px 12px', textAlign: 'right', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detail.bids.map((bid) => (
                              <tr key={bid.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{
                                  padding: '8px 12px',
                                  color: bid.is_winning ? '#C8A23C' : 'rgba(255,255,255,0.6)',
                                  fontWeight: bid.is_winning ? 700 : 400,
                                }}>
                                  {bid.label}
                                  {bid.is_winning && (
                                    <span style={{
                                      marginLeft: 6,
                                      fontSize: '0.68rem',
                                      color: '#C8A23C',
                                      fontWeight: 700,
                                    }}>
                                      WINNER
                                    </span>
                                  )}
                                </td>
                                <td style={{
                                  padding: '8px 12px',
                                  textAlign: 'right',
                                  color: '#FFFFFF',
                                  fontFamily: 'monospace',
                                  fontWeight: 600,
                                }}>
                                  {formatCents(bid.amount_cents)}
                                </td>
                                <td style={{
                                  padding: '8px 12px',
                                  textAlign: 'right',
                                  color: 'rgba(255,255,255,0.35)',
                                  fontSize: '0.78rem',
                                }}>
                                  {formatDateTime(bid.created_at)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Winner Info */}
                  {detail.lot.status === 'sold' && (
                    <div style={{ flex: '0 0 220px' }}>
                      <h3 style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: 'rgba(255,255,255,0.5)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        margin: '0 0 12px',
                      }}>
                        Sale Info
                      </h3>
                      <div style={{
                        background: 'rgba(200, 162, 60, 0.08)',
                        border: '1px solid rgba(200, 162, 60, 0.2)',
                        borderRadius: 10,
                        padding: '14px 16px',
                      }}>
                        <div style={{ marginBottom: 10 }}>
                          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', display: 'block' }}>Winner</span>
                          <span style={{ fontSize: '0.9rem', color: '#C8A23C', fontWeight: 700 }}>
                            {detail.winner_label ?? 'Unknown'}
                          </span>
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', display: 'block' }}>Winning Bid</span>
                          <span style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 700, fontFamily: 'monospace' }}>
                            {detail.lot.winner_bid_cents ? formatCents(detail.lot.winner_bid_cents) : '--'}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', display: 'block' }}>Platform Fee (5%)</span>
                          <span style={{ fontSize: '0.9rem', color: '#4ADE80', fontWeight: 700, fontFamily: 'monospace' }}>
                            {detail.lot.winner_bid_cents
                              ? formatCents(Math.round(detail.lot.winner_bid_cents * 0.05))
                              : '--'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
                  Failed to load details
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
