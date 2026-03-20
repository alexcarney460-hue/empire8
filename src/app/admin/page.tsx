'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';

/* ---------- Theme ---------- */

const COLORS = {
  bgPage: '#0F0520',
  bgCard: '#1A0830',
  bgCardHover: '#221040',
  purple: '#4A0E78',
  purpleLight: '#6B2FA0',
  gold: '#C8A23C',
  goldMuted: 'rgba(200, 162, 60, 0.15)',
  textPrimary: '#F0EAF8',
  textSecondary: '#9B8AAE',
  border: 'rgba(200, 162, 60, 0.12)',
  success: '#3DD68C',
  warning: '#E8A838',
  skeletonBase: '#1A0830',
  skeletonShine: '#2A1848',
} as const;

/* ---------- Types ---------- */

interface DashboardSummary {
  activeDispensaries: number;
  pendingApprovals: number;
  openOrders: number;
  revenue30d: number;
}

type FetchState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: DashboardSummary };

/* ---------- Nav sections ---------- */

const QUICK_NAV = [
  {
    label: 'CRM',
    href: '/admin/crm',
    description: 'Contacts, companies, deals, pipeline management',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Dispensaries',
    href: '/admin/dispensaries',
    description: 'Licensed accounts, approvals, locations',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: 'Orders',
    href: '/admin/orders',
    description: 'Sales orders, fulfillment, delivery tracking',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    label: 'Accounting',
    href: '/admin/accounting',
    description: 'Revenue, invoices, refunds, financial reports',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    description: 'Traffic, engagement, conversion metrics',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: 'Marketing',
    href: '/admin/marketing',
    description: 'Campaigns, content queue, social publishing',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    description: 'Product catalog, admin configuration',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
] as const;

/* ---------- Helpers ---------- */

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

/* ---------- Skeleton ---------- */

function SkeletonPulse({ width, height }: { width: string | number; height: string | number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 8,
        background: `linear-gradient(90deg, ${COLORS.skeletonBase} 0%, ${COLORS.skeletonShine} 50%, ${COLORS.skeletonBase} 100%)`,
        backgroundSize: '200% 100%',
        animation: 'e8shimmer 1.5s ease-in-out infinite',
      }}
    />
  );
}

function StatCardSkeleton() {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: '24px',
        background: COLORS.bgCard,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <SkeletonPulse width={100} height={14} />
      <div style={{ marginTop: 12 }}>
        <SkeletonPulse width={80} height={32} />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <>
      <style>{`@keyframes e8shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 40 }}>
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div style={{ marginBottom: 16 }}>
        <SkeletonPulse width={160} height={20} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} style={{ borderRadius: 16, padding: '24px', background: COLORS.bgCard, border: `1px solid ${COLORS.border}` }}>
            <SkeletonPulse width={40} height={40} />
            <div style={{ marginTop: 12 }}><SkeletonPulse width={120} height={18} /></div>
            <div style={{ marginTop: 8 }}><SkeletonPulse width="100%" height={14} /></div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- Error state ---------- */

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: '40px 24px',
        background: COLORS.bgCard,
        border: `1px solid rgba(200, 60, 60, 0.2)`,
        textAlign: 'center',
        maxWidth: 480,
        margin: '0 auto',
      }}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#C83C3C"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ margin: '0 auto 16px', display: 'block' }}
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: COLORS.textPrimary, margin: '0 0 8px' }}>
        Failed to load dashboard
      </h3>
      <p style={{ fontSize: '0.82rem', color: COLORS.textSecondary, margin: '0 0 20px', lineHeight: 1.5 }}>
        {message}
      </p>
      <button
        onClick={onRetry}
        style={{
          padding: '8px 24px',
          borderRadius: 9999,
          border: 'none',
          background: COLORS.purple,
          color: '#fff',
          fontWeight: 700,
          fontSize: '0.82rem',
          cursor: 'pointer',
          transition: 'opacity 150ms',
        }}
      >
        Retry
      </button>
    </div>
  );
}

/* ---------- Stat card ---------- */

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: '24px',
        background: COLORS.bgCard,
        border: `1px solid ${COLORS.border}`,
        transition: 'border-color 150ms',
      }}
    >
      <div
        style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: COLORS.textSecondary,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '1.8rem',
          fontWeight: 900,
          color: accent ?? COLORS.textPrimary,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* ---------- Page component ---------- */

export default function AdminDashboard() {
  const [state, setState] = useState<FetchState>({ status: 'loading' });

  const fetchSummary = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const res = await fetch('/api/admin/dashboard/summary', { credentials: 'include' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setState({ status: 'success', data: json.data });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setState({ status: 'error', message });
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <section style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 24px 64px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: '1.6rem',
            fontWeight: 900,
            color: COLORS.textPrimary,
            margin: '0 0 4px',
          }}
        >
          Dashboard
        </h1>
        <p style={{ fontSize: '0.85rem', color: COLORS.textSecondary, margin: 0 }}>
          Empire 8 Sales Direct -- admin overview
        </p>
      </div>

      {state.status === 'loading' && <LoadingSkeleton />}

      {state.status === 'error' && (
        <ErrorState message={state.message} onRetry={fetchSummary} />
      )}

      {state.status === 'success' && (
        <>
          {/* Stat cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 16,
              marginBottom: 40,
            }}
          >
            <StatCard
              label="Active Dispensaries"
              value={formatNumber(state.data.activeDispensaries)}
              accent={COLORS.success}
            />
            <StatCard
              label="Open Orders"
              value={formatNumber(state.data.openOrders)}
              accent={COLORS.gold}
            />
            <StatCard
              label="Revenue (30d)"
              value={formatCurrency(state.data.revenue30d)}
              accent={COLORS.gold}
            />
            <StatCard
              label="Pending Approvals"
              value={formatNumber(state.data.pendingApprovals)}
              accent={state.data.pendingApprovals > 0 ? COLORS.warning : COLORS.textSecondary}
            />
          </div>

          {/* Quick nav */}
          <h2
            style={{
              fontSize: '1rem',
              fontWeight: 800,
              color: COLORS.textPrimary,
              margin: '0 0 16px',
            }}
          >
            Quick Navigation
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {QUICK_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'block',
                  borderRadius: 16,
                  padding: '24px',
                  textDecoration: 'none',
                  background: COLORS.bgCard,
                  border: `1px solid ${COLORS.border}`,
                  transition: 'background-color 150ms, border-color 150ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = COLORS.bgCardHover;
                  e.currentTarget.style.borderColor = 'rgba(200, 162, 60, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = COLORS.bgCard;
                  e.currentTarget.style.borderColor = COLORS.border;
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: COLORS.goldMuted,
                    color: COLORS.gold,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                  }}
                >
                  {item.icon}
                </div>
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: COLORS.textPrimary,
                    margin: '0 0 4px',
                  }}
                >
                  {item.label}
                </h3>
                <p
                  style={{
                    fontSize: '0.82rem',
                    color: COLORS.textSecondary,
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Footer */}
      <footer
        style={{
          marginTop: 64,
          paddingTop: 32,
          borderTop: `1px solid ${COLORS.border}`,
          textAlign: 'center',
        }}
      >
        <div style={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: '0.85rem' }}>
          Empire 8 Sales Direct
        </div>
        <div style={{ fontSize: '0.75rem', color: COLORS.textSecondary, marginTop: 4 }}>
          2026 Empire 8. All rights reserved.
        </div>
      </footer>
    </section>
  );
}
