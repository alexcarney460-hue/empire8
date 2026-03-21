'use client';

import Link from 'next/link';
import Image from 'next/image';

const QUICK_LINKS = [
  { label: 'Catalog', href: '/marketplace' },
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Brands', href: '/brands' },
  { label: 'About', href: '/about' },
];

const BUSINESS_LINKS = [
  { label: 'Dispensary Signup', href: '/dispensary-signup' },
  { label: 'Wholesale', href: '/whitelabel' },
  { label: 'Brand Partners', href: '/brands' },
  { label: 'Contact', href: '/contact' },
];

const LEGAL_LINKS = [
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Compliance', href: '/compliance' },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<{ label: string; href: string }>;
}) {
  return (
    <div style={{ minWidth: 140 }}>
      <h4
        className="label-caps"
        style={{
          color: 'var(--color-gold)',
          marginBottom: 20,
          fontSize: '0.68rem',
          letterSpacing: '0.22em',
        }}
      >
        {title}
      </h4>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              style={{
                color: 'rgba(255,255,255,0.55)',
                textDecoration: 'none',
                fontSize: '0.88rem',
                transition: 'color 150ms ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#fff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.55)'; }}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function FooterRedesign() {
  return (
    <footer
      style={{
        backgroundColor: '#0A0418',
        color: '#fff',
        borderTop: '1px solid rgba(200,162,60,0.1)',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px 0' }}>
        {/* Main grid */}
        <div
          className="e8-footer-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
            gap: 48,
            paddingBottom: 48,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Column 1: Brand */}
          <div className="e8-footer-brand">
            <Image
              src="/logo.png"
              alt="Empire 8 Sales Direct"
              width={280}
              height={105}
              style={{
                objectFit: 'contain',
                height: 60,
                width: 'auto',
                display: 'block',
                marginBottom: 18,
              }}
            />
            <p
              style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '1.05rem',
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 600,
                lineHeight: 1.5,
                marginBottom: 8,
              }}
            >
              We Make Cannabis Products Sell
            </p>
            <p
              className="label-caps"
              style={{
                color: 'var(--color-gold)',
                fontSize: '0.62rem',
                letterSpacing: '0.2em',
                opacity: 0.7,
              }}
            >
              Licensed OCM Distributor
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <FooterColumn title="Quick Links" links={QUICK_LINKS} />

          {/* Column 3: Business */}
          <FooterColumn title="Business" links={BUSINESS_LINKS} />

          {/* Column 4: Legal */}
          <FooterColumn title="Legal" links={LEGAL_LINKS} />
        </div>

        {/* Compliance notices */}
        <div style={{ paddingTop: 24, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', lineHeight: 1.7, marginBottom: 4 }}>
            For use only by adults 21 years of age and older. Keep out of reach of children.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', lineHeight: 1.7, marginBottom: 4 }}>
            NYS OCM Licensed Distributor | License #: [PENDING]
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', lineHeight: 1.7 }}>
            NY HOPEline: 1-844-863-9314 | Text HOPENY (467369)
          </p>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 0 32px',
            gap: 12,
          }}
        >
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.78rem' }}>
            &copy; {new Date().getFullYear()} Empire 8 Sales Direct. All rights reserved.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>
            empire8ny.com
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .e8-footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 560px) {
          .e8-footer-grid {
            grid-template-columns: 1fr !important;
            gap: 36px !important;
          }
        }
      `}</style>
    </footer>
  );
}
