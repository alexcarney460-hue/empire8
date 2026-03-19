import Link from 'next/link';
import Image from 'next/image';

const FOOTER_LINKS = {
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Dispensary Sign Up', href: '/dispensary-signup' },
    { label: 'Contact', href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Compliance', href: '/compliance' },
  ],
};

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: 'var(--color-royal-dark)',
        color: '#fff',
        paddingTop: 64,
        paddingBottom: 40,
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        {/* Top row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 48,
            paddingBottom: 48,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* Brand col */}
          <div style={{ gridColumn: 'span 1' }} className="e8-footer-brand">
            <div style={{ marginBottom: 12, backgroundColor: '#fff', borderRadius: 8, padding: '4px 10px', display: 'inline-block' }}>
              <Image
                src="/logo.jpg"
                alt="Empire 8 Sales Direct"
                width={140}
                height={52}
                style={{ objectFit: 'contain', height: 44, width: 'auto', display: 'block' }}
              />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', lineHeight: 1.6, maxWidth: 240 }}>
              Licensed cannabis distribution serving dispensaries, processors, and cultivators across New York State.
            </p>
            <p style={{ color: 'var(--color-gold)', fontSize: '0.875rem', fontStyle: 'italic', marginTop: 12 }}>
              "Direct to Market."
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <h4
                className="label-caps"
                style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 16, fontSize: '0.7rem' }}
              >
                {group}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: '0.9rem' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Compliance section */}
        <div
          style={{
            paddingTop: 24,
            paddingBottom: 24,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: '0.78rem', lineHeight: 1.6 }}>
            For use only by adults 21 years of age and older. Keep out of reach of children.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: '0.75rem', lineHeight: 1.6 }}>
            NYS OCM Licensed Distributor | License #: [PENDING]
          </p>
          <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: '0.75rem', lineHeight: 1.6 }}>
            NY HOPEline: 1-844-863-9314 | Text HOPENY (467369)
          </p>
        </div>

        {/* Bottom row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 24,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>
            &copy; {new Date().getFullYear()} Empire 8 Sales Direct. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link
              href="/privacy"
              style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', textDecoration: 'none' }}
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', textDecoration: 'none' }}
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
