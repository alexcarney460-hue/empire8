'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Settings,
  Menu,
  X,
  LogOut,
  Gavel,
  HandCoins,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

/* ── Types ─────────────────────────────────────────────────────────── */

interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly icon: typeof LayoutDashboard;
}

/* ── Constants ─────────────────────────────────────────────────────── */

const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { label: 'Browse Brands', href: '/brands', icon: Package },
  { label: 'Account Settings', href: '/dashboard/settings', icon: Settings },
] as const;

const MARKETPLACE_NAV_ITEMS: readonly NavItem[] = [
  { label: 'My Lots', href: '/marketplace/my-lots', icon: Gavel },
  { label: 'My Bids', href: '/marketplace/my-bids', icon: HandCoins },
] as const;

const SIDEBAR_WIDTH = 260;

const COLORS = {
  bg: '#0F0520',
  sidebar: '#150A28',
  sidebarBorder: 'rgba(200,162,60,0.12)',
  gold: '#C8A23C',
  goldSubtle: 'rgba(200,162,60,0.10)',
  textPrimary: '#fff',
  textSecondary: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.4)',
  topBar: 'rgba(21,10,40,0.92)',
} as const;

/* ── Component ─────────────────────────────────────────────────────── */

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [companyName, setCompanyName] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  // Fetch company name from stats endpoint; redirect admins to /admin
  useEffect(() => {
    async function loadCompanyName() {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (res.status === 401) {
          // Check if user is an admin — redirect to admin panel
          const supabase = getSupabase();
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.email) {
            const { ADMIN_EMAILS } = await import('@/lib/admin/constants');
            if (ADMIN_EMAILS.includes(user.email.toLowerCase())) {
              window.location.href = '/admin';
              return;
            }
          }
          window.location.href = '/login';
          return;
        }
        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.data?.companyName) {
            setCompanyName(json.data.companyName);
          }
        }
      } catch {
        // Non-critical, company name will just be empty
      }
    }
    loadCompanyName();
  }, []);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, sidebarOpen]);

  const handleLogout = useCallback(async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    window.location.href = '/account';
  }, []);

  const isActive = (href: string): boolean => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: COLORS.bg,
        paddingTop: 'var(--nav-height, 0px)',
      }}
    >
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 40,
          }}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        role="navigation"
        aria-label="Dashboard navigation"
        style={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          backgroundColor: COLORS.sidebar,
          borderRight: `1px solid ${COLORS.sidebarBorder}`,
          display: 'flex',
          flexDirection: 'column',
          position: isMobile ? 'fixed' : 'sticky',
          top: isMobile ? 0 : 'var(--nav-height, 0px)',
          left: 0,
          height: isMobile ? '100vh' : 'calc(100vh - var(--nav-height, 0px))',
          zIndex: isMobile ? 50 : 10,
          transform: isMobile && !sidebarOpen ? `translateX(-${SIDEBAR_WIDTH}px)` : 'translateX(0)',
          transition: 'transform 250ms ease',
          overflowY: 'auto',
        }}
      >
        {/* Sidebar header */}
        <div
          style={{
            padding: '24px 20px 20px',
            borderBottom: `1px solid ${COLORS.sidebarBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: COLORS.gold,
                margin: 0,
                marginBottom: 4,
                fontFamily: "'Barlow', Arial, sans-serif",
              }}
            >
              Dispensary Portal
            </p>
            {companyName && (
              <p
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: COLORS.textPrimary,
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {companyName}
              </p>
            )}
          </div>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation"
              style={{
                background: 'none',
                border: 'none',
                color: COLORS.textSecondary,
                cursor: 'pointer',
                padding: 4,
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 14px',
                  borderRadius: 10,
                  marginBottom: 4,
                  textDecoration: 'none',
                  fontSize: '0.88rem',
                  fontWeight: active ? 600 : 400,
                  color: active ? COLORS.gold : COLORS.textSecondary,
                  backgroundColor: active ? COLORS.goldSubtle : 'transparent',
                  transition: 'background-color 150ms ease, color 150ms ease',
                }}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                {item.label}
              </Link>
            );
          })}

          {/* Marketplace section */}
          <p
            style={{
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: COLORS.textMuted,
              margin: '20px 14px 8px',
              fontFamily: "'Barlow', Arial, sans-serif",
            }}
          >
            Marketplace
          </p>
          {MARKETPLACE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 14px',
                  borderRadius: 10,
                  marginBottom: 4,
                  textDecoration: 'none',
                  fontSize: '0.88rem',
                  fontWeight: active ? 600 : 400,
                  color: active ? COLORS.gold : COLORS.textSecondary,
                  backgroundColor: active ? COLORS.goldSubtle : 'transparent',
                  transition: 'background-color 150ms ease, color 150ms ease',
                }}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div
          style={{
            padding: '12px 10px 20px',
            borderTop: `1px solid ${COLORS.sidebarBorder}`,
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '11px 14px',
              borderRadius: 10,
              width: '100%',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              fontSize: '0.85rem',
              color: COLORS.textMuted,
              cursor: 'pointer',
              transition: 'color 150ms ease',
              fontFamily: 'inherit',
            }}
          >
            <LogOut size={18} strokeWidth={1.8} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <header
          style={{
            position: 'sticky',
            top: 'var(--nav-height, 0px)',
            zIndex: 20,
            backgroundColor: COLORS.topBar,
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${COLORS.sidebarBorder}`,
            padding: '0 24px',
            height: 56,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
              style={{
                background: 'none',
                border: 'none',
                color: COLORS.textSecondary,
                cursor: 'pointer',
                padding: 4,
                marginLeft: -4,
              }}
            >
              <Menu size={22} />
            </button>
          )}
          <p
            style={{
              fontSize: '0.92rem',
              fontWeight: 600,
              color: COLORS.textPrimary,
              margin: 0,
            }}
          >
            {companyName || 'Dashboard'}
          </p>
        </header>

        {/* Page content */}
        <main
          style={{
            flex: 1,
            padding: '32px 24px 48px',
            maxWidth: 1100,
            width: '100%',
            margin: '0 auto',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
