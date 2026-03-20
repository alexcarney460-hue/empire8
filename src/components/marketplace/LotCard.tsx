'use client';

import Link from 'next/link';
import CategoryBadge from './CategoryBadge';
import CountdownTimer from './CountdownTimer';

export interface Lot {
  id: string;
  title: string;
  category: string;
  quantity: number;
  unit: string;
  current_bid_cents: number | null;
  starting_price_cents: number;
  bid_count: number;
  ends_at: string;
  thc_percentage: number | null;
  status: string;
}

interface LotCardProps {
  lot: Lot;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function LotCard({ lot }: LotCardProps) {
  const hasBids = lot.bid_count > 0 && lot.current_bid_cents !== null;

  return (
    <Link
      href={`/marketplace/${lot.id}`}
      style={{ textDecoration: 'none', display: 'block', height: '100%' }}
    >
      <div
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderTop: '2px solid #C8A23C',
          border: '1px solid rgba(200,162,60,0.12)',
          borderTopWidth: 2,
          borderTopColor: '#C8A23C',
          borderRadius: 16,
          padding: '20px 20px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          height: '100%',
          transition: 'border-color 200ms ease, box-shadow 200ms ease',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(200,162,60,0.4)';
          e.currentTarget.style.boxShadow = '0 0 20px rgba(200,162,60,0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(200,162,60,0.12)';
          e.currentTarget.style.borderTopColor = '#C8A23C';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Top row: title + badge */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <h3
            style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              fontFamily: "'Barlow', Arial, sans-serif",
              color: '#fff',
              lineHeight: 1.3,
              margin: 0,
              flex: 1,
            }}
          >
            {lot.title}
          </h3>
          <div style={{ flexShrink: 0 }}>
            <CategoryBadge category={lot.category} />
          </div>
        </div>

        {/* Quantity + THC */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontSize: '0.78rem',
            color: 'rgba(255,255,255,0.5)',
            fontFamily: "'Barlow', Arial, sans-serif",
          }}
        >
          <span>
            {lot.quantity} {lot.unit}
          </span>
          {lot.thc_percentage !== null && lot.thc_percentage > 0 && (
            <span
              style={{
                color: 'rgba(255,255,255,0.4)',
                borderLeft: '1px solid rgba(255,255,255,0.1)',
                paddingLeft: 14,
              }}
            >
              THC {lot.thc_percentage}%
            </span>
          )}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Price */}
        <div>
          {hasBids ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#C8A23C',
                }}
              >
                {formatCents(lot.current_bid_cents!)}
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255,255,255,0.35)',
                  fontFamily: "'Barlow', Arial, sans-serif",
                }}
              >
                current bid
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span
                style={{
                  fontSize: '0.82rem',
                  color: 'rgba(255,255,255,0.5)',
                  fontFamily: "'Barlow', Arial, sans-serif",
                }}
              >
                Starting at
              </span>
              <span
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                {formatCents(lot.starting_price_cents)}
              </span>
            </div>
          )}
        </div>

        {/* Bottom row: bids + countdown */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 10,
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <span
            style={{
              fontSize: '0.72rem',
              color: 'rgba(255,255,255,0.35)',
              fontFamily: "'Barlow', Arial, sans-serif",
            }}
          >
            {lot.bid_count} {lot.bid_count === 1 ? 'bid' : 'bids'}
          </span>
          <CountdownTimer endsAt={lot.ends_at} size="sm" />
        </div>
      </div>
    </Link>
  );
}
