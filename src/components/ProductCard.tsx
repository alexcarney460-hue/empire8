'use client';

import Image from 'next/image';
import { ShoppingCart, CheckCircle } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useDispensaryCart } from '@/context/DispensaryCartContext';

export type BrandProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  image_url: string | null;
  unit_price_cents: number;
  unit_type: string;
  min_order_qty: number;
};

interface ProductCardProps {
  product: BrandProduct;
  brandId: string;
  brandName: string;
}

function formatUnitPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  Flower: '#2D7D46',
  Vapes: '#1A6B8A',
  'Pre-Rolls': '#8B5A2B',
  Edibles: '#9B2D86',
  Concentrates: '#C8A23C',
  Tinctures: '#3D6B4F',
  Topicals: '#6B4F8A',
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#C8A23C';
}

export default function ProductCard({ product, brandId, brandName }: ProductCardProps) {
  const { addToCart } = useDispensaryCart();
  const [added, setAdded] = useState(false);

  const hasImage = Boolean(product.image_url);

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      addToCart(
        {
          productId: product.id,
          brandId,
          brandName,
          productName: product.name,
          unitPriceCents: product.unit_price_cents,
          imageUrl: product.image_url,
          unitType: product.unit_type,
        },
        product.min_order_qty || 1,
      );

      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    },
    [addToCart, product, brandId, brandName],
  );

  return (
    <div
      style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(200,162,60,0.12)',
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'border-color 200ms ease, transform 200ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(200,162,60,0.3)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(200,162,60,0.12)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Image */}
      <div
        style={{
          height: 180,
          position: 'relative',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {hasImage ? (
          <Image
            src={product.image_url!}
            alt={product.name}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #1A0A2E 0%, #2D0A4E 50%, #4A0E78 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                color: 'rgba(200,162,60,0.15)',
                fontFamily: "'Barlow Condensed', Arial, sans-serif",
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              {product.name.charAt(0)}
            </span>
          </div>
        )}

        {/* Category badge */}
        <span
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            backgroundColor: getCategoryColor(product.category),
            color: '#fff',
            padding: '3px 10px',
            borderRadius: 6,
            fontSize: '0.62rem',
            fontWeight: 700,
            fontFamily: "'Barlow', Arial, sans-serif",
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            zIndex: 2,
          }}
        >
          {product.category}
        </span>
      </div>

      {/* Content */}
      <div
        style={{
          padding: '16px 18px 20px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h3
          style={{
            fontSize: '0.95rem',
            fontWeight: 700,
            fontFamily: "'Barlow', Arial, sans-serif",
            color: '#fff',
            lineHeight: 1.3,
            marginBottom: 8,
          }}
        >
          {product.name}
        </h3>

        {product.description && (
          <p
            style={{
              fontSize: '0.78rem',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.55,
              marginBottom: 12,
              flex: 1,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {product.description}
          </p>
        )}

        <div style={{ marginTop: 'auto' }}>
          {/* Price */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 6,
              marginBottom: 14,
            }}
          >
            <span
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                color: '#C8A23C',
              }}
            >
              {formatUnitPrice(product.unit_price_cents)}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              / {product.unit_type}
            </span>
          </div>

          {/* Add to Cart button */}
          <button
            onClick={handleAddToCart}
            aria-label={added ? 'Added to cart' : `Add ${product.name} to cart`}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '11px 16px',
              backgroundColor: added ? 'rgba(45,125,70,0.3)' : 'rgba(200,162,60,0.15)',
              color: added ? '#7BC77F' : '#C8A23C',
              border: `1px solid ${added ? 'rgba(45,125,70,0.3)' : 'rgba(200,162,60,0.2)'}`,
              borderRadius: 10,
              fontFamily: "'Barlow', Arial, sans-serif",
              fontWeight: 700,
              fontSize: '0.78rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition:
                'background-color 200ms ease, color 200ms ease, border-color 200ms ease',
            }}
          >
            {added ? (
              <>
                <CheckCircle size={14} /> Added
              </>
            ) : (
              <>
                <ShoppingCart size={14} /> Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
