import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import AnimateIn from '@/components/AnimateIn';

const FAQ_ITEMS = [
  {
    q: 'What areas does Empire 8 distribute to?',
    a: 'We provide statewide coverage across all 62 New York counties. Our temperature-controlled fleet delivers to licensed dispensaries and retailers throughout the state with same-week delivery timelines.',
  },
  {
    q: 'Is Empire 8 fully licensed and OCM compliant?',
    a: 'Yes. Empire 8 Sales Direct is a fully licensed cannabis distributor under the New York State Office of Cannabis Management (OCM). Every shipment includes complete manifests, chain of custody documentation, and real-time tracking to ensure full regulatory compliance.',
  },
  {
    q: 'How do I become a retail partner?',
    a: 'Licensed dispensaries and retailers can apply through our dispensary sign up page. We assign a dedicated account manager to every partner, provide inventory planning support, and offer competitive wholesale pricing with flexible delivery scheduling.',
  },
  {
    q: 'How can my brand get wholesale supply through Empire 8?',
    a: 'We work with premium cannabis brands that meet our quality and compliance standards. Submit your brand information through our dispensary sign up form. Our team evaluates product quality, packaging compliance, and market fit to build a curated portfolio for New York dispensaries.',
  },
  {
    q: 'What support do you provide to dispensaries?',
    a: 'Beyond reliable product delivery, we offer dedicated account management, marketing support, merchandising guidance, and inventory planning. Our goal is to help your dispensary thrive with the right product mix and consistent supply.',
  },
  {
    q: 'What makes Empire 8 different from other distributors?',
    a: 'We are a New York-based operation built specifically for the NY cannabis market. We combine statewide reach with local expertise, maintain 100% OCM compliance on every shipment, and provide dedicated account managers rather than rotating sales reps. Our temperature-controlled fleet ensures product integrity from warehouse to shelf.',
  },
];

export default function FAQSection() {
  return (
    <section style={{ backgroundColor: '#0F0520', padding: '96px 24px', borderTop: '1px solid rgba(200,162,60,0.1)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <AnimateIn style={{ textAlign: 'center', marginBottom: 56 }}>
          <span className="label-caps" style={{ color: '#C8A23C' }}>Common Questions</span>
          <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginTop: 10, color: '#FFFFFF' }}>
            Frequently Asked Questions
          </h2>
        </AnimateIn>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FAQ_ITEMS.map((item, i) => (
            <AnimateIn key={item.q} delay={i * 60}>
              <div
                style={{
                  backgroundColor: 'rgba(74,14,120,0.15)',
                  border: '1px solid rgba(200,162,60,0.1)',
                  borderRadius: 16,
                  padding: '24px 28px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <ChevronRight size={16} color="#C8A23C" style={{ marginTop: 3, flexShrink: 0 }} />
                  <div>
                    <h3 className="font-heading" style={{ fontSize: '1rem', color: '#FFFFFF', marginBottom: 8, lineHeight: 1.3 }}>
                      {item.q}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, margin: 0 }}>
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>

        <AnimateIn style={{ textAlign: 'center', marginTop: 40 }}>
          <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.5)' }}>
            Have a different question?{' '}
            <Link href="/contact" style={{ color: '#C8A23C', fontWeight: 700, textDecoration: 'none' }}>
              Contact us
            </Link>
          </p>
        </AnimateIn>
      </div>

      {/* FAQPage JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ_ITEMS.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a },
            })),
          }),
        }}
      />
    </section>
  );
}
