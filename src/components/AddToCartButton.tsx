'use client';

import { useState } from 'react';
import { ShoppingBag, Check, Minus, Plus } from 'lucide-react';
import { useDispensaryCart } from '@/context/DispensaryCartContext';

/* ── Theme tokens ──────────────────────────────────────────────────── */

const THEME = {
  gold: '#C8A23C',
  goldHover: '#E0B94A',
  bg: '#0F0520',
  text: '#fff',
  cardBorder: 'rgba(255,255,255,0.08)',
} as const;

/* ── Props ─────────────────────────────────────────────────────────── */

interface AddToCartButtonProps {
  productId: string;
  brandId: string;
  brandName: string;
  productName: string;
  unitPriceCents: number;
  unitType: string;
  imageUrl: string | null;
  /** Compact mode hides quantity selector, adds 1 unit */
  compact?: boolean;
}

/* ── Component ─────────────────────────────────────────────────────── */

export default function AddToCartButton({
  productId,
  brandId,
  brandName,
  productName,
  unitPriceCents,
  unitType,
  imageUrl,
  compact = false,
}: AddToCartButtonProps) {
  const { addToCart } = useDispensaryCart();
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = () => {
    addToCart(
      { productId, brandId, brandName, productName, unitPriceCents, unitType, imageUrl },
      compact ? 1 : qty,
    );

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
    if (!compact) setQty(1);
  };

  if (compact) {
    return (
      <button
        onClick={handleAdd}
        aria-label={`Add ${productName} to cart`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 16px',
          borderRadius: 8,
          border: 'none',
          backgroundColor: justAdded ? '#27AE60' : THEME.gold,
          color: THEME.bg,
          fontWeight: 700,
          fontSize: '0.75rem',
          fontFamily: "'Barlow', sans-serif",
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'background-color 150ms ease, transform 150ms ease',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          if (!justAdded) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = THEME.goldHover;
          }
        }}
        onMouseLeave={(e) => {
          if (!justAdded) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = THEME.gold;
          }
        }}
      >
        {justAdded ? <Check size={14} /> : <ShoppingBag size={14} />}
        {justAdded ? 'Added' : 'Add to Cart'}
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Quantity selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          border: `1px solid ${THEME.cardBorder}`,
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          aria-label="Decrease quantity"
          style={{
            width: 32,
            height: 34,
            border: 'none',
            background: 'none',
            color: THEME.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Minus size={14} />
        </button>
        <span
          style={{
            minWidth: 28,
            textAlign: 'center',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: THEME.text,
          }}
        >
          {qty}
        </span>
        <button
          onClick={() => setQty((q) => Math.min(10_000, q + 1))}
          aria-label="Increase quantity"
          style={{
            width: 32,
            height: 34,
            border: 'none',
            background: 'none',
            color: THEME.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Add button */}
      <button
        onClick={handleAdd}
        aria-label={`Add ${qty} ${productName} to cart`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 18px',
          borderRadius: 8,
          border: 'none',
          backgroundColor: justAdded ? '#27AE60' : THEME.gold,
          color: THEME.bg,
          fontWeight: 700,
          fontSize: '0.75rem',
          fontFamily: "'Barlow', sans-serif",
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'background-color 150ms ease, transform 150ms ease',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          if (!justAdded) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = THEME.goldHover;
          }
        }}
        onMouseLeave={(e) => {
          if (!justAdded) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = THEME.gold;
          }
        }}
      >
        {justAdded ? <Check size={14} /> : <ShoppingBag size={14} />}
        {justAdded ? 'Added' : 'Add to Cart'}
      </button>
    </div>
  );
}
