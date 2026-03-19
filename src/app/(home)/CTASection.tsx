import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import AnimateIn from '@/components/AnimateIn';

export default function CTASection() {
  return (
    <section
      style={{
        background: 'linear-gradient(168deg, #4A0E78 0%, #2D0A4E 60%, #1A0633 100%)',
        padding: '100px 24px',
        textAlign: 'center',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Gold accent glow */}
      <div
        style={{
          position: 'absolute',
          width: 640,
          height: 400,
          top: '-30%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,162,60,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <AnimateIn style={{ maxWidth: 640, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <span className="label-caps" style={{ color: '#C8A23C', display: 'block', marginBottom: 20 }}>
          Get Started
        </span>
        <h2
          className="font-display"
          style={{ fontSize: 'clamp(1.75rem, 5vw, 3.25rem)', marginBottom: 20, lineHeight: 1.05 }}
        >
          Ready to Partner with Empire 8?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 44, fontSize: '1.05rem', lineHeight: 1.75 }}>
          Whether you're a cannabis brand looking for distribution or a dispensary seeking reliable supply, we're your partner.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/dispensary-signup"
            style={{
              backgroundColor: '#C8A23C',
              color: '#1A0633',
              padding: '15px 34px',
              borderRadius: 9999,
              fontFamily: "'Barlow', Arial, sans-serif",
              fontWeight: 700,
              fontSize: '0.82rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 24px rgba(200,162,60,0.35)',
            }}
          >
            Dispensary Sign Up <ArrowRight size={14} />
          </Link>
          <Link
            href="/contact"
            style={{
              backgroundColor: 'transparent',
              color: '#fff',
              padding: '15px 34px',
              borderRadius: 9999,
              border: '1.5px solid rgba(200,162,60,0.35)',
              fontFamily: "'Barlow', Arial, sans-serif",
              fontWeight: 600,
              fontSize: '0.82rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'border-color 150ms ease',
            }}
          >
            Contact Us
          </Link>
        </div>
      </AnimateIn>
    </section>
  );
}
