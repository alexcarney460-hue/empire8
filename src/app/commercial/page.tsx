import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Truck, BadgeCheck, ArrowRight, Package, ChevronRight, Shield, Building2, Utensils, Stethoscope, Wrench, Beaker } from 'lucide-react';
import AnimateIn from '@/components/AnimateIn';

export const metadata: Metadata = {
  title: 'Cannabis Wholesale for Dispensaries — Empire 8 Sales Direct',
  description:
    'Empire 8 Sales Direct is a licensed cannabis wholesale supplier serving dispensaries across New York. Premium flower, edibles, concentrates, and accessories at competitive wholesale pricing.',
  keywords: ['cannabis wholesale', 'dispensary supplier', 'wholesale cannabis NY', 'cannabis distributor', 'dispensary wholesale', 'cannabis products wholesale'],
  alternates: { canonical: 'https://empire8ny.com/commercial' },
  openGraph: {
    title: 'Cannabis Wholesale for Dispensaries — Empire 8 Sales Direct',
    description: 'Licensed cannabis wholesale supplier for NY dispensaries. Premium products, competitive pricing, and reliable delivery across all 62 counties.',
    url: 'https://empire8ny.com/commercial',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cannabis Wholesale for Dispensaries | Empire 8 Sales Direct',
    description: 'Licensed cannabis wholesale serving NY dispensaries. Premium products, volume pricing, fast delivery.',
  },
};

const INDUSTRIES = [
  { icon: Building2, name: 'Dispensaries', desc: 'Licensed retail dispensaries across all 62 New York counties', color: '#2E7D32' },
  { icon: Beaker, name: 'Cultivators', desc: 'Indoor and outdoor cannabis cultivation operations', color: '#6A1B9A' },
  { icon: Wrench, name: 'Processors', desc: 'Cannabis extraction, manufacturing, and processing facilities', color: '#37474F' },
  { icon: Utensils, name: 'Edibles & Infusions', desc: 'Cannabis-infused food and beverage producers', color: '#E65100' },
  { icon: Stethoscope, name: 'Medical Cannabis', desc: 'Medical marijuana dispensaries and patient programs', color: '#4A0E78' },
  { icon: Shield, name: 'Compliance & Testing', desc: 'Licensed testing labs and compliance-focused operations', color: '#C62828' },
];

const PRODUCT_TEASERS = [
  { slug: 'flower-premium', category: 'Flower', name: 'Premium Indoor Flower', detail: 'Lab-tested, hand-trimmed, licensed NY product', price: 'Contact', badge: null, img: '/products/product-5.avif' },
  { slug: 'concentrate-live-resin', category: 'Concentrates', name: 'Live Resin Concentrates', detail: 'Full-spectrum extraction, wholesale units', price: 'Contact', badge: 'Popular', img: '/products/product-3.avif' },
];

const TIER_CARDS = [
  {
    tier: 'Starter',
    color: 'rgba(255,255,255,0.5)',
    accentBg: 'rgba(255,255,255,0.06)',
    headline: 'New Dispensary Accounts',
    description: 'Getting started with Empire 8. Competitive wholesale pricing with no long-term commitment required.',
    cta: 'Get Started',
    href: '/wholesale',
  },
  {
    tier: 'Wholesale',
    color: '#4A0E78',
    accentBg: 'rgba(74,14,120,0.15)',
    headline: 'Volume Wholesale',
    description: 'Deeper discounts for dispensaries with consistent order volume. Priority fulfillment and faster restocking.',
    cta: 'Get Wholesale Pricing',
    href: '/wholesale',
  },
  {
    tier: 'Distribution',
    color: 'var(--color-gold)',
    accentBg: 'rgba(200,162,60,0.12)',
    headline: 'Distribution Partners',
    description: 'Best pricing for high-volume dispensary partners. NET 30 terms, dedicated rep, and bulk delivery scheduling.',
    cta: 'Dispensary Sign Up',
    href: '/dispensary-signup',
  },
];

const FAQ_ITEMS = [
  {
    q: 'What cannabis products do you distribute?',
    a: 'We distribute a full range of licensed cannabis products including premium flower, concentrates, edibles, pre-rolls, vape cartridges, and accessories. All products are lab-tested and compliant with New York state regulations.',
  },
  {
    q: 'Do I need a license to order?',
    a: 'Yes. Empire 8 Sales Direct serves licensed dispensaries and cannabis retailers in New York. You must hold a valid NYS cannabis retail or dispensary license to open a wholesale account.',
  },
  {
    q: 'Which areas do you serve?',
    a: 'We serve licensed dispensaries across all 62 counties in New York state, from New York City to Buffalo and everywhere in between.',
  },
  {
    q: 'What are your delivery options?',
    a: 'We offer scheduled delivery across New York state with 1-2 business day processing. Delivery logistics are coordinated with your account rep to fit your restocking schedule.',
  },
  {
    q: 'Can I set up recurring orders?',
    a: 'Yes. We offer recurring order programs for dispensaries that want consistent restocking. Your account rep can set up weekly, biweekly, or monthly delivery schedules based on your volume.',
  },
  {
    q: 'Do you offer NET terms for dispensaries?',
    a: 'Qualified dispensary accounts have access to NET 30 terms with approved credit. Contact us at info@empire8ny.com for credit applications and custom payment arrangements.',
  },
];

const STATS = [
  { value: '62', label: 'NY Counties Served' },
  { value: '100+', label: 'Brand Partners' },
  { value: 'Licensed',  label: 'NY Cannabis Distributor' },
  { value: '1-2d', label: 'Processing Time' },
];

const FEATURE_ITEMS = [
  { icon: Package, label: 'Wholesale Pricing', sub: 'Volume discounts that scale with your dispensary' },
  { icon: BadgeCheck, label: 'Licensed Distributor', sub: 'Fully licensed NY cannabis wholesale operation' },
  { icon: Truck, label: 'Statewide Delivery', sub: 'Reliable delivery across all 62 NY counties' },
];

export default function CommercialPage() {
  return (
    <div style={{ paddingTop: 'var(--nav-height)', backgroundColor: '#0F0520' }}>

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
              Licensed NY Distributor &nbsp;&middot;&nbsp; Wholesale Cannabis &nbsp;&middot;&nbsp; Statewide Delivery &nbsp;&middot;&nbsp; 62 Counties &nbsp;&middot;&nbsp; Premium Flower &nbsp;&middot;&nbsp; Concentrates &nbsp;&middot;&nbsp; Dispensary Supply
            </span>
          ))}
        </div>
      </div>

      {/* HERO */}
      <section
        style={{
          backgroundColor: '#0F0520',
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

        <div className="e8-glow-gold" style={{ width: 520, height: 520, top: '-20%', right: '6%', background: 'rgba(74,14,120,0.12)' }} />
        <div className="e8-glow-gold" style={{ width: 280, height: 280, bottom: '-5%', left: '4%', background: 'rgba(200,162,60,0.06)' }} />

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
              style={{ color: '#C8A23C', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24 }}
            >
              <span style={{ width: 28, height: 1.5, backgroundColor: '#C8A23C', display: 'inline-block', borderRadius: 99 }} />
              Cannabis Wholesale Supply
            </span>

            <h1
              className="font-display e8-fade-up-1"
              style={{ fontSize: 'clamp(2.75rem, 5.5vw, 4.75rem)', lineHeight: 0.93, marginBottom: 26, letterSpacing: '-0.01em', color: '#fff' }}
            >
              Cannabis Wholesale
              <br />
              for Every
              <br />
              <span style={{ color: '#C8A23C' }}>Dispensary.</span>
            </h1>

            <p
              className="e8-fade-up-2"
              style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.6)', maxWidth: 440, lineHeight: 1.8, marginBottom: 40 }}
            >
              Licensed cannabis wholesale supplier serving dispensaries
              across all 62 New York counties. Premium flower, concentrates,
              edibles, and accessories at competitive wholesale pricing.
            </p>

            <div className="e8-fade-up-3" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link
                href="/catalog"
                className="e8-btn-gold"
                style={{
                  backgroundColor: '#4A0E78',
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
                  boxShadow: '0 4px 20px rgba(74,14,120,0.35)',
                }}
              >
                Browse Products <ArrowRight size={14} />
              </Link>
              <Link
                href="/dispensary-signup"
                style={{
                  backgroundColor: 'transparent',
                  color: '#fff',
                  padding: '14px 30px',
                  borderRadius: 9999,
                  border: '1.5px solid rgba(200,162,60,0.12)',
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
                borderTop: '1px solid rgba(200,162,60,0.12)',
                width: 'fit-content',
              }}
            >
              {STATS.map((stat, i) => (
                <div key={stat.label} className={`e8-stat e8-stat-${i + 1}`}>
                  <div
                    className="font-mono"
                    style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}
                  >
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', marginTop: 4, whiteSpace: 'nowrap' }}>
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
                background: 'rgba(74,14,120,0.15)',
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
                  alt="Cannabis Wholesale Products"
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
                    backgroundColor: 'rgba(74,14,120,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Shield size={18} color="#C8A23C" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#fff' }}>Licensed Distributor</div>
                  <div style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>NYS Cannabis Wholesale</div>
                </div>
              </div>

              <div
                className="e8-fade-up-1"
                style={{
                  position: 'absolute',
                  top: 20,
                  right: -16,
                  zIndex: 2,
                  backgroundColor: '#4A0E78',
                  color: '#fff',
                  borderRadius: 9999,
                  padding: '7px 16px',
                  fontSize: '0.72rem',
                  fontFamily: "'Barlow', Arial, sans-serif",
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 16px rgba(74,14,120,0.4)',
                }}
              >
                All 62 NY Counties
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE BAR */}
      <section style={{ backgroundColor: '#150A28', borderTop: '1px solid rgba(200,162,60,0.12)', borderBottom: '1px solid rgba(200,162,60,0.12)', padding: '32px 24px' }}>
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
                <Icon size={20} color="#C8A23C" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>{label}</div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{sub}</div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* INDUSTRIES WE SERVE */}
      <section style={{ backgroundColor: '#0F0520', padding: '96px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="label-caps" style={{ color: '#C8A23C' }}>
              Who We Serve
            </span>
            <h2
              className="font-display"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginTop: 10, color: '#fff' }}
            >
              Cannabis Wholesale for Every Operator
            </h2>
          </AnimateIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {INDUSTRIES.map((ind, i) => {
              const Icon = ind.icon;
              return (
                <AnimateIn key={ind.name} delay={i * 80}>
                  <div
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(200,162,60,0.12)',
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
                    <h3 className="font-heading" style={{ fontSize: '1.1rem', color: '#fff' }}>
                      {ind.name}
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, margin: 0 }}>
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
      <section style={{ backgroundColor: '#150A28', padding: '96px 24px', borderTop: '1px solid rgba(200,162,60,0.12)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <AnimateIn style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="label-caps" style={{ color: '#C8A23C' }}>
                Our Products
              </span>
              <h2
                className="font-display"
                style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginTop: 10, color: '#fff' }}
              >
                Stocked and Ready to Ship
              </h2>
            </div>
            <Link
              href="/catalog"
              style={{
                color: '#C8A23C',
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
                border: '1.5px solid rgba(200,162,60,0.12)',
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
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(200,162,60,0.12)',
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
                          background: 'radial-gradient(ellipse 70% 55% at 50% 100%, rgba(74,14,120,0.15) 0%, transparent 70%)',
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
                            backgroundColor: '#4A0E78',
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
                      <span className="label-caps" style={{ color: '#C8A23C', fontSize: '0.62rem' }}>
                        {product.category}
                      </span>
                      <h3 className="font-heading" style={{ fontSize: '1rem', marginTop: 6, marginBottom: 4, color: '#fff' }}>
                        {product.name}
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', marginBottom: 'auto', paddingBottom: 18 }}>
                        {product.detail}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(200,162,60,0.12)', paddingTop: 14 }}>
                        <span className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>
                          {product.price}
                        </span>
                        <span className="e8-card-arrow label-caps" style={{ color: '#C8A23C', fontSize: '0.68rem' }}>
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
      <section style={{ backgroundColor: '#0F0520', padding: '96px 24px', borderTop: '1px solid rgba(200,162,60,0.12)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="label-caps" style={{ color: '#C8A23C' }}>
              Pricing Programs
            </span>
            <h2
              className="font-display"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginTop: 10, color: '#fff' }}
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
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(200,162,60,0.12)',
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
                    style={{ color: '#fff', fontSize: '1.2rem', lineHeight: 1.3 }}
                  >
                    {card.headline}
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', lineHeight: 1.75, flex: 1 }}>
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

      {/* WHY EMPIRE 8 */}
      <section style={{ backgroundColor: '#150A28', padding: '96px 24px', borderTop: '1px solid rgba(200,162,60,0.12)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 72, alignItems: 'center' }}>
          <AnimateIn>
            <span className="label-caps" style={{ color: '#C8A23C', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 24, height: 1.5, backgroundColor: '#C8A23C', display: 'inline-block', borderRadius: 99 }} />
              Why Empire 8 Sales Direct
            </span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginTop: 14, marginBottom: 20, color: '#fff', lineHeight: 1.05 }}>
              Built for Dispensaries That Need Reliable Supply.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.85, marginBottom: 12, fontSize: '0.95rem' }}>
              We supply the cannabis products your dispensary needs to keep shelves stocked — at wholesale prices that protect your margins.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.85, marginBottom: 36, fontSize: '0.95rem' }}>
              Volume pricing that rewards consistent ordering. The more you order, the better your per-unit cost.
            </p>
            <Link
              href="/catalog"
              className="e8-btn-royal"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#4A0E78',
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
              { label: 'Licensed Distributor', sub: 'Fully licensed NY cannabis wholesale operation' },
              { label: 'Fast Processing', sub: '1-2 business day turnaround on all orders' },
              { label: 'Volume Pricing', sub: 'Tiered wholesale pricing that rewards bigger orders' },
              { label: 'Dedicated Support', sub: 'Real people, not chatbots, for account help' },
            ].map(({ label, sub }, i) => (
              <AnimateIn key={label} delay={i * 80}>
                <div
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderRadius: 16,
                    padding: '22px 20px',
                    border: '1px solid rgba(200,162,60,0.12)',
                    height: '100%',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      backgroundColor: 'rgba(74,14,120,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <BadgeCheck size={15} color="#C8A23C" />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{sub}</div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ backgroundColor: '#0F0520', padding: '96px 24px', borderTop: '1px solid rgba(200,162,60,0.12)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="label-caps" style={{ color: '#C8A23C' }}>Common Questions</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginTop: 10, color: '#fff' }}>
              Frequently Asked Questions
            </h2>
          </AnimateIn>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQ_ITEMS.map((item, i) => (
              <AnimateIn key={item.q} delay={i * 60}>
                <div
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(200,162,60,0.12)',
                    borderRadius: 16,
                    padding: '24px 28px',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <ChevronRight size={16} color="#C8A23C" style={{ marginTop: 3, flexShrink: 0 }} />
                    <div>
                      <h3 className="font-heading" style={{ fontSize: '1rem', color: '#fff', marginBottom: 8, lineHeight: 1.3 }}>
                        {item.q}
                      </h3>
                      <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, margin: 0 }}>
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>

          <AnimateIn style={{ textAlign: 'center', marginTop: 40 }}>
            <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)' }}>
              Have a different question?{' '}
              <Link href="/contact" style={{ color: '#C8A23C', fontWeight: 700, textDecoration: 'none' }}>
                Contact us &rarr;
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
          style={{ width: 640, height: 400, top: '-30%', left: '50%', transform: 'translateX(-50%)', background: 'rgba(74,14,120,0.18)' }}
        />

        <AnimateIn style={{ maxWidth: 640, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <span className="label-caps" style={{ color: 'rgba(200,162,60,0.85)', display: 'block', marginBottom: 20 }}>
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
                backgroundColor: '#4A0E78',
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
                boxShadow: '0 4px 20px rgba(74,14,120,0.4)',
              }}
            >
              Shop Now <ArrowRight size={14} />
            </Link>
            <Link
              href="/dispensary-signup"
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
