import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import AnimateIn from '@/components/AnimateIn';
import AffiliateForm from '@/components/forms/AffiliateForm';

export const metadata: Metadata = {
  title: 'Affiliate Program — Earn Up to 20% Commission',
  description:
    'Join the Empire 8 Sales Direct affiliate program and earn up to 20% commission on every referred sale. Cannabis creators, grow communities, hydro store owners. NET-7 payouts for top partners. Apply now.',
  keywords: ['cannabis affiliate program', 'glove affiliate', 'grow supply affiliate', 'cannabis influencer commission', 'hydro store affiliate'],
  openGraph: {
    title: 'Affiliate Program — Earn Up to 20% | Empire 8 Sales Direct',
    description: 'Earn up to 20% commission on every referred sale. Real-time dashboard, custom promo codes, and fast payouts.',
    url: 'https://empire8salesdirect.com/affiliate',
  },
  alternates: { canonical: 'https://empire8salesdirect.com/affiliate' },
};

const TIERS = [
  {
    name: 'Starter',
    rate: '10%',
    volume: '1–9 orders/mo',
    highlighted: false,
    perks: ['Tracking link', 'Discount code', 'Monthly payouts'],
  },
  {
    name: 'Growth',
    rate: '12%',
    volume: '10–24 orders/mo',
    highlighted: false,
    perks: ['Higher rate', 'Promo bonuses', 'Monthly payouts'],
  },
  {
    name: 'Pro',
    rate: '15%',
    volume: '25–49 orders/mo',
    highlighted: false,
    perks: ['Flexible discounts', 'Bonus campaigns', 'Monthly payouts'],
  },
  {
    name: 'Elite',
    rate: '18%',
    volume: '50–99 orders/mo',
    highlighted: true,
    perks: ['Priority support', 'NET-7 payouts', 'Bonus eligibility'],
  },
  {
    name: 'Apex',
    rate: '20%',
    volume: '100+ orders/mo',
    highlighted: true,
    perks: ['Max commission', 'NET-7 payouts', 'Exclusive campaigns'],
  },
];

const ARSENAL = [
  { emoji: '📊', title: 'Live Dashboard', desc: 'Real-time visibility into every click, conversion, and commission. Own your data.' },
  { emoji: '🎁', title: 'Marketing Kit', desc: 'Product photos, banners, email swipes, and short-form video templates ready to deploy.' },
  { emoji: '💰', title: 'Bonus Campaigns', desc: 'Seasonal promos and quarterly bonuses for top-performing partners.' },
  { emoji: '🎯', title: 'Custom Codes', desc: 'Your personal promo codes tied to your brand. Build your own referral empire.' },
  { emoji: '🛡', title: 'Dedicated Support', desc: 'Real people on your team. Strategy, assets, and support — not bots.' },
  { emoji: '⚡', title: 'Fast Payouts', desc: 'Monthly standard. NET-7 for Elite & Apex partners. Get paid fast.' },
];

const WHO = [
  'Cannabis Content Creators',
  'Grow & Hydroponics Communities',
  'Dispensary & Retail Operators',
  'Industry Professionals & Consultants',
];


export default function AffiliatePage() {
  return (
    <div style={{ paddingTop: 'var(--nav-height)', backgroundColor: '#fff', minHeight: '100vh' }}>

      {/* HERO */}
      <section style={{ backgroundColor: '#fff', borderBottom: '1px solid var(--color-border)', padding: '72px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '5%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(200,146,42,0.07)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '3%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(27,58,45,0.05)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <span className="label-caps" style={{ color: 'var(--color-gold)', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ width: 24, height: 1.5, backgroundColor: 'var(--color-gold)', display: 'inline-block', borderRadius: 99 }} />
            Partner Program
            <span style={{ width: 24, height: 1.5, backgroundColor: 'var(--color-gold)', display: 'inline-block', borderRadius: 99 }} />
          </span>
          <h1 className="font-display" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', lineHeight: 1.0, color: 'var(--color-charcoal)', marginBottom: 20, letterSpacing: '-0.01em' }}>
            Become a Partner
          </h1>
          <p style={{ color: 'var(--color-warm-gray)', fontSize: '1.1rem', maxWidth: 580, margin: '0 auto 40px', lineHeight: 1.8 }}>
            Join a community of creators and industry professionals building real authority in the grow supply space.
            Earn up to 20% commission and become part of something bigger than affiliate links.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="#apply"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                backgroundColor: 'var(--color-gold)', color: '#fff',
                padding: '14px 32px', borderRadius: 9999,
                fontFamily: "'Barlow', Arial, sans-serif", fontWeight: 700,
                fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                textDecoration: 'none', boxShadow: 'var(--shadow-gold)',
              }}
            >
              Apply Now <ArrowRight size={14} />
            </a>
            <Link
              href="/contact"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                backgroundColor: 'transparent', color: 'var(--color-charcoal)',
                padding: '14px 32px', borderRadius: 9999,
                border: '1.5px solid var(--color-border)',
                fontFamily: "'Barlow', Arial, sans-serif", fontWeight: 600,
                fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              Talk to a Partner Manager
            </Link>
          </div>
        </div>
      </section>

      {/* WHY PARTNER */}
      <section style={{ backgroundColor: '#FAFAFA', borderBottom: '1px solid var(--color-border)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <AnimateIn style={{ marginBottom: 52 }}>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: 'var(--color-charcoal)', textAlign: 'center' }}>
              Why Partner with Empire 8 Sales Direct
            </h2>
          </AnimateIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 28 }}>
            {[
              { title: 'Join a Community, Not a Program', desc: 'Partner with creators who take the grow space seriously. Build alongside people dedicated to quality, reliability, and real results.' },
              { title: 'Earn Like an Owner', desc: 'Up to 20% commission at the Apex tier. Get paid like you built it — because with us, your referrals matter long-term.' },
              { title: 'Fast Payouts', desc: 'Monthly standard payouts. NET-7 for Elite & Apex partners. Get paid when you need it, not 90 days later.' },
              { title: 'Real Support, Real People', desc: 'You get strategy, creative assets, and genuine help from our team. Not a chatbot. Not abandoned in a dashboard.' },
              { title: 'Custom Promo Codes', desc: 'Your personal codes tied to your brand identity. Watch your audience convert with codes that feel like yours.' },
              { title: 'Transparent Real-Time Earnings', desc: 'Watch every click, conversion, and commission in real time. No mystery. No hidden math. Own your numbers.' },
            ].map(({ title, desc }, i) => (
              <AnimateIn key={title} delay={i * 70}>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ color: 'var(--color-gold)', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0, paddingTop: 2 }}>✓</div>
                  <div>
                    <h3 className="font-heading" style={{ fontSize: '0.95rem', marginBottom: 6, color: 'var(--color-charcoal)' }}>{title}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-warm-gray)', lineHeight: 1.7 }}>{desc}</p>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* COMMISSION TIERS */}
      <section style={{ backgroundColor: '#fff', borderBottom: '1px solid var(--color-border)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 16 }}>
            <span className="label-caps" style={{ color: 'var(--color-gold)' }}>Commission Tiers</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginTop: 10, color: 'var(--color-charcoal)' }}>
              Higher Volume = Higher Earnings
            </h2>
          </AnimateIn>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ color: 'var(--color-warm-gray)', maxWidth: 560, margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.7 }}>
              Your commission rate is based on your 30-day referred order count. Higher tier = higher earnings + more benefits.
            </p>
          </AnimateIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            {TIERS.map(({ name, rate, volume, highlighted, perks }, i) => (
              <AnimateIn key={name} delay={i * 70}>
                <div
                  className="tilt-card"
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 20,
                    padding: '28px 20px',
                    border: highlighted ? '2px solid var(--color-gold)' : '1px solid var(--color-border)',
                    boxShadow: highlighted ? 'var(--shadow-gold)' : 'var(--shadow-xs)',
                    height: '100%',
                  }}
                >
                  <div className="font-display" style={{ fontSize: '2.25rem', color: 'var(--color-gold)', lineHeight: 1, marginBottom: 6 }}>{rate}</div>
                  <h3 className="font-heading" style={{ fontSize: '1rem', marginBottom: 6, color: 'var(--color-charcoal)' }}>{name}</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-warm-gray)', marginBottom: 16 }}>{volume}</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {perks.map((perk) => (
                      <li key={perk} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: perk.includes('NET-7') ? 'var(--color-gold)' : 'var(--color-warm-gray)', fontWeight: perk.includes('NET-7') ? 700 : 400 }}>
                        <span style={{ color: 'var(--color-gold)', fontSize: '0.7rem' }}>✓</span> {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimateIn>
            ))}
          </div>

          <AnimateIn>
            <div style={{ marginTop: 24, padding: '20px 28px', backgroundColor: 'rgba(200,146,42,0.06)', border: '1px solid rgba(200,146,42,0.22)', borderRadius: 14 }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-charcoal)', lineHeight: 1.7, margin: 0 }}>
                <strong style={{ color: 'var(--color-gold)' }}>NET-7 Payouts</strong> — Available for Elite & Apex partners. Get paid within 7 days subject to account review. Perfect for high-volume partners who need faster cash flow.
              </p>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ARSENAL */}
      <section style={{ backgroundColor: '#FAFAFA', borderBottom: '1px solid var(--color-border)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 52 }}>
            <span className="label-caps" style={{ color: 'var(--color-gold)' }}>Partner Tools</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginTop: 10, color: 'var(--color-charcoal)' }}>
              Your Partner Arsenal
            </h2>
          </AnimateIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {ARSENAL.map(({ emoji, title, desc }, i) => (
              <AnimateIn key={title} delay={i * 70}>
                <div
                  className="tilt-card"
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 20,
                    padding: '28px 24px',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-xs)',
                    height: '100%',
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: 16 }}>{emoji}</div>
                  <h3 className="font-heading" style={{ fontSize: '1rem', marginBottom: 8, color: 'var(--color-charcoal)' }}>{title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-warm-gray)', lineHeight: 1.7 }}>{desc}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* WHO WE LOOK FOR */}
      <section style={{ backgroundColor: '#fff', borderBottom: '1px solid var(--color-border)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="label-caps" style={{ color: 'var(--color-gold)' }}>Who We Work With</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginTop: 10, color: 'var(--color-charcoal)' }}>
              Join the Partner Network
            </h2>
          </AnimateIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {WHO.map((item, i) => (
              <AnimateIn key={item} delay={i * 80}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '18px 20px',
                    backgroundColor: '#FAFAFA',
                    borderRadius: 14,
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <span style={{ color: 'var(--color-gold)', fontWeight: 800, fontSize: '1rem' }}>→</span>
                  <span className="font-heading" style={{ fontSize: '0.92rem', color: 'var(--color-charcoal)' }}>{item}</span>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* APPLICATION FORM */}
      <section id="apply" style={{ backgroundColor: '#FAFAFA', borderBottom: '1px solid var(--color-border)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <AnimateIn>
            <div style={{ backgroundColor: '#fff', border: '1px solid var(--color-border)', borderRadius: 24, padding: '52px 44px', boxShadow: 'var(--shadow-sm)' }}>
              <h2 className="font-display" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--color-charcoal)', marginBottom: 12 }}>
                Ready to Become a Partner?
              </h2>
              <p style={{ color: 'var(--color-warm-gray)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: 36 }}>
                Submit your info below. We&apos;ll review within 24 hours and get you set up with your dashboard, discount codes, and marketing kit.
              </p>

              <AffiliateForm />
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ backgroundColor: '#fff', borderBottom: '1px solid var(--color-border)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <AnimateIn style={{ marginBottom: 48 }}>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', color: 'var(--color-charcoal)', textAlign: 'center' }}>
              Partner Questions Answered
            </h2>
          </AnimateIn>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {[
              {
                q: 'How do partner commissions work?',
                a: "Your tier is based on your 30-day referred order count. Earn 10%–20% commission depending on your tier. Tiers reset monthly — higher performance = higher rate. Simple.",
              },
              {
                q: 'When do I get paid?',
                a: 'Standard monthly payouts for all partners. Hit Elite (50–99 orders/mo) or Apex (100+ orders/mo) and you qualify for NET-7 payouts — paid within 7 days of the return window closing.',
              },
              {
                q: "What's the earning potential?",
                a: "Depends on your audience. Send 10 orders a month? You're earning 12%. Drive 100+ orders? You're at 20% — plus NET-7 payouts and exclusive campaign bonuses. The more you drive, the more you earn.",
              },
              {
                q: 'Is there a minimum audience size?',
                a: "We prioritize engaged, niche communities. Micro-creators under 5k followers are welcome — quality beats quantity in the grow space.",
              },
              {
                q: 'Can I order products at a discount?',
                a: "Yes. Approved partners receive a private wholesale code for personal-use stock. Separate from your commission earnings.",
              },
              {
                q: 'Still have questions?',
                a: null,
                contact: true,
              },
            ].map(({ q, a, contact }) => (
              <AnimateIn key={q}>
                <div>
                  <h3 className="font-heading" style={{ fontSize: '1rem', marginBottom: 8, color: 'var(--color-charcoal)' }}>{q}</h3>
                  {contact ? (
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-warm-gray)', lineHeight: 1.7 }}>
                      Reach out to our partner team:{' '}
                      <a href="mailto:info@empire8salesdirect.com" style={{ color: 'var(--color-gold)', fontWeight: 700, textDecoration: 'none' }}>
                        info@empire8salesdirect.com
                      </a>
                    </p>
                  ) : (
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-warm-gray)', lineHeight: 1.75 }}>{a}</p>
                  )}
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance notice */}
      <section style={{ backgroundColor: '#FAFAFA', padding: '40px 24px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ backgroundColor: 'rgba(200,146,42,0.06)', border: '1px solid rgba(200,146,42,0.22)', borderRadius: 16, padding: '24px 28px', textAlign: 'center' }}>
            <span className="label-caps" style={{ color: 'var(--color-gold)', fontSize: '0.65rem', display: 'block', marginBottom: 8 }}>
              Platform Compliance
            </span>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-charcoal)', lineHeight: 1.7, margin: 0 }}>
              All promotional creatives and copy are pre-reviewed for cannabis platform guidelines. We provide ready-to-use compliant assets so your content stays approved on every channel.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="e8-dot-grid"
        style={{ backgroundColor: 'var(--color-royal)', padding: '80px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 300, borderRadius: '50%', background: 'rgba(200,146,42,0.09)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <AnimateIn style={{ maxWidth: 560, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h2 className="font-display" style={{ color: '#fff', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: 16, lineHeight: 1.05 }}>
            Want Volume Pricing Instead?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 36, lineHeight: 1.75 }}>
            If you&apos;re buying for your own operation, check out our wholesale and distribution programs.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/wholesale"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                backgroundColor: 'var(--color-gold)', color: '#fff',
                padding: '14px 32px', borderRadius: 9999,
                fontFamily: "'Barlow', Arial, sans-serif", fontWeight: 700,
                fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                textDecoration: 'none', boxShadow: 'var(--shadow-gold)',
              }}
            >
              Wholesale Pricing <ArrowRight size={14} />
            </Link>
            <Link
              href="/distribution"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                backgroundColor: 'transparent', color: '#fff',
                padding: '14px 32px', borderRadius: 9999,
                border: '1.5px solid rgba(255,255,255,0.28)',
                fontFamily: "'Barlow', Arial, sans-serif", fontWeight: 600,
                fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              Distribution Program
            </Link>
          </div>
        </AnimateIn>
      </section>

    </div>
  );
}
