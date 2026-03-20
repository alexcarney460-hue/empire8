import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, ArrowRight, RefreshCw, Package } from 'lucide-react';
import ClearCartOnMount from './ClearCartOnMount';
import TrackPurchase from '@/components/TrackPurchase';

export const metadata: Metadata = {
  title: 'Order Confirmed',
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return (
    <div
      style={{
        paddingTop: 'var(--nav-height)',
        minHeight: '100vh',
        backgroundColor: '#0F0520',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'calc(var(--nav-height) + 48px) 24px 80px',
      }}
    >
      <ClearCartOnMount />
      <TrackPurchase />
      <div style={{ maxWidth: 540, width: '100%', textAlign: 'center' }}>

        {/* Icon */}
        <div
          style={{
            width: 72,
            height: 72,
            backgroundColor: '#EDF7F0',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <CheckCircle size={36} color="var(--color-purple-muted)" />
        </div>

        <span className="label-caps" style={{ color: 'var(--color-gold)', fontSize: '0.68rem' }}>
          Order Confirmed
        </span>

        <h1
          className="font-display"
          style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', color: '#fff', margin: '12px 0 16px', lineHeight: 1.1 }}
        >
          You're all set.
        </h1>

        <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 40, fontSize: '1rem' }}>
          Your order is confirmed and being prepared for shipment. A confirmation email is on its way to your inbox.
        </p>

        {/* Info cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 40 }}>
          <div
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(200,162,60,0.12)',
              borderRadius: 14,
              padding: '20px 18px',
              textAlign: 'left',
            }}
          >
            <Package size={20} color="var(--color-royal)" style={{ marginBottom: 10 }} />
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff', marginBottom: 4 }}>
              Ships in 1–2 days
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
              Orders placed before 3pm EST ship same day.
            </div>
          </div>
          <div
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(200,162,60,0.12)',
              borderRadius: 14,
              padding: '20px 18px',
              textAlign: 'left',
            }}
          >
            <RefreshCw size={20} color="var(--color-purple-muted)" style={{ marginBottom: 10 }} />
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff', marginBottom: 4 }}>
              Subscribe & Save
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
              Save 10% on every order with automatic monthly delivery. Manage your subscription anytime in your account.
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="e8-btn-group" style={{ maxWidth: 400, margin: '0 auto' }}>
          <Link
            href="/catalog"
            className="e8-btn-royal"
            style={{
              backgroundColor: 'var(--color-royal)',
              color: '#fff',
              padding: '14px 28px',
              borderRadius: 9,
              fontFamily: "'Barlow', Arial, sans-serif",
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            Continue Shopping <ArrowRight size={14} />
          </Link>
          <Link
            href="/contact"
            style={{
              backgroundColor: 'transparent',
              color: '#fff',
              padding: '14px 28px',
              borderRadius: 9,
              border: '1.5px solid rgba(200,162,60,0.12)',
              fontFamily: "'Barlow', Arial, sans-serif",
              fontWeight: 600,
              fontSize: '0.85rem',
              textDecoration: 'none',
            }}
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
