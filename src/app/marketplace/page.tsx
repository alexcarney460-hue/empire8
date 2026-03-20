'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Search, Loader2, Clock, Gavel, ArrowRight } from 'lucide-react';

/* ── Types ── */

type Lot = {
  id: string;
  title: string;
  category: string;
  quantity: number;
  unit: string;
  starting_price: number;
  current_bid: number | null;
  bid_count: number;
  ends_at: string;
  thc_pct: number | null;
  status: 'active' | 'ended' | 'sold';
};

type SortOption = 'ending_soon' | 'newest' | 'price_asc' | 'most_bids';

const CATEGORIES = ['All', 'Flower', 'Concentrates', 'Edibles', 'Pre-Rolls', 'Extracts', 'Other'] as const;

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'ending_soon', label: 'Ending Soon' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price Low-High' },
  { value: 'most_bids', label: 'Most Bids' },
];

/* ── Helpers ── */

function formatTimeRemaining(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function isUrgent(endsAt: string): boolean {
  const diff = new Date(endsAt).getTime() - Date.now();
  return diff > 0 && diff < 1000 * 60 * 60 * 4; // under 4 hours
}

/* ── Sort logic ── */

function sortLots(lots: readonly Lot[], sort: SortOption): Lot[] {
  const copy = [...lots];
  switch (sort) {
    case 'ending_soon':
      return copy.sort((a, b) => new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime());
    case 'newest':
      return copy.sort((a, b) => new Date(b.ends_at).getTime() - new Date(a.ends_at).getTime());
    case 'price_asc':
      return copy.sort((a, b) => (a.current_bid ?? a.starting_price) - (b.current_bid ?? b.starting_price));
    case 'most_bids':
      return copy.sort((a, b) => b.bid_count - a.bid_count);
    default:
      return copy;
  }
}

/* ── Component ── */

export default function MarketplacePage() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [sort, setSort] = useState<SortOption>('ending_soon');

  useEffect(() => {
    let cancelled = false;

    async function fetchLots() {
      try {
        const res = await fetch('/api/marketplace/lots');
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error ?? 'Failed to load lots');
        }

        if (!cancelled) {
          setLots(json.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load lots');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchLots();
    return () => { cancelled = true; };
  }, []);

  const filteredLots = useMemo(() => {
    const query = search.toLowerCase().trim();
    const filtered = lots.filter((lot) => {
      const matchesSearch = !query || lot.title.toLowerCase().includes(query);
      const matchesCategory = category === 'All' || lot.category === category;
      return matchesSearch && matchesCategory;
    });
    return sortLots(filtered, sort);
  }, [lots, search, category, sort]);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setCategory('All');
    setSort('ending_soon');
  }, []);

  return (
    <div style={{ backgroundColor: '#0F0520', minHeight: '100vh', paddingTop: 'var(--nav-height)' }}>

      {/* Hero */}
      <section
        style={{
          background: 'linear-gradient(168deg, #2D0A4E 0%, #4A0E78 35%, #2D0A4E 70%, #1A0633 100%)',
          padding: '80px 24px 88px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative glow */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '5%',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,162,60,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-15%',
            left: '8%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(74,14,120,0.15)',
            filter: 'blur(100px)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <span
            className="label-caps"
            style={{ color: '#C8A23C', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20 }}
          >
            <span style={{ width: 24, height: 1.5, backgroundColor: '#C8A23C', display: 'inline-block', borderRadius: 99 }} />
            Weedbay
            <span style={{ width: 24, height: 1.5, backgroundColor: '#C8A23C', display: 'inline-block', borderRadius: 99 }} />
          </span>
          <h1
            className="font-display"
            style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', lineHeight: 1.0, color: '#fff', marginBottom: 20 }}
          >
            Weedbay Marketplace
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', maxWidth: 580, margin: '0 auto', lineHeight: 1.8 }}>
            Anonymous Large-Lot Cannabis Auctions. 5% Platform Fee.
          </p>
        </div>
      </section>

      {/* Filter bar */}
      <section
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(200,162,60,0.08)',
          position: 'sticky',
          top: 'var(--nav-height)',
          zIndex: 10,
          backgroundColor: 'rgba(15,5,32,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 380 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.35)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lots..."
              aria-label="Search marketplace lots"
              style={{
                width: '100%',
                padding: '10px 16px 10px 40px',
                borderRadius: 10,
                border: '1px solid rgba(200,162,60,0.15)',
                backgroundColor: 'rgba(255,255,255,0.04)',
                color: '#fff',
                fontSize: '0.88rem',
                fontFamily: "'Inter', system-ui, sans-serif",
                outline: 'none',
                transition: 'border-color 200ms ease',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(200,162,60,0.4)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(200,162,60,0.15)'; }}
            />
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                aria-pressed={category === cat}
                style={{
                  padding: '8px 18px',
                  borderRadius: 9999,
                  border: `1px solid ${category === cat ? 'rgba(200,162,60,0.5)' : 'rgba(200,162,60,0.12)'}`,
                  backgroundColor: category === cat ? 'rgba(200,162,60,0.15)' : 'transparent',
                  color: category === cat ? '#C8A23C' : 'rgba(255,255,255,0.5)',
                  fontFamily: "'Barlow', Arial, sans-serif",
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  transition: 'background-color 150ms ease, color 150ms ease, border-color 150ms ease',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            aria-label="Sort lots"
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: '1px solid rgba(200,162,60,0.15)',
              backgroundColor: 'rgba(255,255,255,0.04)',
              color: '#fff',
              fontSize: '0.85rem',
              fontFamily: "'Barlow', Arial, sans-serif",
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
              appearance: 'auto',
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} style={{ backgroundColor: '#1A0633', color: '#fff' }}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Content */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <Loader2
              size={32}
              style={{ color: '#C8A23C', animation: 'spin 1s linear infinite' }}
            />
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'rgba(255,255,255,0.5)' }}>
            <p style={{ fontSize: '1rem', marginBottom: 16 }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: '1px solid rgba(200,162,60,0.3)',
                backgroundColor: 'rgba(200,162,60,0.1)',
                color: '#C8A23C',
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && lots.length === 0 && (
          <div style={{ textAlign: 'center', padding: '100px 24px' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #1A0A2E, #4A0E78)',
                margin: '0 auto 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Gavel size={28} style={{ color: 'rgba(200,162,60,0.3)' }} />
            </div>
            <h2
              className="font-display"
              style={{ color: '#fff', fontSize: '1.5rem', marginBottom: 12 }}
            >
              No Active Lots
            </h2>
            <p
              style={{
                color: 'rgba(255,255,255,0.45)',
                fontSize: '0.95rem',
                lineHeight: 1.75,
                maxWidth: 460,
                margin: '0 auto',
              }}
            >
              No active lots. Check back soon.
            </p>
          </div>
        )}

        {/* Filtered empty */}
        {!loading && !error && lots.length > 0 && filteredLots.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'rgba(255,255,255,0.45)' }}>
            <p style={{ fontSize: '1rem', marginBottom: 8 }}>No lots match your filters.</p>
            <button
              onClick={handleClearFilters}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: '1px solid rgba(200,162,60,0.2)',
                backgroundColor: 'transparent',
                color: '#C8A23C',
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Lot grid */}
        {!loading && !error && filteredLots.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
              gap: 20,
            }}
          >
            {filteredLots.map((lot) => (
              <LotCard key={lot.id} lot={lot} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ── Lot Card ── */

function LotCard({ lot }: { lot: Lot }) {
  const displayPrice = lot.current_bid ?? lot.starting_price;
  const priceLabel = lot.current_bid ? 'Current Bid' : 'Starting Price';
  const timeLeft = formatTimeRemaining(lot.ends_at);
  const urgent = isUrgent(lot.ends_at);

  return (
    <Link
      href={`/marketplace/${lot.id}`}
      style={{ textDecoration: 'none', display: 'block', height: '100%' }}
    >
      <div
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(200,162,60,0.12)',
          borderRadius: 16,
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'border-color 200ms ease, transform 200ms ease, box-shadow 200ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(200,162,60,0.35)';
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(74,14,120,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(200,162,60,0.12)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Top area with category badge */}
        <div
          style={{
            height: 140,
            background: 'linear-gradient(135deg, rgba(26,10,46,0.8) 0%, rgba(45,10,78,0.6) 100%)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Gavel size={36} style={{ color: 'rgba(200,162,60,0.15)' }} />
          {/* Category badge */}
          <span
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              padding: '4px 12px',
              borderRadius: 9999,
              backgroundColor: 'rgba(200,162,60,0.15)',
              border: '1px solid rgba(200,162,60,0.25)',
              color: '#C8A23C',
              fontFamily: "'Barlow', Arial, sans-serif",
              fontWeight: 700,
              fontSize: '0.65rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {lot.category}
          </span>
        </div>

        {/* Info */}
        <div style={{ padding: '18px 20px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3
            style={{
              fontFamily: "'Barlow', Arial, sans-serif",
              fontWeight: 700,
              fontSize: '1.05rem',
              color: '#fff',
              marginBottom: 8,
              lineHeight: 1.25,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {lot.title}
          </h3>

          {/* Quantity + THC */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
              {lot.quantity} {lot.unit}
            </span>
            {lot.thc_pct != null && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 6,
                  backgroundColor: 'rgba(200,162,60,0.1)',
                  color: '#C8A23C',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                {lot.thc_pct}% THC
              </span>
            )}
          </div>

          {/* Price */}
          <div style={{ marginBottom: 10 }}>
            <span className="label-caps" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.58rem', display: 'block', marginBottom: 2 }}>
              {priceLabel}
            </span>
            <span
              style={{
                fontFamily: "'Barlow Condensed', Arial, sans-serif",
                fontWeight: 800,
                fontSize: '1.5rem',
                color: '#C8A23C',
              }}
            >
              {formatCurrency(displayPrice)}
            </span>
          </div>

          {/* Meta row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 'auto',
              paddingTop: 14,
              borderTop: '1px solid rgba(200,162,60,0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Gavel size={12} style={{ color: 'rgba(255,255,255,0.35)' }} />
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem' }}>
                {lot.bid_count} {lot.bid_count === 1 ? 'bid' : 'bids'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={12} style={{ color: urgent ? '#C0392B' : 'rgba(255,255,255,0.35)' }} />
              <span
                style={{
                  color: urgent ? '#C0392B' : 'rgba(255,255,255,0.45)',
                  fontSize: '0.78rem',
                  fontWeight: urgent ? 700 : 400,
                }}
              >
                {timeLeft}
              </span>
            </div>
          </div>

          {/* Place Bid button */}
          <button
            style={{
              marginTop: 16,
              width: '100%',
              padding: '12px 0',
              borderRadius: 10,
              border: 'none',
              backgroundColor: '#C8A23C',
              color: '#1A0633',
              fontFamily: "'Barlow', Arial, sans-serif",
              fontWeight: 700,
              fontSize: '0.82rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'background-color 150ms ease, transform 150ms ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#A6841E';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#C8A23C';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={(e) => {
              e.preventDefault();
              // Navigation handled by parent Link
            }}
          >
            Place Bid <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </Link>
  );
}
