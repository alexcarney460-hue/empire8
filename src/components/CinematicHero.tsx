'use client';

import Link from 'next/link';

const LINE_1_WORDS = ['WE', 'MAKE', 'CANNABIS'];
const LINE_2_WORDS = ['PRODUCTS', 'SELL.'];

export default function CinematicHero() {
  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        minHeight: 600,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Background image with parallax */}
      <div
        className="ch-bg"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/hero-splash.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat',
          animation: 'ch-bg-fade 0.5s ease both',
        }}
      />

      {/* Dark overlay gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(15,5,32,0.3) 0%, rgba(15,5,32,0.9) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: '0 24px',
          maxWidth: 1000,
          width: '100%',
        }}
      >
        {/* Line 1: WE MAKE CANNABIS */}
        <h1
          style={{
            margin: 0,
            lineHeight: 1.05,
            fontSize: 'clamp(3rem, 8vw, 6rem)',
            fontFamily: "var(--font-barlow-condensed), 'Arial Narrow', sans-serif",
            fontWeight: 700,
            letterSpacing: '-0.01em',
          }}
        >
          <span style={{ display: 'block' }}>
            {LINE_1_WORDS.map((word, i) => (
              <span
                key={word}
                className="ch-word"
                style={{
                  display: 'inline-block',
                  color: '#FFFFFF',
                  animationDelay: `${0.5 + i * 0.1}s`,
                  marginRight: i < LINE_1_WORDS.length - 1 ? '0.25em' : 0,
                }}
              >
                {word}
              </span>
            ))}
          </span>

          {/* Line 2: PRODUCTS SELL. */}
          <span style={{ display: 'block' }}>
            {LINE_2_WORDS.map((word, i) => (
              <span
                key={word}
                className="ch-word"
                style={{
                  display: 'inline-block',
                  color: '#C8A23C',
                  animationDelay: `${0.8 + i * 0.1}s`,
                  marginRight: i < LINE_2_WORDS.length - 1 ? '0.25em' : 0,
                }}
              >
                {word}
              </span>
            ))}
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="ch-subtitle"
          style={{
            fontSize: 'clamp(0.9rem, 2vw, 1.15rem)',
            color: 'rgba(200, 180, 230, 0.85)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontFamily: "var(--font-barlow), Arial, sans-serif",
            fontWeight: 500,
            marginTop: 28,
            marginBottom: 44,
            animation: 'ch-fade-up 0.6s var(--ease-out-expo) 1.2s both',
          }}
        >
          Brand Ambassadors &middot; AI Marketing &middot; Retail Intelligence
        </p>

        {/* CTA Buttons */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/dispensary-signup"
            className="ch-btn-primary"
            style={{
              animation: 'ch-fade-up 0.5s var(--ease-out-expo) 1.4s both',
              backgroundColor: '#C8A23C',
              color: '#1A0633',
              padding: '16px 38px',
              borderRadius: 9999,
              fontFamily: "var(--font-barlow), Arial, sans-serif",
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 24px rgba(200,162,60,0.35)',
              transition: 'transform 150ms ease, box-shadow 150ms ease',
            }}
          >
            Partner With Us
          </Link>

          <Link
            href="/catalog"
            className="ch-btn-secondary"
            style={{
              animation: 'ch-fade-up 0.5s var(--ease-out-expo) 1.6s both',
              backgroundColor: 'transparent',
              color: '#FFFFFF',
              padding: '16px 38px',
              borderRadius: 9999,
              border: '1.5px solid rgba(255,255,255,0.35)',
              fontFamily: "var(--font-barlow), Arial, sans-serif",
              fontWeight: 600,
              fontSize: '0.85rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition:
                'border-color 150ms ease, background-color 150ms ease, transform 150ms ease',
            }}
          >
            View Catalog
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          animation: 'ch-fade-up 0.5s var(--ease-out-expo) 2s both',
        }}
      >
        <span
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.4)',
            fontFamily: "var(--font-barlow), Arial, sans-serif",
          }}
        >
          Scroll
        </span>
        <svg
          className="ch-chevron"
          width="20"
          height="12"
          viewBox="0 0 20 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 2L10 10L18 2"
            stroke="rgba(200,162,60,0.7)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Scoped styles */}
      <style>{`
        /* Background fade in */
        @keyframes ch-bg-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* Word reveal — clip from below */
        @keyframes ch-word-reveal {
          from {
            opacity: 0;
            transform: translateY(100%);
            clip-path: inset(100% 0 0 0);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            clip-path: inset(0 0 0 0);
          }
        }

        .ch-word {
          opacity: 0;
          animation: ch-word-reveal 0.55s var(--ease-out-expo) both;
        }

        /* Fade up for subtitle & buttons */
        @keyframes ch-fade-up {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Scroll chevron bounce */
        @keyframes ch-bounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(6px); }
        }

        .ch-chevron {
          animation: ch-bounce 1.6s ease-in-out infinite;
        }

        /* Button hover states */
        .ch-btn-primary:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 32px rgba(200,162,60,0.5) !important;
        }

        .ch-btn-secondary:hover {
          background-color: rgba(255,255,255,0.08) !important;
          border-color: rgba(255,255,255,0.6) !important;
          transform: translateY(-1px) !important;
        }

        /* Mobile: disable background-attachment fixed (not supported on iOS) */
        @media (max-width: 768px) {
          .ch-bg {
            background-attachment: scroll !important;
          }
        }
      `}</style>
    </section>
  );
}
