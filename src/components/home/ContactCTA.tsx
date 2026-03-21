'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function ContactCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '50vh',
        background: 'linear-gradient(135deg, #4A0E78 0%, #2D0A4E 100%)',
        padding: '120px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Gold decorative accent — top-right */}
      <div
        style={{
          position: 'absolute',
          top: -80,
          right: -80,
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,162,60,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Gold decorative accent — bottom-left */}
      <div
        style={{
          position: 'absolute',
          bottom: -100,
          left: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,162,60,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Dot grid overlay */}
      <div
        className="e8-dot-grid"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.4,
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 720,
          textAlign: 'center',
        }}
      >
        {/* Label */}
        <span
          className="label-caps"
          style={{
            color: 'var(--color-gold)',
            fontSize: '0.72rem',
            letterSpacing: '0.28em',
            marginBottom: 20,
            display: 'block',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.6s var(--ease-out-expo), transform 0.6s var(--ease-out-expo)',
          }}
        >
          Get Started
        </span>

        {/* Headline */}
        <h2
          className="font-display"
          style={{
            color: '#fff',
            fontSize: 'clamp(2.4rem, 5vw, 4rem)',
            lineHeight: 1.05,
            marginBottom: 24,
            letterSpacing: '-0.02em',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(28px)',
            transition: 'opacity 0.7s var(--ease-out-expo) 0.1s, transform 0.7s var(--ease-out-expo) 0.1s',
          }}
        >
          Ready to Move Product?
        </h2>

        {/* Subtitle */}
        <p
          style={{
            color: 'rgba(255,255,255,0.65)',
            fontSize: '1.1rem',
            lineHeight: 1.7,
            maxWidth: 560,
            margin: '0 auto 44px',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.7s var(--ease-out-expo) 0.2s, transform 0.7s var(--ease-out-expo) 0.2s',
          }}
        >
          Schedule a 30-minute meeting with our team. We&apos;ll show you exactly how Empire 8
          can grow your brand&apos;s presence in dispensaries across New York.
        </p>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {/* Primary: Schedule a Call */}
          <Link
            href="/contact"
            className="e8-btn-gold"
            style={{
              backgroundColor: 'var(--color-gold)',
              color: '#1A0633',
              padding: '16px 36px',
              borderRadius: 12,
              fontFamily: "'Barlow', Arial, sans-serif",
              fontWeight: 700,
              fontSize: '0.88rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.6s var(--ease-out-expo) 0.35s, transform 0.6s var(--ease-out-expo) 0.35s, box-shadow 220ms var(--ease-out-expo)',
            }}
          >
            Schedule a Call
          </Link>

          {/* Ghost: Apply as Dispensary */}
          <Link
            href="/dispensary-signup"
            className="e8-btn-ghost"
            style={{
              backgroundColor: 'transparent',
              color: '#fff',
              padding: '16px 36px',
              borderRadius: 12,
              fontFamily: "'Barlow', Arial, sans-serif",
              fontWeight: 600,
              fontSize: '0.88rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: '1.5px solid rgba(255,255,255,0.3)',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.6s var(--ease-out-expo) 0.45s, transform 0.6s var(--ease-out-expo) 0.45s, background-color 180ms ease, border-color 180ms ease',
            }}
          >
            Apply as Dispensary
          </Link>
        </div>
      </div>
    </section>
  );
}
