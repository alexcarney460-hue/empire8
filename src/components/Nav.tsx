'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Dispensary Sign Up', href: '/dispensary-signup' },
  { label: 'Compliance', href: '/compliance' },
  { label: 'Contact', href: '/contact' },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
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
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 'auto',
          padding: '8px 24px',
          backgroundColor: scrolled ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid rgba(226,224,219,0.4)',
          boxShadow: scrolled ? '0 2px 16px rgba(0,0,0,0.06)' : 'none',
          transition: 'background-color 300ms ease, border-color 300ms ease, box-shadow 300ms ease',
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
              width={640}
              height={240}
              className="e8-logo"
              style={{ objectFit: 'contain', height: 130, width: 'auto' }}
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav style={{ display: 'flex', gap: 32 }} className="desktop-nav">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="label-caps e8-nav-link"
                style={{
                  color: 'var(--color-charcoal)',
                  textDecoration: 'none',
                  fontSize: '0.68rem',
                  letterSpacing: '0.16em',
                  paddingBottom: 2,
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Get in Touch CTA */}
            <Link
              href="/contact"
              className="desktop-nav"
              style={{
                marginLeft: 8,
                backgroundColor: 'var(--color-royal)',
                color: '#fff',
                padding: '8px 18px',
                borderRadius: 8,
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 700,
                fontSize: '0.68rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                transition: 'background-color 150ms ease, transform 200ms ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-royal-light)';
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-royal)';
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
              }}
            >
              Get in Touch
            </Link>

            {/* Mobile hamburger */}
            <button
              className="mobile-menu-btn"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-charcoal)',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 8,
                marginLeft: 4,
              }}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            backgroundColor: '#fff',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 }}>
            <Image
              src="/logo.png"
              alt="Empire 8 Sales Direct"
              width={280}
              height={104}
              style={{ objectFit: 'contain', height: 120, width: 'auto' }}
            />
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-charcoal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: 'var(--color-bg)',
              }}
            >
              <X size={22} />
            </button>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            {NAV_LINKS.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="font-display"
                style={{
                  color: 'var(--color-charcoal)',
                  textDecoration: 'none',
                  fontSize: '2.2rem',
                  padding: '14px 0',
                  borderBottom: '1px solid var(--color-border)',
                  letterSpacing: '-0.01em',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                {link.label}
                <span style={{ fontSize: '1.2rem', color: 'var(--color-gold)', opacity: 0.7 }}>&#8594;</span>
              </Link>
            ))}
          </nav>

          {/* Quick pills */}
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
                  padding: '7px 16px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 9999,
                  color: 'var(--color-warm-gray)',
                  fontSize: '0.65rem',
                  textDecoration: 'none',
                  backgroundColor: 'var(--color-bg)',
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
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
