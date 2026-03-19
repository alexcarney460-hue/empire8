'use client';

import Link from 'next/link';

const sections = [
  {
    label: 'Mission Control',
    href: '/admin/mission-control',
    description: 'Content drafts, AI agents, publishing pipeline',
  },
  {
    label: 'CRM',
    href: '/admin/crm',
    description: 'Contacts, companies, deals, pipeline management',
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    description: 'Traffic, engagement, conversion metrics',
  },
  {
    label: 'Accounting',
    href: '/admin/accounting',
    description: 'Orders, revenue, refunds, reports',
  },
  {
    label: 'Marketing',
    href: '/admin/marketing',
    description: 'Content queue, social media publishing',
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    description: 'Product management, admin config',
  },
];

export default function AdminLanding() {
  return (
    <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f0 55%, #eef6ee 100%)' }}>
      <section style={{ maxWidth: 1024, margin: '0 auto', padding: '40px 24px 64px' }}>
        {/* Mission Control banner */}
        <Link
          href="/admin/mission-control"
          style={{
            display: 'block',
            borderRadius: 20,
            padding: '36px 32px',
            marginBottom: 32,
            textDecoration: 'none',
            background: 'linear-gradient(135deg, #1a2e05 0%, #2d5016 50%, #4a7c28 100%)',
            boxShadow: '0 8px 32px rgba(45,80,22,0.18)',
            transition: 'transform 150ms',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a3d977', marginBottom: 6 }}>
                Command Center
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>
                Mission Control
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                Content drafts, AI agents, publishing pipeline
              </p>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '2rem', fontWeight: 900 }}>&rarr;</div>
          </div>
        </Link>

        {/* Section cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {sections.filter((s) => s.href !== '/admin/mission-control').map((section) => (
            <Link
              key={section.href}
              href={section.href}
              style={{
                display: 'block',
                borderRadius: 20,
                padding: '24px 24px',
                textDecoration: 'none',
                background: 'rgba(255,255,255,0.82)',
                border: '1px solid var(--color-border, #e5e5e5)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'transform 150ms',
              }}
            >
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-charcoal, #1a1a1a)', margin: '0 0 4px' }}>
                {section.label}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-warm-gray, #888)', margin: 0 }}>
                {section.description}
              </p>
            </Link>
          ))}
        </div>

        <footer style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid var(--color-border, #e5e5e5)', textAlign: 'center' }}>
          <div style={{ fontWeight: 800, color: 'var(--color-charcoal, #1a1a1a)', fontSize: '0.85rem' }}>Empire 8 Sales Direct</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-warm-gray, #888)', marginTop: 4 }}>&copy; 2026 Empire 8. All rights reserved.</div>
        </footer>
      </section>
    </div>
  );
}
