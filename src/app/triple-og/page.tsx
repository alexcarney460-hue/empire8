import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Leaf, Shield, Zap, Package, BadgeCheck, Scissors } from 'lucide-react';
import AnimateIn from '@/components/AnimateIn';

export const metadata: Metadata = {
  title: 'Triple OG Gloves — Built for the Trim',
  description:
    'Triple OG Gloves: 5 mil nitrile trimming gloves built for speed, grip, and marathon trim sessions. No stick. No tear. No compromise. Case pricing from $60/case. By Empire 8 Sales Direct.',
  keywords: [
    'trimming gloves', 'cannabis trimming gloves', 'nitrile gloves for trimming',
    'trim gloves', 'harvest gloves', 'Triple OG Gloves', 'best gloves for trimming weed',
    'grow room gloves', '5 mil nitrile gloves',
  ],
  openGraph: {
    title: 'Triple OG Gloves — Built for the Trim',
    description: 'No stick. No tear. No compromise. 5 mil nitrile trimming gloves from $60/case at distribution pricing.',
    url: 'https://empire8salesdirect.com/triple-og',
  },
  alternates: { canonical: 'https://empire8salesdirect.com/triple-og' },
};

const SPECS = [
  { label: 'Material', value: '5 mil Nitrile' },
  { label: 'Sizes', value: 'S — XXL' },
  { label: 'Count', value: '100/box · 1,000/case' },
  { label: 'Powder', value: 'Powder-free' },
  { label: 'Texture', value: 'Micro-textured fingertips' },
  { label: 'Color', value: 'Black' },
];

const WHY_ITEMS = [
  {
    icon: Zap,
    title: 'Built for Speed',
    desc: 'Micro-textured fingertips for precision grip. Change gloves in seconds, not minutes. Designed for crews running 12-hour sessions.',
  },
  {
    icon: Shield,
    title: 'No Stick. No Tear.',
    desc: '5 mil nitrile resists resin buildup without sacrificing dexterity. Tough enough for stems, thin enough for sugar leaves.',
  },
  {
    icon: Scissors,
    title: 'Trim-Room Tested',
    desc: 'Developed with commercial trim crews who go through cases per week. This is the glove they asked for.',
  },
  {
    icon: Package,
    title: 'Case Pricing That Scales',
    desc: '$80/case retail. $70 wholesale (30+). $60 distribution (120+). The more you run, the less you spend.',
  },
];

const SOCIAL_PROOF = [
  { stat: '1M+', label: 'Gloves shipped' },
  { stat: '500+', label: 'Operations supplied' },
  { stat: '5 mil', label: 'Nitrile thickness' },
  { stat: '12hr', label: 'Session tested' },
];

const USE_CASES = [
  'Hand trimming',
  'Machine-assisted trim',
  'Wet trim & harvest',
  'Dry trim & bucking',
  'Processing & packaging',
  'Extraction prep',
];

const PRICING_TIERS = [
  { tier: 'Retail', price: '$80', unit: '/case', note: '1-29 cases · No application', color: 'var(--color-warm-gray)', href: '/catalog' },
  { tier: 'Wholesale', price: '$70', unit: '/case', note: '30+ cases · Save $10/case', color: 'var(--color-purple-muted)', href: '/wholesale' },
  { tier: 'Dispensary', price: '$60', unit: '/case', note: '120+ cases · NET 30 available', color: 'var(--color-gold)', href: '/dispensary-signup' },
];

export default function TripleOGPage() {
  return (
    <div style={{ paddingTop: 'var(--nav-height)', backgroundColor: '#0A0A0A' }}>

      {/* ── MARQUEE ── */}
      <div
        style={{ backgroundColor: 'var(--color-gold)', padding: '12px 0', overflow: 'hidden' }}
        className="e8-marquee"
      >
        <div className="e8-marquee__track">
          {Array(8).fill(null).map((_, i) => (
            <span
              key={i}
              className="label-caps"
              style={{
                color: '#0A0A0A',
                fontSize: '0.7rem',
                padding: '0 36px',
                display: 'inline-block',
                whiteSpace: 'nowrap',
                fontWeight: 800,
              }}
            >
              TRIPLE OG &nbsp;·&nbsp; BUILT FOR THE TRIM &nbsp;·&nbsp; 5 MIL NITRILE &nbsp;·&nbsp; NO STICK &nbsp;·&nbsp; NO TEAR &nbsp;·&nbsp; NO COMPROMISE
            </span>
          ))}
        </div>
      </div>

      {/* ── HERO ── */}
      <section
        style={{
          padding: '96px 24px 112px',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #0A0A0A 0%, #111 100%)',
        }}
      >
        {/* Amber glow */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 800,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(200,146,42,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 72,
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}
          className="e8-hero-grid"
        >
          <div>
            <span
              className="label-caps e8-fade-up"
              style={{
                color: 'var(--color-gold)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 28,
                fontSize: '0.72rem',
              }}
            >
              <Leaf size={14} />
              Triple OG Gloves
            </span>

            <h1
              className="font-display e8-fade-up-1"
              style={{
                fontSize: 'clamp(3rem, 6vw, 5.5rem)',
                lineHeight: 0.9,
                marginBottom: 28,
                letterSpacing: '-0.02em',
                color: '#fff',
              }}
            >
              Built for
              <br />
              the Trim.
            </h1>

            <p
              className="e8-fade-up-2"
              style={{
                fontSize: '1.15rem',
                color: 'rgba(255,255,255,0.5)',
                maxWidth: 440,
                lineHeight: 1.8,
                marginBottom: 20,
              }}
            >
              5 mil nitrile. Micro-textured grip. Zero stick.
              The glove your trim crew actually wants to wear for 12 hours straight.
            </p>

            <p
              className="e8-fade-up-2"
              style={{
                fontSize: '0.88rem',
                color: 'var(--color-gold)',
                fontWeight: 700,
                fontFamily: "'Barlow', Arial, sans-serif",
                marginBottom: 44,
              }}
            >
              From $60/case at distribution pricing.
            </p>

            <div className="e8-fade-up-3" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link
                href="/catalog"
                style={{
                  backgroundColor: 'var(--color-gold)',
                  color: '#0A0A0A',
                  padding: '15px 34px',
                  borderRadius: 9999,
                  fontFamily: "'Barlow', Arial, sans-serif",
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 24px rgba(200,146,42,0.35)',
                }}
              >
                Order Now <ArrowRight size={14} />
              </Link>
              <Link
                href="/wholesale"
                style={{
                  backgroundColor: 'transparent',
                  color: '#fff',
                  padding: '15px 34px',
                  borderRadius: 9999,
                  border: '1.5px solid rgba(255,255,255,0.2)',
                  fontFamily: "'Barlow', Arial, sans-serif",
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                Wholesale Pricing
              </Link>
            </div>
          </div>

          {/* Hero image */}
          <div style={{ position: 'relative' }} className="e8-hero-image-col">
            <div
              style={{
                position: 'absolute',
                inset: '-20%',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(200,146,42,0.15) 0%, transparent 70%)',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
            <div className="e8-float" style={{ position: 'relative', zIndex: 1 }}>
              <div
                className="tilt-card e8-img-shine"
                style={{
                  backgroundColor: '#1a1a1a',
                  borderRadius: 28,
                  overflow: 'hidden',
                  aspectRatio: '4/3',
                  position: 'relative',
                  boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
                  border: '1px solid rgba(200,146,42,0.15)',
                }}
              >
                <Image
                  src="/products/product-5.avif"
                  alt="Triple OG Gloves — 5 mil Nitrile Trimming Gloves"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>

              {/* Floating badge */}
              <div
                className="e8-fade-up-2"
                style={{
                  position: 'absolute',
                  bottom: 20,
                  left: -16,
                  zIndex: 2,
                  backgroundColor: '#1a1a1a',
                  border: '1px solid rgba(200,146,42,0.25)',
                  borderRadius: 16,
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: 'rgba(200,146,42,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <BadgeCheck size={18} color="var(--color-gold)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#fff' }}>Trim-Room Tested</div>
                  <div style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>By commercial crews</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div
          className="e8-fade-up-4"
          style={{
            maxWidth: 900,
            margin: '80px auto 0',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 0,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 40,
          }}
        >
          {SOCIAL_PROOF.map((item) => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <div
                className="font-mono"
                style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-gold)', lineHeight: 1 }}
              >
                {item.stat}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Barlow', Arial, sans-serif", fontWeight: 600 }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY TRIPLE OG ── */}
      <section style={{ backgroundColor: '#111', padding: '96px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 64 }}>
            <span className="label-caps" style={{ color: 'var(--color-gold)', fontSize: '0.72rem' }}>
              Why Triple OG
            </span>
            <h2
              className="font-display"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', marginTop: 14, color: '#fff' }}
            >
              Not Just a Glove. A Tool.
            </h2>
          </AnimateIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {WHY_ITEMS.map(({ icon: Icon, title, desc }, i) => (
              <AnimateIn key={title} delay={i * 90}>
                <div
                  className="tilt-card"
                  style={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 20,
                    padding: '32px 28px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      backgroundColor: 'rgba(200,146,42,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={22} color="var(--color-gold)" />
                  </div>
                  <h3 className="font-heading" style={{ fontSize: '1.1rem', color: '#fff' }}>
                    {title}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.75 }}>
                    {desc}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPECS ── */}
      <section style={{ backgroundColor: '#0A0A0A', padding: '96px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }} className="e8-hero-grid">
          <AnimateIn>
            <span className="label-caps" style={{ color: 'var(--color-gold)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 24, height: 1.5, backgroundColor: 'var(--color-gold)', display: 'inline-block', borderRadius: 99 }} />
              Product Specs
            </span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginTop: 14, marginBottom: 32, color: '#fff', lineHeight: 1.05 }}>
              What&apos;s in the Box.
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {SPECS.map(({ label, value }, i) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '14px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    ...(i === 0 ? { borderTop: '1px solid rgba(255,255,255,0.06)' } : {}),
                  }}
                >
                  <span style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          </AnimateIn>

          <AnimateIn delay={100}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  inset: '-15%',
                  borderRadius: '50%',
                  background: 'radial-gradient(ellipse, rgba(200,146,42,0.08) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  backgroundColor: '#1a1a1a',
                  borderRadius: 24,
                  overflow: 'hidden',
                  aspectRatio: '1',
                  position: 'relative',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
                }}
              >
                <Image
                  src="/products/product-3.avif"
                  alt="Triple OG Gloves — Case of 1,000"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, 40vw"
                />
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section style={{ backgroundColor: '#111', padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <AnimateIn>
            <span className="label-caps" style={{ color: 'var(--color-gold)', fontSize: '0.72rem' }}>
              Built For
            </span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginTop: 14, marginBottom: 40, color: '#fff' }}>
              Every Stage of the Harvest
            </h2>
          </AnimateIn>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {USE_CASES.map((uc, i) => (
              <AnimateIn key={uc} delay={i * 60}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '10px 22px',
                    borderRadius: 9999,
                    border: '1px solid rgba(200,146,42,0.25)',
                    backgroundColor: 'rgba(200,146,42,0.06)',
                    color: 'var(--color-gold)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    fontFamily: "'Barlow', Arial, sans-serif",
                  }}
                >
                  {uc}
                </span>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{ backgroundColor: '#0A0A0A', padding: '96px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="label-caps" style={{ color: 'var(--color-gold)', fontSize: '0.72rem' }}>
              Pricing
            </span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', marginTop: 14, color: '#fff' }}>
              The More You Run, the Less You Spend.
            </h2>
          </AnimateIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {PRICING_TIERS.map(({ tier, price, unit, note, color, href }, i) => (
              <AnimateIn key={tier} delay={i * 100}>
                <Link href={href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                  <div
                    className="tilt-card"
                    style={{
                      backgroundColor: '#1a1a1a',
                      border: tier === 'Distribution' ? '2px solid var(--color-gold)' : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 20,
                      padding: '36px 28px',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      boxShadow: tier === 'Distribution' ? '0 4px 32px rgba(200,146,42,0.15)' : 'none',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        backgroundColor: `${color}15`,
                        borderRadius: 9999,
                        padding: '4px 14px',
                        alignSelf: 'flex-start',
                      }}
                    >
                      <span className="label-caps" style={{ color, fontSize: '0.65rem' }}>{tier}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span className="font-display" style={{ fontSize: '2.75rem', color: '#fff', lineHeight: 1 }}>{price}</span>
                      <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{unit}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, flex: 1 }}>
                      {note}
                    </p>
                    <span
                      className="e8-card-arrow label-caps"
                      style={{
                        color: tier === 'Distribution' ? 'var(--color-gold)' : 'rgba(255,255,255,0.5)',
                        fontSize: '0.72rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {tier === 'Retail' ? 'Shop Now' : 'Apply'} <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        style={{
          padding: '112px 24px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #111 0%, #0A0A0A 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 700,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(200,146,42,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <AnimateIn style={{ maxWidth: 640, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <span className="label-caps" style={{ color: 'var(--color-gold)', display: 'block', marginBottom: 20, fontSize: '0.72rem' }}>
            Supplied by Empire 8 Sales Direct
          </span>
          <h2
            className="font-display"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: 20, lineHeight: 1.0, color: '#fff' }}
          >
            Your Crew Deserves Better Gloves.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 48, fontSize: '1.05rem', lineHeight: 1.75 }}>
            Stop burning through cheap gloves that rip after two branches.
            Triple OG was built for the work you actually do.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/catalog"
              style={{
                backgroundColor: 'var(--color-gold)',
                color: '#0A0A0A',
                padding: '16px 38px',
                borderRadius: 9999,
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 800,
                fontSize: '0.85rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 24px rgba(200,146,42,0.35)',
              }}
            >
              Order by the Case <ArrowRight size={14} />
            </Link>
            <Link
              href="/wholesale"
              style={{
                backgroundColor: 'transparent',
                color: '#fff',
                padding: '16px 38px',
                borderRadius: 9999,
                border: '1.5px solid rgba(255,255,255,0.2)',
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 600,
                fontSize: '0.85rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Get Wholesale Access
            </Link>
          </div>
        </AnimateIn>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .e8-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .e8-hero-image-col {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
