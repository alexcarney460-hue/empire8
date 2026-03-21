'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ShoppingBag } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { useDispensaryCart } from '@/context/DispensaryCartContext';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Catalog', href: '/marketplace' },
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Brands', href: '/brands' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function NavRedesign() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { getCartItemCount, openCart } = useDispensaryCart();
  const cartCount = getCartItemCount();

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 50);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Check for Supabase session
  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => { subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  return (
    <>
      <header
        className="e8-nav-redesign"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          height: scrolled ? 180 : 260,
          padding: '0 24px',
          backgroundColor: scrolled ? 'rgba(15,5,32,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(200,162,60,0.08)' : '1px solid transparent',
          transition: 'background-color 300ms ease, height 300ms ease, border-color 300ms ease, backdrop-filter 300ms ease',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            width: '100%',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <Image
              src="/logo.png"
              alt="Empire 8 Sales Direct — Licensed Cannabis Distribution"
              width={1280}
              height={480}
              className="e8-nav-logo"
              style={{
                objectFit: 'contain',
                height: scrolled ? 160 : 240,
                width: 'auto',
                transition: 'height 300ms ease',
              }}
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav style={{ display: 'flex', gap: 28, alignItems: 'center' }} className="e8-desktop-nav">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="e8-nav-link-redesign"
                style={{
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: '0.82rem',
                  fontFamily: "'Barlow', Arial, sans-serif",
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  position: 'relative',
                  paddingBottom: 4,
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Dashboard link — only visible when logged in */}
            {isLoggedIn && (
              <Link
                href="/dashboard"
                className="e8-desktop-nav"
                style={{
                  backgroundColor: 'rgba(200,162,60,0.15)',
                  color: 'var(--color-gold)',
                  padding: '8px 18px',
                  borderRadius: 8,
                  fontFamily: "'Barlow', Arial, sans-serif",
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  border: '1px solid rgba(200,162,60,0.2)',
                  transition: 'background-color 150ms ease, transform 200ms ease',
                  whiteSpace: 'nowrap',
                }}
              >
                Dashboard
              </Link>
            )}

            {/* Dispensary Cart Button — only visible when logged in */}
            {isLoggedIn && (
              <button
                onClick={openCart}
                aria-label={`Open cart${cartCount > 0 ? `, ${cartCount} items` : ''}`}
                style={{
                  position: 'relative',
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 150ms ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                }}
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-gold)',
                      color: '#1A0633',
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                    }}
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Cart icon for non-logged-in (visible but no badge) */}
            {!isLoggedIn && (
              <Link
                href="/marketplace"
                className="e8-desktop-nav"
                aria-label="Browse catalog"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 150ms ease',
                  textDecoration: 'none',
                }}
              >
                <ShoppingBag size={20} />
              </Link>
            )}

            {/* Partner With Us CTA */}
            <Link
              href="/dispensary-signup"
              className="e8-desktop-nav e8-btn-gold"
              style={{
                backgroundColor: 'var(--color-gold)',
                color: '#1A0633',
                padding: '10px 22px',
                borderRadius: 9999,
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 700,
                fontSize: '0.72rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                transition: 'transform 220ms var(--ease-out-expo), box-shadow 220ms var(--ease-out-expo)',
              }}
            >
              Partner With Us
            </Link>

            {/* Mobile hamburger */}
            <button
              className="e8-mobile-menu-btn"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#fff',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: 8,
              }}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile full-screen overlay */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            backgroundColor: 'rgba(10,4,24,0.98)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px',
            overflowY: 'auto',
          }}
        >
          {/* Mobile header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 }}>
            <Image
              src="/logo.png"
              alt="Empire 8 Sales Direct"
              width={280}
              height={104}
              style={{ objectFit: 'contain', height: 36, width: 'auto' }}
            />
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: 8,
                backgroundColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <X size={22} />
            </button>
          </div>

          {/* Mobile nav links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 0, flex: 1, justifyContent: 'center' }}>
            {NAV_LINKS.map((link, i) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="font-display"
                style={{
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: '2.4rem',
                  padding: '18px 0',
                  borderBottom: '1px solid rgba(200,162,60,0.08)',
                  letterSpacing: '-0.01em',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  opacity: 0,
                  animation: `fadeUp 0.5s var(--ease-out-expo) ${i * 0.06}s forwards`,
                }}
              >
                {link.label}
                <span style={{ fontSize: '1.2rem', color: 'var(--color-gold)', opacity: 0.5 }}>&#8594;</span>
              </Link>
            ))}

            {/* Dashboard link in mobile (logged in) */}
            {isLoggedIn && (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="font-display"
                style={{
                  color: 'var(--color-gold)',
                  textDecoration: 'none',
                  fontSize: '2.4rem',
                  padding: '18px 0',
                  borderBottom: '1px solid rgba(200,162,60,0.08)',
                  letterSpacing: '-0.01em',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                Dashboard
                <span style={{ fontSize: '1.2rem', color: 'var(--color-gold)', opacity: 0.7 }}>&#8594;</span>
              </Link>
            )}

            {/* Auth CTAs in mobile */}
            {!isLoggedIn && (
              <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="label-caps"
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '16px 0',
                    borderRadius: 10,
                    border: '1.5px solid rgba(200,162,60,0.25)',
                    color: '#fff',
                    fontSize: '0.82rem',
                    letterSpacing: '0.14em',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="label-caps"
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '16px 0',
                    borderRadius: 10,
                    backgroundColor: 'var(--color-gold)',
                    color: '#1A0633',
                    fontSize: '0.82rem',
                    letterSpacing: '0.14em',
                    textDecoration: 'none',
                    fontWeight: 700,
                    boxShadow: 'var(--shadow-gold)',
                  }}
                >
                  Create Account
                </Link>
              </div>
            )}
          </nav>

          {/* Bottom pills */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 28 }}>
            {[
              { label: 'Dispensary Sign Up', href: '/dispensary-signup' },
              { label: 'Contact', href: '/contact' },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="label-caps"
                style={{
                  padding: '8px 18px',
                  border: '1px solid rgba(200,162,60,0.15)',
                  borderRadius: 9999,
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '0.65rem',
                  textDecoration: 'none',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  transition: 'border-color 150ms ease, color 150ms ease',
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <style>{`
        /* Desktop nav visible, mobile hidden */
        @media (min-width: 769px) {
          .e8-mobile-menu-btn { display: none !important; }
          .e8-desktop-nav { display: flex !important; }
        }
        @media (max-width: 768px) {
          .e8-desktop-nav { display: none !important; }
          .e8-mobile-menu-btn { display: flex !important; }
          .e8-nav-redesign { height: 180px !important; }
          .e8-nav-logo { height: 160px !important; }
        }

        /* Nav link hover underline — grows from center */
        .e8-nav-link-redesign {
          position: relative;
        }
        .e8-nav-link-redesign::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background: var(--color-gold);
          transition: width 280ms var(--ease-out-expo), left 280ms var(--ease-out-expo);
        }
        .e8-nav-link-redesign:hover::after {
          width: 100%;
          left: 0%;
        }
      `}</style>
    </>
  );
}
