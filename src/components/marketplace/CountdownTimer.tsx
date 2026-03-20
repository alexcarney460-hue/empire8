'use client';

import { useEffect, useState, useCallback } from 'react';

interface CountdownTimerProps {
  endsAt: string;
  size?: 'sm' | 'lg';
}

interface TimeRemaining {
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function computeRemaining(endsAt: string): TimeRemaining {
  const now = Date.now();
  const end = new Date(endsAt).getTime();
  const diff = Math.max(0, Math.floor((end - now) / 1000));

  return {
    totalSeconds: diff,
    days: Math.floor(diff / 86400),
    hours: Math.floor((diff % 86400) / 3600),
    minutes: Math.floor((diff % 3600) / 60),
    seconds: diff % 60,
  };
}

function formatRemaining(t: TimeRemaining): string {
  if (t.totalSeconds <= 0) return 'Ended';

  if (t.days > 0) {
    return `${t.days}d ${t.hours}h ${t.minutes}m`;
  }

  if (t.hours > 0) {
    return `${t.hours}h ${t.minutes}m ${t.seconds}s`;
  }

  return `${t.minutes}m ${t.seconds}s`;
}

export default function CountdownTimer({ endsAt, size = 'sm' }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState<TimeRemaining>(() => computeRemaining(endsAt));

  const tick = useCallback(() => {
    setRemaining(computeRemaining(endsAt));
  }, [endsAt]);

  useEffect(() => {
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);

  const isExpired = remaining.totalSeconds <= 0;
  const isUrgent = !isExpired && remaining.totalSeconds < 3600;

  const textColor = isExpired ? '#DC2626' : isUrgent ? '#C8A23C' : 'rgba(255,255,255,0.6)';

  const isLarge = size === 'lg';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: isLarge ? '1.1rem' : '0.75rem',
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        color: textColor,
        letterSpacing: '0.02em',
        transition: 'color 300ms ease',
      }}
      aria-live="polite"
      aria-label={isExpired ? 'Auction ended' : `Time remaining: ${formatRemaining(remaining)}`}
    >
      {formatRemaining(remaining)}
    </span>
  );
}
