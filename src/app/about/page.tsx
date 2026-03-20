import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Truck, Shield, Handshake, Users, MapPin, BadgeCheck, Clock, Building2 } from 'lucide-react';
import AnimateIn from '@/components/AnimateIn';

export const metadata: Metadata = {
  title: 'About Empire 8 Sales Direct — Licensed Cannabis Wholesale in NY',
  description:
    'Empire 8 Sales Direct is a NYS OCM licensed cannabis wholesale supplier serving dispensaries across all 62 New York counties. Learn about our mission, team, and commitment to compliance.',
  openGraph: {
    title: 'About Empire 8 Sales Direct',
    description: 'Licensed cannabis wholesale supplier serving dispensaries across New York State.',
    url: 'https://empire8salesdirect.com/about',
  },
  alternates: { canonical: 'https://empire8salesdirect.com/about' },
};

const VALUES = [
  {
    icon: Shield,
    title: 'Compliance First',
    desc: 'Every product we move is fully tracked, manifested, and compliant with NYS OCM regulations. We handle the paperwork so you can focus on your customers.',
  },
  {
    icon: Handshake,
    title: 'Dispensary-Focused',
    desc: 'We exist to serve dispensaries. Our entire operation is built around making it easy for licensed retailers to access premium cannabis products at competitive margins.',
  },
  {
    icon: Truck,
    title: 'Reliable Delivery',
    desc: 'Temperature-controlled fleet with same-week delivery across New York State. Your shelves stay stocked, your customers stay happy.',
  },
  {
    icon: Users,
    title: 'Dedicated Support',
    desc: 'Every dispensary partner gets a dedicated account manager. From inventory planning to marketing support, we help your business grow.',
  },
];

const STATS = [
  { stat: '62', label: 'Counties Served' },
  { stat: '100%', label: 'OCM Compliant' },
  { stat: 'Same Week', label: 'Delivery' },
  { stat: 'NET 30', label: 'Terms Available' },
];

export default function AboutPage() {
  return (
    <div style={{ paddingTop: 'var(--nav-height)', backgroundColor: '#0F0520' }}>

      {/* Hero */}
      <section style={{ backgroundColor: '#0F0520', padding: '72px 24px 80px', position: 'relative', overflow: 'hidden', borderBottom: '1px solid rgba(200,162,60,0.12)' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '5%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(200,162,60,0.07)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '3%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(74,14,120,0.05)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <span className="label-caps" style={{ color: 'var(--color-gold)', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ width: 24, height: 1.5, backgroundColor: 'var(--color-gold)', display: 'inline-block', borderRadius: 99 }} />
            About Empire 8
            <span style={{ width: 24, height: 1.5, backgroundColor: 'var(--color-gold)', display: 'inline-block', borderRadius: 99 }} />
          </span>
          <h1 className="font-display" style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', lineHeight: 1.0, color: '#fff', marginBottom: 24 }}>
            Powering New York&apos;s Cannabis Retail.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', maxWidth: 560, margin: '0 auto', lineHeight: 1.8 }}>
            Empire 8 Sales Direct is a licensed cannabis wholesale supplier based in New York.
            We connect premium cannabis brands with dispensaries across all 62 counties &mdash;
            delivering quality products, full compliance, and reliable service.
          </p>
        </div>
      </section>

      {/* Mission block */}
      <section style={{ backgroundColor: '#150A28', padding: '80px 24px', borderBottom: '1px solid rgba(200,162,60,0.12)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 64, alignItems: 'center' }}>
          <AnimateIn>
            <span className="label-caps" style={{ color: 'var(--color-gold)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 24, height: 1.5, backgroundColor: 'var(--color-gold)', display: 'inline-block', borderRadius: 99 }} />
              Our Mission
            </span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginTop: 14, marginBottom: 20, color: '#fff', lineHeight: 1.05 }}>
              Built for Dispensaries.<br />Backed by Compliance.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.85, marginBottom: 16, fontSize: '0.95rem' }}>
              New York&apos;s cannabis market is growing fast &mdash; and dispensaries need a wholesale partner they can trust.
              Empire 8 was founded to fill that gap: a fully licensed, OCM-compliant supplier with statewide reach
              and a curated portfolio of premium brands.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.85, marginBottom: 36, fontSize: '0.95rem' }}>
              We handle the logistics, compliance, and brand relationships so dispensaries can focus on what matters
              most &mdash; serving their communities and growing their business.
            </p>
            <Link
              href="/dispensary-signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'var(--color-gold)',
                color: '#fff',
                padding: '13px 28px',
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

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {STATS.map(({ stat, label }, i) => (
              <AnimateIn key={label} delay={i * 80}>
                <div
                  className="tilt-card"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderRadius: 20,
                    padding: '32px 24px',
                    textAlign: 'center',
                    border: '1px solid rgba(200,162,60,0.12)',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <div className="font-display" style={{ fontSize: '2.25rem', color: 'var(--color-royal)', lineHeight: 1 }}>{stat}</div>
                  <div className="label-caps" style={{ color: 'rgba(255,255,255,0.6)', marginTop: 8, fontSize: '0.68rem' }}>{label}</div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ backgroundColor: '#0F0520', padding: '80px 24px', borderBottom: '1px solid rgba(200,162,60,0.12)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 52 }}>
            <span className="label-caps" style={{ color: 'var(--color-gold)' }}>How We Operate</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginTop: 10, color: '#fff' }}>
              What Sets Empire 8 Apart
            </h2>
          </AnimateIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {VALUES.map(({ icon: Icon, title, desc }, i) => (
              <AnimateIn key={title} delay={i * 90}>
                <div
                  className="tilt-card"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderRadius: 20,
                    padding: '32px 28px',
                    border: '1px solid rgba(200,162,60,0.12)',
                    height: '100%',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <div style={{ width: 48, height: 48, backgroundColor: 'var(--color-purple-light)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <Icon size={24} color="var(--color-royal)" />
                  </div>
                  <h3 className="font-heading" style={{ fontSize: '1.05rem', marginBottom: 12, color: '#fff' }}>{title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.7 }}>{desc}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage Map Section */}
      <section style={{ backgroundColor: '#150A28', padding: '80px 24px', borderBottom: '1px solid rgba(200,162,60,0.12)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <AnimateIn>
            <span className="label-caps" style={{ color: 'var(--color-gold)' }}>Coverage Area</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginTop: 10, marginBottom: 20, color: '#fff' }}>
              All 62 New York Counties
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', lineHeight: 1.8, maxWidth: 600, margin: '0 auto 40px' }}>
              From Manhattan to Buffalo, Long Island to the Adirondacks &mdash;
              Empire 8 delivers to every licensed dispensary in New York State.
              Same-week delivery with temperature-controlled vehicles.
            </p>
          </AnimateIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { icon: MapPin, title: 'NYC Metro', desc: 'Manhattan, Brooklyn, Queens, Bronx, Staten Island' },
              { icon: Building2, title: 'Long Island', desc: 'Nassau and Suffolk counties' },
              { icon: MapPin, title: 'Hudson Valley', desc: 'Westchester, Rockland, Orange, Dutchess' },
              { icon: Clock, title: 'Upstate NY', desc: 'Albany, Syracuse, Rochester, Buffalo' },
              { icon: BadgeCheck, title: 'Capital Region', desc: 'Albany, Schenectady, Troy, Saratoga' },
              { icon: MapPin, title: 'Western NY', desc: 'Buffalo, Niagara Falls, Erie County' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <AnimateIn key={title} delay={i * 60}>
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: 16,
                  padding: '24px 20px',
                  border: '1px solid rgba(200,162,60,0.12)',
                  textAlign: 'left',
                }}>
                  <Icon size={20} color="var(--color-royal)" style={{ marginBottom: 12 }} />
                  <div className="font-heading" style={{ fontSize: '0.95rem', color: '#fff', marginBottom: 6 }}>{title}</div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', lineHeight: 1.6 }}>{desc}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="e8-dot-grid"
        style={{ backgroundColor: 'var(--color-royal)', padding: '96px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 300, borderRadius: '50%', background: 'rgba(200,162,60,0.09)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <AnimateIn style={{ maxWidth: 560, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h2 className="font-display" style={{ color: '#fff', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', marginBottom: 16 }}>
            Ready to Partner with Empire 8?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 40, fontSize: '1.05rem', lineHeight: 1.75 }}>
            Whether you&apos;re a licensed dispensary looking for reliable supply or a cannabis brand seeking
            statewide reach, we&apos;re ready to work with you.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
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
            <Link
              href="/contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'transparent',
                color: '#fff',
                padding: '14px 32px',
                borderRadius: 9999,
                border: '1.5px solid rgba(255,255,255,0.28)',
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 600,
                fontSize: '0.82rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              Contact Us
            </Link>
          </div>
        </AnimateIn>
      </section>

    </div>
  );
}
