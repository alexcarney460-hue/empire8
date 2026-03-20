'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gavel, Plus, ArrowRight, Clock } from 'lucide-react';

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
  cancelled: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', label: 'Cancelled' },
};

/* ── Helpers ───────────────────────────────────────────────────────── */

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function getStatusBadge(status: string) {
  return STATUS_CONFIG[status] ?? { bg: 'rgba(255,255,255,0.08)', color: COLORS.textSecondary, label: status };
}

function getCountdown(endsAt: string): string {
  const now = Date.now();
  const end = new Date(endsAt).getTime();
  const diff = end - now;

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/* ── Page ──────────────────────────────────────────────────────────── */

export default function BrandLotsPage() {
  const [lots, setLots] = useState<readonly Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/marketplace/my-lots');
        if (cancelled) return;

        if (!res.ok) {
          setError('Unable to load lots.');
          setLoading(false);
          return;
        }

        const json = await res.json();
        if (json.ok) setLots(json.data ?? []);
      } catch {
        if (!cancelled) setError('Unable to load lots.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

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

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1
            style={{
              fontSize: 'clamp(1.3rem, 3vw, 1.75rem)',
              fontWeight: 700,
              color: COLORS.textPrimary,
              margin: '0 0 6px 0',
            }}
          >
            My Lots
          </h1>
          <p style={{ fontSize: '0.88rem', color: COLORS.textSecondary, margin: 0 }}>
            Your marketplace listings. {lots.length} lot{lots.length !== 1 ? 's' : ''} total.
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
            padding: '10px 20px',
            borderRadius: 9999,
            fontFamily: "'Barlow', Arial, sans-serif",
            fontWeight: 700,
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textDecoration: 'none',
          }}
        >
          <Plus size={14} /> Create Lot
        </Link>
      </div>

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
          <Gavel size={32} color={COLORS.textMuted} style={{ marginBottom: 16 }} />
          <p style={{ color: COLORS.textSecondary, fontSize: '0.9rem', margin: '0 0 16px' }}>
            No marketplace lots yet. Create your first lot to start selling.
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
            Create Lot
          </Link>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: COLORS.card,
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {lots.map((lot, idx) => {
            const badge = getStatusBadge(lot.status);
            const currentPrice = lot.current_bid_cents ?? lot.starting_price_cents;
            const countdown = getCountdown(lot.ends_at);
            const isActive = lot.status === 'active';

            return (
              <Link
                key={lot.id}
                href={`/marketplace/${lot.id}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderBottom: idx < lots.length - 1 ? `1px solid ${COLORS.cardBorder}` : 'none',
                  textDecoration: 'none',
                  transition: 'background-color 150ms ease',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', flex: 1 }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: COLORS.textPrimary }}>
                    {lot.title}
                  </span>
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      backgroundColor: badge.bg,
                      color: badge.color,
                      borderRadius: 9999,
                      padding: '3px 10px',
                    }}
                  >
                    {badge.label}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>
                    {lot.category}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: '0.78rem', color: COLORS.textSecondary }}>
                    {lot.bid_count} bid{lot.bid_count !== 1 ? 's' : ''}
                  </span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: COLORS.textPrimary }}>
                    {formatCurrency(currentPrice)}
                  </span>
                  {isActive && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.72rem',
                        color: COLORS.gold,
                      }}
                    >
                      <Clock size={12} />
                      {countdown}
                    </span>
                  )}
                  <ArrowRight size={14} color={COLORS.textMuted} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
