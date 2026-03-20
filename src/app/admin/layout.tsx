'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { ADMIN_EMAILS } from '@/lib/admin/constants';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'CRM', href: '/admin/crm' },
  { label: 'Dispensaries', href: '/admin/dispensaries' },
  { label: 'Orders', href: '/admin/orders' },
  { label: 'Accounting', href: '/admin/accounting' },
  { label: 'Analytics', href: '/admin/analytics' },
  { label: 'Marketing', href: '/admin/marketing' },
  { label: 'Settings', href: '/admin/settings' },
] as const;

const COLORS = {
  bgPage: '#0F0520',
  bgNav: '#1A0830',
  purple: '#4A0E78',
  gold: '#C8A23C',
  goldMuted: 'rgba(200, 162, 60, 0.15)',
  textPrimary: '#F0EAF8',
  textSecondary: '#9B8AAE',
  border: 'rgba(200, 162, 60, 0.12)',
} as const;

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(href + '/');
}

function LoadingScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: COLORS.bgPage,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: `3px solid ${COLORS.purple}`,
            borderTopColor: COLORS.gold,
            borderRadius: '50%',
            animation: 'e8spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        <div style={{ color: COLORS.textSecondary, fontSize: '0.85rem', fontWeight: 500 }}>
          Verifying access...
        </div>
        <style>{`@keyframes e8spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

function AccessDenied() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: COLORS.bgPage,
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 380, padding: '0 24px' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'rgba(200, 60, 60, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '1.5rem',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C83C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1
          style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: COLORS.textPrimary,
            margin: '0 0 8px',
          }}
        >
          Access Denied
        </h1>
        <p style={{ fontSize: '0.85rem', color: COLORS.textSecondary, margin: '0 0 24px', lineHeight: 1.5 }}>
          You do not have permission to access the admin panel.
          Sign in with an authorized account to continue.
        </p>
        <a
          href="/account"
          style={{
            display: 'inline-block',
            padding: '10px 28px',
            borderRadius: 9999,
            fontWeight: 700,
            fontSize: '0.82rem',
            color: '#fff',
            background: COLORS.purple,
            textDecoration: 'none',
            transition: 'opacity 150ms',
          }}
        >
          Sign In
        </a>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getUser();
        const email = data.user?.email ?? '';
        if (!cancelled) {
          setAuthorized(ADMIN_EMAILS.includes(email.toLowerCase()));
        }
      } catch {
        if (!cancelled) {
          setAuthorized(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (authorized === null) {
    return <LoadingScreen />;
  }

  if (!authorized) {
    return <AccessDenied />;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'auto',
        background: COLORS.bgPage,
        zIndex: 200,
      }}
    >
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: COLORS.bgNav,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <div
          style={{
            maxWidth: 1320,
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            height: 56,
            gap: 24,
          }}
        >
          <Link
            href="/admin"
            style={{
              fontWeight: 900,
              fontSize: '1.1rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              textDecoration: 'none',
              color: COLORS.textPrimary,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ color: COLORS.gold }}>E8</span>
            <span>Admin</span>
          </Link>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginLeft: 16,
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              flexShrink: 1,
              minWidth: 0,
            }}
          >
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 9999,
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    textDecoration: 'none',
                    transition: 'background-color 150ms, color 150ms',
                    background: active ? COLORS.gold : 'transparent',
                    color: active ? '#1A0830' : COLORS.textSecondary,
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {children}
    </div>
  );
}
