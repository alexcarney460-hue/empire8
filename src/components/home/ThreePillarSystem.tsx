'use client';

import { useEffect, useRef } from 'react';

/* ────────────────────────────────────────────────────────────────
   Data
   ──────────────────────────────────────────────────────────────── */

const PILLARS = [
  {
    number: '01',
    title: 'In-Store Influence',
    description:
      'Trained brand ambassadors deployed to your territory. They build relationships with budtenders, run demos, and make sure your products get recommended — not collecting dust.',
    points: ['Trusted ambassadors', 'Territory-based deployment', 'Built-in social media'],
  },
  {
    number: '02',
    title: 'Retail Intelligence',
    description:
      'Data-driven deployment. We track what sells, where it sells, and why. Then we deploy ambassadors based on performance data — not guesswork.',
    points: ['Data-driven deployment', 'Performance tracking', 'Territory optimization'],
  },
  {
    number: '03',
    title: 'AI Marketing Engine',
    description:
      'Every store visit becomes content. Product reels, budtender picks, behind-the-scenes, store features. Customers walk in already knowing what to buy.',
    points: ['Product reels', 'Budtender picks content', 'Demand created before the sale'],
  },
] as const;

/* ────────────────────────────────────────────────────────────────
   Icons (inline SVG — no external deps)
   ──────────────────────────────────────────────────────────────── */

function UsersIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C8A23C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C8A23C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C8A23C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

const ICONS = [UsersIcon, ChartIcon, BoltIcon];

/* ────────────────────────────────────────────────────────────────
   Check-circle for key points
   ──────────────────────────────────────────────────────────────── */

function CheckCircle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8A23C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────────── */

export default function ThreePillarSystem() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
    );

    const targets = section.querySelectorAll('[data-animate]');
    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="tps-section" style={styles.section}>
      {/* Decorative glow */}
      <div style={styles.glowTopRight} />
      <div style={styles.glowBottomLeft} />

      {/* Header */}
      <div style={styles.header}>
        <span data-animate className="label-caps" style={styles.label}>
          WHAT MAKES EMPIRE 8 DIFFERENT
        </span>
        <h2 data-animate className="font-display" style={styles.headline}>
          The 3-Pillar System
        </h2>
        <p data-animate style={styles.subtitle}>
          Execution + Intelligence + Amplification
        </p>
      </div>

      {/* Pillar cards */}
      <div style={styles.pillarsWrap}>
        {PILLARS.map((pillar, i) => {
          const Icon = ICONS[i];
          const isEven = i % 2 === 1;

          return (
            <article
              key={pillar.number}
              data-animate
              data-direction={isEven ? 'right' : 'left'}
              style={styles.card}
            >
              {/* Large background number */}
              <span
                data-animate
                data-delay="number"
                aria-hidden
                style={{
                  ...styles.bigNumber,
                  ...(isEven ? { right: 24, left: 'auto' } : { left: 24 }),
                }}
              >
                {pillar.number}
              </span>

              <div style={{ ...styles.cardInner, ...(isEven ? styles.cardInnerReversed : {}) }}>
                {/* Text side */}
                <div style={styles.textSide}>
                  {/* Gold accent line */}
                  <div style={styles.accentLine} />

                  <div style={styles.iconRow}>
                    <div style={styles.iconCircle}>
                      <Icon />
                    </div>
                    <span className="label-caps" style={styles.pillarLabel}>
                      Pillar {pillar.number}
                    </span>
                  </div>

                  <h3 className="font-heading" style={styles.cardTitle}>
                    {pillar.title}
                  </h3>

                  <p style={styles.cardDesc}>{pillar.description}</p>

                  <ul style={styles.pointsList}>
                    {pillar.points.map((pt, pi) => (
                      <li
                        key={pt}
                        data-animate
                        data-stagger={pi}
                        style={styles.pointItem}
                      >
                        <CheckCircle />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual side — abstract decorative element */}
                <div style={styles.visualSide}>
                  <div style={styles.visualInner}>
                    <span className="font-display" style={styles.visualNumber}>
                      {pillar.number}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Inline styles for animations — keeps component self-contained */}
      <style>{animationCSS}</style>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────
   Animation CSS (injected via <style>)
   ──────────────────────────────────────────────────────────────── */

const animationCSS = `
/* Base hidden state for all animated elements */
[data-animate] {
  opacity: 0;
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

/* Header elements: fade up */
.tps-header [data-animate] {
  transform: translateY(28px);
}

/* Cards: slide from side */
[data-animate][data-direction="left"] {
  transform: translateX(-80px);
}
[data-animate][data-direction="right"] {
  transform: translateX(80px);
}

/* Big number: just fade */
[data-animate][data-delay="number"] {
  transform: none;
  transition-delay: 0s;
}

/* Staggered key points */
[data-animate][data-stagger="0"] {
  transform: translateY(16px);
  transition-delay: 0.15s;
}
[data-animate][data-stagger="1"] {
  transform: translateY(16px);
  transition-delay: 0.25s;
}
[data-animate][data-stagger="2"] {
  transform: translateY(16px);
  transition-delay: 0.35s;
}

/* Visible state */
[data-animate].is-visible,
.is-visible [data-animate] {
  opacity: 1;
  transform: none;
}

/* Number should appear first inside visible card */
.is-visible [data-delay="number"] {
  transition-delay: 0s;
}

/* Card content follows */
.is-visible [data-stagger="0"] {
  transition-delay: 0.3s;
}
.is-visible [data-stagger="1"] {
  transition-delay: 0.4s;
}
.is-visible [data-stagger="2"] {
  transition-delay: 0.5s;
}

/* Card hover lift */
.tps-card:hover {
  border-color: rgba(200,162,60,0.25) !important;
  box-shadow: 0 20px 48px rgba(0,0,0,0.25), 0 0 0 1px rgba(200,162,60,0.12);
}

/* Responsive: stack on mobile */
@media (max-width: 768px) {
  .tps-card-inner {
    flex-direction: column !important;
  }
  .tps-card-inner-reversed {
    flex-direction: column !important;
  }
  .tps-text-side {
    min-width: 0 !important;
    max-width: 100% !important;
  }
  .tps-visual-side {
    display: none !important;
  }
  .tps-big-number {
    font-size: 4rem !important;
  }
  [data-animate][data-direction="left"],
  [data-animate][data-direction="right"] {
    transform: translateY(40px);
  }
  .tps-section {
    padding: 64px 16px !important;
  }
  .tps-card {
    padding: 32px 20px !important;
  }
}
`;

/* ────────────────────────────────────────────────────────────────
   Styles
   ──────────────────────────────────────────────────────────────── */

const styles: Record<string, React.CSSProperties> = {
  section: {
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(180deg, #150A28 0%, #0F0520 100%)',
    padding: '120px 24px',
  },

  /* Decorative glows */
  glowTopRight: {
    position: 'absolute',
    top: -120,
    right: -120,
    width: 400,
    height: 400,
    borderRadius: '50%',
    background: 'rgba(200,162,60,0.06)',
    filter: 'blur(120px)',
    pointerEvents: 'none',
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 350,
    height: 350,
    borderRadius: '50%',
    background: 'rgba(74,14,120,0.12)',
    filter: 'blur(120px)',
    pointerEvents: 'none',
  },

  /* Header */
  header: {
    position: 'relative',
    zIndex: 1,
    textAlign: 'center' as const,
    maxWidth: 700,
    margin: '0 auto 72px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  label: {
    color: '#C8A23C',
    display: 'inline-block',
  },
  headline: {
    color: '#fff',
    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
    lineHeight: 1.1,
    margin: 0,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '1.125rem',
    margin: 0,
    letterSpacing: '0.04em',
  },

  /* Pillars wrapper */
  pillarsWrap: {
    position: 'relative',
    zIndex: 1,
    maxWidth: 1100,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 48,
  },

  /* Card */
  card: {
    position: 'relative',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(200,162,60,0.12)',
    borderRadius: 20,
    padding: '48px 40px',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
  },

  /* Big background number */
  bigNumber: {
    position: 'absolute',
    top: 12,
    fontSize: '6rem',
    fontWeight: 800,
    lineHeight: 1,
    color: 'rgba(200,162,60,0.15)',
    pointerEvents: 'none',
    userSelect: 'none',
    fontFamily: 'var(--font-barlow-condensed), Arial Narrow, sans-serif',
    zIndex: 0,
  },

  /* Card inner layout */
  cardInner: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 48,
  },
  cardInnerReversed: {
    flexDirection: 'row-reverse',
  },

  /* Text side */
  textSide: {
    flex: '1 1 60%',
    minWidth: 0,
  },

  /* Gold accent line */
  accentLine: {
    width: 60,
    height: 2,
    background: 'linear-gradient(90deg, #C8A23C, #E8D48B)',
    borderRadius: 2,
    marginBottom: 20,
  },

  /* Icon row */
  iconRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    minWidth: 44,
    borderRadius: 12,
    background: 'rgba(200,162,60,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '0.65rem',
  },

  /* Card title & description */
  cardTitle: {
    color: '#fff',
    fontSize: 'clamp(1.35rem, 3vw, 1.75rem)',
    margin: '0 0 12px',
    lineHeight: 1.2,
  },
  cardDesc: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: '0.975rem',
    lineHeight: 1.7,
    margin: '0 0 24px',
    maxWidth: 520,
  },

  /* Key points */
  pointsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  pointItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    color: 'rgba(255,255,255,0.75)',
    fontSize: '0.9rem',
    lineHeight: 1.5,
  },

  /* Visual side */
  visualSide: {
    flex: '0 0 35%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualInner: {
    width: '100%',
    aspectRatio: '1',
    maxWidth: 220,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, rgba(200,162,60,0.12) 0%, rgba(200,162,60,0.03) 70%, transparent 100%)',
    border: '1px solid rgba(200,162,60,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualNumber: {
    fontSize: 'clamp(3rem, 6vw, 5rem)',
    color: 'rgba(200,162,60,0.2)',
    lineHeight: 1,
  },
};
