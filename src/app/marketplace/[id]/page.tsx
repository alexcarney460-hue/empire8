'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Gavel,
  Loader2,
  Shield,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';

/* ── Types ── */

type Bid = {
  id: string;
  bidder_number: number;
  amount_cents: number;
  created_at: string;
};

type LotDetail = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  quantity: number;
  unit: string;
  strain_name: string | null;
  grow_method: string | null;
  thc_percentage: number | null;
  cbd_percentage: number | null;
  starting_price_cents: number;
  current_bid_cents: number | null;
  buy_now_price_cents: number | null;
  reserve_met: boolean;
  bid_count: number;
  ends_at: string;
  status: 'active' | 'ended' | 'sold';
  lab_results_url: string | null;
  images?: string[];
  bids: Bid[];
};

/* ── Helpers ── */

function formatTimeRemaining(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds}s`;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function isUrgent(endsAt: string): boolean {
  const diff = new Date(endsAt).getTime() - Date.now();
  return diff > 0 && diff < 1000 * 60 * 60 * 4;
}

/* ── Status Badge ── */

function StatusBadge({ status }: { status: LotDetail['status'] }) {
  const styles: Record<string, { bg: string; border: string; color: string }> = {
    active: { bg: 'rgba(39,174,96,0.12)', border: 'rgba(39,174,96,0.3)', color: '#27AE60' },
    ended: { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' },
    sold: { bg: 'rgba(200,162,60,0.12)', border: 'rgba(200,162,60,0.3)', color: '#C8A23C' },
  };
  const s = styles[status] ?? styles.ended;
  return (
    <span
      style={{
        padding: '4px 14px',
        borderRadius: 9999,
        backgroundColor: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        fontFamily: "'Barlow', Arial, sans-serif",
        fontWeight: 700,
        fontSize: '0.7rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}
    >
      {status}
    </span>
  );
}

/* ── Image Gallery ── */

function ImageGallery({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);
  const hasImages = images.length > 0;

  const goPrev = useCallback(() => {
    setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goNext = useCallback(() => {
    setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  return (
    <div
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(200,162,60,0.1)',
        position: 'relative',
        aspectRatio: '4/3',
      }}
    >
      {hasImages ? (
        <>
          <img
            src={images[index]}
            alt={`Lot image ${index + 1}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {images.length > 1 && (
            <>
              <button
                onClick={goPrev}
                aria-label="Previous image"
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={goNext}
                aria-label="Next image"
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronRight size={18} />
              </button>
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: 6,
                }}
              >
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    aria-label={`Go to image ${i + 1}`}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: i === index ? '#C8A23C' : 'rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(26,10,46,0.8) 0%, rgba(45,10,78,0.6) 100%)',
          }}
        >
          <Gavel size={56} style={{ color: 'rgba(200,162,60,0.12)' }} />
        </div>
      )}
    </div>
  );
}

/* ── Main Component ── */

export default function LotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [lot, setLot] = useState<LotDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [maxBid, setMaxBid] = useState('');
  const [showAutoBid, setShowAutoBid] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function fetchLot() {
      try {
        const res = await fetch(`/api/marketplace/lots/${id}`);
        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json.error ?? 'Lot not found');
        }

        if (!cancelled) {
          setLot(json.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load lot');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchLot();
    return () => { cancelled = true; };
  }, [id]);

  // Live countdown
  useEffect(() => {
    if (!lot?.ends_at) return;
    const tick = () => setTimeLeft(formatTimeRemaining(lot.ends_at));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lot?.ends_at]);

  const displayPriceCents = lot ? (lot.current_bid_cents ?? lot.starting_price_cents) : 0;
  const minimumBidCents = lot ? (lot.current_bid_cents ? lot.current_bid_cents + 100 : lot.starting_price_cents) : 0;
  const urgent = lot ? isUrgent(lot.ends_at) : false;
  const isActive = lot?.status === 'active';

  const handlePlaceBid = useCallback(() => {
    // Placeholder -- bid submission would POST to /api/marketplace/bids
    const amountDollars = parseFloat(bidAmount);
    const amountCents = Math.round(amountDollars * 100);
    if (isNaN(amountDollars) || amountCents < minimumBidCents) {
      alert(`Minimum bid is ${formatCurrency(minimumBidCents)}`);
      return;
    }
    alert(`Bid of ${formatCurrency(amountCents)} submitted. (Integration pending)`);
  }, [bidAmount, minimumBidCents]);

  const handleBuyNow = useCallback(() => {
    if (!lot?.buy_now_price_cents) return;
    alert(`Buy Now for ${formatCurrency(lot.buy_now_price_cents)} selected. (Integration pending)`);
  }, [lot?.buy_now_price_cents]);

  if (loading) {
    return (
      <div style={{ backgroundColor: '#0F0520', minHeight: '100vh', paddingTop: 'var(--nav-height)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <Loader2 size={32} style={{ color: '#C8A23C', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error || !lot) {
    return (
      <div style={{ backgroundColor: '#0F0520', minHeight: '100vh', paddingTop: 'var(--nav-height)' }}>
        <div style={{ textAlign: 'center', padding: '120px 24px', color: 'rgba(255,255,255,0.5)' }}>
          <p style={{ fontSize: '1rem', marginBottom: 20 }}>{error ?? 'Lot not found'}</p>
          <Link
            href="/marketplace"
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: '1px solid rgba(200,162,60,0.3)',
              backgroundColor: 'rgba(200,162,60,0.1)',
              color: '#C8A23C',
              fontFamily: "'Barlow', Arial, sans-serif",
              fontWeight: 600,
              fontSize: '0.85rem',
              textDecoration: 'none',
            }}
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0F0520', minHeight: '100vh', paddingTop: 'var(--nav-height)' }}>

      {/* Back link + header */}
      <section
        style={{
          padding: '32px 24px 24px',
          borderBottom: '1px solid rgba(200,162,60,0.08)',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <Link
            href="/marketplace"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'rgba(255,255,255,0.45)',
              textDecoration: 'none',
              fontSize: '0.82rem',
              fontFamily: "'Barlow', Arial, sans-serif",
              fontWeight: 600,
              marginBottom: 20,
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#C8A23C'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
          >
            <ArrowLeft size={14} /> Back to Marketplace
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1
              className="font-display"
              style={{
                color: '#fff',
                fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
                lineHeight: 1.1,
              }}
            >
              {lot.title}
            </h1>
            <span
              style={{
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
            <StatusBadge status={lot.status} />
          </div>
        </div>
      </section>

      {/* Main content: two-column on desktop */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 80px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 32,
          }}
          className="marketplace-detail-grid"
        >
          {/* Left column: images + details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            <ImageGallery images={lot.images ?? []} />

            {/* Description */}
            {lot.description && (
              <div>
                <h2
                  style={{
                    fontFamily: "'Barlow', Arial, sans-serif",
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: '#fff',
                    marginBottom: 10,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Description
                </h2>
                <p
                  style={{
                    color: 'rgba(255,255,255,0.55)',
                    fontSize: '0.92rem',
                    lineHeight: 1.8,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {lot.description}
                </p>
              </div>
            )}

            {/* Details grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 16,
              }}
            >
              <DetailItem label="Quantity" value={`${lot.quantity} ${lot.unit}`} />
              {lot.strain_name && <DetailItem label="Strain" value={lot.strain_name} />}
              {lot.grow_method && <DetailItem label="Grow Method" value={lot.grow_method} />}
              {lot.thc_percentage != null && <DetailItem label="THC" value={`${lot.thc_percentage}%`} />}
              {lot.cbd_percentage != null && <DetailItem label="CBD" value={`${lot.cbd_percentage}%`} />}
            </div>

            {/* Lab results */}
            {lot.lab_results_url && (
              <a
                href={lot.lab_results_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: '1px solid rgba(200,162,60,0.2)',
                  backgroundColor: 'rgba(200,162,60,0.06)',
                  color: '#C8A23C',
                  fontFamily: "'Barlow', Arial, sans-serif",
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  textDecoration: 'none',
                  transition: 'border-color 150ms ease',
                  width: 'fit-content',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(200,162,60,0.5)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(200,162,60,0.2)'; }}
              >
                <Shield size={14} /> View Lab Results <ExternalLink size={12} />
              </a>
            )}

            {/* Seller */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 18px',
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(200,162,60,0.08)',
              }}
            >
              <Shield size={16} style={{ color: '#C8A23C' }} />
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.88rem' }}>
                Verified Seller
              </span>
            </div>

            {/* Bid History */}
            <div>
              <h2
                style={{
                  fontFamily: "'Barlow', Arial, sans-serif",
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: '#fff',
                  marginBottom: 14,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Bid History
              </h2>
              {lot.bids.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.88rem' }}>
                  No bids yet. Be the first to bid.
                </p>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {lot.bids.map((bid) => (
                    <div
                      key={bid.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 16px',
                        borderRadius: 10,
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(200,162,60,0.06)',
                      }}
                    >
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                        Bidder #{bid.bidder_number}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span
                          style={{
                            color: '#C8A23C',
                            fontFamily: "'Barlow', Arial, sans-serif",
                            fontWeight: 700,
                            fontSize: '0.92rem',
                          }}
                        >
                          {formatCurrency(bid.amount_cents)}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
                          {formatTimestamp(bid.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column: bidding panel */}
          <div>
            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(200,162,60,0.15)',
                borderRadius: 20,
                padding: '28px 24px',
                position: 'sticky',
                top: 'calc(var(--nav-height) + 24px)',
              }}
            >
              {/* Current bid */}
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <span
                  className="label-caps"
                  style={{
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '0.62rem',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  {lot.current_bid_cents ? 'Current Bid' : 'Starting Price'}
                </span>
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', Arial, sans-serif",
                    fontWeight: 800,
                    fontSize: '2.5rem',
                    color: '#C8A23C',
                    lineHeight: 1,
                  }}
                >
                  {formatCurrency(displayPriceCents)}
                </span>
              </div>

              {/* Bid count + time */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 10,
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  marginBottom: 20,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Gavel size={14} style={{ color: 'rgba(255,255,255,0.35)' }} />
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem' }}>
                    {lot.bid_count} {lot.bid_count === 1 ? 'bid' : 'bids'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} style={{ color: urgent ? '#C0392B' : 'rgba(255,255,255,0.35)' }} />
                  <span
                    style={{
                      color: urgent ? '#C0392B' : 'rgba(255,255,255,0.55)',
                      fontSize: '0.85rem',
                      fontWeight: urgent ? 700 : 400,
                    }}
                  >
                    {timeLeft}
                  </span>
                </div>
              </div>

              {/* Reserve indicator - only displayed when there is meaningful reserve info */}
              {lot.bid_count > 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '8px 0',
                    marginBottom: 16,
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: lot.reserve_met ? '#27AE60' : '#C0392B',
                  }}
                >
                  {lot.reserve_met ? 'Reserve met' : 'Reserve not met'}
                </div>
              )}

              {/* Bid input */}
              {isActive && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <label
                      htmlFor="bid-amount"
                      style={{
                        display: 'block',
                        color: 'rgba(255,255,255,0.45)',
                        fontSize: '0.78rem',
                        fontFamily: "'Barlow', Arial, sans-serif",
                        fontWeight: 600,
                        marginBottom: 6,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Your Bid
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span
                        style={{
                          position: 'absolute',
                          left: 14,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'rgba(255,255,255,0.35)',
                          fontSize: '1rem',
                          fontWeight: 600,
                        }}
                      >
                        $
                      </span>
                      <input
                        id="bid-amount"
                        type="number"
                        min={minimumBidCents / 100}
                        step="1"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={(minimumBidCents / 100).toString()}
                        style={{
                          width: '100%',
                          padding: '14px 16px 14px 28px',
                          borderRadius: 10,
                          border: '1px solid rgba(200,162,60,0.2)',
                          backgroundColor: 'rgba(255,255,255,0.04)',
                          color: '#fff',
                          fontSize: '1.1rem',
                          fontFamily: "'Barlow', Arial, sans-serif",
                          fontWeight: 700,
                          outline: 'none',
                          transition: 'border-color 200ms ease',
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(200,162,60,0.5)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(200,162,60,0.2)'; }}
                      />
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', marginTop: 4, display: 'block' }}>
                      Min: {formatCurrency(minimumBidCents)}
                    </span>
                  </div>

                  {/* Place Bid button */}
                  <button
                    onClick={handlePlaceBid}
                    style={{
                      width: '100%',
                      padding: '14px 0',
                      borderRadius: 10,
                      border: 'none',
                      backgroundColor: '#C8A23C',
                      color: '#1A0633',
                      fontFamily: "'Barlow', Arial, sans-serif",
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'background-color 150ms ease, transform 150ms ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      marginBottom: 12,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#A6841E';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#C8A23C';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <Gavel size={16} /> Place Bid
                  </button>

                  {/* Auto-bid toggle */}
                  <button
                    onClick={() => setShowAutoBid((prev) => !prev)}
                    style={{
                      width: '100%',
                      padding: '10px 0',
                      borderRadius: 8,
                      border: '1px solid rgba(200,162,60,0.15)',
                      backgroundColor: 'transparent',
                      color: 'rgba(255,255,255,0.5)',
                      fontFamily: "'Barlow', Arial, sans-serif",
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      letterSpacing: '0.04em',
                      cursor: 'pointer',
                      transition: 'color 150ms ease, border-color 150ms ease',
                      marginBottom: showAutoBid ? 12 : 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#C8A23C';
                      e.currentTarget.style.borderColor = 'rgba(200,162,60,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                      e.currentTarget.style.borderColor = 'rgba(200,162,60,0.15)';
                    }}
                  >
                    Set Max Bid (Auto-Bid)
                  </button>

                  {showAutoBid && (
                    <div style={{ marginBottom: 16 }}>
                      <label
                        htmlFor="max-bid"
                        style={{
                          display: 'block',
                          color: 'rgba(255,255,255,0.4)',
                          fontSize: '0.72rem',
                          fontFamily: "'Barlow', Arial, sans-serif",
                          fontWeight: 600,
                          marginBottom: 6,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Maximum Bid
                      </label>
                      <input
                        id="max-bid"
                        type="number"
                        min={minimumBidCents / 100}
                        step="1"
                        value={maxBid}
                        onChange={(e) => setMaxBid(e.target.value)}
                        placeholder="Auto-bid up to..."
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: 10,
                          border: '1px solid rgba(200,162,60,0.15)',
                          backgroundColor: 'rgba(255,255,255,0.04)',
                          color: '#fff',
                          fontSize: '0.95rem',
                          fontFamily: "'Barlow', Arial, sans-serif",
                          fontWeight: 600,
                          outline: 'none',
                          transition: 'border-color 200ms ease',
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(200,162,60,0.4)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(200,162,60,0.15)'; }}
                      />
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', marginTop: 6, lineHeight: 1.5 }}>
                        We will automatically bid on your behalf up to this amount.
                      </p>
                    </div>
                  )}

                  {/* Buy Now */}
                  {lot.buy_now_price_cents != null && (
                    <button
                      onClick={handleBuyNow}
                      style={{
                        width: '100%',
                        padding: '14px 0',
                        borderRadius: 10,
                        border: '1px solid rgba(200,162,60,0.3)',
                        backgroundColor: 'rgba(200,162,60,0.08)',
                        color: '#C8A23C',
                        fontFamily: "'Barlow', Arial, sans-serif",
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        transition: 'background-color 150ms ease, border-color 150ms ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        marginTop: 12,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(200,162,60,0.15)';
                        e.currentTarget.style.borderColor = 'rgba(200,162,60,0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(200,162,60,0.08)';
                        e.currentTarget.style.borderColor = 'rgba(200,162,60,0.3)';
                      }}
                    >
                      <Zap size={14} /> Buy Now {formatCurrency(lot.buy_now_price_cents!)}
                    </button>
                  )}
                </>
              )}

              {/* Ended state */}
              {!isActive && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '20px 0',
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                  }}
                >
                  This auction has {lot.status === 'sold' ? 'been sold' : 'ended'}.
                </div>
              )}

              {/* Platform fee notice */}
              <div
                style={{
                  marginTop: 20,
                  padding: '12px 16px',
                  borderRadius: 10,
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderTop: '1px solid rgba(200,162,60,0.08)',
                  textAlign: 'center',
                }}
              >
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>
                  5% platform fee applies to winning bid
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Responsive grid style */}
      <style>{`
        @media (min-width: 768px) {
          .marketplace-detail-grid {
            grid-template-columns: 1fr 380px !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ── Detail Item ── */

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(200,162,60,0.06)',
      }}
    >
      <span
        className="label-caps"
        style={{
          color: 'rgba(255,255,255,0.35)',
          fontSize: '0.58rem',
          display: 'block',
          marginBottom: 4,
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: '#fff',
          fontSize: '0.95rem',
          fontFamily: "'Barlow', Arial, sans-serif",
          fontWeight: 700,
        }}
      >
        {value}
      </span>
    </div>
  );
}
