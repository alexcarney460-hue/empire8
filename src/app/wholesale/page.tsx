import type { Metadata } from 'next';
import Link from 'next/link';
import { BadgeCheck, Truck, DollarSign, User, ArrowRight } from 'lucide-react';
import AnimateIn from '@/components/AnimateIn';
import WholesaleForm from '@/components/forms/WholesaleForm';

export const metadata: Metadata = {
  title: 'Cannabis Wholesale Supplier — Dispensary Pricing for NY',
  description:
    'Empire 8 Sales Direct is a licensed cannabis wholesale supplier serving dispensaries across all 62 New York counties. Volume pricing, priority fulfillment, and dedicated account support.',
  keywords: ['cannabis wholesale supplier', 'NY dispensary wholesale', 'cannabis wholesale New York', 'dispensary supplier', 'licensed cannabis distributor', 'wholesale cannabis products'],
  openGraph: {
    title: 'Cannabis Wholesale Supplier — Dispensary Pricing for NY',
    description: 'Licensed cannabis wholesale for NY dispensaries. Volume pricing, priority fulfillment, and dedicated support. Apply online.',
    url: 'https://empire8salesdirect.com/wholesale',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cannabis Wholesale for NY Dispensaries | Empire 8 Sales Direct',
    description: 'Licensed cannabis wholesale supplier serving all 62 NY counties. Volume pricing and dedicated account support. Apply online.',
  },
  alternates: { canonical: 'https://empire8salesdirect.com/wholesale' },
};

const BENEFITS = [
  { icon: DollarSign, title: 'Volume Pricing', desc: 'Competitive wholesale pricing on cannabis products. Tiered discounts that scale with order volume.' },
  { icon: Truck, title: 'Priority Fulfillment', desc: 'Wholesale accounts get priority processing and restocking ahead of retail orders.' },
  { icon: BadgeCheck, title: 'Dedicated Support', desc: 'Direct line to your account rep for reorders, product questions, and custom requests.' },
  { icon: User, title: 'Net 30 Available', desc: 'Qualify for NET terms after your first three orders. Designed for dispensary cash flow.' },
];


export default function WholesalePage() {
  return (
    <div style={{ paddingTop: 'var(--nav-height)', backgroundColor: '#fff', minHeight: '100vh' }}>

      {/* Hero */}
      <section style={{ backgroundColor: '#fff', padding: '72px 24px 80px', position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '5%', width: 480, height: 480, borderRadius: '50%', background: 'rgba(200,146,42,0.07)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '3%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(27,58,45,0.05)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <span className="label-caps" style={{ color: 'var(--color-gold)', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ width: 24, height: 1.5, backgroundColor: 'var(--color-gold)', display: 'inline-block', borderRadius: 99 }} />
            Wholesale Program
            <span style={{ width: 24, height: 1.5, backgroundColor: 'var(--color-gold)', display: 'inline-block', borderRadius: 99 }} />
          </span>
          <h1 className="font-display" style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', lineHeight: 1.0, color: 'var(--color-charcoal)', marginBottom: 20 }}>
            Cannabis Wholesale for NY Dispensaries.
          </h1>
          <p style={{ color: 'var(--color-warm-gray)', fontSize: '1.05rem', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.8 }}>
            Licensed cannabis wholesale supplier serving dispensaries across all 62 New York counties. Apply once for wholesale pricing and priority fulfillment.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, backgroundColor: 'rgba(200,146,42,0.08)', border: '1px solid rgba(200,146,42,0.25)', borderRadius: 16, padding: '18px 32px' }}>
            <span className="font-display" style={{ fontSize: '1.5rem', color: 'var(--color-gold)', lineHeight: 1 }}>Wholesale</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: 'var(--color-charcoal)', fontWeight: 700, fontSize: '0.9rem' }}>Volume pricing for licensed dispensaries</div>
              <div style={{ color: 'var(--color-warm-gray)', fontSize: '0.8rem' }}>Apply online · Approval in 1 business day</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section style={{ backgroundColor: '#FAFAFA', padding: '80px 24px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 52 }}>
            <span className="label-caps" style={{ color: 'var(--color-gold)' }}>What You Get</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginTop: 10, color: 'var(--color-charcoal)' }}>
              Wholesale Account Benefits
            </h2>
          </AnimateIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {BENEFITS.map(({ icon: Icon, title, desc }, i) => (
              <AnimateIn key={title} delay={i * 90}>
                <div
                  className="tilt-card"
                  style={{
                    backgroundColor: '#fff',
                    border: '1px solid var(--color-border)',
                    borderRadius: 20,
                    padding: '28px 24px',
                    borderTop: '3px solid var(--color-gold)',
                    height: '100%',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <div style={{ width: 48, height: 48, backgroundColor: 'var(--color-purple-light)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                    <Icon size={22} color="var(--color-gold)" />
                  </div>
                  <h3 className="font-heading" style={{ fontSize: '1rem', marginBottom: 8, color: 'var(--color-charcoal)' }}>{title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-warm-gray)', lineHeight: 1.7 }}>{desc}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Application form */}
      <section style={{ backgroundColor: '#fff', padding: '80px 24px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 44 }}>
            <span className="label-caps" style={{ color: 'var(--color-gold)' }}>Apply Now</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginTop: 10, color: 'var(--color-charcoal)' }}>
              Apply for Wholesale Access
            </h2>
            <p style={{ color: 'var(--color-warm-gray)', marginTop: 12 }}>
              We review applications within 1 business day.
            </p>
          </AnimateIn>

          <AnimateIn>
            <div style={{ backgroundColor: '#fff', border: '1px solid var(--color-border)', borderRadius: 24, padding: '44px 40px', boxShadow: 'var(--shadow-sm)' }}>
              <WholesaleForm />
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* CTA */}
      <section
        className="e8-dot-grid"
        style={{ backgroundColor: 'var(--color-royal)', padding: '80px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 300, borderRadius: '50%', background: 'rgba(200,146,42,0.09)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <AnimateIn style={{ maxWidth: 560, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <span className="label-caps" style={{ color: 'rgba(200,146,42,0.85)', display: 'block', marginBottom: 16 }}>Need More?</span>
          <h2 className="font-display" style={{ color: '#fff', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: 16, lineHeight: 1.05 }}>
            Looking for Dispensary-Tier Pricing?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 36, lineHeight: 1.75 }}>
            High-volume dispensary accounts get premium pricing with NET 30 terms and a dedicated rep.
          </p>
          <Link
            href="/dispensary-signup"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: 'var(--color-gold)',
              color: '#fff',
              padding: '14px 32px',
              borderRadius: 9999,
              fontFamily: "'Barlow', Arial, sans-serif",
              fontWeight: 700,
              fontSize: '0.82rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              boxShadow: 'var(--shadow-gold)',
            }}
          >
            Dispensary Sign Up <ArrowRight size={14} />
          </Link>
        </AnimateIn>
      </section>

    </div>
  );
}
