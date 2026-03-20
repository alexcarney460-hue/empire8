'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShoppingBag, Loader2 } from 'lucide-react';
import OrderTracking from '@/components/OrderTracking';
import {
  fetchOrderDetails,
  formatCents,
  groupItemsByBrand,
  type OrderDetails,
} from '@/lib/orders';

/* ── Constants ─────────────────────────────────────────────────────── */

const COLORS = {
  bg: '#0F0520',
  bgCard: '#160B2E',
  bgCardAlt: '#1C1035',
  success: '#22C55E',
  gold: '#C8A23C',
  goldLight: '#E8D48B',
  purple: '#4A0E78',
  purpleMuted: '#7B5A9E',
  textPrimary: '#F8F6F2',
  textMuted: '#9A9590',
  border: '#2D0A4E',
};

/* ── Inner page (needs useSearchParams inside Suspense) ────────── */

function OrderConfirmationInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError('No order ID provided.');
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const details = await fetchOrderDetails(orderId as string);
      if (cancelled) return;

      if (!details) {
        setError('Order not found. Please check your order ID and try again.');
      } else {
        setOrder(details);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const brandGroups = useMemo(() => {
    if (!order) return [];
    return groupItemsByBrand(order.items);
  }, [order]);

  const brandNames = useMemo(() => {
    if (!order) return [];
    return order.brands.map((b) => b.brandName);
  }, [order]);

  /* ── Loading state ─────────────────────────────────────────────── */

  if (loading) {
    return (
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: COLORS.bg,
        }}
      >
        <Loader2
          size={36}
          color={COLORS.gold}
          style={{ animation: 'spin 1s linear infinite' }}
        />
      </div>
    );
  }

  /* ── Error state ───────────────────────────────────────────────── */

  if (error || !order) {
    return (
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: COLORS.bg,
          padding: '40px 20px',
          textAlign: 'center',
        }}
      >
        <ShoppingBag size={48} color={COLORS.purpleMuted} />
        <h1
          className="font-heading"
          style={{
            color: COLORS.textPrimary,
            fontSize: '1.3rem',
            marginTop: 20,
            marginBottom: 10,
          }}
        >
          {error ?? 'Order not found'}
        </h1>
        <Link
          href="/brands"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: COLORS.gold,
            color: COLORS.bg,
            padding: '12px 28px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: '0.85rem',
            textDecoration: 'none',
            marginTop: 16,
          }}
        >
          Browse Brands <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  /* ── Success state ─────────────────────────────────────────────── */

  return (
    <div
      style={{
        minHeight: '80vh',
        backgroundColor: COLORS.bg,
        padding: '60px 20px 80px',
      }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* Success animation */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              backgroundColor: COLORS.success,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'checkPop 500ms cubic-bezier(0.16, 1, 0.3, 1) both',
              boxShadow: `0 0 0 8px rgba(34, 197, 94, 0.15), 0 8px 32px rgba(34, 197, 94, 0.25)`,
            }}
            aria-hidden="true"
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              style={{ animation: 'checkDraw 600ms ease 300ms both' }}
            >
              <path
                d="M8 18L15 25L28 11"
                stroke="white"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 40,
                  strokeDashoffset: 40,
                  animation: 'checkStroke 500ms ease 400ms forwards',
                }}
              />
            </svg>
          </div>

          <h1
            className="font-display"
            style={{
              color: COLORS.textPrimary,
              fontSize: 'clamp(1.4rem, 4vw, 1.8rem)',
              marginTop: 24,
              textAlign: 'center',
              lineHeight: 1.2,
            }}
          >
            Order Submitted Successfully
          </h1>

          <p
            className="font-mono"
            style={{
              color: COLORS.gold,
              fontSize: '0.95rem',
              marginTop: 8,
              letterSpacing: '0.05em',
            }}
          >
            {order.orderNumber}
          </p>
        </div>

        {/* Brand notification */}
        <div
          style={{
            backgroundColor: COLORS.bgCard,
            borderRadius: 14,
            padding: '20px 24px',
            marginBottom: 20,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <p
            style={{
              color: COLORS.textMuted,
              fontSize: '0.85rem',
              marginBottom: 12,
              lineHeight: 1.5,
            }}
          >
            Sales orders have been sent to the following brands:
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            {brandNames.map((name) => (
              <span
                key={name}
                className="font-heading"
                style={{
                  backgroundColor: COLORS.bgCardAlt,
                  color: COLORS.goldLight,
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                {name}
              </span>
            ))}
          </div>

          <p
            style={{
              color: COLORS.purpleMuted,
              fontSize: '0.78rem',
              marginTop: 14,
              fontStyle: 'italic',
            }}
          >
            You will receive a confirmation email shortly.
          </p>
        </div>

        {/* Order tracking */}
        <div style={{ marginBottom: 20 }}>
          <OrderTracking
            currentStatus={order.status}
            statusHistory={order.statusHistory}
          />
        </div>

        {/* Order summary by brand */}
        <div
          style={{
            backgroundColor: COLORS.bgCard,
            borderRadius: 14,
            padding: '24px',
            marginBottom: 20,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <h2
            className="font-heading"
            style={{
              fontSize: '0.85rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: COLORS.textMuted,
              marginBottom: 20,
            }}
          >
            Order Summary
          </h2>

          {brandGroups.map((group, groupIdx) => (
            <div key={group.brandId}>
              {groupIdx > 0 && (
                <div
                  style={{
                    borderTop: `1px solid ${COLORS.border}`,
                    margin: '16px 0',
                  }}
                />
              )}

              <h3
                className="font-heading"
                style={{
                  color: COLORS.goldLight,
                  fontSize: '0.9rem',
                  marginBottom: 12,
                }}
              >
                {group.brandName}
              </h3>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {group.items.map((item) => (
                  <div
                    key={item.productId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      backgroundColor: COLORS.bgCardAlt,
                      borderRadius: 10,
                      padding: '10px 14px',
                    }}
                  >
                    {item.imageUrl && (
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          overflow: 'hidden',
                          flexShrink: 0,
                          position: 'relative',
                          backgroundColor: COLORS.border,
                        }}
                      >
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="44px"
                        />
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          color: COLORS.textPrimary,
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.productName}
                      </p>
                      <p
                        style={{
                          color: COLORS.textMuted,
                          fontSize: '0.72rem',
                          marginTop: 2,
                        }}
                      >
                        {item.quantity} x {formatCents(item.unitPriceCents)}{' '}
                        / {item.unitType}
                      </p>
                    </div>

                    <span
                      className="font-mono"
                      style={{
                        color: COLORS.textPrimary,
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatCents(item.unitPriceCents * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Brand subtotal */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  marginTop: 10,
                  gap: 8,
                }}
              >
                <span
                  style={{
                    color: COLORS.textMuted,
                    fontSize: '0.75rem',
                  }}
                >
                  Subtotal
                </span>
                <span
                  className="font-mono"
                  style={{
                    color: COLORS.goldLight,
                    fontSize: '0.88rem',
                    fontWeight: 600,
                  }}
                >
                  {formatCents(group.subtotalCents)}
                </span>
              </div>
            </div>
          ))}

          {/* Grand total */}
          <div
            style={{
              borderTop: `1px solid ${COLORS.border}`,
              marginTop: 20,
              paddingTop: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              className="font-heading"
              style={{
                color: COLORS.textPrimary,
                fontSize: '1rem',
                fontWeight: 700,
              }}
            >
              Total
            </span>
            <span
              className="font-mono"
              style={{
                color: COLORS.gold,
                fontSize: '1.3rem',
                fontWeight: 700,
              }}
            >
              {formatCents(order.totalCents)}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            flexDirection: 'column',
          }}
        >
          <Link
            href="/dashboard/orders"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: COLORS.gold,
              color: COLORS.bg,
              padding: '14px 28px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              transition: 'background-color 150ms ease',
            }}
          >
            View Orders <ArrowRight size={15} />
          </Link>

          <Link
            href="/brands"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: 'transparent',
              color: COLORS.textMuted,
              padding: '14px 28px',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: '0.82rem',
              letterSpacing: '0.04em',
              textDecoration: 'none',
              border: `1px solid ${COLORS.border}`,
              transition: 'border-color 150ms ease, color 150ms ease',
            }}
          >
            Continue Browsing
          </Link>
        </div>

        {/* Notes */}
        {order.notes && (
          <div
            style={{
              backgroundColor: COLORS.bgCardAlt,
              borderRadius: 10,
              padding: '14px 18px',
              marginTop: 20,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <p
              style={{
                color: COLORS.textMuted,
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Notes
            </p>
            <p
              style={{
                color: COLORS.textPrimary,
                fontSize: '0.82rem',
                lineHeight: 1.5,
              }}
            >
              {order.notes}
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes checkPop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes checkStroke {
          to { stroke-dashoffset: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/* ── Page wrapper with Suspense for useSearchParams ──────────────── */

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0F0520',
          }}
        >
          <Loader2
            size={36}
            color="#C8A23C"
            style={{ animation: 'spin 1s linear infinite' }}
          />
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      }
    >
      <OrderConfirmationInner />
    </Suspense>
  );
}
