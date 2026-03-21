'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface Tier {
  name: string;
  price: number;
  badge: string | null;
  badgeColor: 'gold' | 'purple' | null;
  highlighted: boolean;
  features: string[];
}

const TIERS: readonly Tier[] = [
  {
    name: 'SMALL',
    price: 2500,
    badge: null,
    badgeColor: null,
    highlighted: false,
    features: [
      '12-16 posts/month',
      'AI captions + hooks',
      '1 platform focus',
      'Monthly content plan',
    ],
  },
  {
    name: 'FLEX',
    price: 5000,
    badge: 'MOST POPULAR',
    badgeColor: 'gold',
    highlighted: true,
    features: [
      '20-30 posts/month',
      'Multi-platform',
      'Product campaigns',
      'Dispensary tagging',
      'Performance insights',
    ],
  },
  {
    name: 'BOSS',
    price: 9000,
    badge: 'FULL SERVICE',
    badgeColor: 'purple',
    highlighted: false,
    features: [
      '40-60 posts/month',
      'Daily content strategy',
      'Budtender picks content',
      'Geo-target campaigns',
      'Influencer coordination',
      'Weekly optimization',
    ],
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Price counter hook                                                 */
/* ------------------------------------------------------------------ */

function useCountUp(target: number, isVisible: boolean, duration = 1200): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isVisible) {
      setValue(0);
      return;
    }

    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isVisible, target, duration]);

  return value;
}

/* ------------------------------------------------------------------ */
/*  PriceDisplay                                                       */
/* ------------------------------------------------------------------ */

function PriceDisplay({ target, isVisible }: { target: number; isVisible: boolean }) {
  const displayed = useCountUp(target, isVisible);
  return (
    <span style={{ fontFamily: 'var(--font-barlow-condensed), "Arial Narrow", sans-serif' }}>
      ${displayed.toLocaleString()}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  PricingCard                                                        */
/* ------------------------------------------------------------------ */

function PricingCard({
  tier,
  index,
  isVisible,
}: {
  tier: Tier;
  index: number;
  isVisible: boolean;
}) {
  const delay = index === 1 ? 0.4 : index * 0.2;

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${tier.highlighted ? '#C8A23C' : 'rgba(200,162,60,0.1)'}`,
    borderRadius: 24,
    padding: '48px 32px 40px',
    position: 'relative',
    transform: isVisible
      ? tier.highlighted
        ? 'translateY(0) scale(1.02)'
        : 'translateY(0)'
      : 'translateY(60px)',
    opacity: isVisible ? 1 : 0,
    transition: `opacity 0.65s var(--ease-out-expo) ${delay}s, transform 0.65s var(--ease-out-expo) ${delay}s`,
    willChange: 'opacity, transform',
    boxShadow: tier.highlighted
      ? '0 8px 40px rgba(200,162,60,0.18), 0 0 0 1px rgba(200,162,60,0.12)'
      : 'none',
    display: 'flex',
    flexDirection: 'column',
  };

  const badgeBg =
    tier.badgeColor === 'gold'
      ? 'linear-gradient(135deg, #C8A23C, #E8D48B)'
      : 'linear-gradient(135deg, #4A0E78, #6B2FA0)';

  const badgeTextColor = '#fff';

  return (
    <div style={cardStyle}>
      {/* Badge */}
      {tier.badge && (
        <div
          style={{
            position: 'absolute',
            top: -14,
            right: 24,
            background: badgeBg,
            color: badgeTextColor,
            fontFamily: 'var(--font-barlow), Arial, sans-serif',
            fontWeight: 700,
            fontSize: '0.65rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            padding: '6px 16px',
            borderRadius: 8,
          }}
        >
          {tier.badge}
        </div>
      )}

      {/* Tier name */}
      <p
        className="label-caps"
        style={{
          color: tier.highlighted ? '#C8A23C' : 'rgba(255,255,255,0.5)',
          marginBottom: 8,
        }}
      >
        {tier.name}
      </p>

      {/* Price */}
      <div style={{ marginBottom: 32 }}>
        <span
          style={{
            fontFamily: 'var(--font-barlow-condensed), "Arial Narrow", sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            color: '#C8A23C',
            lineHeight: 1.1,
          }}
        >
          <PriceDisplay target={tier.price} isVisible={isVisible} />
        </span>
        <span
          style={{
            fontSize: '0.88rem',
            color: 'rgba(255,255,255,0.4)',
            marginLeft: 4,
          }}
        >
          /month
        </span>
      </div>

      {/* Features */}
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          flex: 1,
        }}
      >
        {tier.features.map((f) => (
          <li
            key={f}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              fontSize: '0.88rem',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.45,
            }}
          >
            <Check
              size={16}
              style={{
                color: '#C8A23C',
                flexShrink: 0,
                marginTop: 2,
              }}
            />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href="/contact"
        className={tier.highlighted ? 'e8-btn-gold' : 'e8-btn-ghost'}
        style={{
          display: 'block',
          textAlign: 'center',
          marginTop: 36,
          padding: '14px 24px',
          borderRadius: 12,
          fontFamily: 'var(--font-barlow), Arial, sans-serif',
          fontWeight: 700,
          fontSize: '0.88rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          textDecoration: 'none',
          ...(tier.highlighted
            ? {
                background: 'linear-gradient(135deg, #C8A23C, #A6841E)',
                color: '#fff',
                border: 'none',
              }
            : {
                background: 'transparent',
                color: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(200,162,60,0.3)',
              }),
        }}
      >
        Get Started
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PricingSection                                                     */
/* ------------------------------------------------------------------ */

export default function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (entry?.isIntersecting) {
        setIsVisible(true);
      }
    },
    [],
  );

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.15,
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersection]);

  return (
    <section
      ref={sectionRef}
      style={{
        background: '#0F0520',
        padding: '120px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          width: 600,
          height: 600,
          transform: 'translateX(-50%)',
          background: 'rgba(200,162,60,0.06)',
          borderRadius: '50%',
          filter: 'blur(120px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 64,
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(28px)',
            transition: 'opacity 0.65s var(--ease-out-expo), transform 0.65s var(--ease-out-expo)',
          }}
        >
          <p
            className="label-caps"
            style={{ color: '#C8A23C', marginBottom: 12 }}
          >
            MARKETING PACKAGES
          </p>
          <h2
            className="font-display"
            style={{
              color: '#fff',
              fontSize: 'clamp(2rem, 5vw, 3.25rem)',
              lineHeight: 1.1,
              margin: '0 0 16px',
            }}
          >
            Choose Your Growth Plan
          </h2>
          <p
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '1.05rem',
              maxWidth: 520,
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Every plan includes licensed wholesale distribution + AI-powered marketing
          </p>
        </div>

        {/* Cards grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 28,
            alignItems: 'start',
          }}
        >
          {TIERS.map((tier, i) => (
            <PricingCard key={tier.name} tier={tier} index={i} isVisible={isVisible} />
          ))}
        </div>
      </div>

      {/* Responsive override */}
      <style>{`
        @media (max-width: 900px) {
          section > div > div:last-child {
            grid-template-columns: 1fr !important;
            max-width: 420px;
            margin-left: auto;
            margin-right: auto;
          }
        }
      `}</style>
    </section>
  );
}
