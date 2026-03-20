import Link from 'next/link';
import Image from 'next/image';

const COMPANY_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'Dispensary Sign Up', href: '/dispensary-signup' },
  { label: 'Contact', href: '/contact' },
];

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Compliance', href: '/compliance' },
];

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: '#1A0830',
        color: '#fff',
        paddingTop: 56,
        paddingBottom: 32,
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        {/* Top section: Logo + Links */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 48,
            paddingBottom: 40,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Brand */}
          <div style={{ flex: '1 1 280px', minWidth: 200 }}>
            <Image
              src="/logo.png"
              alt="Empire 8 Sales Direct"
              width={280}
              height={105}
              style={{ objectFit: 'contain', height: 90, width: 'auto', display: 'block', marginBottom: 16 }}
            />
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: 1.65, maxWidth: 280 }}>
              Licensed cannabis wholesale serving dispensaries across all 62 New York counties.
            </p>
          </div>

          {/* Company links */}
          <div style={{ flex: '0 0 auto', minWidth: 140 }}>
            <h4
              className="label-caps"
              style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 16, fontSize: '0.68rem' }}
            >
              Company
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.88rem' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div style={{ flex: '0 0 auto', minWidth: 140 }}>
            <h4
              className="label-caps"
              style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 16, fontSize: '0.68rem' }}
            >
              Legal
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.88rem' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Compliance notices */}
        <div style={{ paddingTop: 20, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', lineHeight: 1.7, marginBottom: 4 }}>
            For use only by adults 21 years of age and older. Keep out of reach of children.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', lineHeight: 1.7, marginBottom: 4 }}>
            NYS OCM Licensed Distributor | License #: [PENDING]
          </p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', lineHeight: 1.7 }}>
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
            paddingTop: 20,
            gap: 12,
          }}
        >
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>
            &copy; {new Date().getFullYear()} Empire 8 Sales Direct. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
