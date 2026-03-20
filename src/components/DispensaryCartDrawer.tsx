'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useDispensaryCart, type CartItem } from '@/context/DispensaryCartContext';

/* ── Theme tokens ──────────────────────────────────────────────────── */

const THEME = {
  bg: '#0F0520',
  cardBg: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(255,255,255,0.08)',
  gold: '#C8A23C',
  goldHover: '#E0B94A',
  text: '#fff',
  textMuted: 'rgba(255,255,255,0.55)',
  overlay: 'rgba(0,0,0,0.65)',
  danger: '#C0392B',
  dangerHover: '#E74C3C',
} as const;

/* ── Helpers ───────────────────────────────────────────────────────── */

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/* ── Cart Item Row ─────────────────────────────────────────────────── */

function CartItemRow({ item }: { item: CartItem }) {
  const { updateQuantity, removeFromCart } = useDispensaryCart();

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '12px 0',
        borderBottom: `1px solid ${THEME.cardBorder}`,
        alignItems: 'flex-start',
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 8,
          backgroundColor: THEME.cardBg,
          overflow: 'hidden',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.productName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <ShoppingBag size={20} color={THEME.textMuted} />
        )}
      </div>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: '0.85rem',
            fontWeight: 600,
            color: THEME.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.productName}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: THEME.textMuted }}>
          {formatCents(item.unitPriceCents)} / {item.unitType}
        </p>

        {/* Quantity controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <button
            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
            aria-label={`Decrease quantity of ${item.productName}`}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: `1px solid ${THEME.cardBorder}`,
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
              fontSize: '0.82rem',
              fontWeight: 600,
              color: THEME.text,
              minWidth: 24,
              textAlign: 'center',
            }}
          >
            {item.quantity}
          </span>

          <button
            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
            aria-label={`Increase quantity of ${item.productName}`}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: `1px solid ${THEME.cardBorder}`,
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

          <button
            onClick={() => removeFromCart(item.productId)}
            aria-label={`Remove ${item.productName} from cart`}
            style={{
              marginLeft: 'auto',
              width: 28,
              height: 28,
              borderRadius: 6,
              border: 'none',
              background: 'none',
              color: THEME.danger,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Line total */}
      <p
        style={{
          margin: 0,
          fontSize: '0.85rem',
          fontWeight: 700,
          color: THEME.gold,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {formatCents(item.unitPriceCents * item.quantity)}
      </p>
    </div>
  );
}

/* ── Main Drawer ───────────────────────────────────────────────────── */

export default function DispensaryCartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    clearCart,
    getCartTotal,
    getCartItemCount,
    getItemsByBrand,
  } = useDispensaryCart();

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Focus trap: focus drawer on open
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      drawerRef.current.focus();
    }
  }, [isOpen]);

  // Escape key closes drawer
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, closeCart]);

  const handleSubmitOrder = async () => {
    if (items.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const res = await fetch('/api/orders/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            brandId: i.brandId,
            brandName: i.brandName,
            productName: i.productName,
            unitPriceCents: i.unitPriceCents,
            quantity: i.quantity,
            imageUrl: i.imageUrl,
            unitType: i.unitType,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || 'Failed to submit order.');
        return;
      }

      setSubmitSuccess(`Order ${data.orderNumber} submitted successfully.`);
      clearCart();
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const brandGroups = getItemsByBrand();
  const totalCents = getCartTotal();
  const itemCount = getCartItemCount();
  const isEmpty = items.length === 0 && !submitSuccess;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={closeCart}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 299,
          backgroundColor: THEME.overlay,
          transition: 'opacity 200ms ease',
        }}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Dispensary cart"
        tabIndex={-1}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: 420,
          zIndex: 300,
          backgroundColor: THEME.bg,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
          animation: 'slideInRight 250ms ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: `1px solid ${THEME.cardBorder}`,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '1.1rem',
                fontWeight: 700,
                color: THEME.text,
                fontFamily: "'Barlow', sans-serif",
              }}
            >
              Your Order
            </h2>
            {itemCount > 0 && (
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: THEME.textMuted }}>
                {itemCount} item{itemCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: 'none',
              backgroundColor: THEME.cardBg,
              color: THEME.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
          {/* Success message */}
          {submitSuccess && (
            <div
              style={{
                margin: '24px 0',
                padding: 16,
                borderRadius: 10,
                backgroundColor: 'rgba(39,174,96,0.12)',
                border: '1px solid rgba(39,174,96,0.3)',
                textAlign: 'center',
              }}
            >
              <p style={{ margin: 0, color: '#27AE60', fontWeight: 600, fontSize: '0.9rem' }}>
                {submitSuccess}
              </p>
              <p style={{ margin: '8px 0 0', color: THEME.textMuted, fontSize: '0.78rem' }}>
                We will reach out to confirm your order shortly.
              </p>
            </div>
          )}

          {/* Empty state */}
          {isEmpty && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '64px 24px',
                textAlign: 'center',
              }}
            >
              <ShoppingBag size={48} color={THEME.textMuted} strokeWidth={1.2} />
              <p
                style={{
                  margin: '16px 0 0',
                  color: THEME.textMuted,
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                }}
              >
                Your cart is empty. Browse brands to add products.
              </p>
            </div>
          )}

          {/* Items grouped by brand */}
          {brandGroups.map((group) => (
            <div key={group.brandId} style={{ marginTop: 20 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: THEME.gold,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontFamily: "'Barlow', sans-serif",
                  }}
                >
                  {group.brandName}
                </h3>
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: THEME.textMuted,
                    fontWeight: 500,
                  }}
                >
                  {formatCents(group.subtotalCents)}
                </span>
              </div>
              {group.items.map((item) => (
                <CartItemRow key={item.productId} item={item} />
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div
            style={{
              padding: '16px 24px 24px',
              borderTop: `1px solid ${THEME.cardBorder}`,
            }}
          >
            {/* Total */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: THEME.text,
                }}
              >
                Order Total
              </span>
              <span
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: THEME.gold,
                  fontFamily: "'Barlow', sans-serif",
                }}
              >
                {formatCents(totalCents)}
              </span>
            </div>

            {/* Error */}
            {submitError && (
              <p
                style={{
                  margin: '0 0 12px',
                  fontSize: '0.78rem',
                  color: THEME.danger,
                  textAlign: 'center',
                }}
              >
                {submitError}
              </p>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmitOrder}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '14px 0',
                borderRadius: 10,
                border: 'none',
                backgroundColor: submitting ? THEME.textMuted : THEME.gold,
                color: THEME.bg,
                fontWeight: 700,
                fontSize: '0.85rem',
                fontFamily: "'Barlow', sans-serif",
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: submitting ? 'wait' : 'pointer',
                transition: 'background-color 150ms ease, transform 150ms ease',
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = THEME.goldHover;
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!submitting) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = THEME.gold;
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                }
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Order'}
            </button>

            <p
              style={{
                margin: '10px 0 0',
                fontSize: '0.68rem',
                color: THEME.textMuted,
                textAlign: 'center',
                lineHeight: 1.4,
              }}
            >
              No payment required. Our team will confirm availability and send an invoice.
            </p>
          </div>
        )}
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
