'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { ADMIN_EMAILS } from '@/lib/admin/constants';

const navItems = [
  { label: 'Mission Control', href: '/admin/mission-control' },
  { label: 'CRM', href: '/admin/crm' },
  { label: 'Analytics', href: '/admin/analytics' },
  { label: 'Accounting', href: '/admin/accounting' },
  { label: 'Shipping', href: '/admin/shipping' },
  { label: 'Marketing', href: '/admin/marketing' },
  { label: 'Settings', href: '/admin/settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getUser();
      const email = data.user?.email ?? '';
      setAuthorized(ADMIN_EMAILS.includes(email.toLowerCase()));
    })();
  }, []);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname === href || pathname.startsWith(href + '/');
  };

  if (authorized === null) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'var(--bg, #f8f8f6)' }}>
        <div style={{ color: 'var(--color-warm-gray, #888)' }}>Loading...</div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'var(--bg, #f8f8f6)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-charcoal, #1a1a1a)', marginBottom: 12 }}>
            Not authorized.
          </div>
          <a
            href="/account"
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              borderRadius: 9999,
              fontWeight: 700,
              fontSize: '0.8rem',
              color: '#fff',
              backgroundColor: 'var(--color-royal, #4A0E78)',
              textDecoration: 'none',
            }}
          >
            Sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-auto" style={{ background: 'var(--bg, #f8f8f6)', zIndex: 200 }}>
      {/* Admin top nav */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--color-border, #e5e5e5)',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 56, gap: 24, overflowX: 'auto' }}>
          <Link
            href="/admin"
            style={{ fontWeight: 900, fontSize: '1.1rem', whiteSpace: 'nowrap', flexShrink: 0, color: 'var(--color-royal, #4A0E78)', textDecoration: 'none' }}
          >
            VS Admin
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 16 }}>
            {navItems.map((item) => {
              const active = isActive(item.href);
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
                    transition: 'background-color 150ms',
                    background: active ? 'var(--color-royal, #4A0E78)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--color-warm-gray, #888)',
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
