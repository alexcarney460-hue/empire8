import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Shield, Users, Calendar, MapPin, ClipboardList } from 'lucide-react';
import AnimateIn from '@/components/AnimateIn';

export const metadata: Metadata = {
  title: 'Cannabis Trimming Services — Licensed Onsite Crews',
  description:
    'Hire licensed and bonded cannabis trimming crews for your facility. Onsite trimming services with full compliance documentation. Book by the day or harvest run.',
  keywords: ['cannabis trimming services', 'onsite trimming crew', 'licensed trimming service', 'cannabis harvest service', 'contract trimming', 'trimming labor cannabis'],
  openGraph: {
    title: 'Cannabis Trimming Services — Licensed Onsite Crews',
    description: 'Licensed and bonded onsite trimming crews for cannabis grows. Full compliance documentation included. Get a quote today.',
    url: 'https://empire8salesdirect.com/services',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cannabis Trimming Services | Empire 8 Sales Direct',
    description: 'Licensed and bonded onsite trimming crews. Professional trimmers for your facility on your schedule.',
  },
  alternates: { canonical: 'https://empire8salesdirect.com/services' },
};

const FEATURES = [
  { icon: Shield, title: 'Licensed & Bonded', desc: 'Every member of our trimming crew is fully licensed and bonded. We carry liability insurance and operate in full compliance with state regulations.' },
  { icon: Users, title: 'Experienced Crews', desc: 'Our trimmers are trained professionals — not day labor. Consistent technique, consistent output, every harvest.' },
  { icon: BadgeCheck, title: 'Quality Guaranteed', desc: "We stand behind our work. Every job is supervised by a crew lead. We don't leave until the work meets standard." },
  { icon: Calendar, title: 'Flexible Scheduling', desc: 'Book by the day, week, or full harvest run. We work around your harvest timeline, not the other way around.' },
  { icon: MapPin, title: 'We Come to You', desc: 'Fully onsite service — we bring the team, the tools, and the supplies. Your facility, your rules.' },
  { icon: ClipboardList, title: 'Full Compliance Documentation', desc: 'We provide crew licensing documentation, insurance certificates, and chain-of-custody records for your compliance files.' },
];

const PROCESS = [
  { step: '01', title: 'Request a Quote', desc: "Tell us your harvest size, timeline, and location. We'll respond within 1 business day with a rate and availability." },
  { step: '02', title: 'Confirm & Schedule', desc: 'We lock in your dates, confirm crew size, and send all compliance documentation for your records.' },
  { step: '03', title: 'We Show Up Ready', desc: 'Crew arrives on time with all equipment and supplies. Your facility, your protocols — we follow your lead.' },
  { step: '04', title: 'Work Gets Done', desc: 'We trim to spec, maintain a clean workspace, and brief you at the end of each day on progress and yield.' },
];

const WHO = [
  { title: 'Licensed Cannabis Grows', desc: 'State-licensed cultivators that need reliable, compliant trim crews at harvest.' },
  { title: 'Commercial Greenhouses', desc: 'High-volume operations with tight harvest windows and no time to waste.' },
  { title: 'Craft Cultivators', desc: 'Smaller craft grows that want professional-quality trim without full-time staff overhead.' },
  { title: 'Processing Facilities', desc: 'Post-harvest processors looking for consistent throughput and clean documentation.' },
];

export default function ServicesPage() {
  return (
    <div style={{ paddingTop: 'var(--nav-height)', backgroundColor: '#fff', minHeight: '100vh' }}>

      {/* Hero */}
      <section style={{ backgroundColor: '#fff', padding: '72px 24px 80px', position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '5%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(200,146,42,0.07)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '3%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(27,58,45,0.05)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <span className="label-caps" style={{ color: 'var(--color-gold)', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ width: 24, height: 1.5, backgroundColor: 'var(--color-gold)', display: 'inline-block', borderRadius: 99 }} />
            Onsite Trimming Services
            <span style={{ width: 24, height: 1.5, backgroundColor: 'var(--color-gold)', display: 'inline-block', borderRadius: 99 }} />
          </span>
          <h1 className="font-display" style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', lineHeight: 1.0, color: 'var(--color-charcoal)', marginBottom: 20 }}>
            Professional Trim Crews.{' '}
            <span style={{ color: 'var(--color-royal)' }}>Licensed & Bonded.</span>
          </h1>
          <p style={{ color: 'var(--color-warm-gray)', fontSize: '1.05rem', maxWidth: 540, margin: '0 auto 40px', lineHeight: 1.8 }}>
            We bring a trained, licensed, and bonded trimming crew directly to your facility.
            Professional output, full compliance documentation, and zero headache.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/contact"
              style={{
                backgroundColor: 'var(--color-gold)',
                color: '#fff',
                padding: '14px 30px',
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
                boxShadow: 'var(--shadow-gold)',
              }}
            >
              Request a Quote <ArrowRight size={14} />
            </Link>
            <a
              href="mailto:info@empire8salesdirect.com"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--color-charcoal)',
                padding: '14px 30px',
                borderRadius: 9999,
                border: '1.5px solid var(--color-border)',
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 600,
                fontSize: '0.82rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              Email to Schedule
            </a>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div style={{ backgroundColor: 'var(--color-royal)', padding: '18px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
          {['Licensed & Bonded', 'Fully Insured', 'State Compliant', 'Onsite — We Come to You'].map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BadgeCheck size={15} color="var(--color-gold)" />
              <span className="label-caps" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.68rem' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section style={{ backgroundColor: '#FAFAFA', padding: '80px 24px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 52 }}>
            <span className="label-caps" style={{ color: 'var(--color-gold)' }}>What We Provide</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginTop: 10, color: 'var(--color-charcoal)' }}>
              Everything Handled. Nothing Left Out.
            </h2>
          </AnimateIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <AnimateIn key={title} delay={i * 75}>
                <div
                  className="tilt-card"
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 20,
                    padding: '28px 24px',
                    border: '1px solid var(--color-border)',
                    height: '100%',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <div style={{ width: 48, height: 48, backgroundColor: 'var(--color-purple-light)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                    <Icon size={22} color="var(--color-royal)" />
                  </div>
                  <h3 className="font-heading" style={{ fontSize: '1rem', marginBottom: 10, color: 'var(--color-charcoal)' }}>{title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-warm-gray)', lineHeight: 1.7 }}>{desc}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ backgroundColor: '#fff', padding: '80px 24px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="label-caps" style={{ color: 'var(--color-gold)' }}>The Process</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginTop: 10, color: 'var(--color-charcoal)' }}>
              How It Works
            </h2>
          </AnimateIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
            {PROCESS.map(({ step, title, desc }, i) => (
              <AnimateIn key={step} delay={i * 90}>
                <div>
                  <div className="font-display" style={{ fontSize: '3.5rem', color: 'var(--color-border)', lineHeight: 1, marginBottom: 12 }}>
                    {step}
                  </div>
                  <h3 className="font-heading" style={{ fontSize: '1rem', marginBottom: 10, color: 'var(--color-charcoal)' }}>{title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-warm-gray)', lineHeight: 1.7 }}>{desc}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section style={{ backgroundColor: '#FAFAFA', padding: '80px 24px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="label-caps" style={{ color: 'var(--color-gold)' }}>Who We Work With</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginTop: 10, color: 'var(--color-charcoal)' }}>
              Built for Commercial Operations
            </h2>
          </AnimateIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {WHO.map(({ title, desc }, i) => (
              <AnimateIn key={title} delay={i * 80}>
                <div
                  className="tilt-card"
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 20,
                    padding: '28px 24px',
                    border: '1px solid var(--color-border)',
                    borderTop: '3px solid var(--color-royal)',
                    height: '100%',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <h3 className="font-heading" style={{ fontSize: '0.95rem', marginBottom: 10, color: 'var(--color-royal)' }}>{title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-warm-gray)', lineHeight: 1.6 }}>{desc}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="e8-dot-grid"
        style={{ backgroundColor: 'var(--color-royal)', padding: '96px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 300, borderRadius: '50%', background: 'rgba(200,146,42,0.09)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <AnimateIn style={{ maxWidth: 560, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <span className="label-caps" style={{ color: 'rgba(200,146,42,0.85)', display: 'block', marginBottom: 16 }}>Get a Quote</span>
          <h2 className="font-display" style={{ color: '#fff', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', marginBottom: 16, lineHeight: 1.05 }}>
            Ready to Book a Crew?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 40, fontSize: '1.05rem', lineHeight: 1.75 }}>
            Tell us your harvest size and timeline and we&apos;ll get you a quote within 24 hours. No commitment required.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'var(--color-gold)',
                color: '#fff',
                padding: '14px 32px',
                borderRadius: 9999,
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 700,
                fontSize: '0.82rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                boxShadow: 'var(--shadow-gold)',
              }}
            >
              Request a Quote <ArrowRight size={14} />
            </Link>
            <Link
              href="/catalog"
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
              Shop Supplies
            </Link>
          </div>
        </AnimateIn>
      </section>

    </div>
  );
}
