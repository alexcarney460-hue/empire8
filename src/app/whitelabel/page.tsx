import type { Metadata } from 'next';
import Link from 'next/link';
import { Palette, Package, Shield, Truck, Sparkles, ArrowRight } from 'lucide-react';
import AnimateIn from '@/components/AnimateIn';
import WhiteLabelForm from '@/components/forms/WhiteLabelForm';

export const metadata: Metadata = {
  title: 'White Label Cannabis Products | Launch Your Brand',
  description:
    'Launch your own cannabis brand with Empire 8. We handle manufacturing, compliance, packaging, and distribution across New York State. Your brand, our infrastructure.',
  keywords: [
    'white label cannabis',
    'private label cannabis NY',
    'cannabis brand creation',
    'white label vapes',
    'white label edibles',
    'cannabis manufacturing NY',
    'launch cannabis brand new york',
  ],
  openGraph: {
    title: 'White Label Cannabis Products | Launch Your Brand | Empire 8',
    description:
      'Launch your own cannabis brand with Empire 8. Manufacturing, compliance, packaging, and statewide distribution.',
    url: 'https://empire8ny.com/whitelabel',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'White Label Cannabis Products — Empire 8' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'White Label Cannabis Products | Empire 8',
    description:
      'Launch your cannabis brand with Empire 8. Manufacturing, compliance, and NY statewide distribution.',
    images: ['/og-image.jpg'],
  },
  alternates: { canonical: 'https://empire8ny.com/whitelabel' },
};

const SERVICES = [
  {
    icon: Palette,
    title: 'Custom Branding',
    desc: 'Your brand name, logo, and packaging design on premium cannabis products. Full creative control with our design support.',
  },
  {
    icon: Package,
    title: 'Product Development',
    desc: 'Choose from vapes, pre-rolls, edibles, flower, concentrates, tinctures, and more. We formulate and manufacture to your specs.',
  },
  {
    icon: Shield,
    title: 'Full Compliance',
    desc: 'Every product meets NYS OCM regulations. We handle testing, labeling, child-resistant packaging, and all compliance requirements.',
  },
  {
    icon: Truck,
    title: 'Statewide Distribution',
    desc: 'Your white label products distributed to dispensaries across all 62 New York counties through our existing network.',
  },
  {
    icon: Sparkles,
    title: 'Low Minimums',
    desc: 'Start your brand without massive upfront investment. Flexible minimum order quantities to get your products to market fast.',
  },
];

export default function WhiteLabelPage() {
  return (
    <div style={{ paddingTop: 'var(--nav-height)', backgroundColor: '#0F0520', minHeight: '100vh' }}>

      {/* Hero */}
      <section
        style={{
          background: 'linear-gradient(168deg, #2D0A4E 0%, #4A0E78 35%, #2D0A4E 70%, #1A0633 100%)',
          padding: '80px 24px 88px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: '-20%', right: '5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,162,60,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <span className="label-caps" style={{ color: '#C8A23C', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ width: 24, height: 1.5, backgroundColor: '#C8A23C', display: 'inline-block', borderRadius: 99 }} />
            White Label Program
            <span style={{ width: 24, height: 1.5, backgroundColor: '#C8A23C', display: 'inline-block', borderRadius: 99 }} />
          </span>
          <h1 className="font-display" style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', lineHeight: 1.0, color: '#fff', marginBottom: 20 }}>
            Launch Your Own Cannabis Brand
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', maxWidth: 580, margin: '0 auto', lineHeight: 1.8 }}>
            Empire 8 provides end-to-end white label services for cannabis entrepreneurs.
            We manufacture, package, and distribute your branded products across New York State.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ backgroundColor: '#0F0520', padding: '80px 24px', borderBottom: '1px solid rgba(200,162,60,0.1)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 52 }}>
            <span className="label-caps" style={{ color: '#C8A23C' }}>How It Works</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginTop: 10, color: '#fff' }}>
              Your Brand. Our Infrastructure.
            </h2>
          </AnimateIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 24 }}>
            {['Choose Products', 'Design Your Brand', 'We Manufacture', 'Compliance & Testing', 'Distribution'].map((step, i) => (
              <AnimateIn key={step} delay={i * 80}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    backgroundColor: 'rgba(200,162,60,0.15)', color: '#C8A23C',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px', fontSize: '1.1rem', fontWeight: 800,
                  }}>
                    {i + 1}
                  </div>
                  <p style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 600 }}>{step}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section style={{ backgroundColor: '#150A28', padding: '80px 24px', borderBottom: '1px solid rgba(200,162,60,0.1)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 52 }}>
            <span className="label-caps" style={{ color: '#C8A23C' }}>What We Provide</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginTop: 10, color: '#fff' }}>
              Everything You Need to Launch
            </h2>
          </AnimateIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {SERVICES.map(({ icon: Icon, title, desc }, i) => (
              <AnimateIn key={title} delay={i * 75}>
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: 20, padding: '28px 24px',
                  border: '1px solid rgba(200,162,60,0.12)',
                  borderTop: '3px solid #C8A23C', height: '100%',
                }}>
                  <div style={{ width: 48, height: 48, backgroundColor: 'rgba(200,162,60,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                    <Icon size={22} color="#C8A23C" />
                  </div>
                  <h3 className="font-heading" style={{ fontSize: '1rem', marginBottom: 8, color: '#fff' }}>{title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>{desc}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section
        style={{
          background: 'linear-gradient(168deg, #1A0633 0%, #2D0A4E 50%, #1A0633 100%)',
          padding: '80px 24px',
          borderBottom: '1px solid rgba(200,162,60,0.1)',
        }}
      >
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 44 }}>
            <span className="label-caps" style={{ color: '#C8A23C' }}>Apply Now</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginTop: 10, color: '#fff' }}>
              White Label Application
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', marginTop: 12, maxWidth: 520, margin: '12px auto 0', lineHeight: 1.7 }}>
              Tell us about your brand vision. Our team will reach out within 2 business days to discuss your project.
            </p>
          </AnimateIn>
          <AnimateIn>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(200,162,60,0.15)', borderRadius: 24, padding: '44px 40px' }}>
              <WhiteLabelForm />
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          background: 'linear-gradient(135deg, #4A0E78 0%, #2D0A4E 100%)',
          padding: '80px 24px', textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <AnimateIn style={{ maxWidth: 560, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h2 className="font-display" style={{ color: '#fff', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: 16, lineHeight: 1.05 }}>
            Already a Dispensary?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 36, lineHeight: 1.75 }}>
            Sign up as a dispensary partner to order from our existing brand portfolio.
          </p>
          <Link
            href="/dispensary-signup"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              backgroundColor: '#C8A23C', color: '#1A0633',
              padding: '14px 32px', borderRadius: 9999,
              fontFamily: "'Barlow', Arial, sans-serif", fontWeight: 700,
              fontSize: '0.82rem', letterSpacing: '0.12em',
              textTransform: 'uppercase', textDecoration: 'none',
              boxShadow: '0 4px 24px rgba(200,162,60,0.35)',
            }}
          >
            Dispensary Sign Up <ArrowRight size={14} />
          </Link>
        </AnimateIn>
      </section>

      {/* Compliance */}
      <section style={{ backgroundColor: '#0A0418', padding: '32px 24px', borderTop: '1px solid rgba(200,162,60,0.1)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', lineHeight: 1.8, margin: 0 }}>
            For use only by adults 21 years of age and older. Empire 8 Sales Direct does not make health or medical claims about cannabis products. NYS OCM Licensed Distributor.
          </p>
        </div>
      </section>
    </div>
  );
}
