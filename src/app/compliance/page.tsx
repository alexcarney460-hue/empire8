import type { Metadata } from 'next';
import Link from 'next/link';

const PURPLE = '#4A0E78';
const PURPLE_DARK = '#2D0849';
const GOLD = '#C8A23C';

export const metadata: Metadata = {
  title: 'Compliance — Empire 8 Sales Direct',
  description:
    'Empire 8 Sales Direct compliance statement. NYS OCM licensed adult-use cannabis distributor operating in full compliance with 9 NYCRR Parts 128 & 129.',
  robots: { index: true, follow: true },
};

const HEALTH_WARNINGS = [
  'Cannabis can impair concentration and coordination. Do not operate a vehicle or machinery under the influence of cannabis.',
  'Cannabis smoke contains chemicals known to the State of New York to cause cancer.',
  'Use of cannabis during pregnancy or breastfeeding may be harmful. Consult your physician.',
  'Keep cannabis products out of the reach of children and pets.',
  'Cannabis can be addictive. If you or someone you know has a problem with cannabis, please contact the NY HOPEline at 1-844-863-9314.',
];

function getRotatingWarning(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return HEALTH_WARNINGS[dayOfYear % HEALTH_WARNINGS.length];
}

const sectionStyle: React.CSSProperties = {
  marginBottom: 48,
};

const headingStyle: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif",
  fontWeight: 700,
  fontSize: '1.3rem',
  color: PURPLE,
  marginBottom: 16,
  letterSpacing: '0.01em',
};

const textStyle: React.CSSProperties = {
  color: '#444',
  fontSize: '0.95rem',
  lineHeight: 1.8,
  marginBottom: 12,
};

export default function CompliancePage() {
  const healthWarning = getRotatingWarning();

  return (
    <div style={{ paddingTop: 'var(--nav-height)', backgroundColor: '#fff', minHeight: '100vh' }}>

      {/* Hero */}
      <section
        style={{
          backgroundColor: PURPLE_DARK,
          padding: '72px 24px 64px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '10%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: `rgba(200,162,60,0.06)`,
            filter: 'blur(80px)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <span
            style={{
              fontFamily: "'Barlow', Arial, sans-serif",
              fontWeight: 700,
              fontSize: '0.72rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: GOLD,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 20,
            }}
          >
            <span style={{ width: 24, height: 1.5, backgroundColor: GOLD, display: 'inline-block', borderRadius: 99 }} />
            Regulatory Compliance
            <span style={{ width: 24, height: 1.5, backgroundColor: GOLD, display: 'inline-block', borderRadius: 99 }} />
          </span>
          <h1
            style={{
              fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              lineHeight: 1.05,
              color: '#fff',
              marginBottom: 16,
            }}
          >
            Compliance Statement
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
            Empire 8 Sales Direct operates in full compliance with New York State cannabis regulations.
          </p>
        </div>
      </section>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 24px 96px' }}>

        {/* License Info */}
        <div style={sectionStyle}>
          <h2 style={headingStyle}>License Information</h2>
          <div
            style={{
              backgroundColor: '#FAFAFA',
              border: '1px solid #E4E1DB',
              borderRadius: 16,
              padding: '28px 28px',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px 16px', fontSize: '0.95rem' }}>
              <span style={{ color: '#888', fontWeight: 600 }}>Company</span>
              <span style={{ color: '#1C1C1C', fontWeight: 600 }}>Empire 8 Sales Direct</span>

              <span style={{ color: '#888', fontWeight: 600 }}>License Type</span>
              <span style={{ color: '#1C1C1C' }}>Adult-Use Cannabis Distributor (NYS OCM)</span>

              <span style={{ color: '#888', fontWeight: 600 }}>License #</span>
              <span style={{ color: '#1C1C1C' }}>[PENDING APPLICATION]</span>

              <span style={{ color: '#888', fontWeight: 600 }}>Jurisdiction</span>
              <span style={{ color: '#1C1C1C' }}>New York State Office of Cannabis Management</span>
            </div>
          </div>
        </div>

        {/* Regulatory Compliance */}
        <div style={sectionStyle}>
          <h2 style={headingStyle}>Regulatory Compliance</h2>
          <p style={textStyle}>
            Empire 8 Sales Direct operates in full compliance with the New York State Marijuana
            Regulation and Taxation Act (MRTA) and all applicable regulations set forth in
            9 NYCRR Parts 128 and 129, as administered by the New York State Office of Cannabis Management (OCM).
          </p>
          <p style={textStyle}>
            Empire 8 Sales Direct is a B2B cannabis distribution company. We do not sell directly to consumers.
          </p>
        </div>

        {/* Age Restriction */}
        <div style={sectionStyle}>
          <h2 style={headingStyle}>Age Restriction</h2>
          <p style={textStyle}>
            For use only by adults 21 years of age and older. It is illegal to sell cannabis products
            to individuals under the age of 21 in the State of New York.
          </p>
        </div>

        {/* Disclaimers */}
        <div style={sectionStyle}>
          <h2 style={headingStyle}>Disclaimers</h2>
          <p style={textStyle}>
            This site does not make any health or medical claims about cannabis products. Cannabis has
            not been analyzed or approved by the Food and Drug Administration (FDA). Information
            presented on this website is for informational purposes only and is not intended as a
            substitute for professional medical advice.
          </p>
        </div>

        {/* Health Warning */}
        <div style={sectionStyle}>
          <h2 style={headingStyle}>Health Warning</h2>
          <div
            style={{
              backgroundColor: 'rgba(74,14,120,0.04)',
              border: `1px solid rgba(74,14,120,0.15)`,
              borderRadius: 12,
              padding: '20px 24px',
            }}
          >
            <p style={{ ...textStyle, color: PURPLE, fontWeight: 600, marginBottom: 0 }}>
              {healthWarning}
            </p>
          </div>
        </div>

        {/* Emergency Resources */}
        <div style={sectionStyle}>
          <h2 style={headingStyle}>Emergency Resources</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{
                backgroundColor: '#FAFAFA',
                border: '1px solid #E4E1DB',
                borderRadius: 12,
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: '#1C1C1C', fontSize: '0.95rem' }}>Poison Control</div>
                <div style={{ color: '#888', fontSize: '0.85rem' }}>For cannabis-related emergencies</div>
              </div>
              <a
                href="tel:1-800-222-1222"
                style={{ color: PURPLE, fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}
              >
                1-800-222-1222
              </a>
            </div>
            <div
              style={{
                backgroundColor: '#FAFAFA',
                border: '1px solid #E4E1DB',
                borderRadius: 12,
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: '#1C1C1C', fontSize: '0.95rem' }}>NY HOPEline</div>
                <div style={{ color: '#888', fontSize: '0.85rem' }}>Substance use support &amp; referrals</div>
              </div>
              <a
                href="tel:1-844-863-9314"
                style={{ color: PURPLE, fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}
              >
                1-844-863-9314
              </a>
            </div>
          </div>
        </div>

        {/* OCM Link */}
        <div style={sectionStyle}>
          <h2 style={headingStyle}>Regulatory Authority</h2>
          <p style={textStyle}>
            For more information about cannabis regulation in New York State, visit the
            Office of Cannabis Management:{' '}
            <a
              href="https://cannabis.ny.gov"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: PURPLE, fontWeight: 600, textDecoration: 'underline' }}
            >
              cannabis.ny.gov
            </a>
          </p>
        </div>

        {/* Footer links */}
        <div
          style={{
            borderTop: '1px solid #E4E1DB',
            paddingTop: 32,
            display: 'flex',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <Link href="/privacy" style={{ color: PURPLE, fontSize: '0.9rem', textDecoration: 'none', fontWeight: 600 }}>
            Privacy Policy
          </Link>
          <Link href="/terms" style={{ color: PURPLE, fontSize: '0.9rem', textDecoration: 'none', fontWeight: 600 }}>
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
