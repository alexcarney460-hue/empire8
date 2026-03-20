import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, Clock, MessageSquare, ArrowRight } from 'lucide-react';
import AnimateIn from '@/components/AnimateIn';
import ContactForm from '@/components/forms/ContactForm';

export const metadata: Metadata = {
  title: 'Contact Empire 8 Sales Direct — Cannabis Wholesale Inquiries',
  description:
    'Contact Empire 8 Sales Direct for wholesale cannabis supply, dispensary account setup, and distribution inquiries. We respond within 1 business day.',
  keywords: ['contact cannabis wholesale', 'dispensary supplier inquiry', 'cannabis distribution contact', 'Empire 8 contact'],
  openGraph: {
    title: 'Contact Empire 8 Sales Direct',
    description: 'Wholesale cannabis supply inquiries, dispensary account setup, and distribution questions. We respond within 1 business day.',
    url: 'https://empire8salesdirect.com/contact',
  },
  twitter: {
    card: 'summary',
    title: 'Contact Empire 8 Sales Direct',
    description: 'Wholesale cannabis inquiries and dispensary account setup. We respond within 1 business day.',
  },
  alternates: { canonical: 'https://empire8salesdirect.com/contact' },
};

const CONTACT_OPTIONS = [
  { icon: Mail, label: 'Email Us', value: 'info@empire8salesdirect.com', sub: 'We respond within 1 business day', href: 'mailto:info@empire8salesdirect.com' },
  { icon: Mail, label: 'Order Support', value: 'info@empire8salesdirect.com', sub: 'Mon\u2013Fri, 9am\u20135pm EST', href: 'mailto:info@empire8salesdirect.com' },
  { icon: Clock, label: 'Business Hours', value: 'Mon\u2013Fri 9am\u20135pm EST', sub: 'Orders placed after hours ship next day', href: null },
];


const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Empire 8 Sales Direct',
  url: 'https://empire8salesdirect.com',
  logo: 'https://empire8salesdirect.com/logo.jpg',
  image: 'https://empire8salesdirect.com/og-image.jpg',
  description:
    'Licensed cannabis wholesale supplier and distributor serving dispensaries across New York State. Premium flower, concentrates, edibles, and accessories.',
  telephone: '+1-800-000-0000',
  email: 'info@empire8salesdirect.com',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'New York',
    addressRegion: 'NY',
    postalCode: '10001',
    addressCountry: 'US',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 40.7128,
    longitude: -74.0060,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '17:00',
    },
  ],
  priceRange: '$$',
  paymentAccepted: 'Credit Card, Debit Card',
  currenciesAccepted: 'USD',
  sameAs: [],
  areaServed: {
    '@type': 'State',
    name: 'New York',
  },
  makesOffer: [
    {
      '@type': 'Offer',
      itemOffered: { '@type': 'Product', name: 'Premium Cannabis Flower', category: 'Cannabis Wholesale' },
    },
    {
      '@type': 'Offer',
      itemOffered: { '@type': 'Product', name: 'Cannabis Concentrates', category: 'Cannabis Wholesale' },
    },
    {
      '@type': 'Offer',
      itemOffered: { '@type': 'Product', name: 'Cannabis Edibles', category: 'Cannabis Wholesale' },
    },
    {
      '@type': 'Offer',
      itemOffered: { '@type': 'Product', name: 'Pre-Rolls & Vape Cartridges', category: 'Cannabis Wholesale' },
    },
    {
      '@type': 'Offer',
      itemOffered: { '@type': 'Product', name: 'Cannabis Accessories', category: 'Cannabis Wholesale' },
    },
  ],
};

export default function ContactPage() {
  return (
    <div style={{ paddingTop: 'var(--nav-height)', backgroundColor: '#0F0520', minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      {/* Hero */}
      <section style={{ backgroundColor: '#0F0520', padding: '72px 24px 80px', position: 'relative', overflow: 'hidden', borderBottom: '1px solid rgba(200,162,60,0.12)' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '5%', width: 480, height: 480, borderRadius: '50%', background: 'rgba(200,146,42,0.07)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <span className="label-caps" style={{ color: 'var(--color-gold)', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ width: 24, height: 1.5, backgroundColor: 'var(--color-gold)', display: 'inline-block', borderRadius: 99 }} />
            Get in Touch
            <span style={{ width: 24, height: 1.5, backgroundColor: 'var(--color-gold)', display: 'inline-block', borderRadius: 99 }} />
          </span>
          <h1 className="font-display" style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', lineHeight: 1.0, color: '#fff', marginBottom: 20 }}>
            We&apos;re Here to Help.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', maxWidth: 500, margin: '0 auto', lineHeight: 1.8 }}>
            Questions about an order, product availability, or setting up a wholesale account — reach out and we&apos;ll get back to you fast.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'start' }}>

          {/* Left -- contact info */}
          <div>
            <AnimateIn>
              <h2 className="font-heading" style={{ fontSize: '1.25rem', marginBottom: 28, color: '#fff' }}>
                Contact Info
              </h2>
            </AnimateIn>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
              {CONTACT_OPTIONS.map(({ icon: Icon, label, value, sub, href }, i) => (
                <AnimateIn key={label} delay={i * 80}>
                  <div
                    className="tilt-card"
                    style={{
                      display: 'flex',
                      gap: 16,
                      alignItems: 'flex-start',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      borderRadius: 16,
                      padding: '20px 20px',
                      border: '1px solid rgba(200,162,60,0.12)',
                      boxShadow: 'var(--shadow-xs)',
                    }}
                  >
                    <div style={{ width: 44, height: 44, backgroundColor: 'var(--color-purple-light)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={20} color="var(--color-royal)" />
                    </div>
                    <div>
                      <div className="label-caps" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.68rem', marginBottom: 4 }}>{label}</div>
                      {href ? (
                        <a href={href} style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none' }}>{value}</a>
                      ) : (
                        <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>{value}</div>
                      )}
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginTop: 2 }}>{sub}</div>
                    </div>
                  </div>
                </AnimateIn>
              ))}
            </div>

            {/* Wholesale callout */}
            <AnimateIn delay={300}>
              <div
                className="e8-dot-grid"
                style={{ backgroundColor: 'var(--color-royal)', borderRadius: 20, padding: '28px 24px', color: '#fff', position: 'relative', overflow: 'hidden' }}
              >
                <MessageSquare size={24} color="var(--color-gold)" style={{ marginBottom: 12 }} />
                <h3 className="font-heading" style={{ fontSize: '1rem', marginBottom: 8 }}>Applying for Wholesale?</h3>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: 20 }}>
                  Use our dedicated wholesale application for faster processing and access to volume pricing.
                </p>
                <Link
                  href="/dispensary-signup"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: 'var(--color-gold)',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: 9999,
                    fontFamily: "'Barlow', Arial, sans-serif",
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    boxShadow: 'var(--shadow-gold)',
                  }}
                >
                  Wholesale Application <ArrowRight size={12} />
                </Link>
              </div>
            </AnimateIn>
          </div>

          {/* Right -- contact form */}
          <AnimateIn delay={100}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: '44px 40px', border: '1px solid rgba(200,162,60,0.12)', boxShadow: 'var(--shadow-sm)' }}>
              <h2 className="font-heading" style={{ fontSize: '1.25rem', marginBottom: 8, color: '#fff' }}>Send a Message</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginBottom: 28 }}>
                We&apos;ll get back to you within 1 business day.
              </p>

              <ContactForm />
            </div>
          </AnimateIn>

        </div>
      </div>
    </div>
  );
}
