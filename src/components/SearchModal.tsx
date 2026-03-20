'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X } from 'lucide-react';
import PRODUCTS from '@/lib/products';

interface Props {
  onClose: () => void;
}

export default function SearchModal({ onClose }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const q = query.toLowerCase().trim();
  const results = q
    ? PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.useCases.some((u) => u.toLowerCase().includes(q))
      )
    : PRODUCTS;

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search products"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        backgroundColor: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 80,
        paddingLeft: 16,
        paddingRight: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 600,
          backgroundColor: '#fff',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Input row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <Search size={18} color="var(--color-warm-gray)" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search brands, products, marketplace..."
            aria-label="Search products"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '0.95rem',
              color: 'var(--color-charcoal)',
              backgroundColor: 'transparent',
            }}
          />
          <button
            onClick={onClose}
            aria-label="Close search"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-warm-gray)',
              display: 'flex',
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
          {results.length === 0 ? (
            <div
              style={{
                padding: '32px 24px',
                textAlign: 'center',
                color: 'var(--color-warm-gray)',
                fontSize: '0.85rem',
              }}
            >
              No products found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <>
              {q && (
                <div
                  style={{
                    padding: '8px 18px',
                    fontSize: '0.65rem',
                    color: 'var(--color-warm-gray)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    backgroundColor: '#fafaf9',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </div>
              )}
              {results.map((p) => (
                <Link
                  key={p.slug}
                  href={`/catalog/${p.slug}`}
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 18px',
                    textDecoration: 'none',
                    borderBottom: '1px solid var(--color-border)',
                    transition: 'background-color 120ms ease',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#fafaf9'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent'; }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      overflow: 'hidden',
                      flexShrink: 0,
                      position: 'relative',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <Image src={p.img} alt={p.name} fill style={{ objectFit: 'cover' }} sizes="48px" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: 2 }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-warm-gray)' }}>{p.category}</div>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-royal)', flexShrink: 0 }}>
                    ${p.price.toFixed(2)}<span style={{ fontWeight: 400, fontSize: '0.7rem', color: 'var(--color-warm-gray)' }}> {p.unit}</span>
                  </div>
                </Link>
              ))}
              <Link
                href="/catalog"
                onClick={onClose}
                style={{
                  display: 'block',
                  padding: '12px 18px',
                  textAlign: 'center',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--color-royal)',
                  textDecoration: 'none',
                  backgroundColor: '#fafaf9',
                }}
              >
                View full catalog →
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
