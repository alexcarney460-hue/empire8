import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ChevronRight, CheckCircle, Package, Truck, ShieldCheck, Tag } from 'lucide-react';
import PRODUCTS, { getProductBySlug, getRelatedProducts } from '@/lib/products';
import AddToCartPanel from '@/components/AddToCartPanel';
import InventoryBadge from '@/components/InventoryBadge';
import TrackViewItem from '@/components/TrackViewItem';
import { priceForAccount, formatPrice } from '@/lib/pricing';

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};

  const url = `https://empire8salesdirect.com/catalog/${product.slug}`;
  const imgUrl = `https://empire8salesdirect.com${product.img}`;
  const wholesalePrice = (product.price * 0.875).toFixed(2);

  return {
    title: `Buy ${product.shortName} Bulk — Wholesale from $${wholesalePrice}`,
    description: `${product.tagline} Retail $${product.price}${product.unit}, wholesale from $${wholesalePrice}. ${product.description.slice(0, 90)}. In stock, ships fast.`,
    keywords: [
      `buy ${product.shortName} bulk`,
      `${product.shortName} wholesale`,
      ...product.useCases,
      product.category.toLowerCase(),
      'disposable gloves case',
      'Empire 8',
    ],
    openGraph: {
      title: `Buy ${product.shortName} — Wholesale & Bulk Pricing`,
      description: `${product.tagline} Available by the case with wholesale and distribution pricing.`,
      url,
      type: 'website',
      images: [{ url: imgUrl, width: 800, height: 800, alt: product.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.shortName} — Bulk & Wholesale`,
      description: product.tagline,
      images: [imgUrl],
    },
    alternates: { canonical: url },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const related = getRelatedProducts(product.relatedSlugs);

  const wholesalePrice = priceForAccount(product.price, 'wholesale');
  const distroPrice = priceForAccount(product.price, 'distribution');

  const productUrl = `https://empire8salesdirect.com/catalog/${product.slug}`;

  const availabilityUrl = product.inStock
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';

  const seller = { '@type': 'Organization', name: 'Empire 8 Sales Direct', url: 'https://empire8salesdirect.com' };

  // Extract material and weight from specs when available
  const materialSpec = product.specs.find((s) => s.label === 'Material');
  const dimensionsSpec = product.specs.find((s) => s.label === 'Dimensions');

  // Build pricing tier offers — use actual product tier prices when available,
  // otherwise fall back to the generic discount calculation
  const retailPrice = product.casePrice ?? product.price;
  const wholesaleTierPrice = product.wholesalePrice ?? wholesalePrice;
  const distroTierPrice = product.distributorPrice ?? distroPrice;

  const offers: Record<string, unknown>[] = [
    {
      '@type': 'Offer',
      name: 'Retail',
      price: retailPrice.toFixed(2),
      priceCurrency: 'USD',
      availability: availabilityUrl,
      url: productUrl,
      priceValidUntil: '2026-12-31',
      seller,
      eligibleQuantity: {
        '@type': 'QuantitativeValue',
        minValue: 1,
        ...(product.casePrice != null ? { maxValue: 29, unitText: 'cases' } : {}),
      },
    },
  ];

  // Only add wholesale/distribution tiers for products that have tiered pricing
  if (product.wholesalePrice != null || product.casePrice != null) {
    offers.push(
      {
        '@type': 'Offer',
        name: `Wholesale — $${wholesaleTierPrice.toFixed(2)}${product.unit} (save $${(retailPrice - wholesaleTierPrice).toFixed(0)}${product.unit})`,
        price: wholesaleTierPrice.toFixed(2),
        priceCurrency: 'USD',
        availability: availabilityUrl,
        url: 'https://empire8salesdirect.com/wholesale',
        priceValidUntil: '2026-12-31',
        seller,
        eligibleCustomerType: 'https://schema.org/Business',
        eligibleQuantity: {
          '@type': 'QuantitativeValue',
          minValue: 30,
          maxValue: 119,
          unitText: 'cases',
        },
      },
      {
        '@type': 'Offer',
        name: `Distribution — $${distroTierPrice.toFixed(2)}${product.unit} (save $${(retailPrice - distroTierPrice).toFixed(0)}${product.unit})`,
        price: distroTierPrice.toFixed(2),
        priceCurrency: 'USD',
        availability: availabilityUrl,
        url: 'https://empire8salesdirect.com/dispensary-signup',
        priceValidUntil: '2026-12-31',
        seller,
        eligibleCustomerType: 'https://schema.org/Business',
        eligibleQuantity: {
          '@type': 'QuantitativeValue',
          minValue: 120,
          unitText: 'cases',
        },
      },
    );
  }

  const productSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map((img) => `https://empire8salesdirect.com${img}`),
    sku: product.slug,
    brand: { '@type': 'Brand', name: 'Empire 8 Sales Direct' },
    category: product.category,
    url: productUrl,
    ...(materialSpec ? { material: materialSpec.value } : {}),
    ...(dimensionsSpec ? { size: dimensionsSpec.value } : {}),
    offers:
      offers.length > 1
        ? {
            '@type': 'AggregateOffer',
            priceCurrency: 'USD',
            lowPrice: distroTierPrice.toFixed(2),
            highPrice: retailPrice.toFixed(2),
            offerCount: offers.length,
            offers,
          }
        : {
            ...offers[0],
          },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',    item: 'https://empire8salesdirect.com' },
      { '@type': 'ListItem', position: 2, name: 'Catalog', item: 'https://empire8salesdirect.com/catalog' },
      { '@type': 'ListItem', position: 3, name: product.category, item: `https://empire8salesdirect.com/catalog#${product.category.toLowerCase()}` },
      { '@type': 'ListItem', position: 4, name: product.shortName, item: productUrl },
    ],
  };

  return (
    <div style={{ paddingTop: 'var(--nav-height)', backgroundColor: '#0F0520', minHeight: '100vh' }}>
      <TrackViewItem id={product.slug} name={product.name} price={product.price} category={product.category} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([productSchema, breadcrumbSchema]) }} />

      {/* Breadcrumb */}
      <div style={{ backgroundColor: '#0F0520', borderBottom: '1px solid rgba(200,162,60,0.12)', padding: '12px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', textDecoration: 'none' }}>Home</Link>
          <ChevronRight size={12} color="rgba(255,255,255,0.6)" />
          <Link href="/catalog" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', textDecoration: 'none' }}>Catalog</Link>
          <ChevronRight size={12} color="rgba(255,255,255,0.6)" />
          <Link href={`/catalog?category=${product.category}`} style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', textDecoration: 'none' }}>{product.category}</Link>
          <ChevronRight size={12} color="rgba(255,255,255,0.6)" />
          <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>{product.shortName}</span>
        </div>
      </div>

      {/* Main product section */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }} className="e8-product-grid">

          {/* Left — Image */}
          <div style={{ position: 'sticky', top: 'calc(var(--nav-height) + 24px)' }} className="e8-product-image-col">
            {/* Amber glow behind image */}
            <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '-10%', borderRadius: '50%', background: 'rgba(200,146,42,0.10)', filter: 'blur(70px)', pointerEvents: 'none', zIndex: 0 }} />
            <div
              style={{
                backgroundColor: 'var(--color-purple-light)',
                borderRadius: 24,
                overflow: 'hidden',
                aspectRatio: '1 / 1',
                position: 'relative',
                boxShadow: 'var(--shadow-xl)',
                zIndex: 1,
              }}
            >
              <Image
                src={product.img}
                alt={product.name}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              {product.badge && (
                <span
                  className="label-caps"
                  style={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    backgroundColor: 'var(--color-gold)',
                    color: '#fff',
                    padding: '6px 14px',
                    borderRadius: 9999,
                    fontSize: '0.7rem',
                    boxShadow: 'var(--shadow-gold)',
                  }}
                >
                  {product.badge}
                </span>
              )}
            </div>

            {/* Trust badges under image */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
              {[
                { icon: Package, label: 'Case Pricing', sub: 'Buy by the case' },
                { icon: Truck, label: 'Fast Restock', sub: 'Reliable fulfillment' },
                { icon: ShieldCheck, label: 'Pro Grade', sub: 'Industrial specs' },
                { icon: Tag, label: 'Wholesale Avail.', sub: 'Save $10–$20/case' },
              ].map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(200,162,60,0.12)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Icon size={16} color="var(--color-royal)" />
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>{label}</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
            </div>{/* /position:relative wrapper */}
          </div>

          {/* Right — Buy panel */}
          <div>
            <span className="label-caps" style={{ color: 'var(--color-gold)', fontSize: '0.68rem' }}>
              {product.category}
            </span>

            <h1
              className="font-display"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: '#fff', marginTop: 8, lineHeight: 1.1, marginBottom: 12 }}
            >
              {product.name}
            </h1>

            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', lineHeight: 1.7, marginBottom: 28 }}>
              {product.tagline}
            </p>

            {/* Pricing tiers */}
            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(200,162,60,0.12)',
                borderRadius: 16,
                overflow: 'hidden',
                marginBottom: 28,
              }}
            >
              {/* Retail */}
              <div
                style={{
                  padding: '18px 20px',
                  borderBottom: '1px solid rgba(200,162,60,0.12)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                }}
              >
                <div>
                  <div className="label-caps" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.65rem', marginBottom: 2 }}>Retail Price</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem' }}>No minimum — order any quantity</div>
                </div>
                <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 600, color: '#fff' }}>
                  {formatPrice(product.price)}
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 400, fontFamily: 'inherit' }}>
                    {' '}{product.unit}
                  </span>
                </div>
              </div>

              {/* Wholesale */}
              <div
                style={{
                  padding: '18px 20px',
                  borderBottom: '1px solid rgba(200,162,60,0.12)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <div className="label-caps" style={{ color: 'var(--color-purple-muted)', fontSize: '0.65rem' }}>Wholesale</div>
                    <span style={{ backgroundColor: 'var(--color-purple-light)', color: 'var(--color-royal)', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>SAVE $10/CASE</span>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem' }}>30+ cases · Approved accounts only</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--color-royal)' }}>
                    {formatPrice(wholesalePrice)}
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 400, fontFamily: 'inherit' }}>
                      {' '}{product.unit}
                    </span>
                  </div>
                  <Link href="/dispensary-signup" style={{ fontSize: '0.72rem', color: 'var(--color-purple-muted)', textDecoration: 'none', fontWeight: 600 }}>
                    Apply →
                  </Link>
                </div>
              </div>

              {/* Distribution */}
              <div
                style={{
                  padding: '18px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <div className="label-caps" style={{ color: 'var(--color-gold)', fontSize: '0.65rem' }}>Distribution</div>
                    <span style={{ backgroundColor: '#FEF3DC', color: 'var(--color-gold)', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>SAVE $20/CASE</span>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem' }}>120+ cases · NET 30 terms available</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--color-gold)' }}>
                    {formatPrice(distroPrice)}
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 400, fontFamily: 'inherit' }}>
                      {' '}{product.unit}
                    </span>
                  </div>
                  <Link href="/dispensary-signup" style={{ fontSize: '0.72rem', color: 'var(--color-gold)', textDecoration: 'none', fontWeight: 600 }}>
                    Apply →
                  </Link>
                </div>
              </div>
            </div>

            {/* Subscribe & Save + Add to Cart */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <InventoryBadge slug={product.slug} />
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>Ships within 1-2 business days</span>
              </div>
              <AddToCartPanel
                id={product.slug}
                name={product.name}
                price={product.price}
                img={product.img}
                unit={product.unit}
                product={product}
              />
            </div>

            {/* Specs */}
            <h2 className="font-heading" style={{ fontSize: '1rem', color: '#fff', marginBottom: 16 }}>
              Specifications
            </h2>
            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(200,162,60,0.12)',
                borderRadius: 12,
                overflow: 'hidden',
                marginBottom: 36,
              }}
            >
              {product.specs.map((spec, i) => (
                <div
                  key={spec.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: i < product.specs.length - 1 ? '1px solid rgba(200,162,60,0.12)' : 'none',
                    backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{spec.label}</span>
                  <span style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 500 }}>{spec.value}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            <h2 className="font-heading" style={{ fontSize: '1rem', color: '#fff', marginBottom: 12 }}>
              About This Product
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.8, marginBottom: 28 }}>
              {product.description}
            </p>

            {/* Features */}
            <h2 className="font-heading" style={{ fontSize: '1rem', color: '#fff', marginBottom: 14 }}>
              Key Features
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {product.features.map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <CheckCircle size={16} color="var(--color-purple-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', color: '#fff', lineHeight: 1.5 }}>{f}</span>
                </li>
              ))}
            </ul>

            {/* Use cases */}
            <h2 className="font-heading" style={{ fontSize: '1rem', color: '#fff', marginBottom: 14 }}>
              Common Applications
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {product.useCases.map((u) => (
                <span
                  key={u}
                  style={{
                    backgroundColor: 'var(--color-purple-light)',
                    color: 'var(--color-royal)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    padding: '6px 14px',
                    borderRadius: 9999,
                    border: '1px solid rgba(27,58,45,0.12)',
                  }}
                >
                  {u}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section style={{ backgroundColor: '#0F0520', padding: '64px 24px', borderTop: '1px solid rgba(200,162,60,0.12)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span className="label-caps" style={{ color: 'var(--color-gold)', fontSize: '0.68rem' }}>You Might Also Need</span>
                <h2 className="font-display" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginTop: 6, color: '#fff' }}>
                  Related Products
                </h2>
              </div>
              <Link
                href="/catalog"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--color-royal)',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                View All <ArrowRight size={14} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
              {related.map((rp) => (
                <Link
                  key={rp.slug}
                  href={`/catalog/${rp.slug}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    className="tilt-card"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(200,162,60,0.12)',
                      borderRadius: 16,
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ height: 180, position: 'relative', backgroundColor: 'var(--color-purple-light)' }}>
                      <Image
                        src={rp.img}
                        alt={rp.name}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="(max-width: 768px) 100vw, 25vw"
                      />
                      {rp.badge && (
                        <span
                          className="label-caps"
                          style={{
                            position: 'absolute', top: 10, right: 10,
                            backgroundColor: 'var(--color-gold)', color: '#fff',
                            padding: '4px 10px', borderRadius: 4, fontSize: '0.65rem',
                          }}
                        >
                          {rp.badge}
                        </span>
                      )}
                    </div>
                    <div style={{ padding: '16px 18px 20px' }}>
                      <span className="label-caps" style={{ color: 'var(--color-gold)', fontSize: '0.65rem' }}>{rp.category}</span>
                      <h3 className="font-heading" style={{ fontSize: '0.92rem', marginTop: 6, marginBottom: 4, color: '#fff', lineHeight: 1.3 }}>
                        {rp.name}
                      </h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                        <span className="font-mono" style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>
                          {formatPrice(rp.price)}
                          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', fontWeight: 400, fontFamily: 'inherit' }}> {rp.unit}</span>
                        </span>
                        <span style={{ color: 'var(--color-royal)', fontSize: '0.78rem', fontWeight: 600 }}>View →</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Wholesale CTA banner */}
      <section style={{ backgroundColor: 'var(--color-royal)', padding: '56px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <span className="label-caps" style={{ color: 'var(--color-gold)', fontSize: '0.68rem' }}>Save More</span>
          <h2 className="font-display" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', color: '#fff', marginTop: 8, marginBottom: 12 }}>
            Buying in Volume?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: 28 }}>
            Wholesale accounts pay $70/case (save $10/case). Distribution accounts pay $60/case (save $20/case) with NET 30 terms. Apply in minutes.
          </p>
          <div className="e8-btn-group" style={{ maxWidth: 380, margin: '0 auto' }}>
            <Link
              href="/dispensary-signup"
              style={{
                backgroundColor: 'var(--color-gold)',
                color: '#fff',
                padding: '13px 28px',
                borderRadius: 8,
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 700,
                fontSize: '0.85rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              Get Wholesale Access
            </Link>
            <Link
              href="/dispensary-signup"
              style={{
                backgroundColor: 'transparent',
                color: '#fff',
                padding: '13px 28px',
                borderRadius: 8,
                border: '2px solid rgba(255,255,255,0.3)',
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 600,
                fontSize: '0.85rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              Dispensary Sign Up
            </Link>
          </div>
        </div>
      </section>


    </div>
  );
}
