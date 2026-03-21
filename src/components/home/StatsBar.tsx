'use client';

import { useEffect, useRef, useState } from 'react';

interface StatItem {
  readonly value: number;
  readonly suffix: string;
  readonly label: string;
}

const STATS: readonly StatItem[] = [
  { value: 62, suffix: '', label: 'Counties Covered' },
  { value: 100, suffix: '%', label: 'OCM Compliant' },
  { value: 7, suffix: '', label: 'Distribution Zones' },
  { value: 3, suffix: '', label: 'Pillar System' },
] as const;

const ANIMATION_DURATION = 1400;

function useCountUp(target: number, shouldAnimate: boolean): number {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!shouldAnimate) return;

    let startTime: number | null = null;
    let frameId: number;

    const step = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [target, shouldAnimate]);

  return current;
}

function StatCounter({
  stat,
  isVisible,
}: {
  readonly stat: StatItem;
  readonly isVisible: boolean;
}) {
  const count = useCountUp(stat.value, isVisible);

  return (
    <div style={{ textAlign: 'center', padding: '0 24px' }}>
      <div
        className="font-display"
        style={{
          fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
          color: 'var(--color-gold)',
          lineHeight: 1.1,
          marginBottom: 8,
        }}
      >
        {isVisible ? count : 0}
        {stat.suffix}
      </div>
      <div
        className="label-caps"
        style={{ color: 'var(--color-off-white)', opacity: 0.85 }}
      >
        {stat.label}
      </div>
    </div>
  );
}

export default function StatsBar() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        .e8-stats-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          position: relative;
        }
        @media (max-width: 768px) {
          .e8-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            row-gap: 48px;
          }
          .e8-stats-divider { display: none !important; }
        }
      `}</style>
      <section
        ref={sectionRef}
        style={{
          backgroundColor: '#0F0520',
          borderTop: '1px solid rgba(200,162,60,0.15)',
          borderBottom: '1px solid rgba(200,162,60,0.15)',
          padding: '64px 24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="e8-stats-grid">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {i > 0 && (
                <div
                  className="e8-stats-divider"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '10%',
                    bottom: '10%',
                    width: 1,
                    background:
                      'linear-gradient(to bottom, transparent, rgba(200,162,60,0.3), transparent)',
                  }}
                />
              )}
              <StatCounter stat={stat} isVisible={isVisible} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
