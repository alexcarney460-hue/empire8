import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Zap, Brain, Megaphone, ShieldCheck } from 'lucide-react';
import AnimateIn from '@/components/AnimateIn';

export const metadata: Metadata = {
  title: 'About Empire 8 Sales Direct — Licensed Cannabis Wholesale in NY',
  description:
    'Empire 8 Sales Direct is a NYS OCM licensed cannabis wholesale supplier serving dispensaries across all 62 New York counties. Learn about our mission and compliance.',
  keywords: [
    'about empire 8',
    'cannabis wholesale company NY',
    'NYS OCM licensed supplier',
    'cannabis distributor about',
    'NY cannabis supply chain',
  ],
  openGraph: {
    title: 'About Empire 8 Sales Direct',
    description: 'Licensed cannabis wholesale supplier serving dispensaries across New York State.',
    url: 'https://empire8ny.com/about',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'About Empire 8 Sales Direct' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Empire 8 Sales Direct',
    description: 'NYS OCM licensed cannabis wholesale supplier serving all 62 New York counties.',
    images: ['/og-image.jpg'],
  },
  alternates: { canonical: 'https://empire8ny.com/about' },
};

const VALUES = [
  {
    icon: Zap,
    title: 'Execution',
    desc: 'We don\'t just plan — we move. High-speed logistics, same-week delivery across all 62 counties, and a manufacturing backbone that keeps shelves stocked.',
  },
  {
    icon: Brain,
    title: 'Intelligence',
    desc: 'Our proprietary AI platform drives real-time retail intelligence, demand forecasting, and data-driven inventory decisions that maximize sell-through.',
  },
  {
    icon: Megaphone,
    title: 'Amplification',
    desc: 'AI-powered marketing and trained in-store ambassadors turn foot traffic into sales. We don\'t just deliver product — we help it sell.',
  },
  {
    icon: ShieldCheck,
    title: 'Integrity',
    desc: 'Every product is fully tracked, manifested, and OCM compliant. We\'ve rolled our sleeves up — come see what an honest day\'s work with us looks like.',
  },
];

const STATS = [
  { stat: '62', label: 'Counties Served' },
  { stat: '100%', label: 'OCM Compliant' },
  { stat: 'Same Week', label: 'Delivery' },
  { stat: 'NET 30', label: 'Terms Available' },
];

const COMBINES = [
  'Wholesale direct pricing',
  'AI-powered sales & marketing',
  'Trained in-store ambassadors',
  'True AI-driven retail intelligence',
];

const aboutPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'About Empire 8 Sales Direct',
  description:
    'Empire 8 Sales Direct is a NYS OCM licensed cannabis wholesale supplier serving dispensaries across all 62 New York counties.',
  url: 'https://empire8ny.com/about',
  mainEntity: {
    '@type': 'Organization',
    name: 'Empire 8 Sales Direct',
    url: 'https://empire8ny.com',
  },
};

export default function AboutPage() {
  return (
    <div style={{ paddingTop: 'var(--nav-height)', backgroundColor: '#0F0520' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageSchema) }}
      />

      {/* ── Hero ── */}
      <section
        style={{
          background: 'linear-gradient(168deg, #2D0A4E 0%, #4A0E78 35%, #2D0A4E 70%, #1A0633 100%)',
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '96px 24px 88px',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(200,162,60,0.12)',
        }}
      >
        {/* Gold radial glow accents */}
        <div style={{ position: 'absolute', top: '10%', right: '8%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,162,60,0.09) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,162,60,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,47,160,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <span className="label-caps e8-fade-up" style={{ color: '#C8A23C', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <span style={{ width: 28, height: 1.5, backgroundColor: '#C8A23C', display: 'inline-block', borderRadius: 99 }} />
            ABOUT US
            <span style={{ width: 28, height: 1.5, backgroundColor: '#C8A23C', display: 'inline-block', borderRadius: 99 }} />
          </span>
          <h1 className="font-display e8-fade-up-1" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.25rem)', lineHeight: 1.0, color: '#fff', marginBottom: 24 }}>
            We Make Cannabis<br />Products Sell.
          </h1>
          <p className="e8-fade-up-2" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto', lineHeight: 1.8 }}>
            Empire 8 is a wholesale-direct company combining manufacturing, high-speed logistics,
            and a proprietary AI marketing and sales platform built to move product off dispensary shelves.
          </p>
        </div>
      </section>

      {/* ── Executive Summary ── */}
      <section style={{ backgroundColor: '#0F0520', padding: '96px 24px', borderBottom: '1px solid rgba(200,162,60,0.12)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 64, alignItems: 'start' }}>
          {/* Left: text */}
          <AnimateIn>
            <span className="label-caps" style={{ color: '#C8A23C', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 24, height: 1.5, backgroundColor: '#C8A23C', display: 'inline-block', borderRadius: 99 }} />
              Who We Are
            </span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', marginTop: 14, marginBottom: 24, color: '#fff', lineHeight: 1.05 }}>
              Wholesale Direct.<br />AI Powered. Results Driven.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.85, marginBottom: 20, fontSize: '1rem' }}>
              Empire 8 is a wholesale-direct company combining manufacturing, high-speed logistics,
              and a proprietary ground-breaking AI marketing and sales platform. We don&apos;t just deliver
              product &mdash; we make it sell.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.85, marginBottom: 32, fontSize: '0.95rem' }}>
              We&apos;ve rolled our sleeves up &mdash; come see what an honest day&apos;s work with us looks like.
            </p>

            {/* What we combine */}
            <div style={{ marginBottom: 36 }}>
              <p className="label-caps" style={{ color: '#C8A23C', marginBottom: 16, fontSize: '0.65rem' }}>We Combine</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {COMBINES.map((item) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#C8A23C', flexShrink: 0 }} />
                    <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.92rem' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/dispensary-signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#C8A23C',
                color: '#fff',
                padding: '13px 28px',
                borderRadius: 9999,
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 700,
                fontSize: '0.82rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                boxShadow: '0 8px 28px rgba(200,162,60,0.30)',
              }}
            >
              Become a Partner <ArrowRight size={14} />
            </Link>
          </AnimateIn>

          {/* Right: stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {STATS.map(({ stat, label }, i) => (
              <AnimateIn key={label} delay={i * 100}>
                <div
                  className="tilt-card"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderRadius: 20,
                    padding: '36px 24px',
                    textAlign: 'center',
                    border: '1px solid rgba(200,162,60,0.12)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                >
                  <div className="font-display" style={{ fontSize: '2.5rem', color: '#C8A23C', lineHeight: 1 }}>{stat}</div>
                  <div className="label-caps" style={{ color: 'rgba(255,255,255,0.55)', marginTop: 10, fontSize: '0.68rem' }}>{label}</div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section style={{ backgroundColor: '#150A28', padding: '96px 24px', borderBottom: '1px solid rgba(200,162,60,0.12)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="label-caps" style={{ color: '#C8A23C' }}>Our Values</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginTop: 10, color: '#fff' }}>
              What Drives Empire 8
            </h2>
          </AnimateIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {VALUES.map(({ icon: Icon, title, desc }, i) => (
              <AnimateIn key={title} delay={i * 90}>
                <div
                  className="tilt-card"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderRadius: 20,
                    padding: '32px 28px',
                    borderTop: '3px solid #C8A23C',
                    border: '1px solid rgba(200,162,60,0.12)',
                    borderTopWidth: 3,
                    borderTopColor: '#C8A23C',
                    height: '100%',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ width: 52, height: 52, backgroundColor: 'rgba(200,162,60,0.1)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
                    <Icon size={24} color="#C8A23C" />
                  </div>
                  <h3 className="font-heading" style={{ fontSize: '1.1rem', marginBottom: 12, color: '#fff' }}>{title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', lineHeight: 1.75 }}>{desc}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Partner With Us CTA ── */}
      <section
        style={{
          background: 'linear-gradient(135deg, rgba(200,162,60,0.15) 0%, rgba(200,162,60,0.08) 50%, rgba(74,14,120,0.12) 100%)',
          backgroundColor: '#0F0520',
          padding: '96px 24px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative glows */}
        <div style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,162,60,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,14,120,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <AnimateIn style={{ maxWidth: 600, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <span className="label-caps" style={{ color: '#C8A23C', marginBottom: 16, display: 'block' }}>Partner With Us</span>
          <h2 className="font-display" style={{ color: '#fff', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', marginBottom: 16, lineHeight: 1.05 }}>
            Ready to Grow Your Business?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 44, fontSize: '1.05rem', lineHeight: 1.75 }}>
            Whether you&apos;re a licensed dispensary looking for reliable supply or a cannabis brand seeking
            statewide reach, we&apos;re ready to work with you.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/dispensary-signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#C8A23C',
                color: '#fff',
                padding: '14px 32px',
                borderRadius: 9999,
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 700,
                fontSize: '0.82rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                boxShadow: '0 8px 28px rgba(200,162,60,0.30)',
              }}
            >
              Dispensary Sign Up <ArrowRight size={14} />
            </Link>
            <Link
              href="/contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'transparent',
                color: '#fff',
                padding: '14px 32px',
                borderRadius: 9999,
                border: '1.5px solid rgba(255,255,255,0.28)',
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 600,
                fontSize: '0.82rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              Contact Us
            </Link>
          </div>
        </AnimateIn>
      </section>
    </div>
  );
}
