import type { Metadata } from 'next';
import Link from 'next/link';
import { XCircle, ArrowLeft, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Checkout Cancelled',
  robots: { index: false, follow: false },
};

export default function CheckoutCancelPage() {
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
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div
          style={{
            width: 64,
            height: 64,
            backgroundColor: '#FDF0F0',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <XCircle size={32} color="var(--color-alert-red)" />
        </div>

        <span className="label-caps" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.68rem' }}>
          Checkout Cancelled
        </span>

        <h1
          className="font-display"
          style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', color: '#fff', margin: '10px 0 14px', lineHeight: 1.1 }}
        >
          No charges were made.
        </h1>

        <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 36, fontSize: '0.95rem' }}>
          Your cart is still saved. Pick up where you left off, or reach out if you need help placing your order.
        </p>

        <div className="e8-btn-group" style={{ maxWidth: 380, margin: '0 auto' }}>
          <Link
            href="/catalog"
            className="e8-btn-gold"
            style={{
              backgroundColor: 'var(--color-gold)',
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
            <ArrowLeft size={14} /> Back to Catalog
          </Link>
          <a
            href="mailto:info@empire8ny.com"
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
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Phone size={14} /> Email Us
          </a>
        </div>
      </div>
    </div>
  );
}
