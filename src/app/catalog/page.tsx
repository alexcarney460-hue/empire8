import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PRODUCTS from '@/lib/products';
import { formatPrice } from '@/lib/pricing';

export const metadata: Metadata = {
  title: 'Cannabis Product Catalog — Empire 8 Sales Direct',
  description:
    'Browse our full cannabis product catalog. Premium flower, concentrates, edibles, pre-rolls, and dispensary supplies. Wholesale pricing for licensed NY dispensaries.',
  keywords: ['cannabis wholesale catalog', 'dispensary products', 'wholesale cannabis NY', 'cannabis flower wholesale', 'dispensary supply', 'cannabis distributor catalog'],
  openGraph: {
    title: 'Cannabis Product Catalog — Empire 8 Sales Direct',
    description: 'Full cannabis product catalog for licensed NY dispensaries. Wholesale pricing on flower, concentrates, edibles, and more.',
    url: 'https://empire8salesdirect.com/catalog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cannabis Product Catalog | Empire 8 Sales Direct',
    description: 'Cannabis wholesale catalog for NY dispensaries. Premium products at competitive wholesale pricing.',
  },
  alternates: { canonical: 'https://empire8salesdirect.com/catalog' },
};

const CATEGORIES = ['All', 'Gloves', 'Trimmers', 'Accessories'] as const;

export default function CatalogPage() {
  const grouped = {
    Gloves: PRODUCTS.filter((p) => p.category === 'Gloves'),
    Trimmers: PRODUCTS.filter((p) => p.category === 'Trimmers'),
    Accessories: PRODUCTS.filter((p) => p.category === 'Accessories'),
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Empire 8 Sales Direct Product Catalog',
    description: 'Licensed cannabis wholesale products for NY dispensaries.',
    url: 'https://empire8salesdirect.com/catalog',
    numberOfItems: PRODUCTS.length,
    itemListElement: PRODUCTS.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://empire8salesdirect.com/catalog/${p.slug}`,
      name: p.name,
      image: `https://empire8salesdirect.com${p.img}`,
    })),
  };

  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Product Catalog — Cannabis Wholesale',
    description:
      'Licensed cannabis wholesale products for NY dispensaries. Premium flower, concentrates, edibles, and accessories at wholesale pricing.',
    url: 'https://empire8salesdirect.com/catalog',
    isPartOf: { '@type': 'WebSite', name: 'Empire 8 Sales Direct', url: 'https://empire8salesdirect.com' },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: PRODUCTS.length,
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://empire8salesdirect.com' },
        { '@type': 'ListItem', position: 2, name: 'Catalog', item: 'https://empire8salesdirect.com/catalog' },
      ],
    },
  };

  return (
    <div style={{ paddingTop: 'var(--nav-height)', backgroundColor: '#fff', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([itemListSchema, collectionPageSchema]) }} />

      {/* Header */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid var(--color-border)', padding: '56px 24px 48px', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle amber glow */}
        <div style={{ position: 'absolute', top: '-40%', right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(200,146,42,0.07)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative' }}>
          <span className="label-caps" style={{ color: 'var(--color-gold)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 24, height: 1.5, backgroundColor: 'var(--color-gold)', display: 'inline-block' }} />
            Products
          </span>
          <h1
            className="font-display"
            style={{ color: 'var(--color-charcoal)', fontSize: 'clamp(2rem, 5vw, 3rem)', marginTop: 10 }}
          >
            Full Product Catalog
          </h1>
          <p style={{ color: 'var(--color-warm-gray)', marginTop: 14, maxWidth: 480, fontSize: '0.95rem', lineHeight: 1.75 }}>
            Stocked and ready to ship. All products available by the case at retail, wholesale, and distribution pricing.
          </p>
        </div>
      </div>

      {/* Category filter bar */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid var(--color-border)', padding: '16px 24px', position: 'sticky', top: 'var(--nav-height)', zIndex: 10 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => (
            <a
              key={cat}
              href={`#${cat.toLowerCase()}`}
              style={{
                padding: '8px 20px',
                borderRadius: 9999,
                border: '1px solid var(--color-border)',
                backgroundColor: 'transparent',
                color: 'var(--color-charcoal)',
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 600,
                fontSize: '0.8rem',
                letterSpacing: '0.06em',
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'background-color 150ms ease, color 150ms ease',
              }}
            >
              {cat}
            </a>
          ))}
          <div style={{ flex: 1 }} />
          <Link
            href="/wholesale"
            style={{
              padding: '8px 20px',
              borderRadius: 9999,
              backgroundColor: 'var(--color-purple-light)',
              color: 'var(--color-royal)',
              fontFamily: "'Barlow', Arial, sans-serif",
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '0.06em',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            Get Wholesale Pricing <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px' }}>

        {/* Gloves */}
        <section id="gloves" style={{ marginBottom: 64 }}>
          <div style={{ marginBottom: 28 }}>
            <span className="label-caps" style={{ color: 'var(--color-gold)', fontSize: '0.68rem' }}>Disposable Gloves</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginTop: 6, color: 'var(--color-charcoal)' }}>
              Gloves
            </h2>
          </div>
          <div className="e8-grid-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {grouped.Gloves.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>

        {/* Trimmers */}
        <section id="trimmers" style={{ marginBottom: 64 }}>
          <div style={{ marginBottom: 28 }}>
            <span className="label-caps" style={{ color: 'var(--color-gold)', fontSize: '0.68rem' }}>Trimming Tools</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginTop: 6, color: 'var(--color-charcoal)' }}>
              Trimmers & Scissors
            </h2>
          </div>
          <div className="e8-grid-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {grouped.Trimmers.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>

        {/* Accessories */}
        <section id="accessories" style={{ marginBottom: 48 }}>
          <div style={{ marginBottom: 28 }}>
            <span className="label-caps" style={{ color: 'var(--color-gold)', fontSize: '0.68rem' }}>Harvest Accessories</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginTop: 6, color: 'var(--color-charcoal)' }}>
              Accessories
            </h2>
          </div>
          <div className="e8-grid-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {grouped.Accessories.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>

        {/* Wholesale CTA */}
        <div
          className="e8-dot-grid"
          style={{
            backgroundColor: 'var(--color-royal)',
            borderRadius: 24,
            padding: '44px 40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 28,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div style={{ position: 'absolute', top: '-30%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(200,146,42,0.10)', filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div className="label-caps" style={{ color: 'rgba(200,146,42,0.85)', fontSize: '0.65rem', marginBottom: 10 }}>Volume Pricing</div>
            <h3 className="font-display" style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', color: '#fff', marginBottom: 8, lineHeight: 1.1 }}>
              Wholesale and distribution pricing available.
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Apply online — approval within 1 business day.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', position: 'relative' }}>
            <Link
              href="/wholesale"
              className="e8-btn-gold"
              style={{
                backgroundColor: 'var(--color-gold)',
                color: '#fff',
                padding: '13px 28px',
                borderRadius: 9999,
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 700,
                fontSize: '0.8rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                boxShadow: 'var(--shadow-gold)',
              }}
            >
              Apply for Wholesale
            </Link>
            <Link
              href="/dispensary-signup"
              className="e8-btn-ghost"
              style={{
                backgroundColor: 'transparent',
                color: '#fff',
                padding: '13px 28px',
                borderRadius: 9999,
                border: '1.5px solid rgba(255,255,255,0.28)',
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 600,
                fontSize: '0.8rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Dispensary Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: (typeof PRODUCTS)[number] }) {
  return (
    <Link href={`/catalog/${product.slug}`} style={{ textDecoration: 'none' }}>
      <div
        className="tilt-card"
        style={{
          backgroundColor: '#fff',
          border: '1px solid var(--color-border)',
          borderRadius: 16,
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="e8-img-shine" style={{ height: 180, position: 'relative', backgroundColor: 'var(--color-purple-light)', flexShrink: 0 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(200,146,42,0.09) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 1 }} />
          <Image
            src={product.img}
            alt={product.name}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 768px) 100vw, 25vw"
          />
          {product.badge && (
            <span
              className="label-caps e8-badge-pulse"
              style={{
                position: 'absolute', top: 10, right: 10,
                backgroundColor: 'var(--color-gold)', color: '#fff',
                padding: '4px 12px', borderRadius: 9999, fontSize: '0.62rem',
                zIndex: 2,
              }}
            >
              {product.badge}
            </span>
          )}
        </div>

        <div style={{ padding: '18px 18px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <span className="label-caps" style={{ color: 'var(--color-gold)', fontSize: '0.65rem' }}>
            {product.category}
          </span>
          <h3
            className="font-heading"
            style={{ fontSize: '0.95rem', marginTop: 6, marginBottom: 4, color: 'var(--color-charcoal)', lineHeight: 1.3 }}
          >
            {product.name}
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-warm-gray)', marginBottom: 16, flex: 1, lineHeight: 1.5 }}>
            {product.specs.find((s) => s.label === 'Count' || s.label === 'Size' || s.label === 'Sizes' || s.label === 'Dimensions')?.value ?? ''}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="font-mono" style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>
                {formatPrice(product.price)}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-warm-gray)', marginLeft: 4 }}>{product.unit}</span>
            </div>
            <span
              className="e8-card-arrow"
              style={{
                color: 'var(--color-royal)',
                fontSize: '0.72rem',
                fontWeight: 700,
                fontFamily: "'Barlow', Arial, sans-serif",
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              View <ArrowRight size={12} />
            </span>
          </div>
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-purple-muted)', fontWeight: 600 }}>
              Wholesale pricing available →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
