'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

const COLORS = {
  bg: '#0F0520',
  cardBg: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(200,162,60,0.15)',
  gold: '#C8A23C',
  goldHover: '#A6841E',
  purple: '#4A0E78',
  purpleDark: '#2D0A4E',
  textWhite: '#fff',
  textMuted: 'rgba(255,255,255,0.55)',
  textFaint: 'rgba(255,255,255,0.35)',
  inputBg: 'rgba(255,255,255,0.06)',
  inputBorder: 'rgba(255,255,255,0.12)',
  inputFocus: 'rgba(200,162,60,0.4)',
  errorBg: 'rgba(192,57,43,0.12)',
  errorBorder: 'rgba(192,57,43,0.3)',
  errorText: '#E74C3C',
} as const;

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px 14px 44px',
  backgroundColor: COLORS.inputBg,
  border: `1px solid ${COLORS.inputBorder}`,
  borderRadius: 12,
  color: COLORS.textWhite,
  fontSize: '0.95rem',
  outline: 'none',
  transition: 'border-color 180ms ease, box-shadow 180ms ease',
  fontFamily: 'inherit',
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pendingApproval = searchParams.get('error') === 'pending_approval';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sign in client-side so Supabase sets the auth cookie in the browser
      const { getSupabase } = await import('@/lib/supabase');
      const supabase = getSupabase();

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError || !authData.user) {
        setError('Invalid email or password.');
        setLoading(false);
        return;
      }

      // Check if admin first
      const { ADMIN_EMAILS } = await import('@/lib/admin/constants');
      const isAdmin = ADMIN_EMAILS.includes(authData.user.email?.toLowerCase() ?? '');

      if (isAdmin) {
        // Set admin cookie via API — pass the access token explicitly since
        // Supabase JS stores sessions in localStorage, not cookies
        const session = authData.session;
        await fetch('/api/auth/admin-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token ?? ''}`,
          },
        });
        window.location.href = '/admin';
        return;
      }

      // Check for dispensary account
      const { data: dispensaryRow } = await supabase
        .from('dispensary_accounts')
        .select('id, is_approved')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      const dispensary = dispensaryRow as { id: string; is_approved: boolean } | null;

      // Check for brand account
      const { data: brandRow } = await supabase
        .from('brand_accounts')
        .select('id, is_approved')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      const brand = brandRow as { id: string; is_approved: boolean } | null;

      // Route based on account type
      if (dispensary) {
        if (!dispensary.is_approved) {
          setError('Your dispensary account is pending approval. You will receive an email once approved.');
          setLoading(false);
          return;
        }
        router.push('/dashboard');
        return;
      }

      if (brand) {
        if (!brand.is_approved) {
          setError('Your brand account is pending approval. You will receive an email once approved.');
          setLoading(false);
          return;
        }
        router.push('/brand-dashboard');
        return;
      }

      setError('No account found. Please sign up first.');
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        paddingTop: 'var(--nav-height)',
        backgroundColor: COLORS.bg,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Hero header */}
      <section
        style={{
          background: `linear-gradient(168deg, ${COLORS.purpleDark} 0%, ${COLORS.purple} 35%, ${COLORS.purpleDark} 70%, #1A0633 100%)`,
          padding: '60px 24px 48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '10%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,162,60,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <span
            className="label-caps"
            style={{ color: COLORS.gold, display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16 }}
          >
            <span style={{ width: 24, height: 1.5, backgroundColor: COLORS.gold, display: 'inline-block', borderRadius: 99 }} />
            Empire 8 Portal
            <span style={{ width: 24, height: 1.5, backgroundColor: COLORS.gold, display: 'inline-block', borderRadius: 99 }} />
          </span>
          <h1 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', lineHeight: 1.05, color: COLORS.textWhite, marginBottom: 12 }}>
            Sign In to Your Account
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: '0.95rem', lineHeight: 1.7 }}>
            Access the Empire 8 wholesale catalog, place orders, and manage your dispensary account.
          </p>
        </div>
      </section>

      {/* Form */}
      <section style={{ flex: 1, padding: '48px 24px 80px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          {pendingApproval && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '16px 20px',
                backgroundColor: 'rgba(200,162,60,0.08)',
                border: '1px solid rgba(200,162,60,0.25)',
                borderRadius: 12,
                marginBottom: 24,
              }}
            >
              <AlertCircle size={18} color={COLORS.gold} style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ color: COLORS.gold, fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
                Your dispensary account is pending approval. You will be notified by email once approved.
              </p>
            </div>
          )}

          <div
            style={{
              backgroundColor: COLORS.cardBg,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 24,
              padding: '40px 36px',
            }}
          >
            <form onSubmit={handleSubmit}>
              {error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '14px 16px',
                    backgroundColor: COLORS.errorBg,
                    border: `1px solid ${COLORS.errorBorder}`,
                    borderRadius: 10,
                    marginBottom: 24,
                  }}
                >
                  <AlertCircle size={16} color={COLORS.errorText} style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ color: COLORS.errorText, fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>{error}</p>
                </div>
              )}

              {/* Email */}
              <div style={{ marginBottom: 20 }}>
                <label
                  className="label-caps"
                  htmlFor="email"
                  style={{ color: COLORS.textMuted, display: 'block', marginBottom: 8, fontSize: '0.65rem' }}
                >
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={16}
                    color={COLORS.textMuted}
                    style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@dispensary.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = COLORS.inputFocus;
                      e.currentTarget.style.boxShadow = `0 0 0 3px rgba(200,162,60,0.1)`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = COLORS.inputBorder;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 12 }}>
                <label
                  className="label-caps"
                  htmlFor="password"
                  style={{ color: COLORS.textMuted, display: 'block', marginBottom: 8, fontSize: '0.65rem' }}
                >
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
                    color={COLORS.textMuted}
                    style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = COLORS.inputFocus;
                      e.currentTarget.style.boxShadow = `0 0 0 3px rgba(200,162,60,0.1)`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = COLORS.inputBorder;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Forgot password link */}
              <div style={{ marginBottom: 32, textAlign: 'right' }}>
                <Link
                  href="/forgot-password"
                  style={{
                    color: COLORS.gold,
                    textDecoration: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    transition: 'opacity 150ms ease',
                  }}
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="e8-btn-gold"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: loading ? COLORS.goldHover : COLORS.gold,
                  color: '#1A0633',
                  padding: '15px 24px',
                  borderRadius: 9999,
                  fontFamily: "'Barlow', Arial, sans-serif",
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
                {!loading && <ArrowRight size={14} />}
              </button>
            </form>

            {/* Sign up link */}
            <p style={{ textAlign: 'center', marginTop: 28, color: COLORS.textMuted, fontSize: '0.875rem' }}>
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                style={{ color: COLORS.gold, textDecoration: 'none', fontWeight: 600 }}
              >
                Apply Now
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
