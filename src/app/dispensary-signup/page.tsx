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

      {/* Hero */}
      <section
        style={{
          background: 'linear-gradient(168deg, #2D0A4E 0%, #4A0E78 35%, #2D0A4E 70%, #1A0633 100%)',
          padding: '80px 24px 88px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: '-20%', right: '5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,162,60,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '3%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,47,160,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <span className="label-caps" style={{ color: '#C8A23C', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ width: 24, height: 1.5, backgroundColor: '#C8A23C', display: 'inline-block', borderRadius: 99 }} />
            Dispensary Sign Up
            <span style={{ width: 24, height: 1.5, backgroundColor: '#C8A23C', display: 'inline-block', borderRadius: 99 }} />
          </span>
          <h1 className="font-display" style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', lineHeight: 1.0, color: '#fff', marginBottom: 20 }}>
            Partner with New York&apos;s Premier Cannabis Supplier
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', maxWidth: 580, margin: '0 auto', lineHeight: 1.8 }}>
            Empire 8 Sales Direct supplies licensed dispensaries across all 62 New York counties with premium cannabis products. Apply below to become a partner.
          </p>
        </div>
      </section>

      {/* Zone Map */}
      <section style={{ backgroundColor: '#0F0520', padding: '64px 24px', borderBottom: '1px solid rgba(200,162,60,0.1)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 32 }}>
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

      {/* What We Offer */}
      <section style={{ backgroundColor: '#150A28', padding: '80px 24px', borderBottom: '1px solid rgba(200,162,60,0.1)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 52 }}>
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

      {/* Why Dispensaries Choose Empire 8 */}
      <section style={{ backgroundColor: '#0F0520', padding: '80px 24px', borderBottom: '1px solid rgba(200,162,60,0.1)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 52 }}>
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

      {/* Application */}
      <section
        style={{
          background: 'linear-gradient(168deg, #1A0633 0%, #2D0A4E 50%, #1A0633 100%)',
          padding: '80px 24px',
          borderBottom: '1px solid rgba(200,162,60,0.1)',
        }}
      >
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
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
            <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(200,162,60,0.15)', borderRadius: 24, padding: '44px 40px' }}>
              <DistributionForm />
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          background: 'linear-gradient(135deg, #4A0E78 0%, #2D0A4E 100%)',
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

      {/* Compliance Disclaimer */}
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
