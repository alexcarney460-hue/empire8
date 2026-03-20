'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, ArrowRight, Loader2 } from 'lucide-react';

type Brand = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  category: string | null;
};

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    let cancelled = false;

    async function fetchBrands() {
      try {
        const res = await fetch('/api/brands');
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error ?? 'Failed to load brands');
        }

        if (!cancelled) {
          setBrands(json.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load brands');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchBrands();
    return () => { cancelled = true; };
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const brand of brands) {
      if (brand.category) {
        cats.add(brand.category);
      }
    }
    return ['All', ...Array.from(cats).sort()];
  }, [brands]);

  const filteredBrands = useMemo(() => {
    const query = search.toLowerCase().trim();
    return brands.filter((brand) => {
      const matchesSearch = !query || brand.name.toLowerCase().includes(query);
      const matchesCategory =
        selectedCategory === 'All' || brand.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [brands, search, selectedCategory]);

  const showCategoryFilter = categories.length > 1;

  return (
    <div style={{ backgroundColor: '#0F0520', minHeight: '100vh', paddingTop: 'var(--nav-height)' }}>

      {/* Hero header */}
      <section
        style={{
          padding: '64px 24px 56px',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(200,162,60,0.12)',
        }}
      >
        {/* Background glows */}
        <div
          style={{
            position: 'absolute',
            top: '-30%',
            right: '10%',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'rgba(74,14,120,0.15)',
            filter: 'blur(100px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-20%',
            left: '5%',
            width: 350,
            height: 350,
            borderRadius: '50%',
            background: 'rgba(200,162,60,0.06)',
            filter: 'blur(80px)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <span
            className="label-caps"
            style={{
              color: '#C8A23C',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                width: 24,
                height: 1.5,
                backgroundColor: '#C8A23C',
                display: 'inline-block',
                borderRadius: 99,
              }}
            />
            Our Brands
          </span>
          <h1
            className="font-display"
            style={{
              color: '#fff',
              fontSize: 'clamp(2rem, 5vw, 3.25rem)',
              marginTop: 10,
              lineHeight: 1.05,
            }}
          >
            Curated Cannabis Brands
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.55)',
              marginTop: 16,
              maxWidth: 520,
              fontSize: '0.95rem',
              lineHeight: 1.8,
            }}
          >
            Browse our portfolio of NY-licensed cannabis brands. Premium flower,
            vapes, edibles, and more -- delivered to your dispensary.
          </p>
        </div>
      </section>

      {/* Search and filters */}
      <section
        style={{
          padding: '20px 24px',
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
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          {/* Search bar */}
          <div
            style={{
              position: 'relative',
              flex: '1 1 260px',
              maxWidth: 380,
            }}
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.35)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brands..."
              aria-label="Search brands by name"
              style={{
                width: '100%',
                padding: '10px 16px 10px 40px',
                borderRadius: 10,
                border: '1px solid rgba(200,162,60,0.15)',
                backgroundColor: 'rgba(255,255,255,0.04)',
                color: '#fff',
                fontSize: '0.88rem',
                fontFamily: "'Inter', system-ui, sans-serif",
                outline: 'none',
                transition: 'border-color 200ms ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(200,162,60,0.4)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(200,162,60,0.15)';
              }}
            />
          </div>

          {/* Category pills */}
          {showCategoryFilter && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  aria-pressed={selectedCategory === cat}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 9999,
                    border: `1px solid ${
                      selectedCategory === cat
                        ? 'rgba(200,162,60,0.5)'
                        : 'rgba(200,162,60,0.12)'
                    }`,
                    backgroundColor:
                      selectedCategory === cat
                        ? 'rgba(200,162,60,0.15)'
                        : 'transparent',
                    color:
                      selectedCategory === cat
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
          )}
        </div>
      </section>

      {/* Content */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px 80px' }}>
        {loading && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 300,
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
        )}

        {error && (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 24px',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            <p style={{ fontSize: '1rem', marginBottom: 16 }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: '1px solid rgba(200,162,60,0.3)',
                backgroundColor: 'rgba(200,162,60,0.1)',
                color: '#C8A23C',
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && brands.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '100px 24px',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #1A0A2E, #4A0E78)',
                margin: '0 auto 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '1.5rem', color: 'rgba(200,162,60,0.3)' }}>B</span>
            </div>
            <h2
              className="font-display"
              style={{ color: '#fff', fontSize: '1.5rem', marginBottom: 12 }}
            >
              Brands Coming Soon
            </h2>
            <p
              style={{
                color: 'rgba(255,255,255,0.45)',
                fontSize: '0.95rem',
                lineHeight: 1.75,
                maxWidth: 460,
                margin: '0 auto',
              }}
            >
              Brands coming soon. Check back for our curated portfolio of
              NY-licensed cannabis brands.
            </p>
          </div>
        )}

        {!loading && !error && brands.length > 0 && filteredBrands.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 24px',
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            <p style={{ fontSize: '1rem', marginBottom: 8 }}>
              No brands match your search.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
              }}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: '1px solid rgba(200,162,60,0.2)',
                backgroundColor: 'transparent',
                color: '#C8A23C',
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              Clear Filters
            </button>
          </div>
        )}

        {!loading && !error && filteredBrands.length > 0 && (
          <div
            className="e8-grid-stagger"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 20,
            }}
          >
            {filteredBrands.map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BrandCard({ brand }: { brand: Brand }) {
  const hasLogo = Boolean(brand.logo_url);

  return (
    <Link
      href={`/brands/${brand.slug}`}
      style={{ textDecoration: 'none', display: 'block', height: '100%' }}
    >
      <div
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(200,162,60,0.12)',
          borderRadius: 16,
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition:
            'border-color 200ms ease, transform 200ms ease, box-shadow 200ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(200,162,60,0.35)';
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(74,14,120,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(200,162,60,0.12)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Logo area */}
        <div
          style={{
            height: 180,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            background: 'linear-gradient(135deg, rgba(26,10,46,0.8) 0%, rgba(45,10,78,0.6) 100%)',
          }}
        >
          {hasLogo ? (
            <Image
              src={brand.logo_url!}
              alt={`${brand.name} logo`}
              width={200}
              height={120}
              style={{
                objectFit: 'contain',
                maxWidth: '70%',
                maxHeight: '70%',
              }}
            />
          ) : (
            <span
              style={{
                fontSize: '3rem',
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

        {/* Info */}
        <div
          style={{
            padding: '18px 20px 22px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {brand.category && (
            <span
              className="label-caps"
              style={{
                color: '#C8A23C',
                fontSize: '0.6rem',
                marginBottom: 6,
              }}
            >
              {brand.category}
            </span>
          )}

          <h3
            style={{
              fontFamily: "'Barlow', Arial, sans-serif",
              fontWeight: 700,
              fontSize: '1.1rem',
              color: '#fff',
              marginBottom: 8,
              lineHeight: 1.25,
            }}
          >
            {brand.name}
          </h3>

          {brand.description && (
            <p
              style={{
                fontSize: '0.82rem',
                color: 'rgba(255,255,255,0.45)',
                lineHeight: 1.6,
                flex: 1,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {brand.description}
            </p>
          )}

          <div
            style={{
              marginTop: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#C8A23C',
              fontFamily: "'Barlow', Arial, sans-serif",
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            View Products <ArrowRight size={12} />
          </div>
        </div>
      </div>
    </Link>
  );
}
