import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, Truck, DollarSign, User, FileText, Phone, Package, ShieldCheck, ArrowRight } from 'lucide-react';
import AnimateIn from '@/components/AnimateIn';
import DistributionForm from '@/components/forms/DistributionForm';

export const metadata: Metadata = {
  title: 'Dispensary Sign Up | Partner with Empire 8',
  description:
    'Licensed NY dispensaries -- sign up with Empire 8 Sales Direct for premium cannabis supply, competitive wholesale pricing, and statewide delivery.',
  keywords: [
    'dispensary sign up',
    'cannabis wholesale NY',
    'dispensary supplier new york',
    'cannabis distribution',
    'OCM licensed distributor',
    'dispensary partnership NY',
    'cannabis wholesale account',
  ],
  openGraph: {
    title: 'Dispensary Sign Up | Partner with Empire 8',
    description:
      'Licensed NY dispensaries -- sign up for premium cannabis supply, competitive wholesale pricing, and statewide delivery.',
    url: 'https://empire8ny.com/dispensary-signup',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Dispensary Sign Up — Empire 8' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dispensary Sign Up | Empire 8',
    description:
      'Sign up as a licensed NY dispensary for premium cannabis wholesale supply and statewide delivery.',
    images: ['/og-image.jpg'],
  },
  alternates: { canonical: 'https://empire8ny.com/dispensary-signup' },
};

const OFFERINGS = [
  {
    icon: Package,
    title: 'Curated Product Portfolio',
    desc: 'Vapes, flower, pre-rolls, edibles, concentrates, tinctures, and more from premium NY-licensed brands.',
  },
  {
    icon: DollarSign,
    title: 'Competitive Wholesale Pricing',
    desc: 'Volume-based pricing with NET 30 terms available for qualified dispensaries.',
  },
  {
    icon: Truck,
    title: 'Statewide Delivery',
    desc: 'Temperature-controlled delivery across all 7 New York zones. Same-week fulfillment.',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance & Tracking',
    desc: 'Full manifesting, chain of custody documentation, and real-time order tracking. 100% OCM compliant.',
  },
];

const WHY_EMPIRE8 = [
  { icon: BadgeCheck, title: 'Licensed & Compliant', desc: 'NYS OCM licensed. Every shipment fully manifested and tracked seed-to-shelf.' },
  { icon: Package, title: 'Premium Brands', desc: 'Curated portfolio of top-tier NY cannabis brands across all major product categories.' },
  { icon: User, title: 'Dedicated Account Manager', desc: 'Your own rep for ordering, inventory planning, and marketing support.' },
  { icon: FileText, title: 'Flexible Terms', desc: 'NET 30 billing available for approved accounts. Volume-based pricing.' },
  { icon: ShieldCheck, title: 'Full Product Range', desc: 'Vapes, cartridges, flower, infused pre-rolls, edibles, beverages, tinctures, concentrates.' },
  { icon: Phone, title: 'Fast Fulfillment', desc: 'Same-week delivery with temperature-controlled vehicles across all 62 counties.' },
];

const HOW_IT_WORKS = [
  { step: 1, title: 'Submit Application', desc: 'Fill out the form below with your dispensary details and NY Cannabis License number.' },
  { step: 2, title: 'Account Review', desc: 'Our team reviews your application and verifies your OCM license within 2 business days.' },
  { step: 3, title: 'Meet Your Rep', desc: 'Get assigned a dedicated account manager who walks you through our catalog and pricing.' },
  { step: 4, title: 'Start Ordering', desc: 'Place your first order and receive same-week delivery with full compliance documentation.' },
];

const signupSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Dispensary Sign Up',
  description: 'Sign up as a licensed NY dispensary to partner with Empire 8 Sales Direct for wholesale cannabis supply.',
  url: 'https://empire8ny.com/dispensary-signup',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Empire 8 Sales Direct',
    url: 'https://empire8ny.com',
  },
  potentialAction: {
    '@type': 'RegisterAction',
    target: 'https://empire8ny.com/dispensary-signup',
    name: 'Sign up as a dispensary partner',
  },
};

export default function DispensarySignUpPage() {
  return (
    <div style={{ paddingTop: 'var(--nav-height)', backgroundColor: '#0F0520', minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(signupSchema) }}
      />

      {/* ── Cinematic Hero ── */}
      <section
        style={{
          background: 'linear-gradient(168deg, #2D0A4E 0%, #4A0E78 30%, #2D0A4E 65%, #1A0633 100%)',
          minHeight: '55vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '96px 24px 88px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative radial glows */}
        <div style={{ position: 'absolute', top: '-15%', right: '5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,162,60,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '3%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,47,160,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: 900, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,162,60,0.04) 0%, transparent 60%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <span className="label-caps e8-fade-up" style={{ color: '#C8A23C', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <span style={{ width: 28, height: 1.5, backgroundColor: '#C8A23C', display: 'inline-block', borderRadius: 99 }} />
            Dispensary Sign Up
            <span style={{ width: 28, height: 1.5, backgroundColor: '#C8A23C', display: 'inline-block', borderRadius: 99 }} />
          </span>
          <h1 className="font-display e8-fade-up-1" style={{ fontSize: 'clamp(2.25rem, 5.5vw, 3.75rem)', lineHeight: 1.0, color: '#fff', marginBottom: 20 }}>
            Partner with New York&apos;s Premier Cannabis Supplier
          </h1>
          <p className="e8-fade-up-2" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', maxWidth: 580, margin: '0 auto', lineHeight: 1.8 }}>
            Empire 8 Sales Direct supplies licensed dispensaries across all 62 New York counties with premium cannabis products, AI-driven marketing, and same-week delivery.
          </p>
        </div>
      </section>

      {/* ── Zone Map ── */}
      <section style={{ backgroundColor: '#0F0520', padding: '80px 24px', borderBottom: '1px solid rgba(200,162,60,0.1)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 36 }}>
            <span className="label-caps" style={{ color: '#C8A23C' }}>Coverage Area</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginTop: 10, color: '#fff' }}>
              Statewide Delivery Zones
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', maxWidth: 560, margin: '12px auto 0', lineHeight: 1.7 }}>
              Empire 8 delivers across all 7 zones covering every county in New York State.
            </p>
          </AnimateIn>
          <AnimateIn delay={100}>
            <div style={{ borderRadius: 16, overflow: 'hidden', border: '2px solid rgba(200,162,60,0.2)', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
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

      {/* ── What We Offer ── */}
      <section style={{ backgroundColor: '#150A28', padding: '96px 24px', borderBottom: '1px solid rgba(200,162,60,0.1)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="label-caps" style={{ color: '#C8A23C' }}>Our Services</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginTop: 10, color: '#fff' }}>
              What We Offer
            </h2>
          </AnimateIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {OFFERINGS.map(({ icon: Icon, title, desc }, i) => (
              <AnimateIn key={title} delay={i * 75}>
                <div
                  className="tilt-card"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderRadius: 20,
                    padding: '28px 24px',
                    border: '1px solid rgba(200,162,60,0.12)',
                    borderTop: '3px solid #C8A23C',
                    height: '100%',
                  }}
                >
                  <div style={{ width: 48, height: 48, backgroundColor: 'rgba(200,162,60,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                    <Icon size={22} color="#C8A23C" />
                  </div>
                  <h3 className="font-heading" style={{ fontSize: '1rem', marginBottom: 8, color: '#fff' }}>{title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>{desc}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ backgroundColor: '#0F0520', padding: '96px 24px', borderBottom: '1px solid rgba(200,162,60,0.1)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="label-caps" style={{ color: '#C8A23C' }}>Getting Started</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginTop: 10, color: '#fff' }}>
              How It Works
            </h2>
          </AnimateIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
            {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
              <AnimateIn key={step} delay={i * 100}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #C8A23C 0%, #E8D48B 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: '0 4px 20px rgba(200,162,60,0.3)',
                  }}>
                    <span className="font-display" style={{ fontSize: '1.25rem', color: '#1A0633', lineHeight: 1 }}>{step}</span>
                  </div>
                  <h3 className="font-heading" style={{ fontSize: '1rem', marginBottom: 8, color: '#fff' }}>{title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{desc}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Dispensaries Choose Empire 8 ── */}
      <section style={{ backgroundColor: '#150A28', padding: '96px 24px', borderBottom: '1px solid rgba(200,162,60,0.1)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="label-caps" style={{ color: '#C8A23C' }}>Why Empire 8</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginTop: 10, color: '#fff' }}>
              Why Dispensaries Choose Empire 8
            </h2>
          </AnimateIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {WHY_EMPIRE8.map(({ icon: Icon, title, desc }, i) => (
              <AnimateIn key={title} delay={i * 75}>
                <div
                  className="tilt-card"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderRadius: 20,
                    padding: '28px 24px',
                    border: '1px solid rgba(200,162,60,0.12)',
                    borderTop: '3px solid #C8A23C',
                    height: '100%',
                  }}
                >
                  <div style={{ width: 48, height: 48, backgroundColor: 'rgba(200,162,60,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                    <Icon size={22} color="#C8A23C" />
                  </div>
                  <h3 className="font-heading" style={{ fontSize: '1rem', marginBottom: 8, color: '#fff' }}>{title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>{desc}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Application Form ── */}
      <section
        style={{
          background: 'linear-gradient(168deg, #1A0633 0%, #2D0A4E 50%, #1A0633 100%)',
          padding: '96px 24px',
          borderBottom: '1px solid rgba(200,162,60,0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle glow behind form */}
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,162,60,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 44 }}>
            <span className="label-caps" style={{ color: '#C8A23C' }}>Apply Now</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginTop: 10, color: '#fff' }}>
              Apply to Become a Dispensary Partner
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', marginTop: 12, maxWidth: 520, margin: '12px auto 0', lineHeight: 1.7 }}>
              Submit your information below. A New York Cannabis License is required. Applications are reviewed within 2 business days.
            </p>
          </AnimateIn>

          <AnimateIn>
            <div
              className="e8-form-card"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(200,162,60,0.15)',
                borderRadius: 24,
                padding: '44px 40px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(200,162,60,0.08)',
              }}
            >
              <DistributionForm />
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section
        style={{
          background: 'linear-gradient(135deg, rgba(200,162,60,0.12) 0%, rgba(74,14,120,0.1) 100%)',
          backgroundColor: '#0F0520',
          padding: '80px 24px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,162,60,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <AnimateIn style={{ maxWidth: 560, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h2 className="font-display" style={{ color: '#fff', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: 16, lineHeight: 1.05 }}>
            Questions Before You Apply?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 36, lineHeight: 1.75 }}>
            Reach out and we&apos;ll walk you through the dispensary program and what to expect.
          </p>
          <Link
            href="/contact"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#C8A23C',
              color: '#1A0633',
              padding: '14px 32px',
              borderRadius: 9999,
              fontFamily: "'Barlow', Arial, sans-serif",
              fontWeight: 700,
              fontSize: '0.82rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              boxShadow: '0 4px 24px rgba(200,162,60,0.35)',
            }}
          >
            Contact Us <ArrowRight size={14} />
          </Link>
        </AnimateIn>
      </section>

      {/* ── Compliance Disclaimer ── */}
      <section style={{ backgroundColor: '#0A0418', padding: '32px 24px', borderTop: '1px solid rgba(200,162,60,0.1)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', lineHeight: 1.8, margin: 0 }}>
            For use only by adults 21 years of age and older. Empire 8 Sales Direct does not make health or medical claims about cannabis products. NYS OCM Licensed Distributor.
          </p>
        </div>
      </section>
    </div>
  );
}
