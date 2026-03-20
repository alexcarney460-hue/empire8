'use client';

import { useState, useEffect, useMemo, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import type { BrandProduct } from '@/components/ProductCard';

type Brand = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  category: string | null;
};

type BrandPageData = {
  brand: Brand;
  products: BrandProduct[];
};

export default function BrandDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [data, setData] = useState<BrandPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  useEffect(() => {
    let cancelled = false;

    async function fetchBrand() {
      try {
        const res = await fetch(`/api/brands/${slug}`);
        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json.error ?? 'Brand not found');
        }

        if (!cancelled) {
          setData(json.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load brand');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchBrand();
    return () => { cancelled = true; };
  }, [slug]);

  const productCategories = useMemo(() => {
    if (!data?.products.length) return ['All'];
    const cats = new Set<string>();
    for (const p of data.products) {
      if (p.category) cats.add(p.category);
    }
    return ['All', ...Array.from(cats).sort()];
  }, [data]);

  const filteredProducts = useMemo(() => {
    if (!data?.products) return [];
    if (activeCategory === 'All') return data.products;
    return data.products.filter((p) => p.category === activeCategory);
  }, [data, activeCategory]);

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          backgroundColor: '#0F0520',
          minHeight: '100vh',
          paddingTop: 'var(--nav-height)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Loader2
          size={32}
          style={{
            color: '#C8A23C',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div
        style={{
          backgroundColor: '#0F0520',
          minHeight: '100vh',
          paddingTop: 'var(--nav-height)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <h1
          className="font-display"
          style={{ color: '#fff', fontSize: '1.75rem', marginBottom: 12 }}
        >
          Brand Not Found
        </h1>
        <p
          style={{
            color: 'rgba(255,255,255,0.45)',
            marginBottom: 28,
            fontSize: '0.95rem',
          }}
        >
          {error ?? 'This brand could not be loaded.'}
        </p>
        <Link
          href="/brands"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 24px',
            borderRadius: 9999,
            border: '1px solid rgba(200,162,60,0.3)',
            backgroundColor: 'rgba(200,162,60,0.1)',
            color: '#C8A23C',
            fontFamily: "'Barlow', Arial, sans-serif",
            fontWeight: 700,
            fontSize: '0.82rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={14} /> Back to Brands
        </Link>
      </div>
    );
  }

  const { brand, products } = data;
  const hasLogo = Boolean(brand.logo_url);
  const showCategoryTabs = productCategories.length > 1;

  return (
    <div style={{ backgroundColor: '#0F0520', minHeight: '100vh', paddingTop: 'var(--nav-height)' }}>

      {/* Back link */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 24px 0' }}>
        <Link
          href="/brands"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'rgba(255,255,255,0.45)',
            fontFamily: "'Barlow', Arial, sans-serif",
            fontWeight: 600,
            fontSize: '0.78rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            transition: 'color 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#C8A23C';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
          }}
        >
          <ArrowLeft size={14} /> All Brands
        </Link>
      </div>

      {/* Brand header */}
      <section
        style={{
          padding: '40px 24px 48px',
          borderBottom: '1px solid rgba(200,162,60,0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glows */}
        <div
          style={{
            position: 'absolute',
            top: '-40%',
            right: '5%',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'rgba(74,14,120,0.12)',
            filter: 'blur(100px)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 40,
            flexWrap: 'wrap',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Logo */}
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(200,162,60,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {hasLogo ? (
              <Image
                src={brand.logo_url!}
                alt={`${brand.name} logo`}
                width={140}
                height={140}
                style={{ objectFit: 'contain', maxWidth: '80%', maxHeight: '80%' }}
                priority
              />
            ) : (
              <span
                style={{
                  fontSize: '4rem',
                  fontWeight: 800,
                  fontFamily: "'Barlow Condensed', Arial, sans-serif",
                  color: 'rgba(200,162,60,0.2)',
                  textTransform: 'uppercase',
                }}
              >
                {brand.name.charAt(0)}
              </span>
            )}
          </div>

          {/* Brand info */}
          <div style={{ flex: 1, minWidth: 280 }}>
            {brand.category && (
              <span
                className="label-caps"
                style={{
                  color: '#C8A23C',
                  fontSize: '0.62rem',
                  marginBottom: 8,
                  display: 'block',
                }}
              >
                {brand.category}
              </span>
            )}

            <h1
              className="font-display"
              style={{
                color: '#fff',
                fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                lineHeight: 1.05,
                marginBottom: 14,
              }}
            >
              {brand.name}
            </h1>

            {brand.description && (
              <p
                style={{
                  color: 'rgba(255,255,255,0.55)',
                  fontSize: '0.95rem',
                  lineHeight: 1.8,
                  maxWidth: 560,
                  marginBottom: 20,
                }}
              >
                {brand.description}
              </p>
            )}

            {brand.website_url && (
              <a
                href={brand.website_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#C8A23C',
                  fontFamily: "'Barlow', Arial, sans-serif",
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  textDecoration: 'none',
                  transition: 'opacity 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <ExternalLink size={14} /> Visit Website
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Category tabs */}
      {showCategoryTabs && (
        <section
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(200,162,60,0.08)',
            position: 'sticky',
            top: 'var(--nav-height)',
            zIndex: 10,
            backgroundColor: 'rgba(15,5,32,0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <div
            style={{
              maxWidth: 1280,
              margin: '0 auto',
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
            }}
            role="tablist"
            aria-label="Filter products by category"
          >
            {productCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                role="tab"
                aria-selected={activeCategory === cat}
                style={{
                  padding: '8px 18px',
                  borderRadius: 9999,
                  border: `1px solid ${
                    activeCategory === cat
                      ? 'rgba(200,162,60,0.5)'
                      : 'rgba(200,162,60,0.12)'
                  }`,
                  backgroundColor:
                    activeCategory === cat
                      ? 'rgba(200,162,60,0.15)'
                      : 'transparent',
                  color:
                    activeCategory === cat
                      ? '#C8A23C'
                      : 'rgba(255,255,255,0.5)',
                  fontFamily: "'Barlow', Arial, sans-serif",
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  transition:
                    'background-color 150ms ease, color 150ms ease, border-color 150ms ease',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Products grid */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ marginBottom: 28 }}>
          <span
            className="label-caps"
            style={{ color: '#C8A23C', fontSize: '0.62rem' }}
          >
            {activeCategory === 'All' ? 'All Products' : activeCategory}
          </span>
          <h2
            className="font-display"
            style={{
              color: '#fff',
              fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
              marginTop: 6,
            }}
          >
            {filteredProducts.length}{' '}
            {filteredProducts.length === 1 ? 'Product' : 'Products'} Available
          </h2>
        </div>

        {filteredProducts.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 24px',
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            <p style={{ fontSize: '0.95rem' }}>
              No products available in this category yet.
            </p>
          </div>
        )}

        {filteredProducts.length > 0 && (
          <div
            className="e8-grid-stagger"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 20,
            }}
          >
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} brandId={data.brand.id} brandName={data.brand.name} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section
        style={{
          padding: '64px 24px',
          borderTop: '1px solid rgba(200,162,60,0.1)',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <h2
            className="font-display"
            style={{ color: '#fff', fontSize: '1.5rem', marginBottom: 12 }}
          >
            Interested in Carrying {brand.name}?
          </h2>
          <p
            style={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: '0.92rem',
              lineHeight: 1.75,
              marginBottom: 32,
            }}
          >
            Sign up as a dispensary partner and start ordering directly from
            Empire 8 Sales Direct.
          </p>
          <div
            style={{
              display: 'flex',
              gap: 14,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="/dispensary-signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#C8A23C',
                color: '#fff',
                padding: '13px 28px',
                borderRadius: 9999,
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 700,
                fontSize: '0.82rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                boxShadow: '0 8px 28px rgba(200,162,60,0.30)',
              }}
            >
              Dispensary Sign Up
            </Link>
            <Link
              href="/contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'transparent',
                color: '#fff',
                padding: '13px 28px',
                borderRadius: 9999,
                border: '1.5px solid rgba(255,255,255,0.2)',
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
        </div>
      </section>
    </div>
  );
}
