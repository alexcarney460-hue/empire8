'use client';

import { useEffect, useRef } from 'react';

/* ── Data ── */

const PROBLEMS: readonly string[] = [
  'Products sit on shelves',
  'Budtenders push what they know',
  'Brands lack visibility',
  "Marketing doesn't translate to sales",
] as const;

const SHIFT_POINTS: readonly string[] = [
  'Customers discover before entering',
  'Budtenders influence 60-80% of purchases',
  'Social proof drives trust',
] as const;

/* ── Intersection Observer hook ── */

function useRevealObserver(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const targets = container.querySelectorAll('.e8-reveal');

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ref]);
}

/* ── Section Label ── */

function SectionLabel({ text }: { readonly text: string }) {
  return (
    <div
      className="e8-reveal"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 40,
        opacity: 0,
        transform: 'translateY(20px)',
        transition: 'opacity 0.5s var(--ease-out-expo), transform 0.5s var(--ease-out-expo)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 1,
          backgroundColor: 'var(--color-gold)',
          flexShrink: 0,
        }}
      />
      <span
        className="label-caps"
        style={{ color: 'var(--color-gold)' }}
      >
        {text}
      </span>
    </div>
  );
}

/* ── Problem Section ── */

function ProblemSection() {
  return (
    <div
      style={{
        backgroundColor: '#0F0520',
        padding: '96px 24px',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <SectionLabel text="THE PROBLEM" />

        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {PROBLEMS.map((text, i) => (
            <li
              key={text}
              className="e8-reveal"
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 16,
                marginBottom: 28,
                opacity: 0,
                transform: 'translateY(20px)',
                transition:
                  'opacity 0.5s var(--ease-out-expo), transform 0.5s var(--ease-out-expo)',
                transitionDelay: `${(i + 1) * 150}ms`,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  minWidth: 8,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-gold)',
                  display: 'inline-block',
                  marginTop: 6,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: 'var(--color-off-white)',
                  fontFamily: 'var(--font-inter), system-ui, sans-serif',
                  fontSize: '1.1rem',
                  lineHeight: 1.6,
                }}
              >
                {text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ── Shift Section ── */

function ShiftSection() {
  return (
    <div
      style={{
        backgroundColor: '#150A28',
        padding: '96px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <SectionLabel text="THE SHIFT" />

        {/* Main flow statement */}
        <div
          className="e8-reveal"
          style={{
            marginBottom: 56,
            opacity: 0,
            transform: 'translateY(20px)',
            transition:
              'opacity 0.6s var(--ease-out-expo), transform 0.6s var(--ease-out-expo)',
            transitionDelay: '150ms',
          }}
        >
          <h3
            className="font-display"
            style={{
              fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
              color: 'var(--color-gold)',
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Attention → Influence → Sell-Through
          </h3>
        </div>

        {/* Arrow flow graphic + supporting points */}
        <div
          className="e8-shift-flow"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            position: 'relative',
          }}
        >
          {SHIFT_POINTS.map((text, i) => (
            <div
              key={text}
              className="e8-reveal"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 20,
                position: 'relative',
                paddingBottom: i < SHIFT_POINTS.length - 1 ? 40 : 0,
                opacity: 0,
                transform: 'translateY(20px)',
                transition:
                  'opacity 0.5s var(--ease-out-expo), transform 0.5s var(--ease-out-expo)',
                transitionDelay: `${(i + 2) * 150}ms`,
              }}
            >
              {/* Vertical connector line + node */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                {/* Node circle */}
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    border: '2px solid var(--color-gold)',
                    backgroundColor:
                      i === SHIFT_POINTS.length - 1 ? 'var(--color-gold)' : 'transparent',
                    flexShrink: 0,
                    position: 'relative',
                    zIndex: 2,
                  }}
                />
                {/* Vertical line to next node */}
                {i < SHIFT_POINTS.length - 1 && (
                  <div
                    style={{
                      width: 1,
                      flexGrow: 1,
                      minHeight: 28,
                      background:
                        'linear-gradient(to bottom, var(--color-gold), rgba(200,162,60,0.2))',
                      position: 'absolute',
                      top: 14,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  />
                )}
                {/* Arrow at bottom of last connector */}
                {i < SHIFT_POINTS.length - 1 && (
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderTop: '6px solid rgba(200,162,60,0.4)',
                      position: 'absolute',
                      bottom: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  />
                )}
              </div>

              {/* Text content */}
              <span
                style={{
                  color: 'var(--color-off-white)',
                  fontFamily: 'var(--font-inter), system-ui, sans-serif',
                  fontSize: '1.1rem',
                  lineHeight: 1.5,
                  paddingTop: 0,
                }}
              >
                {text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ── */

export default function ProblemSolution() {
  const containerRef = useRef<HTMLElement>(null);
  useRevealObserver(containerRef);

  return (
    <>
      <style>{`
        .e8-reveal.is-visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
      <section ref={containerRef}>
        <ProblemSection />
        <ShiftSection />
      </section>
    </>
  );
}
