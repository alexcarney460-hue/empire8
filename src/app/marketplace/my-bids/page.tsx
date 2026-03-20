'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

/* ── Types ─────────────────────────────────────────────────────────── */

interface BidEntry {
  readonly lot_id: string;
  readonly title: string;
  readonly category: string;
  readonly your_bid_cents: number;
  readonly current_bid_cents: number | null;
  readonly starting_price_cents: number;
  readonly bid_count: number;
  readonly lot_status: string;
  readonly ends_at: string;
  readonly bid_status: 'winning' | 'outbid' | 'won' | 'lost';
}

/* ── Constants ─────────────────────────────────────────────────────── */

const COLORS = {
  bg: '#0F0520',
  card: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(200,162,60,0.12)',
  gold: '#C8A23C',
  goldSubtle: 'rgba(200,162,60,0.10)',
  textPrimary: '#fff',
  textSecondary: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.4)',
} as const;

const BID_STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  winning: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80', label: 'Winning' },
  outbid: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', label: 'Outbid' },
  won: { bg: 'rgba(200,162,60,0.15)', color: '#C8A23C', label: 'Won' },
  lost: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', label: 'Lost' },
};

/* ── Helpers ───────────────────────────────────────────────────────── */

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getBidStatusBadge(status: string) {
  return (
    BID_STATUS_CONFIG[status] ?? {
      bg: 'rgba(255,255,255,0.08)',
      color: COLORS.textSecondary,
      label: status,
    }
  );
}

/* ── Page ──────────────────────────────────────────────────────────── */

export default function MyBidsPage() {
  const [entries, setEntries] = useState<readonly BidEntry[]>([]);

  useEffect(() => { window.scrollTo(0, 0); }, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/marketplace/my-bids');

        if (cancelled) return;

        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }

        if (!res.ok) {
          setError('Unable to load your bids. Please try again later.');
          setLoading(false);
          return;
        }

        const json = await res.json();
        if (cancelled) return;

        if (json.ok) {
          setEntries(json.data ?? []);
        } else {
          setError(json.error ?? 'An unexpected error occurred.');
        }
      } catch {
        if (!cancelled) setError('Unable to load your bids.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  /* ── Loading state ────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: `3px solid ${COLORS.cardBorder}`,
            borderTopColor: COLORS.gold,
            animation: 'e8-spin 0.7s linear infinite',
          }}
        />
      </div>
    );
  }

  /* ── Error state ──────────────────────────────────────────────────── */

  if (error) {
    return (
      <div
        style={{
          backgroundColor: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 12,
          padding: '20px 24px',
          color: '#f87171',
          fontSize: '0.88rem',
        }}
      >
        {error}
      </div>
    );
  }

  /* ── Main render ──────────────────────────────────────────────────── */

  return (
    <div style={{ paddingTop: 'var(--nav-height)', backgroundColor: COLORS.bg, minHeight: '100vh', padding: 'var(--nav-height) 24px 48px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 700,
            color: COLORS.textPrimary,
            margin: '0 0 6px 0',
          }}
        >
          My Bids
        </h1>
        <p style={{ fontSize: '0.92rem', color: COLORS.textSecondary, margin: 0 }}>
          Track the auctions you are bidding on.
        </p>
      </div>

      {/* Empty state */}
      {entries.length === 0 ? (
        <div
          style={{
            backgroundColor: COLORS.card,
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 16,
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <p style={{ color: COLORS.textSecondary, fontSize: '0.92rem', margin: '0 0 16px' }}>
            You have not placed any bids yet.
          </p>
          <Link
            href="/marketplace"
            style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              color: COLORS.gold,
              textDecoration: 'none',
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 9999,
              padding: '8px 18px',
            }}
          >
            Browse the marketplace
          </Link>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div
          style={{
            backgroundColor: COLORS.card,
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 16,
            overflow: 'hidden',
            minWidth: 560,
          }}
        >
          {/* Table header */}
          <div
            role="row"
            aria-hidden="true"
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 0.8fr 0.8fr',
              gap: 8,
              padding: '12px 20px',
              borderBottom: `1px solid ${COLORS.cardBorder}`,
            }}
          >
            {['Lot Title', 'Your Bid', 'Current Bid', 'Status', 'Ends At'].map(
              (heading) => (
                <span
                  key={heading}
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: COLORS.textMuted,
                    fontFamily: "'Barlow', Arial, sans-serif",
                  }}
                >
                  {heading}
                </span>
              ),
            )}
          </div>

          {/* Rows */}
          {entries.map((entry, idx) => {
            const badge = getBidStatusBadge(entry.bid_status);
            const currentDisplay =
              entry.current_bid_cents != null
                ? formatCurrency(entry.current_bid_cents)
                : formatCurrency(entry.starting_price_cents);

            return (
              <Link
                key={entry.lot_id}
                href={`/marketplace/${entry.lot_id}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 0.8fr 0.8fr',
                  gap: 8,
                  alignItems: 'center',
                  padding: '14px 20px',
                  borderBottom:
                    idx < entries.length - 1
                      ? `1px solid ${COLORS.cardBorder}`
                      : 'none',
                  textDecoration: 'none',
                  transition: 'background-color 150ms ease',
                }}
                role="row"
              >
                <span
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: COLORS.textPrimary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.title}
                </span>
                <span
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: COLORS.textPrimary,
                  }}
                >
                  {formatCurrency(entry.your_bid_cents)}
                </span>
                <span
                  style={{
                    fontSize: '0.88rem',
                    color: COLORS.textSecondary,
                  }}
                >
                  {currentDisplay}
                </span>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    backgroundColor: badge.bg,
                    color: badge.color,
                    borderRadius: 9999,
                    padding: '3px 10px',
                    width: 'fit-content',
                  }}
                >
                  {badge.label}
                </span>
                <span style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>
                  {formatDate(entry.ends_at)}
                </span>
              </Link>
            );
          })}
        </div>
        </div>
      )}
      </div>
    </div>
  );
}
