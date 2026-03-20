import type { Metadata } from 'next';
import Link from 'next/link';

const PURPLE = '#4A0E78';
const PURPLE_DARK = '#2D0849';
const GOLD = '#C8A23C';

export const metadata: Metadata = {
  title: 'Terms of Service — Empire 8 Sales Direct',
  description:
    'Terms of service for Empire 8 Sales Direct. B2B cannabis distribution services in New York State, governed by NYS cannabis regulations.',
  robots: { index: true, follow: true },
};

const sectionStyle: React.CSSProperties = {
  marginBottom: 48,
};

const headingStyle: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif",
  fontWeight: 700,
  fontSize: '1.3rem',
  color: GOLD,
  marginBottom: 16,
  letterSpacing: '0.01em',
};

const textStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.6)',
  fontSize: '0.95rem',
  lineHeight: 1.8,
  marginBottom: 12,
};

const listStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.6)',
  fontSize: '0.95rem',
  lineHeight: 1.8,
  paddingLeft: 24,
  marginBottom: 12,
};

export default function TermsPage() {
  return (
    <div style={{ paddingTop: 'var(--nav-height)', backgroundColor: '#0F0520', minHeight: '100vh' }}>

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
            bottom: '-20%',
            right: '15%',
            width: 350,
            height: 350,
            borderRadius: '50%',
            background: 'rgba(200,162,60,0.06)',
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
            Legal
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
            Terms of Service
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
            Last updated: March 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 24px 96px' }}>

        <div style={sectionStyle}>
          <p style={textStyle}>
            Welcome to the Empire 8 Sales Direct website. By accessing or using this website, you
            agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to
            these Terms, please do not use this website.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>1. Age Requirement</h2>
          <p style={textStyle}>
            You must be at least 21 years of age to access this website. By using this site, you
            represent and warrant that you are 21 years of age or older. Age verification is required
            upon entry in compliance with 9 NYCRR 129.2(l). Any misrepresentation of age is a violation
            of these Terms and may be subject to legal consequences.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>2. B2B Services Only</h2>
          <p style={textStyle}>
            Empire 8 Sales Direct is a business-to-business (B2B) cannabis distribution company
            operating in the State of New York. Our services are designed exclusively for licensed
            cannabis businesses including, but not limited to, licensed retailers, processors,
            and other distributors.
          </p>
          <p style={textStyle}>
            This website and our services are not intended for direct consumer purchases. We do not
            sell cannabis or cannabis products directly to individual consumers.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>3. Service Description</h2>
          <p style={textStyle}>
            Empire 8 Sales Direct provides cannabis distribution services in the State of New York,
            including:
          </p>
          <ul style={listStyle}>
            <li>Distribution of licensed cannabis products to authorized retailers and businesses</li>
            <li>Supply chain and logistics management for cannabis products</li>
            <li>B2B sales facilitation between licensed cannabis operators</li>
            <li>Compliance-focused distribution ensuring regulatory adherence</li>
          </ul>
          <p style={textStyle}>
            All services are subject to valid New York State cannabis licensing and regulatory
            requirements administered by the Office of Cannabis Management (OCM).
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>4. Regulatory Compliance</h2>
          <p style={textStyle}>
            Empire 8 Sales Direct operates in compliance with all applicable New York State cannabis
            laws and regulations, including but not limited to:
          </p>
          <ul style={listStyle}>
            <li>The Marijuana Regulation and Taxation Act (MRTA)</li>
            <li>9 NYCRR Part 128 — General Provisions</li>
            <li>9 NYCRR Part 129 — Adult-Use Cannabis</li>
            <li>All rules, guidance, and directives issued by the NYS Office of Cannabis Management</li>
          </ul>
          <p style={textStyle}>
            By engaging with our services, you agree to comply with all applicable cannabis regulations
            in your jurisdiction and to maintain all required licenses and permits.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>5. No Medical or Health Claims</h2>
          <p style={textStyle}>
            Empire 8 Sales Direct makes no medical or health claims regarding cannabis or cannabis
            products. Nothing on this website should be construed as medical advice or a health claim.
            Cannabis products distributed through our services have not been evaluated or approved by
            the Food and Drug Administration (FDA).
          </p>
          <p style={textStyle}>
            Consult a qualified healthcare professional before using any cannabis product.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>6. Intellectual Property</h2>
          <p style={textStyle}>
            All content on this website, including text, graphics, logos, images, and software, is
            the property of Empire 8 Sales Direct or its content suppliers and is protected by
            United States and international intellectual property laws. You may not reproduce,
            distribute, or create derivative works from any content without our prior written consent.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>7. Limitation of Liability</h2>
          <p style={textStyle}>
            To the fullest extent permitted by applicable law, Empire 8 Sales Direct shall not be
            liable for any indirect, incidental, special, consequential, or punitive damages, or any
            loss of profits or revenues, whether incurred directly or indirectly, or any loss of data,
            use, goodwill, or other intangible losses resulting from:
          </p>
          <ul style={listStyle}>
            <li>Your use of or inability to use our website or services</li>
            <li>Any unauthorized access to or use of our servers or personal information</li>
            <li>Any interruption or cessation of transmission to or from our website</li>
            <li>Any regulatory action affecting cannabis distribution in New York State</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>8. Indemnification</h2>
          <p style={textStyle}>
            You agree to indemnify and hold harmless Empire 8 Sales Direct, its officers, directors,
            employees, and agents from and against any claims, liabilities, damages, losses, and
            expenses arising out of or in any way connected with your access to or use of this
            website or violation of these Terms.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>9. Governing Law</h2>
          <p style={textStyle}>
            These Terms shall be governed by and construed in accordance with the laws of the
            State of New York, without regard to its conflict of law principles. Any disputes
            arising under these Terms shall be subject to the exclusive jurisdiction of the courts
            located in the State of New York.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>10. Changes to Terms</h2>
          <p style={textStyle}>
            We reserve the right to modify these Terms at any time. Changes will be effective
            immediately upon posting to this website. Your continued use of the website after any
            changes constitutes acceptance of the modified Terms.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>11. Contact</h2>
          <p style={textStyle}>
            For questions about these Terms of Service, please contact:
          </p>
          <div
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(200,162,60,0.12)',
              borderRadius: 12,
              padding: '20px 24px',
              marginTop: 8,
            }}
          >
            <p style={{ ...textStyle, color: '#fff', marginBottom: 4 }}><strong>Empire 8 Sales Direct</strong></p>
            <p style={{ ...textStyle, marginBottom: 4 }}>Legal Department</p>
            <p style={{ ...textStyle, marginBottom: 0 }}>New York, NY</p>
          </div>
        </div>

        {/* Footer links */}
        <div
          style={{
            borderTop: '1px solid rgba(200,162,60,0.12)',
            paddingTop: 32,
            display: 'flex',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <Link href="/compliance" style={{ color: GOLD, fontSize: '0.9rem', textDecoration: 'none', fontWeight: 600 }}>
            Compliance
          </Link>
          <Link href="/privacy" style={{ color: GOLD, fontSize: '0.9rem', textDecoration: 'none', fontWeight: 600 }}>
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
