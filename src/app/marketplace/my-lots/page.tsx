'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────── */

interface Lot {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly current_bid_cents: number | null;
  readonly starting_price_cents: number;
  readonly bid_count: number;
  readonly status: string;
  readonly ends_at: string;
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

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80', label: 'Active' },
  ended: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', label: 'Ended' },
  sold: { bg: 'rgba(200,162,60,0.15)', color: '#C8A23C', label: 'Sold' },
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

function getStatusBadge(status: string) {
  return STATUS_CONFIG[status] ?? { bg: 'rgba(255,255,255,0.08)', color: COLORS.textSecondary, label: status };
}

/* ── Page ──────────────────────────────────────────────────────────── */

export default function MyLotsPage() {
  const [lots, setLots] = useState<readonly Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/marketplace/my-lots');

        if (cancelled) return;

        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }

        if (!res.ok) {
          setError('Unable to load your lots. Please try again later.');
          setLoading(false);
          return;
        }

        const json = await res.json();
        if (cancelled) return;

        if (json.ok) {
          setLots(json.data ?? []);
        } else {
          setError(json.error ?? 'An unexpected error occurred.');
        }
      } catch {
        if (!cancelled) setError('Unable to load your lots.');
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
        <style>{`@keyframes e8-spin { to { transform: rotate(360deg); } }`}</style>
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
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: 700,
              color: COLORS.textPrimary,
              margin: '0 0 6px 0',
            }}
          >
            My Lots
          </h1>
          <p style={{ fontSize: '0.92rem', color: COLORS.textSecondary, margin: 0 }}>
            Manage your auction listings on WeedBay.
          </p>
        </div>
        <Link
          href="/marketplace/create"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: COLORS.gold,
            color: '#1A0633',
            padding: '12px 24px',
            borderRadius: 9999,
            fontFamily: "'Barlow', Arial, sans-serif",
            fontWeight: 700,
            fontSize: '0.78rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            boxShadow: '0 4px 24px rgba(200,162,60,0.25)',
          }}
        >
          <Plus size={14} /> Post a Lot
        </Link>
      </div>

      {/* Empty state */}
      {lots.length === 0 ? (
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
            You have not posted any lots yet.
          </p>
          <Link
            href="/marketplace/create"
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
            Post your first lot
          </Link>
        </div>
      ) : (
        <>
          {/* Table header */}
          <div
            style={{
              backgroundColor: COLORS.card,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            <div
              role="row"
              aria-hidden="true"
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 0.6fr 0.8fr 0.8fr',
                gap: 8,
                padding: '12px 20px',
                borderBottom: `1px solid ${COLORS.cardBorder}`,
              }}
            >
              {['Title', 'Category', 'Current Bid', 'Bids', 'Status', 'Ends At'].map(
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
            {lots.map((lot, idx) => {
              const badge = getStatusBadge(lot.status);
              const displayBid =
                lot.current_bid_cents != null
                  ? formatCurrency(lot.current_bid_cents)
                  : formatCurrency(lot.starting_price_cents);

              return (
                <Link
                  key={lot.id}
                  href={`/marketplace/${lot.id}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 0.6fr 0.8fr 0.8fr',
                    gap: 8,
                    alignItems: 'center',
                    padding: '14px 20px',
                    borderBottom:
                      idx < lots.length - 1
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
                    {lot.title}
                  </span>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      color: COLORS.textSecondary,
                      textTransform: 'capitalize',
                    }}
                  >
                    {lot.category}
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: COLORS.textPrimary }}>
                    {displayBid}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: COLORS.textSecondary }}>
                    {lot.bid_count}
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
                    {formatDate(lot.ends_at)}
                  </span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
