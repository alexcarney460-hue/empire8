import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Truck, BadgeCheck, ArrowRight, Package, ChevronRight, Shield, Building2, Utensils, Stethoscope, Wrench, Beaker } from 'lucide-react';
import AnimateIn from '@/components/AnimateIn';

export const metadata: Metadata = {
  title: 'Commercial Disposable Gloves — Bulk Industry Pricing',
  description:
    'Bulk disposable gloves for food service, medical, janitorial, automotive, and industrial use. Nitrile, latex, and vinyl. Case pricing with fast nationwide shipping.',
  keywords: ['commercial disposable gloves', 'bulk nitrile gloves', 'food service gloves', 'medical exam gloves', 'industrial gloves bulk', 'janitorial gloves case'],
  alternates: { canonical: 'https://empire8salesdirect.com/commercial' },
  openGraph: {
    title: 'Commercial Disposable Gloves — Bulk Industry Pricing',
    description: 'Nitrile, latex, and vinyl gloves for every industry. Retail $70/case, wholesale $60/case (30+), distribution $50/case (120+).',
    url: 'https://empire8salesdirect.com/commercial',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Commercial Disposable Gloves | Empire 8 Sales Direct',
    description: 'Bulk gloves for food service, medical, janitorial, and industrial operations. ASTM certified, fast shipping.',
  },
};

const INDUSTRIES = [
  { icon: Utensils, name: 'Food Service', desc: 'Restaurants, catering, delis, and food processing', color: '#E65100' },
  { icon: Stethoscope, name: 'Medical & Dental', desc: 'Clinics, offices, and exam-grade applications', color: '#1565C0' },
  { icon: Building2, name: 'Janitorial & Facilities', desc: 'Commercial cleaning, maintenance, and sanitation', color: '#2E7D32' },
  { icon: Wrench, name: 'Automotive & Trades', desc: 'Mechanics, body shops, painting, and detailing', color: '#37474F' },
  { icon: Beaker, name: 'Laboratory & Research', desc: 'Scientific, quality control, and testing environments', color: '#6A1B9A' },
  { icon: Shield, name: 'Safety & Compliance', desc: 'Hazmat handling, industrial safety, and PPE programs', color: '#C62828' },
];

const PRODUCT_TEASERS = [
  { slug: 'nitrile-5mil-box', category: 'Nitrile', name: '5 mil Nitrile Gloves — Box', detail: '5 mil · S–XXL · 100 gloves', price: '$7.00', badge: null, img: '/products/product-5.avif' },
  { slug: 'nitrile-5mil-case', category: 'Nitrile', name: '5 mil Nitrile Gloves — Case', detail: '10 boxes · 1,000 gloves', price: '$70.00', badge: 'Best Value', img: '/products/product-3.avif' },
];

const TIER_CARDS = [
  {
    tier: 'Retail',
    color: 'var(--color-warm-gray)',
    accentBg: '#F7F7F6',
    headline: 'Order What You Need',
    description: '$70/case ($7/box) for 1–29 cases. No application needed — perfect for small businesses and offices.',
    cta: 'Shop Now',
    href: '/catalog',
  },
  {
    tier: 'Wholesale',
    color: 'var(--color-purple-muted)',
    accentBg: '#EDF7F0',
    headline: 'Volume Discounts',
    description: '$60/case ($6/box) on 30+ case orders. Save $10/case with fast restock and priority fulfillment.',
    cta: 'Get Wholesale Pricing',
    href: '/wholesale',
  },
  {
    tier: 'Distribution',
    color: 'var(--color-gold)',
    accentBg: '#FDF6E8',
    headline: 'Enterprise Programs',
    description: '$50/case ($5/box) on 120+ case orders. Save $20/case with NET terms, dedicated rep, and bulk freight pricing.',
    cta: 'Apply for Distribution',
    href: '/distribution',
  },
];

const FAQ_ITEMS = [
  {
    q: 'What types of gloves do you carry?',
    a: 'We carry nitrile (blue and black), latex exam-grade, and vinyl disposable gloves — all 5 mil thickness. Every glove is powder-free and available in sizes XS through XXL, sold by the 100-count case.',
  },
  {
    q: 'What certifications do your gloves have?',
    a: 'Our nitrile and latex gloves are ASTM-certified for industrial and exam-grade use (ASTM D6319 and ASTM D3578). Vinyl gloves meet FDA food-contact requirements. All products carry an AQL rating of 1.5–2.5.',
  },
  {
    q: 'Is there a minimum order?',
    a: 'Retail customers can order 1–29 cases at $70/case ($7/box) with no application needed. Wholesale accounts ($60/case) require 30+ cases per order. Distribution accounts ($50/case) require 120+ cases per order and are designed for commercial operations and resellers.',
  },
  {
    q: 'What are your shipping rates?',
    a: 'Shipping is calculated by weight, starting at $7.99 for light packages. We automatically select the cheapest carrier rate for every order. We ship to all 48 contiguous states with 1–2 day processing.',
  },
  {
    q: 'Can I set up recurring orders?',
    a: 'Yes! Our Subscribe & Save program gives you 10% off every order with automatic monthly, biweekly, or quarterly delivery. Select "Subscribe & Save" when adding items to your cart. You can pause, change frequency, or cancel anytime from your account page.',
  },
  {
    q: 'Do you offer NET terms for businesses?',
    a: 'Distribution accounts have access to NET 30 terms with approved credit. Contact us at info@empire8salesdirect.com for custom payment arrangements on large or recurring orders.',
  },
];

const STATS = [
  { value: '500+', label: 'Businesses Served' },
  { value: '5 mil', label: 'Glove Thickness' },
  { value: '48',  label: 'States Shipped' },
  { value: '1-2d', label: 'Processing Time' },
];

const FEATURE_ITEMS = [
  { icon: Package, label: 'Bulk Case Pricing', sub: 'Volume discounts that scale with your business' },
  { icon: BadgeCheck, label: 'ASTM Certified', sub: 'Industrial and exam-grade certifications' },
  { icon: Truck, label: 'Fast Shipping', sub: 'Best-rate carriers to all 48 states' },
];

export default function CommercialPage() {
  return (
    <div style={{ paddingTop: 'var(--nav-height)', backgroundColor: '#fff' }}>

      {/* MARQUEE TRUST BAR */}
      <div
        style={{ backgroundColor: '#1C1C1C', padding: '14px 0', overflow: 'hidden' }}
        className="e8-marquee"
      >
        <div className="e8-marquee__track">
          {Array(6).fill(null).map((_, i) => (
            <span
              key={i}
              className="label-caps"
              style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.68rem',
                padding: '0 40px',
                display: 'inline-block',
                whiteSpace: 'nowrap',
              }}
            >
              ASTM Certified &nbsp;·&nbsp; Bulk Case Pricing &nbsp;·&nbsp; Fast Shipping &nbsp;·&nbsp; Retail $7/box &nbsp;·&nbsp; Wholesale $60/case &nbsp;·&nbsp; Distribution $50/case &nbsp;·&nbsp; All Industries Served
            </span>
          ))}
        </div>
      </div>

      {/* HERO */}
      <section
        style={{
          backgroundColor: '#fff',
          padding: '72px 24px 88px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: '4%',
            opacity: 0.03,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          <Image src="/logo.jpg" alt="" width={600} height={220} style={{ objectFit: 'contain', width: 'clamp(300px, 40vw, 580px)', height: 'auto' }} />
        </div>

        <div className="e8-glow-gold" style={{ width: 520, height: 520, top: '-20%', right: '6%', background: 'rgba(28,28,28,0.05)' }} />
        <div className="e8-glow-gold" style={{ width: 280, height: 280, bottom: '-5%', left: '4%', background: 'rgba(28,28,28,0.04)' }} />

        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 64,
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}
          className="e8-hero-grid"
        >
          <div>
            <span
              className="label-caps e8-fade-up"
              style={{ color: '#1565C0', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24 }}
            >
              <span style={{ width: 28, height: 1.5, backgroundColor: '#1565C0', display: 'inline-block', borderRadius: 99 }} />
              Commercial &amp; Industrial Supply
            </span>

            <h1
              className="font-display e8-fade-up-1"
              style={{ fontSize: 'clamp(2.75rem, 5.5vw, 4.75rem)', lineHeight: 0.93, marginBottom: 26, letterSpacing: '-0.01em', color: 'var(--color-charcoal)' }}
            >
              Professional Gloves
              <br />
              for Every
              <br />
              <span style={{ color: '#1565C0' }}>Industry.</span>
            </h1>

            <p
              className="e8-fade-up-2"
              style={{ fontSize: '1.05rem', color: 'var(--color-warm-gray)', maxWidth: 440, lineHeight: 1.8, marginBottom: 40 }}
            >
              ASTM-certified nitrile, latex, and vinyl disposable gloves.
              Bulk case pricing for food service, medical, janitorial,
              automotive, and industrial operations.
            </p>

            <div className="e8-fade-up-3" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link
                href="/catalog"
                className="e8-btn-gold"
                style={{
                  backgroundColor: '#1565C0',
                  color: '#fff',
                  padding: '14px 30px',
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
                  boxShadow: '0 4px 20px rgba(21,101,192,0.25)',
                }}
              >
                Shop Gloves <ArrowRight size={14} />
              </Link>
              <Link
                href="/wholesale"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--color-charcoal)',
                  padding: '14px 30px',
                  borderRadius: 9999,
                  border: '1.5px solid var(--color-border)',
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

            <div
              className="e8-fade-up-4"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, auto)',
                gap: '0 28px',
                marginTop: 48,
                paddingTop: 36,
                borderTop: '1px solid var(--color-border)',
                width: 'fit-content',
              }}
            >
              {STATS.map((stat, i) => (
                <div key={stat.label} className={`e8-stat e8-stat-${i + 1}`}>
                  <div
                    className="font-mono"
                    style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-charcoal)', lineHeight: 1 }}
                  >
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-warm-gray)', marginTop: 4, whiteSpace: 'nowrap' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative' }} className="e8-hero-image-col">
            <div
              style={{
                position: 'absolute',
                inset: '-18%',
                borderRadius: '50%',
                background: 'rgba(21,101,192,0.08)',
                filter: 'blur(72px)',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />

            <div className="e8-float" style={{ position: 'relative', zIndex: 1 }}>
              <div
                className="tilt-card e8-img-shine"
                style={{
                  backgroundColor: 'var(--color-purple-light)',
                  borderRadius: 28,
                  overflow: 'hidden',
                  aspectRatio: '4/3',
                  position: 'relative',
                  boxShadow: 'var(--shadow-xl)',
                }}
              >
                <Image
                  src="/products/product-1.avif"
                  alt="Professional Nitrile Gloves"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>

              <div
                className="e8-float-badge e8-fade-up-2"
                style={{
                  position: 'absolute',
                  bottom: 24,
                  left: -24,
                  zIndex: 2,
                  minWidth: 210,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: '#E3F2FD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Shield size={18} color="#1565C0" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--color-charcoal)' }}>ASTM Certified</div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--color-warm-gray)', marginTop: 1 }}>Industrial &amp; Exam Grade</div>
                </div>
              </div>

              <div
                className="e8-fade-up-1"
                style={{
                  position: 'absolute',
                  top: 20,
                  right: -16,
                  zIndex: 2,
                  backgroundColor: '#1565C0',
                  color: '#fff',
                  borderRadius: 9999,
                  padding: '7px 16px',
                  fontSize: '0.72rem',
                  fontFamily: "'Barlow', Arial, sans-serif",
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 16px rgba(21,101,192,0.3)',
                }}
              >
                100 ct / case
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE BAR */}
      <section style={{ backgroundColor: '#F8FAF8', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '32px 24px' }}>
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'center',
            gap: 56,
            flexWrap: 'wrap',
          }}
        >
          {FEATURE_ITEMS.map(({ icon: Icon, label, sub }, i) => (
            <AnimateIn key={label} delay={i * 90} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="e8-icon-circle">
                <Icon size={20} color="#1565C0" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-charcoal)' }}>{label}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-warm-gray)', marginTop: 2 }}>{sub}</div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* INDUSTRIES WE SERVE */}
      <section style={{ backgroundColor: '#fff', padding: '96px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="label-caps" style={{ color: '#1565C0' }}>
              Industries We Serve
            </span>
            <h2
              className="font-display"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginTop: 10, color: 'var(--color-charcoal)' }}
            >
              The Right Glove for Every Job
            </h2>
          </AnimateIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {INDUSTRIES.map((ind, i) => {
              const Icon = ind.icon;
              return (
                <AnimateIn key={ind.name} delay={i * 80}>
                  <div
                    style={{
                      backgroundColor: '#fff',
                      border: '1px solid var(--color-border)',
                      borderRadius: 20,
                      padding: '32px 28px',
                      boxShadow: 'var(--shadow-xs)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        backgroundColor: `${ind.color}10`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={22} color={ind.color} />
                    </div>
                    <h3 className="font-heading" style={{ fontSize: '1.1rem', color: 'var(--color-charcoal)' }}>
                      {ind.name}
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--color-warm-gray)', lineHeight: 1.65, margin: 0 }}>
                      {ind.desc}
                    </p>
                  </div>
                </AnimateIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section style={{ backgroundColor: '#FAFAFA', padding: '96px 24px', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <AnimateIn style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="label-caps" style={{ color: '#1565C0' }}>
                Our Products
              </span>
              <h2
                className="font-display"
                style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginTop: 10, color: 'var(--color-charcoal)' }}
              >
                Stocked and Ready to Ship
              </h2>
            </div>
            <Link
              href="/catalog"
              style={{
                color: '#1565C0',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 700,
                fontSize: '0.82rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: "'Barlow', Arial, sans-serif",
                padding: '8px 18px',
                borderRadius: 9999,
                border: '1.5px solid var(--color-border)',
              }}
            >
              View All Products <ArrowRight size={14} />
            </Link>
          </AnimateIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {PRODUCT_TEASERS.map((product, i) => (
              <AnimateIn key={product.slug} delay={i * 90}>
                <Link href={`/catalog/${product.slug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                  <div
                    className="tilt-card"
                    style={{
                      backgroundColor: '#fff',
                      border: '1px solid var(--color-border)',
                      borderRadius: 20,
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-xs)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div className="e8-img-shine" style={{ height: 214, position: 'relative', backgroundColor: 'var(--color-purple-light)', flexShrink: 0 }}>
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'radial-gradient(ellipse 70% 55% at 50% 100%, rgba(21,101,192,0.08) 0%, transparent 70%)',
                          pointerEvents: 'none',
                          zIndex: 1,
                        }}
                      />
                      <Image
                        src={product.img}
                        alt={product.name}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="(max-width: 768px) 100vw, 25vw"
                      />
                      {product.badge && (
                        <span
                          className="label-caps"
                          style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            backgroundColor: '#1565C0',
                            color: '#fff',
                            padding: '5px 12px',
                            borderRadius: 9999,
                            fontSize: '0.62rem',
                            zIndex: 2,
                          }}
                        >
                          {product.badge}
                        </span>
                      )}
                    </div>

                    <div style={{ padding: '20px 20px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span className="label-caps" style={{ color: '#1565C0', fontSize: '0.62rem' }}>
                        {product.category}
                      </span>
                      <h3 className="font-heading" style={{ fontSize: '1rem', marginTop: 6, marginBottom: 4, color: 'var(--color-charcoal)' }}>
                        {product.name}
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--color-warm-gray)', marginBottom: 'auto', paddingBottom: 18 }}>
                        {product.detail}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
                        <span className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>
                          {product.price}
                        </span>
                        <span className="e8-card-arrow label-caps" style={{ color: '#1565C0', fontSize: '0.68rem' }}>
                          View <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* TIER CARDS */}
      <section style={{ backgroundColor: '#fff', padding: '96px 24px', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="label-caps" style={{ color: '#1565C0' }}>
              Pricing Programs
            </span>
            <h2
              className="font-display"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginTop: 10, color: 'var(--color-charcoal)' }}
            >
              Pricing Built for Your Scale
            </h2>
          </AnimateIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {TIER_CARDS.map((card, i) => (
              <AnimateIn key={card.tier} delay={i * 110}>
                <div
                  className="tilt-card"
                  style={{
                    backgroundColor: '#fff',
                    border: '1px solid var(--color-border)',
                    borderRadius: 20,
                    padding: '36px 28px 32px',
                    borderTop: `4px solid ${card.color}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    height: '100%',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      backgroundColor: card.accentBg,
                      borderRadius: 9999,
                      padding: '4px 14px',
                      alignSelf: 'flex-start',
                    }}
                  >
                    <span className="label-caps" style={{ color: card.color, fontSize: '0.65rem' }}>
                      {card.tier}
                    </span>
                  </div>
                  <h3
                    className="font-heading"
                    style={{ color: 'var(--color-charcoal)', fontSize: '1.2rem', lineHeight: 1.3 }}
                  >
                    {card.headline}
                  </h3>
                  <p style={{ color: 'var(--color-warm-gray)', fontSize: '0.88rem', lineHeight: 1.75, flex: 1 }}>
                    {card.description}
                  </p>
                  <Link
                    href={card.href}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      backgroundColor: card.color === 'var(--color-gold)' ? 'var(--color-gold)' : 'transparent',
                      border: `1.5px solid ${card.color}`,
                      color: card.color === 'var(--color-gold)' ? '#fff' : card.color,
                      padding: '10px 22px',
                      borderRadius: 9999,
                      fontFamily: "'Barlow', Arial, sans-serif",
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                      alignSelf: 'flex-start',
                    }}
                    className="e8-card-arrow"
                  >
                    {card.cta} <ArrowRight size={13} />
                  </Link>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* WHY VALUE SUPPLIERS */}
      <section style={{ backgroundColor: '#FAFAFA', padding: '96px 24px', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 72, alignItems: 'center' }}>
          <AnimateIn>
            <span className="label-caps" style={{ color: '#1565C0', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 24, height: 1.5, backgroundColor: '#1565C0', display: 'inline-block', borderRadius: 99 }} />
              Why Empire 8 Sales Direct
            </span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginTop: 14, marginBottom: 20, color: 'var(--color-charcoal)', lineHeight: 1.05 }}>
              Built for Businesses That Go Through Gloves.
            </h2>
            <p style={{ color: 'var(--color-warm-gray)', lineHeight: 1.85, marginBottom: 12, fontSize: '0.95rem' }}>
              We supply the gloves your team burns through every week — at prices that make sense for operations buying by the case, not the box.
            </p>
            <p style={{ color: 'var(--color-warm-gray)', lineHeight: 1.85, marginBottom: 36, fontSize: '0.95rem' }}>
              Volume pricing that rewards bigger orders — the more cases you buy, the more you save per case.
            </p>
            <Link
              href="/catalog"
              className="e8-btn-royal"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#1565C0',
                color: '#fff',
                padding: '13px 28px',
                borderRadius: 9999,
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 700,
                fontSize: '0.8rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              Browse Catalog <ArrowRight size={14} />
            </Link>
          </AnimateIn>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { label: 'Retail from 1 Case', sub: 'No application needed for 1–29 cases' },
              { label: 'Fast Processing', sub: '1–2 business day turnaround on all orders' },
              { label: 'Volume Discounts', sub: 'Tiered pricing — bigger orders save more per case' },
              { label: 'Dedicated Support', sub: 'Real people, not chatbots, for account help' },
            ].map(({ label, sub }, i) => (
              <AnimateIn key={label} delay={i * 80}>
                <div
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    padding: '22px 20px',
                    border: '1px solid var(--color-border)',
                    height: '100%',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      backgroundColor: '#E3F2FD',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <BadgeCheck size={15} color="#1565C0" />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-charcoal)', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-warm-gray)', lineHeight: 1.5 }}>{sub}</div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ backgroundColor: '#fff', padding: '96px 24px', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="label-caps" style={{ color: '#1565C0' }}>Common Questions</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginTop: 10, color: 'var(--color-charcoal)' }}>
              Frequently Asked Questions
            </h2>
          </AnimateIn>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQ_ITEMS.map((item, i) => (
              <AnimateIn key={item.q} delay={i * 60}>
                <div
                  style={{
                    backgroundColor: '#FAFAFA',
                    border: '1px solid var(--color-border)',
                    borderRadius: 16,
                    padding: '24px 28px',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <ChevronRight size={16} color="#1565C0" style={{ marginTop: 3, flexShrink: 0 }} />
                    <div>
                      <h3 className="font-heading" style={{ fontSize: '1rem', color: 'var(--color-charcoal)', marginBottom: 8, lineHeight: 1.3 }}>
                        {item.q}
                      </h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--color-warm-gray)', lineHeight: 1.75, margin: 0 }}>
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>

          <AnimateIn style={{ textAlign: 'center', marginTop: 40 }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-warm-gray)' }}>
              Have a different question?{' '}
              <Link href="/contact" style={{ color: '#1565C0', fontWeight: 700, textDecoration: 'none' }}>
                Contact us →
              </Link>
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* FAQ JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ_ITEMS.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a },
            })),
          }),
        }}
      />

      {/* CTA BANNER */}
      <section
        className="e8-dot-grid"
        style={{
          backgroundColor: '#1C1C1C',
          padding: '100px 24px',
          textAlign: 'center',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          className="e8-glow-gold"
          style={{ width: 640, height: 400, top: '-30%', left: '50%', transform: 'translateX(-50%)', background: 'rgba(21,101,192,0.12)' }}
        />

        <AnimateIn style={{ maxWidth: 640, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <span className="label-caps" style={{ color: 'rgba(21,101,192,0.85)', display: 'block', marginBottom: 20 }}>
            Get Started Today
          </span>
          <h2
            className="font-display"
            style={{ fontSize: 'clamp(1.75rem, 5vw, 3.25rem)', marginBottom: 20, lineHeight: 1.0 }}
          >
            Ready to Stock Up?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 44, fontSize: '1.05rem', lineHeight: 1.75 }}>
            Order online today or apply for wholesale and distribution pricing.
            Bulk discounts, NET terms, and a dedicated rep for qualifying accounts.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/catalog"
              className="e8-btn-gold"
              style={{
                backgroundColor: '#1565C0',
                color: '#fff',
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
                boxShadow: '0 4px 20px rgba(21,101,192,0.3)',
              }}
            >
              Shop Now <ArrowRight size={14} />
            </Link>
            <Link
              href="/wholesale"
              className="e8-btn-ghost"
              style={{
                backgroundColor: 'transparent',
                color: '#fff',
                padding: '15px 34px',
                borderRadius: 9999,
                border: '1.5px solid rgba(255,255,255,0.28)',
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
              Apply for Wholesale
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
