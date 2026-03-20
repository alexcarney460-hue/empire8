'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Search, Loader2, Gavel } from 'lucide-react';
import LotCard from '@/components/marketplace/LotCard';
import type { Lot } from '@/components/marketplace/LotCard';

type SortOption = 'ending_soon' | 'newest' | 'price_asc' | 'most_bids';

const CATEGORIES = ['All', 'Flower', 'Concentrates', 'Edibles', 'Pre-Rolls', 'Extracts', 'Other'] as const;

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'ending_soon', label: 'Ending Soon' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price Low-High' },
  { value: 'most_bids', label: 'Most Bids' },
];

/* ── Sort logic ── */

function sortLots(lots: readonly Lot[], sort: SortOption): Lot[] {
  const copy = [...lots];
  switch (sort) {
    case 'ending_soon':
      return copy.sort((a, b) => new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime());
    case 'newest':
      return copy.sort((a, b) => new Date(b.ends_at).getTime() - new Date(a.ends_at).getTime());
    case 'price_asc':
      return copy.sort((a, b) => (a.current_bid_cents ?? a.starting_price_cents) - (b.current_bid_cents ?? b.starting_price_cents));
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

        if (!res.ok || !json.ok) {
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

