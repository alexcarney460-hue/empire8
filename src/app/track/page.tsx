'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Package, Truck, ExternalLink, AlertCircle, Clock, CheckCircle2, Box, ArrowRight } from 'lucide-react';
import AnimateIn from '@/components/AnimateIn';

/* ---------- Types ---------- */

interface OrderItem {
  readonly product_name: string;
  readonly quantity: number;
  readonly unit_price: number;
}

interface OrderResult {
  readonly status: string;
  readonly total: number;
  readonly currency: string;
  readonly tracking_number: string;
  readonly tracking_url: string | null;
  readonly shipping_carrier: string | null;
  readonly shipping_service: string | null;
  readonly shipping_name: string | null;
  readonly created_at: string;
  readonly items: readonly OrderItem[];
}

/* ---------- Status helpers ---------- */

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: typeof Package }> = {
  pending:    { label: 'Pending',    color: 'var(--color-warm-gray)', bg: 'rgba(139,131,117,0.08)', icon: Clock },
  processing: { label: 'Processing', color: 'var(--color-gold)',    bg: 'rgba(200,146,42,0.10)',  icon: Box },
  shipped:    { label: 'Shipped',    color: 'var(--color-royal)',   bg: 'rgba(62,85,55,0.10)',    icon: Truck },
  delivered:  { label: 'Delivered',  color: 'var(--color-royal)',   bg: 'rgba(62,85,55,0.10)',    icon: CheckCircle2 },
  cancelled:  { label: 'Cancelled',  color: '#b44',                 bg: 'rgba(180,68,68,0.08)',   icon: AlertCircle },
};

function getStatusInfo(status: string) {
  return STATUS_MAP[status.toLowerCase()] ?? {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    color: 'var(--color-warm-gray)',
    bg: 'rgba(139,131,117,0.08)',
    icon: Package,
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

/* ---------- Component ---------- */

export default function TrackOrderPage() {
  const [email, setEmail] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderResult | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOrder(null);

    const trimmedEmail = email.trim();
    const trimmedTracking = trackingNumber.trim();

    if (!trimmedEmail || !trimmedTracking) {
      setError('Please enter both your email and tracking number.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/shipping/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, tracking_number: trimmedTracking }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setOrder(data.order);
    } catch {
      setError('Unable to reach our servers. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  const statusInfo = order ? getStatusInfo(order.status) : null;
  const StatusIcon = statusInfo?.icon ?? Package;

  return (
    <div style={{ paddingTop: 'var(--nav-height)', backgroundColor: '#0F0520', minHeight: '100vh' }}>

      {/* Hero */}
      <section
        style={{
          backgroundColor: '#0F0520',
          padding: '72px 24px 80px',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(200,162,60,0.12)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '5%',
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: 'rgba(62,85,55,0.06)',
            filter: 'blur(80px)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <span
            className="label-caps"
            style={{
              color: 'var(--color-royal)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 20,
            }}
          >
            <span style={{ width: 24, height: 1.5, backgroundColor: 'var(--color-royal)', display: 'inline-block', borderRadius: 99 }} />
            Order Tracking
            <span style={{ width: 24, height: 1.5, backgroundColor: 'var(--color-royal)', display: 'inline-block', borderRadius: 99 }} />
          </span>
          <h1
            className="font-display"
            style={{
              fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
              lineHeight: 1.0,
              color: '#fff',
              marginBottom: 20,
            }}
          >
            Track Your Order.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', maxWidth: 500, margin: '0 auto', lineHeight: 1.8 }}>
            Enter your email address and tracking number to see the latest status of your shipment.
          </p>
        </div>
      </section>

      {/* Content */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '56px 24px 80px' }}>

        {/* Lookup form */}
        <AnimateIn>
          <form
            onSubmit={handleSubmit}
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderRadius: 20,
              padding: '40px 36px',
              border: '1px solid rgba(200,162,60,0.12)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 28 }}>
              {/* Email field */}
              <div>
                <label
                  htmlFor="track-email"
                  className="label-caps"
                  style={{ display: 'block', marginBottom: 8, color: 'rgba(255,255,255,0.6)', fontSize: '0.68rem' }}
                >
                  Email Address
                </label>
                <input
                  id="track-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1px solid rgba(200,162,60,0.12)',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    fontSize: '0.95rem',
                    color: '#fff',
                    outline: 'none',
                    transition: 'border-color 200ms ease, box-shadow 200ms ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-royal)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(62,85,55,0.08)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(200,162,60,0.12)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Tracking number field */}
              <div>
                <label
                  htmlFor="track-number"
                  className="label-caps"
                  style={{ display: 'block', marginBottom: 8, color: 'rgba(255,255,255,0.6)', fontSize: '0.68rem' }}
                >
                  Tracking Number
                </label>
                <input
                  id="track-number"
                  type="text"
                  required
                  placeholder="e.g. 9400111899223100012345"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1px solid rgba(200,162,60,0.12)',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    fontSize: '0.95rem',
                    color: '#fff',
                    outline: 'none',
                    transition: 'border-color 200ms ease, box-shadow 200ms ease',
                    fontFamily: "'Barlow', Arial, sans-serif",
                    letterSpacing: '0.04em',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-royal)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(62,85,55,0.08)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(200,162,60,0.12)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 24px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: loading ? 'var(--color-warm-gray)' : 'var(--color-royal)',
                color: '#fff',
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 700,
                fontSize: '0.82rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 200ms ease, transform 200ms ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-royal-light)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-royal)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                }
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'e8-spin 0.6s linear infinite',
                      display: 'inline-block',
                    }}
                  />
                  Looking Up Order...
                </>
              ) : (
                <>
                  <Truck size={16} />
                  Track Order
                </>
              )}
            </button>
          </form>
        </AnimateIn>

        {/* Error state */}
        {error && (
          <AnimateIn>
            <div
              style={{
                marginTop: 24,
                padding: '20px 24px',
                borderRadius: 16,
                backgroundColor: 'rgba(180,68,68,0.06)',
                border: '1px solid rgba(180,68,68,0.15)',
                display: 'flex',
                gap: 14,
                alignItems: 'flex-start',
              }}
            >
              <AlertCircle size={20} color="#b44" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ color: '#944', fontSize: '0.95rem', fontWeight: 600, marginBottom: 4 }}>
                  {error}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', lineHeight: 1.6 }}>
                  Double-check that you entered the email used at checkout and the full tracking number from your shipping confirmation.
                </p>
              </div>
            </div>
          </AnimateIn>
        )}

        {/* Order result */}
        {order && statusInfo && (
          <AnimateIn>
            <div
              style={{
                marginTop: 28,
                borderRadius: 20,
                border: '1px solid rgba(200,162,60,0.12)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {/* Status header */}
              <div
                style={{
                  padding: '28px 32px',
                  backgroundColor: statusInfo.bg,
                  borderBottom: '1px solid rgba(200,162,60,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-xs)',
                    flexShrink: 0,
                  }}
                >
                  <StatusIcon size={22} color={statusInfo.color} />
                </div>
                <div>
                  <span
                    className="label-caps"
                    style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.62rem', display: 'block', marginBottom: 4 }}
                  >
                    Order Status
                  </span>
                  <span
                    className="font-heading"
                    style={{ fontSize: '1.25rem', color: statusInfo.color }}
                  >
                    {statusInfo.label}
                  </span>
                </div>
              </div>

              {/* Shipping details */}
              <div style={{ padding: '28px 32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 32px' }}>
                  {order.shipping_name && (
                    <InfoField label="Ship To" value={order.shipping_name} />
                  )}
                  <InfoField label="Order Date" value={formatDate(order.created_at)} />
                  {order.shipping_carrier && (
                    <InfoField label="Carrier" value={order.shipping_carrier} />
                  )}
                  {order.shipping_service && (
                    <InfoField label="Service" value={order.shipping_service} />
                  )}
                  <InfoField label="Tracking Number" value={order.tracking_number} mono />
                  <InfoField label="Order Total" value={formatCurrency(order.total, order.currency)} />
                </div>

                {/* Tracking link */}
                {order.tracking_url && (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 24,
                      padding: '12px 20px',
                      borderRadius: 10,
                      backgroundColor: 'var(--color-royal)',
                      color: '#fff',
                      fontFamily: "'Barlow', Arial, sans-serif",
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                      transition: 'background-color 200ms ease, transform 200ms ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-royal-light)';
                      (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-royal)';
                      (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
                    }}
                  >
                    <ExternalLink size={14} />
                    Track on {order.shipping_carrier || 'Carrier'} Website
                  </a>
                )}
              </div>

              {/* Order items */}
              {order.items.length > 0 && (
                <div
                  style={{
                    borderTop: '1px solid rgba(200,162,60,0.12)',
                    padding: '24px 32px',
                  }}
                >
                  <span
                    className="label-caps"
                    style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.62rem', display: 'block', marginBottom: 16 }}
                  >
                    Items in This Order
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {order.items.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          borderRadius: 10,
                          backgroundColor: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(200,162,60,0.12)',
                        }}
                      >
                        <div>
                          <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>
                            {item.product_name}
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', marginLeft: 8 }}>
                            x{item.quantity}
                          </span>
                        </div>
                        <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>
                          {formatCurrency(item.unit_price * item.quantity, order.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Carrier note */}
              {order.tracking_url && (
                <div
                  style={{
                    borderTop: '1px solid rgba(200,162,60,0.12)',
                    padding: '20px 32px',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', lineHeight: 1.6 }}>
                    You can also track directly with your carrier:{' '}
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-royal)', textDecoration: 'underline', fontWeight: 600 }}
                    >
                      {order.tracking_url}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </AnimateIn>
        )}

        {/* Help callout */}
        <AnimateIn delay={200}>
          <div
            style={{
              marginTop: 40,
              padding: '24px 28px',
              borderRadius: 16,
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(200,162,60,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <p style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600, marginBottom: 4 }}>
                Need help with your order?
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem' }}>
                Can&apos;t find your tracking info? Contact our support team.
              </p>
            </div>
            <Link
              href="/contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 18px',
                borderRadius: 8,
                border: '1px solid rgba(200,162,60,0.12)',
                backgroundColor: 'rgba(255,255,255,0.04)',
                color: '#fff',
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 700,
                fontSize: '0.72rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                transition: 'border-color 200ms ease, background-color 200ms ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-royal)';
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-purple-light)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(200,162,60,0.12)';
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(255,255,255,0.04)';
              }}
            >
              Contact Support <ArrowRight size={12} />
            </Link>
          </div>
        </AnimateIn>
      </div>

    </div>
  );
}

/* ---------- Subcomponent ---------- */

function InfoField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span
        className="label-caps"
        style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.62rem', display: 'block', marginBottom: 4 }}
      >
        {label}
      </span>
      <span
        style={{
          color: '#fff',
          fontSize: '0.95rem',
          fontWeight: 600,
          fontFamily: mono ? "'Barlow', monospace" : undefined,
          letterSpacing: mono ? '0.04em' : undefined,
          wordBreak: 'break-all',
        }}
      >
        {value}
      </span>
    </div>
  );
}
