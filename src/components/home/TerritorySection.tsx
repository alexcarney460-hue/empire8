'use client';

import { Target, Handshake, TrendingUp } from 'lucide-react';
import AnimateIn from '../AnimateIn';
import Link from 'next/link';

const strategyPoints = [
  {
    icon: Target,
    title: 'Focus on Top Dispensaries',
    description:
      'We identify and prioritize the highest-volume, highest-influence dispensaries in every zone.',
  },
  {
    icon: Handshake,
    title: 'Build Deep Relationships',
    description:
      'Our ambassadors become trusted partners — not just reps — through consistent, in-person presence.',
  },
  {
    icon: TrendingUp,
    title: 'Expand Based on Performance',
    description:
      'New territory opens only when current zones hit benchmarks. Growth is earned, never rushed.',
  },
] as const;

const coverageStats = [
  { value: '7', label: 'Zones' },
  { value: '62', label: 'Counties' },
  { value: '12', label: 'Phase 1 Ambassadors' },
] as const;

export default function TerritorySection() {
  return (
    <section
      style={{
        minHeight: '80vh',
        backgroundImage: `
          linear-gradient(rgba(15,5,32,0.75), rgba(15,5,32,0.75)),
          url(/zone-map.jpg)
        `,
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 24px',
      }}
    >
      <div style={{ maxWidth: 900, width: '100%', textAlign: 'center' }}>
        {/* Label */}
        <AnimateIn>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <span
              style={{
                width: 28,
                height: 2,
                background: 'var(--color-gold)',
                display: 'block',
              }}
            />
            <span
              className="label-caps"
              style={{ color: 'var(--color-gold)' }}
            >
              Territory Development
            </span>
            <span
              style={{
                width: 28,
                height: 2,
                background: 'var(--color-gold)',
                display: 'block',
              }}
            />
          </div>
        </AnimateIn>

        {/* Headline */}
        <AnimateIn delay={80}>
          <h2
            className="font-display"
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
              lineHeight: 1.1,
              color: '#fff',
              margin: '0 0 16px',
            }}
          >
            All 62 Counties. One Network.
          </h2>
        </AnimateIn>

        {/* Subtitle */}
        <AnimateIn delay={160}>
          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              color: 'rgba(255,255,255,0.7)',
              margin: '0 0 48px',
              fontWeight: 500,
            }}
          >
            Lean Coverage. Maximum Influence.
          </p>
        </AnimateIn>

        {/* Strategy cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
            marginBottom: 48,
          }}
        >
          {strategyPoints.map((point, i) => {
            const Icon = point.icon;
            return (
              <AnimateIn key={point.title} delay={250 + i * 150}>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(200,162,60,0.1)',
                    borderRadius: 14,
                    padding: '32px 24px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: 'rgba(200,162,60,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}
                  >
                    <Icon
                      size={22}
                      style={{ color: 'var(--color-gold)' }}
                      strokeWidth={2}
                    />
                  </div>
                  <h3
                    style={{
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '1rem',
                      margin: '0 0 8px',
                    }}
                  >
                    {point.title}
                  </h3>
                  <p
                    style={{
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {point.description}
                  </p>
                </div>
              </AnimateIn>
            );
          })}
        </div>

        {/* Coverage stats row */}
        <AnimateIn delay={700}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0,
              marginBottom: 40,
              flexWrap: 'wrap',
            }}
          >
            {coverageStats.map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0,
                }}
              >
                {i > 0 && (
                  <span
                    style={{
                      width: 1,
                      height: 36,
                      background: 'var(--color-gold)',
                      opacity: 0.4,
                      margin: '0 28px',
                      flexShrink: 0,
                    }}
                  />
                )}
                <div style={{ textAlign: 'center' }}>
                  <span
                    className="font-display"
                    style={{
                      fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
                      color: 'var(--color-gold)',
                      display: 'block',
                      lineHeight: 1.1,
                    }}
                  >
                    {stat.value}
                  </span>
                  <span
                    style={{
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {stat.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </AnimateIn>

        {/* CTA */}
        <AnimateIn delay={850}>
          <Link
            href="/dispensary-signup"
            className="e8-btn-gold"
            style={{
              display: 'inline-block',
              background: 'var(--color-gold)',
              color: 'var(--color-charcoal)',
              fontWeight: 700,
              fontSize: '0.95rem',
              padding: '14px 36px',
              borderRadius: 10,
              textDecoration: 'none',
              letterSpacing: '0.02em',
            }}
          >
            Apply for Coverage
          </Link>
        </AnimateIn>
      </div>
    </section>
  );
}
