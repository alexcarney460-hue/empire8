import type { Metadata } from 'next';
import Link from 'next/link';

const PURPLE = '#4A0E78';
const PURPLE_DARK = '#2D0849';
const GOLD = '#C8A23C';

export const metadata: Metadata = {
  title: 'Privacy Policy — Empire 8 Sales Direct',
  description:
    'Privacy policy for Empire 8 Sales Direct. Learn how we collect, use, and protect your data as a licensed cannabis distributor in New York State.',
  robots: { index: true, follow: true },
};

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

const listStyle: React.CSSProperties = {
  color: '#444',
  fontSize: '0.95rem',
  lineHeight: 1.8,
  paddingLeft: 24,
  marginBottom: 12,
};

export default function PrivacyPage() {
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
            left: '10%',
            width: 400,
            height: 400,
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
            Privacy Policy
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
            Empire 8 Sales Direct (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to
            protecting the privacy of our business partners and website visitors. This Privacy Policy
            explains how we collect, use, disclose, and safeguard your information when you visit our
            website or engage with our B2B cannabis distribution services in New York State.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>1. Information We Collect</h2>
          <p style={textStyle}>We may collect the following types of information:</p>
          <ul style={listStyle}>
            <li><strong>Business contact information:</strong> name, email address, phone number, business name, and business address</li>
            <li><strong>Business details:</strong> license type, license number, and other regulatory information relevant to B2B cannabis distribution</li>
            <li><strong>Age verification data:</strong> date of birth entered during age gate verification (stored locally on your device only)</li>
            <li><strong>Website usage data:</strong> pages visited, time spent on pages, browser type, and device information</li>
            <li><strong>Communication records:</strong> inquiries, form submissions, and correspondence related to distribution services</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>2. How We Use Your Information</h2>
          <p style={textStyle}>We use collected information for the following purposes:</p>
          <ul style={listStyle}>
            <li>Facilitating B2B communication and business relationships</li>
            <li>Processing distribution service inquiries and orders</li>
            <li>Verifying licensure and regulatory compliance of business partners</li>
            <li>Improving our website and service delivery</li>
            <li>Complying with NYS OCM regulatory requirements</li>
            <li>Responding to inquiries and providing customer support</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>3. Age Verification Data</h2>
          <p style={textStyle}>
            Age verification is conducted through our age gate as required by 9 NYCRR 129.2(l).
            The date of birth you enter is used solely to calculate whether you are 21 years of age
            or older. This data is stored locally on your device via browser localStorage and is not
            transmitted to our servers. The verification expires after 30 days, at which point you
            will be asked to verify again.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>4. Cannabis-Specific Privacy Protections</h2>
          <p style={textStyle}>
            We do not collect or store cannabis purchase history of individual consumers.
            As a B2B distributor, our records pertain to business-to-business transactions only and
            are maintained in compliance with NYS OCM record-keeping requirements.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>5. Sale of Personal Data</h2>
          <p style={textStyle}>
            We do not sell, rent, or trade your personal information to third parties for marketing
            purposes. Your data is used exclusively for the purposes outlined in this policy.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>6. Cookies and Tracking</h2>
          <p style={textStyle}>
            Our website may use cookies and similar technologies to improve user experience and
            analyze site traffic. Cookies used include:
          </p>
          <ul style={listStyle}>
            <li><strong>Essential cookies:</strong> required for site functionality (e.g., age verification status)</li>
            <li><strong>Analytics cookies:</strong> help us understand how visitors interact with our website</li>
            <li><strong>Performance cookies:</strong> used to optimize site speed and reliability</li>
          </ul>
          <p style={textStyle}>
            You can control cookie preferences through your browser settings. Disabling essential
            cookies may affect site functionality.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>7. Third-Party Services</h2>
          <p style={textStyle}>
            We use the following third-party services that may process your data:
          </p>
          <ul style={listStyle}>
            <li><strong>Supabase:</strong> customer relationship management (CRM) and data storage</li>
            <li><strong>Analytics providers:</strong> website traffic analysis (if enabled)</li>
          </ul>
          <p style={textStyle}>
            Each third-party service operates under its own privacy policy. We ensure that our
            third-party partners maintain appropriate data protection standards.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>8. Data Security</h2>
          <p style={textStyle}>
            We implement commercially reasonable security measures to protect your information from
            unauthorized access, alteration, disclosure, or destruction. However, no method of
            electronic storage or transmission over the internet is 100% secure.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>9. Data Deletion Requests</h2>
          <p style={textStyle}>
            You may request the deletion of your personal data at any time by contacting us at the
            address below. We will process your request within 30 business days, subject to any
            legal or regulatory record-retention obligations imposed by NYS OCM.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>10. Changes to This Policy</h2>
          <p style={textStyle}>
            We may update this Privacy Policy from time to time. Changes will be posted on this page
            with an updated &quot;Last updated&quot; date. Your continued use of the website after any
            changes constitutes acceptance of the updated policy.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>11. Contact Us</h2>
          <p style={textStyle}>
            For privacy inquiries, data deletion requests, or questions about this policy, please contact:
          </p>
          <div
            style={{
              backgroundColor: '#FAFAFA',
              border: '1px solid #E4E1DB',
              borderRadius: 12,
              padding: '20px 24px',
              marginTop: 8,
            }}
          >
            <p style={{ ...textStyle, marginBottom: 4 }}><strong>Empire 8 Sales Direct</strong></p>
            <p style={{ ...textStyle, marginBottom: 4 }}>Privacy Inquiries</p>
            <p style={{ ...textStyle, marginBottom: 0 }}>New York, NY</p>
          </div>
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
          <Link href="/compliance" style={{ color: PURPLE, fontSize: '0.9rem', textDecoration: 'none', fontWeight: 600 }}>
            Compliance
          </Link>
          <Link href="/terms" style={{ color: PURPLE, fontSize: '0.9rem', textDecoration: 'none', fontWeight: 600 }}>
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
