'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  duration?: number;
}

export default function CounterStat({ value, suffix = '', prefix = '', label, duration = 2 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [displayed, setDisplayed] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          const startTime = performance.now();
          function tick(now: number) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / (duration * 1000), 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            setDisplayed(Math.round(value * eased));
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration, started]);

  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div
        className="font-display"
        style={{
          fontSize: 'clamp(2.5rem, 6vw, 4rem)',
          color: '#C8A23C',
          lineHeight: 1,
        }}
      >
        {prefix}{displayed.toLocaleString()}{suffix}
      </div>
      <div
        className="label-caps"
        style={{ color: 'rgba(255,255,255,0.6)', marginTop: 8, fontSize: '0.72rem' }}
      >
        {label}
      </div>
    </div>
  );
}
