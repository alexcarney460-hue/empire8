import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Package, Truck, BadgeCheck, Users } from 'lucide-react';
import AnimateIn from '@/components/AnimateIn';

export const metadata: Metadata = {
  title: 'About Empire 8 Sales Direct — Gloves & Cannabis Supplies',
  description:
    'Empire 8 Sales Direct supplies professional-grade disposable gloves and cannabis trimming equipment to operations across the United States. Learn about our commitment to quality, fast restock, and industry-grade products.',
  openGraph: {
    title: 'About Empire 8 Sales Direct',
    description: 'Professional-grade gloves and cannabis trimming supplies. Built for the operations that need reliability.',
    url: 'https://empire8salesdirect.com/about',
  },
  alternates: { canonical: 'https://empire8salesdirect.com/about' },
};

const VALUES = [
  {
    icon: Package,
    title: 'Professional Grade, Every Time',
    desc: "We source products built for commercial operations — not hobby kits. If it doesn't hold up under real workload conditions, it doesn't make our catalog.",
  },
  {
    icon: BadgeCheck,
    title: 'Value Without Compromise',
    desc: "Professional grade shouldn't mean unaffordable. We negotiate volume pricing so you don't have to — and pass those savings straight through.",
  },
  {
    icon: Truck,
    title: 'Reliable Restock',
    desc: 'Running out of gloves mid-harvest is not an option. We keep deep inventory and fulfill fast so your operation never stops for supplies.',
  },
  {
    icon: Users,
    title: 'Built for Every Scale',
    desc: "Whether you're a home grower ordering your first case or a licensed commercial operation running through 10,000 pairs a month — you get the same quality and service.",
  },
];

const STATS = [
  { stat: '3', label: 'Customer Tiers' },
  { stat: '100+', label: 'SKUs Available' },
  { stat: '48hr', label: 'Average Fulfillment' },
  { stat: 'NET 30', label: 'Terms Available' },
];

export default function AboutPage() {
  return (
    <div style={{ paddingTop: 'var(--nav-height)', backgroundColor: '#fff' }}>

      {/* Hero */}
      <section style={{ backgroundColor: '#fff', padding: '72px 24px 80px', position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '5%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(200,146,42,0.07)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '3%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(27,58,45,0.05)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <span className="label-caps" style={{ color: 'var(--color-gold)', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ width: 24, height: 1.5, backgroundColor: 'var(--color-gold)', display: 'inline-block', borderRadius: 99 }} />
            Our Story
            <span style={{ width: 24, height: 1.5, backgroundColor: 'var(--color-gold)', display: 'inline-block', borderRadius: 99 }} />
          </span>
          <h1 className="font-display" style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', lineHeight: 1.0, color: 'var(--color-charcoal)', marginBottom: 24 }}>
            The Supply Chain for Serious Growers.
          </h1>
          <p style={{ color: 'var(--color-warm-gray)', fontSize: '1.05rem', maxWidth: 560, margin: '0 auto', lineHeight: 1.8 }}>
            Empire 8 Sales Direct started with a simple observation: the grow industry was underserved on supplies.
            Quality gloves and trimming equipment existed — but not at prices that made sense for operations of every size.
          </p>
        </div>
      </section>

      {/* Mission block */}
      <section style={{ backgroundColor: '#FAFAFA', padding: '80px 24px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 64, alignItems: 'center' }}>
          <AnimateIn>
            <span className="label-caps" style={{ color: 'var(--color-gold)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 24, height: 1.5, backgroundColor: 'var(--color-gold)', display: 'inline-block', borderRadius: 99 }} />
              What We Do
            </span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginTop: 14, marginBottom: 20, color: 'var(--color-charcoal)', lineHeight: 1.05 }}>
              One Supplier.<br />Every Scale.
            </h2>
            <p style={{ color: 'var(--color-warm-gray)', lineHeight: 1.85, marginBottom: 16, fontSize: '0.95rem' }}>
              We supply disposable gloves and cannabis trimming equipment to retail customers, hydro stores, dispensaries, licensed grows, and commercial distributors across the country.
            </p>
            <p style={{ color: 'var(--color-warm-gray)', lineHeight: 1.85, marginBottom: 36, fontSize: '0.95rem' }}>
              Our pricing is tiered by volume — the more you buy, the better your rate. And we make it easy to move up tiers as your operation grows.
            </p>
            <Link
              href="/catalog"
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
              See All Products <ArrowRight size={14} />
            </Link>
          </AnimateIn>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {STATS.map(({ stat, label }, i) => (
              <AnimateIn key={label} delay={i * 80}>
                <div
                  className="tilt-card"
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 20,
                    padding: '32px 24px',
                    textAlign: 'center',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <div className="font-display" style={{ fontSize: '2.25rem', color: 'var(--color-royal)', lineHeight: 1 }}>{stat}</div>
                  <div className="label-caps" style={{ color: 'var(--color-warm-gray)', marginTop: 8, fontSize: '0.68rem' }}>{label}</div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ backgroundColor: '#fff', padding: '80px 24px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 52 }}>
            <span className="label-caps" style={{ color: 'var(--color-gold)' }}>What We Stand For</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginTop: 10, color: 'var(--color-charcoal)' }}>
              How We Operate
            </h2>
          </AnimateIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {VALUES.map(({ icon: Icon, title, desc }, i) => (
              <AnimateIn key={title} delay={i * 90}>
                <div
                  className="tilt-card"
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 20,
                    padding: '32px 28px',
                    border: '1px solid var(--color-border)',
                    height: '100%',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <div style={{ width: 48, height: 48, backgroundColor: 'var(--color-purple-light)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <Icon size={24} color="var(--color-royal)" />
                  </div>
                  <h3 className="font-heading" style={{ fontSize: '1.05rem', marginBottom: 12, color: 'var(--color-charcoal)' }}>{title}</h3>
                  <p style={{ color: 'var(--color-warm-gray)', fontSize: '0.9rem', lineHeight: 1.7 }}>{desc}</p>
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
        <div style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 300, borderRadius: '50%', background: 'rgba(200,146,42,0.09)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <AnimateIn style={{ maxWidth: 560, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h2 className="font-display" style={{ color: '#fff', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', marginBottom: 16 }}>
            Ready to Get Supplied?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 40, fontSize: '1.05rem', lineHeight: 1.75 }}>
            Browse the catalog or apply for wholesale and distribution pricing.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/catalog"
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
              Shop the Catalog <ArrowRight size={14} />
            </Link>
            <Link
              href="/wholesale"
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
              Wholesale Pricing
            </Link>
          </div>
        </AnimateIn>
      </section>

    </div>
  );
}
