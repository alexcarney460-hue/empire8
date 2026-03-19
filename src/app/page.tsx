import type { Metadata } from 'next';
import Link from 'next/link';
import { Truck, Shield, Handshake, HeadphonesIcon, ArrowRight, MapPin, BadgeCheck, Building2, LocateFixed } from 'lucide-react';
import AnimateIn from '@/components/AnimateIn';
import FAQSection from './(home)/FAQSection';
import CTASection from './(home)/CTASection';

export const metadata: Metadata = {
  title: 'Empire 8 Sales Direct | NY Cannabis Distribution Partner',
  description:
    'Licensed B2B cannabis distribution across all 62 New York counties. Connecting top cannabis brands with dispensaries. OCM compliant. Temperature-controlled fleet.',
  keywords: [
    'cannabis distribution new york',
    'NY cannabis distributor',
    'B2B cannabis distribution',
    'OCM compliant distributor',
    'cannabis supply chain new york',
    'dispensary wholesale supply',
    'licensed cannabis distributor NY',
  ],
  alternates: { canonical: 'https://empire8salesdirect.com' },
  openGraph: {
    title: 'Empire 8 Sales Direct | NY Cannabis Distribution Partner',
    description: 'Licensed B2B cannabis distribution across all 62 New York counties. Connecting top cannabis brands with dispensaries statewide.',
    url: 'https://empire8salesdirect.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Empire 8 Sales Direct | NY Cannabis Distribution',
    description: 'Licensed B2B cannabis distribution across all 62 New York counties. OCM compliant. Temperature-controlled statewide delivery.',
  },
};

const SERVICE_CARDS = [
  {
    icon: Truck,
    title: 'Statewide Distribution',
    description: 'Full coverage across all 62 New York counties. Temperature-controlled fleet. Same-week delivery to licensed retailers.',
  },
  {
    icon: Shield,
    title: 'Compliance & Logistics',
    description: 'Every shipment tracked and compliant with NYS OCM regulations. Manifests, chain of custody, and real-time tracking.',
  },
  {
    icon: Handshake,
    title: 'Brand Partnerships',
    description: 'We work with premium cannabis brands to bring the best products to New York dispensaries. Curated portfolio, competitive margins.',
  },
  {
    icon: HeadphonesIcon,
    title: 'Retailer Support',
    description: 'Dedicated account managers, marketing support, and inventory planning to help your dispensary thrive.',
  },
];

const TRUST_STATS = [
  { icon: MapPin, value: '62 Counties', label: 'Served' },
  { icon: BadgeCheck, value: '100%', label: 'OCM Compliant' },
  { icon: Building2, value: 'Licensed', label: 'Distributor' },
  { icon: LocateFixed, value: 'NY-Based', label: 'Operations' },
];

export default function HomePage() {
  return (
    <div style={{ paddingTop: 'var(--nav-height)', backgroundColor: '#0F0520' }}>

      {/* -- HERO -- */}
      <section
        style={{
          background: 'linear-gradient(168deg, #2D0A4E 0%, #4A0E78 35%, #2D0A4E 70%, #1A0633 100%)',
          padding: '96px 24px 112px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle gold accent glow */}
        <div
          style={{
            position: 'absolute',
            width: 700,
            height: 700,
            top: '-30%',
            right: '-10%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,162,60,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 500,
            height: 500,
            bottom: '-20%',
            left: '-5%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(107,47,160,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <span
            className="label-caps e8-fade-up"
            style={{
              color: '#C8A23C',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 28,
            }}
          >
            <span style={{ width: 28, height: 1.5, backgroundColor: '#C8A23C', display: 'inline-block', borderRadius: 99 }} />
            Licensed B2B Cannabis Distribution
            <span style={{ width: 28, height: 1.5, backgroundColor: '#C8A23C', display: 'inline-block', borderRadius: 99 }} />
          </span>

          <h1
            className="font-display e8-fade-up-1"
            style={{
              fontSize: 'clamp(2.25rem, 5.5vw, 4.25rem)',
              lineHeight: 1.05,
              marginBottom: 24,
              letterSpacing: '-0.01em',
              color: '#FFFFFF',
            }}
          >
            New York's Premier
            <br />
            Cannabis Distribution Partner
          </h1>

          <p
            className="e8-fade-up-2"
            style={{
              fontSize: '1.1rem',
              color: 'rgba(255,255,255,0.65)',
              maxWidth: 640,
              margin: '0 auto 44px',
              lineHeight: 1.8,
            }}
          >
            Licensed B2B distribution connecting top cannabis brands with
            New York's finest dispensaries. Reliable. Compliant. Statewide.
          </p>

          <div className="e8-fade-up-3" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/distribution"
              style={{
                backgroundColor: '#C8A23C',
                color: '#1A0633',
                padding: '15px 34px',
                borderRadius: 9999,
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 700,
                fontSize: '0.82rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 24px rgba(200,162,60,0.35)',
                transition: 'transform 150ms ease, box-shadow 150ms ease',
              }}
            >
              Become a Partner <ArrowRight size={14} />
            </Link>
            <Link
              href="/about"
              style={{
                backgroundColor: 'transparent',
                color: '#FFFFFF',
                padding: '15px 34px',
                borderRadius: 9999,
                border: '1.5px solid rgba(200,162,60,0.4)',
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 600,
                fontSize: '0.82rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'border-color 150ms ease, color 150ms ease',
              }}
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* -- TRUST STATS BAR -- */}
      <section
        style={{
          backgroundColor: '#1A0633',
          borderTop: '1px solid rgba(200,162,60,0.15)',
          borderBottom: '1px solid rgba(200,162,60,0.15)',
          padding: '40px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 24,
            textAlign: 'center',
          }}
          className="e8-stats-grid"
        >
          {TRUST_STATS.map(({ icon: Icon, value, label }, i) => (
            <AnimateIn key={label} delay={i * 90}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: 'rgba(200,162,60,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 4,
                  }}
                >
                  <Icon size={20} color="#C8A23C" />
                </div>
                <div
                  className="font-mono"
                  style={{ fontSize: '1.35rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}
                >
                  {value}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Barlow', Arial, sans-serif" }}>
                  {label}
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* -- SERVICES -- */}
      <section style={{ backgroundColor: '#0F0520', padding: '96px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 64 }}>
            <span className="label-caps" style={{ color: '#C8A23C' }}>
              What We Do
            </span>
            <h2
              className="font-display"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginTop: 12, color: '#FFFFFF' }}
            >
              Full-Service Cannabis Distribution
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 16, maxWidth: 560, margin: '16px auto 0', fontSize: '1rem', lineHeight: 1.7 }}>
              From warehouse to dispensary shelf, we handle every step of the supply chain with precision and full regulatory compliance.
            </p>
          </AnimateIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {SERVICE_CARDS.map(({ icon: Icon, title, description }, i) => (
              <AnimateIn key={title} delay={i * 110}>
                <div
                  className="tilt-card"
                  style={{
                    backgroundColor: 'rgba(74,14,120,0.15)',
                    border: '1px solid rgba(200,162,60,0.12)',
                    borderRadius: 20,
                    padding: '36px 28px 32px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    height: '100%',
                    transition: 'border-color 200ms ease, background-color 200ms ease',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      backgroundColor: 'rgba(200,162,60,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={22} color="#C8A23C" />
                  </div>
                  <h3
                    className="font-heading"
                    style={{ color: '#FFFFFF', fontSize: '1.15rem', lineHeight: 1.3 }}
                  >
                    {title}
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', lineHeight: 1.75, flex: 1, margin: 0 }}>
                    {description}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* -- WHY EMPIRE 8 -- */}
      <section
        style={{
          background: 'linear-gradient(180deg, #1A0633 0%, #2D0A4E 100%)',
          padding: '96px 24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative gold line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 120,
            height: 2,
            background: 'linear-gradient(90deg, transparent, #C8A23C, transparent)',
          }}
        />

        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <AnimateIn>
            <span className="label-caps" style={{ color: '#C8A23C', display: 'block', marginBottom: 12 }}>
              Why Empire 8
            </span>
            <h2
              className="font-display"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: '#FFFFFF', marginBottom: 24 }}
            >
              Built for the New York Market
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1.05rem', lineHeight: 1.8, maxWidth: 640, margin: '0 auto 48px' }}>
              Empire 8 Sales Direct was founded to solve distribution in New York's regulated cannabis market.
              We know the routes, the regulations, and the retailers. Our entire operation is built around
              getting compliant product from brands to shelves, fast.
            </p>
          </AnimateIn>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            {[
              { stat: 'Statewide', detail: 'coverage across all 62 NY counties' },
              { stat: 'OCM Compliant', detail: 'every shipment, every time' },
              { stat: 'Same-Week', detail: 'delivery to licensed retailers' },
              { stat: 'Dedicated', detail: 'account managers for every partner' },
            ].map((item, i) => (
              <AnimateIn key={item.stat} delay={i * 90}>
                <div
                  style={{
                    backgroundColor: 'rgba(200,162,60,0.06)',
                    border: '1px solid rgba(200,162,60,0.12)',
                    borderRadius: 16,
                    padding: '28px 20px',
                  }}
                >
                  <div className="font-heading" style={{ color: '#C8A23C', fontSize: '1.1rem', fontWeight: 700, marginBottom: 6 }}>
                    {item.stat}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                    {item.detail}
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      <FAQSection />
      <CTASection />

      {/* -- COMPLIANCE FOOTER -- */}
      <div
        style={{
          backgroundColor: '#0A0318',
          borderTop: '1px solid rgba(200,162,60,0.1)',
          padding: '24px 24px',
          textAlign: 'center',
        }}
      >
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', lineHeight: 1.8, maxWidth: 600, margin: '0 auto' }}>
          For use only by adults 21 years of age and older. Empire 8 Sales Direct does not make health or medical claims about cannabis products.
        </p>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .e8-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 32px !important;
          }
        }
        @media (max-width: 480px) {
          .e8-stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
