import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, Truck, DollarSign, User, FileText, Phone, ArrowRight } from 'lucide-react';
import AnimateIn from '@/components/AnimateIn';
import DistributionForm from '@/components/forms/DistributionForm';

export const metadata: Metadata = {
  title: 'Dispensary Sign Up — $60/Case + NET 30',
  description:
    'Sign up your dispensary. $60/case pricing on 120+ case orders with NET 30 terms, dedicated rep, and priority inventory. Save $20/case off retail.',
  keywords: ['dispensary sign up', 'dispensary wholesale pricing', 'wholesale gloves dispensary', 'dispensary supplies', 'net 30 gloves', 'cannabis supplies wholesale'],
  openGraph: {
    title: 'Dispensary Sign Up — $60/Case + NET 30',
    description: 'Dispensary wholesale pricing at $60/case on 120+ case orders. NET 30 billing, dedicated rep, and priority inventory allocation.',
    url: 'https://empire8salesdirect.com/dispensary-signup',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dispensary Sign Up | Empire 8 Sales Direct',
    description: '$60/case glove pricing for dispensaries. NET 30 terms, priority allocation, and dedicated account rep.',
  },
  alternates: { canonical: 'https://empire8salesdirect.com/dispensary-signup' },
};

const BENEFITS = [
  { icon: DollarSign, title: '$60/case Pricing', desc: 'Dispensary accounts save $20/case off retail — $60/case ($6/box) on every SKU, every order.' },
  { icon: Truck, title: 'Priority Allocation', desc: 'Dispensary partners are fulfilled first. You get inventory priority before retail channels.' },
  { icon: FileText, title: 'NET 30 Terms', desc: 'Qualify for NET 30 billing after account approval. Invoice-based ordering for established operations.' },
  { icon: User, title: 'Dedicated Rep', desc: 'Direct line to your account manager for custom orders, volume quotes, and restock scheduling.' },
  { icon: BadgeCheck, title: 'Custom Pricing Tiers', desc: 'At 100+ case/month volume, we build a custom pricing agreement tailored to your operation.' },
  { icon: Phone, title: 'After-Hours Support', desc: 'Dispensary accounts get priority support contact for urgent restock situations.' },
];

const COMPARISON = [
  { label: 'Case Price',               retail: '$80/case',  wholesale: '$70/case',      dispensary: '$60/case' },
  { label: 'Savings per Case',         retail: '—',         wholesale: 'Save $10/case', dispensary: 'Save $20/case' },
  { label: 'Minimum Order',            retail: '1 case',    wholesale: '30 cases',      dispensary: '120 cases' },
  { label: 'NET Terms',                retail: 'No',        wholesale: 'No',            dispensary: 'NET 30' },
  { label: 'Dedicated Account Rep',    retail: 'No',        wholesale: 'No',            dispensary: 'Yes' },
  { label: 'Inventory Priority',       retail: 'No',        wholesale: 'No',            dispensary: 'Yes' },
  { label: 'Custom Pricing Available', retail: 'No',        wholesale: 'No',            dispensary: 'Yes (200+ cases)' },
];


export default function DispensarySignUpPage() {
  return (
    <div style={{ paddingTop: 'var(--nav-height)', backgroundColor: '#fff', minHeight: '100vh' }}>

      {/* Hero */}
      <section style={{ backgroundColor: '#fff', padding: '72px 24px 80px', position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '5%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(200,146,42,0.07)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '3%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(27,58,45,0.05)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <span className="label-caps" style={{ color: 'var(--color-gold)', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ width: 24, height: 1.5, backgroundColor: 'var(--color-gold)', display: 'inline-block', borderRadius: 99 }} />
            Dispensary Sign Up
            <span style={{ width: 24, height: 1.5, backgroundColor: 'var(--color-gold)', display: 'inline-block', borderRadius: 99 }} />
          </span>
          <h1 className="font-display" style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', lineHeight: 1.0, color: 'var(--color-charcoal)', marginBottom: 20 }}>
            Built for Commercial Volume.
          </h1>
          <p style={{ color: 'var(--color-warm-gray)', fontSize: '1.05rem', maxWidth: 540, margin: '0 auto 36px', lineHeight: 1.8 }}>
            Licensed dispensaries and commercial operations — sign up for wholesale access and get $60/case pricing (save $20/case) on every order.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, backgroundColor: 'rgba(200,146,42,0.08)', border: '1px solid rgba(200,146,42,0.25)', borderRadius: 16, padding: '18px 32px' }}>
            <span className="font-display" style={{ fontSize: '2.25rem', color: 'var(--color-gold)', lineHeight: 1 }}>$60</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: 'var(--color-charcoal)', fontWeight: 700, fontSize: '0.9rem' }}>Per Case — Dispensary Tier</div>
              <div style={{ color: 'var(--color-warm-gray)', fontSize: '0.8rem' }}>120+ cases · Save $20/case · NET 30 available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Zone Map */}
      <section style={{ backgroundColor: '#0F0520', padding: '64px 24px', borderBottom: '1px solid rgba(200,162,60,0.15)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 32 }}>
            <span className="label-caps" style={{ color: '#C8A23C' }}>Coverage Area</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginTop: 10, color: '#fff' }}>
              Statewide Delivery Zones
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem', maxWidth: 560, margin: '12px auto 0', lineHeight: 1.7 }}>
              Empire 8 delivers across all 7 zones covering every county in New York State.
            </p>
          </AnimateIn>
          <AnimateIn delay={100}>
            <div style={{ borderRadius: 16, overflow: 'hidden', border: '2px solid rgba(200,162,60,0.25)', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
              <Image
                src="/zone-map.jpg"
                alt="Empire 8 Sales Direct — Regional Sales and Distribution Map covering all 7 zones across New York State"
                width={1600}
                height={1000}
                style={{ width: '100%', height: 'auto', display: 'block' }}
                priority
              />
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Tier Comparison Table */}
      <section style={{ backgroundColor: '#FAFAFA', padding: '80px 24px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="label-caps" style={{ color: 'var(--color-gold)' }}>Pricing Tiers</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginTop: 10, color: 'var(--color-charcoal)' }}>
              How the Tiers Compare
            </h2>
          </AnimateIn>
          <AnimateIn>
            <div style={{ backgroundColor: '#fff', borderRadius: 20, border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                      <th style={{ padding: '16px 24px', textAlign: 'left' }}></th>
                      {['Retail', 'Wholesale', 'Dispensary'].map((tier, i) => (
                        <th
                          key={tier}
                          style={{
                            padding: '16px 24px',
                            textAlign: 'center',
                            borderLeft: '1px solid var(--color-border)',
                            backgroundColor: i === 2 ? 'rgba(200,146,42,0.05)' : 'transparent',
                          }}
                        >
                          <span className="label-caps" style={{ color: i === 2 ? 'var(--color-gold)' : i === 1 ? 'var(--color-purple-muted)' : 'var(--color-warm-gray)', fontSize: '0.72rem' }}>
                            {tier}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON.map((row, ri) => (
                      <tr key={row.label} style={{ borderBottom: ri < COMPARISON.length - 1 ? '1px solid var(--color-border)' : 'none', backgroundColor: ri % 2 === 0 ? '#FAFAFA' : '#fff' }}>
                        <td style={{ padding: '14px 24px', fontSize: '0.88rem', color: 'var(--color-charcoal)', fontWeight: 500 }}>{row.label}</td>
                        <td style={{ padding: '14px 24px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-warm-gray)', borderLeft: '1px solid var(--color-border)' }}>{row.retail}</td>
                        <td style={{ padding: '14px 24px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-purple-muted)', fontWeight: 500, borderLeft: '1px solid var(--color-border)' }}>{row.wholesale}</td>
                        <td style={{ padding: '14px 24px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-gold)', fontWeight: 600, backgroundColor: 'rgba(200,146,42,0.05)', borderLeft: '1px solid rgba(200,146,42,0.15)' }}>{row.dispensary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Benefits */}
      <section style={{ backgroundColor: '#fff', padding: '80px 24px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 52 }}>
            <span className="label-caps" style={{ color: 'var(--color-gold)' }}>What You Get</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginTop: 10, color: 'var(--color-charcoal)' }}>
              Dispensary Partner Benefits
            </h2>
          </AnimateIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {BENEFITS.map(({ icon: Icon, title, desc }, i) => (
              <AnimateIn key={title} delay={i * 75}>
                <div
                  className="tilt-card"
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 20,
                    padding: '28px 24px',
                    border: '1px solid var(--color-border)',
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

      {/* Application */}
      <section style={{ backgroundColor: '#FAFAFA', padding: '80px 24px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 44 }}>
            <span className="label-caps" style={{ color: 'var(--color-gold)' }}>Apply Now</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginTop: 10, color: 'var(--color-charcoal)' }}>
              Dispensary Sign Up
            </h2>
            <p style={{ color: 'var(--color-warm-gray)', marginTop: 12 }}>
              Applications reviewed within 1 business day. You&apos;ll receive account credentials and NET 30 terms upon approval.
            </p>
          </AnimateIn>

          <AnimateIn>
            <div style={{ backgroundColor: '#fff', border: '1px solid var(--color-border)', borderRadius: 24, padding: '44px 40px', boxShadow: 'var(--shadow-sm)' }}>
              <DistributionForm />
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
          <h2 className="font-display" style={{ color: '#fff', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: 16, lineHeight: 1.05 }}>
            Questions Before You Apply?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 36, lineHeight: 1.75 }}>
            Reach out and we&apos;ll walk you through the dispensary program and what to expect.
          </p>
          <Link
            href="/contact"
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
            Contact Us <ArrowRight size={14} />
          </Link>
        </AnimateIn>
      </section>

    </div>
  );
}
