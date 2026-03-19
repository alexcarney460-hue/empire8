'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import { ADMIN_EMAILS } from '@/lib/admin/constants';
import type { Profile } from '@/lib/account';
import OrderHistory from './OrderHistory';
import SubscriptionManager from './SubscriptionManager';

type View = 'login' | 'signup' | 'dashboard';

/** Sync the Supabase access token to a server-side cookie for admin fallback auth. */
function syncAdminSession(accessToken: string): void {
  fetch('/api/auth/sync-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: accessToken }),
  }).catch(() => {
    // Non-critical — admin can still use token-based auth
  });
}

/** Clear the admin session cookie on logout. */
function clearAdminSession(): void {
  fetch('/api/auth/sync-session', { method: 'DELETE' }).catch(() => {
    // Non-critical
  });
}

export default function AccountPage() {
  const [view, setView] = useState<View>('login');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [emailVerified, setEmailVerified] = useState(true);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setEmailVerified(!!data.session.user.email_confirmed_at);
        loadProfile(data.session.user.id, data.session.user.email ?? '');
        // Sync admin session cookie for middleware fallback auth
        syncAdminSession(data.session.access_token);
      } else {
        setChecking(false);
      }
    });
  }, []);

  async function loadProfile(userId: string, userEmail: string) {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('profiles')
      .select('user_id,email,account_type,company_name,approved')
      .eq('user_id', userId)
      .maybeSingle();

    const prof = (data as unknown as Profile) ?? {
      user_id: userId,
      email: userEmail,
      account_type: 'retail',
      company_name: null,
      approved: false,
    };
    // Auto-approve admin
    if (ADMIN_EMAILS.includes(userEmail.toLowerCase()) && !prof.approved) {
      await (supabase.from('profiles') as any).upsert({ user_id: userId, email: userEmail, approved: true });
      prof.approved = true;
    }
    setProfile(prof);
    setView('dashboard');
    setChecking(false);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const supabase = getSupabase();
    const { data, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    if (data.user) {
      // Create profile row
      const isAdmin = ADMIN_EMAILS.includes((data.user.email ?? email).toLowerCase());
      await (supabase.from('profiles') as any).upsert({
        user_id: data.user.id,
        email: data.user.email ?? email,
        account_type: 'retail',
        approved: isAdmin,
      });
      setSuccess('Account created! Check your email to confirm, then sign in.');
      setView('login');
      setPassword('');
    }
    setLoading(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = getSupabase();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !data.user) {
      setError(authError?.message ?? 'Login failed. Please try again.');
      setLoading(false);
      return;
    }
    setEmailVerified(!!data.user.email_confirmed_at);
    // Sync admin session cookie for middleware fallback auth
    if (data.session?.access_token) {
      syncAdminSession(data.session.access_token);
    }
    await loadProfile(data.user.id, data.user.email ?? email);
    setLoading(false);
  }

  async function handleResendVerification() {
    setResending(true);
    setResendSuccess('');
    setError('');
    const supabase = getSupabase();
    const { error: resendError } = await supabase.auth.resend({ type: 'signup', email: profile?.email ?? email });
    if (resendError) {
      setError(resendError.message);
    } else {
      setResendSuccess('Verification email sent! Check your inbox.');
    }
    setResending(false);
  }

  async function handleLogout() {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    // Clear the admin session cookie
    clearAdminSession();
    setProfile(null);
    setView('login');
    setEmail('');
    setPassword('');
  }

  const accountLabel: Record<string, string> = {
    retail: 'Retail ($80/case)',
    wholesale: 'Wholesale ($70/case)',
    distribution: 'Distribution ($60/case)',
  };

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-royal)', animation: 'e8-spin 0.7s linear infinite' }} />
        <style>{`@keyframes e8-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', paddingTop: 'var(--nav-height)' }}>
      {/* Hero */}
      <section style={{ borderBottom: '1px solid var(--color-border)', padding: '56px 24px 48px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
          <p className="label-caps" style={{ color: 'var(--color-gold)', fontSize: '0.65rem', marginBottom: 12 }}>
            {view === 'dashboard' ? 'My Account' : view === 'signup' ? 'Create Account' : 'Sign In'}
          </p>
          <h1 className="font-display" style={{ fontSize: '2.2rem', color: 'var(--color-charcoal)', lineHeight: 1.15, marginBottom: 8 }}>
            {view === 'dashboard' ? `Welcome back` : view === 'signup' ? 'Create Your Account' : 'Account Login'}
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-warm-gray)' }}>
            {view === 'dashboard'
              ? profile?.company_name ?? profile?.email
              : view === 'signup'
                ? 'Create an account to get started.'
                : 'Sign in to access your pricing tier and order history.'}
          </p>
        </div>
      </section>

      {/* Content */}
      <section style={{ padding: '48px 24px', maxWidth: 480, margin: '0 auto' }}>
        {(view === 'login' || view === 'signup') ? (
          <div
            style={{
              backgroundColor: '#fff',
              border: '1px solid var(--color-border)',
              borderRadius: 20,
              padding: '36px 32px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {success && (
              <div style={{ fontSize: '0.8rem', color: '#166534', backgroundColor: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                {success}
              </div>
            )}
            <form onSubmit={view === 'signup' ? handleSignup : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: 6 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  style={{
                    width: '100%',
                    border: '1px solid var(--color-border)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: '0.875rem',
                    color: 'var(--color-charcoal)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: '#fafaf9',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: 6 }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    border: '1px solid var(--color-border)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: '0.875rem',
                    color: 'var(--color-charcoal)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: '#fafaf9',
                  }}
                />
              </div>

              {error && (
                <div style={{ fontSize: '0.8rem', color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: loading ? 'var(--color-border)' : 'var(--color-royal)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 9999,
                  padding: '12px 24px',
                  fontFamily: "'Barlow', Arial, sans-serif",
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 150ms ease',
                  marginTop: 4,
                }}
              >
                {loading ? (view === 'signup' ? 'Creating Account...' : 'Signing in...') : (view === 'signup' ? 'Create Account' : 'Sign In')}
              </button>
            </form>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
              {view === 'login' ? (
                <>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-warm-gray)', marginBottom: 12 }}>
                    Don&apos;t have an account?
                  </p>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => { setView('signup'); setError(''); setSuccess(''); }}
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--color-royal)',
                        background: 'none',
                        border: '1px solid var(--color-border)',
                        borderRadius: 9999,
                        padding: '6px 14px',
                        cursor: 'pointer',
                      }}
                    >
                      Create Account
                    </button>
                    <Link
                      href="/wholesale"
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--color-royal)',
                        textDecoration: 'none',
                        border: '1px solid var(--color-border)',
                        borderRadius: 9999,
                        padding: '6px 14px',
                      }}
                    >
                      Apply for Wholesale
                    </Link>
                    <Link
                      href="/dispensary-signup"
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--color-royal)',
                        textDecoration: 'none',
                        border: '1px solid var(--color-border)',
                        borderRadius: 9999,
                        padding: '6px 14px',
                      }}
                    >
                      Dispensary Sign Up
                    </Link>
                  </div>
                </>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-warm-gray)' }}>
                  Already have an account?{' '}
                  <button
                    onClick={() => { setView('login'); setError(''); setSuccess(''); }}
                    style={{ color: 'var(--color-royal)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
                  >
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email verification banner */}
            {!emailVerified && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  backgroundColor: '#FFF8EC',
                  border: '1px solid rgba(200,146,42,0.35)',
                  borderRadius: 12,
                  padding: '16px 20px',
                }}
              >
                <p style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-charcoal)', margin: 0 }}>
                  Please verify your email to place orders
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-warm-gray)', margin: 0, lineHeight: 1.5 }}>
                  Check your inbox for a verification link. You can browse and add items to your cart, but checkout requires a verified email.
                </p>
                {resendSuccess && (
                  <div style={{ fontSize: '0.78rem', color: '#166534', backgroundColor: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px' }}>
                    {resendSuccess}
                  </div>
                )}
                <button
                  onClick={handleResendVerification}
                  disabled={resending}
                  style={{
                    alignSelf: 'flex-start',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: resending ? 'var(--color-warm-gray)' : 'var(--color-royal)',
                    background: 'none',
                    border: '1px solid var(--color-royal)',
                    borderRadius: 9999,
                    padding: '7px 16px',
                    cursor: resending ? 'not-allowed' : 'pointer',
                    fontFamily: "'Barlow', Arial, sans-serif",
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    transition: 'all 150ms ease',
                    opacity: resending ? 0.6 : 1,
                  }}
                >
                  {resending ? 'Sending...' : 'Resend Verification Email'}
                </button>
              </div>
            )}

            {/* Account type card */}
            <div
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 20,
                padding: '28px 28px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <p className="label-caps" style={{ color: 'var(--color-warm-gray)', fontSize: '0.6rem', marginBottom: 16 }}>Account Details</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Row label="Email" value={profile?.email ?? '—'} />
                <Row label="Account Type" value={accountLabel[profile?.account_type ?? 'retail'] ?? 'Retail'} highlight={profile?.account_type !== 'retail'} />
                {profile?.company_name && <Row label="Company" value={profile.company_name} />}
                <Row
                  label="Status"
                  value={profile?.approved ? 'Approved' : 'Pending Approval'}
                  highlight={profile?.approved}
                />
              </div>
            </div>

            {/* Quick links */}
            <div
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 20,
                padding: '24px 28px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <p className="label-caps" style={{ color: 'var(--color-warm-gray)', fontSize: '0.6rem', marginBottom: 16 }}>Quick Links</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ...(ADMIN_EMAILS.includes(profile?.email?.toLowerCase() ?? '') ? [{ label: 'Admin Dashboard', href: '/admin' }] : []),
                  { label: 'My Subscriptions', href: '#subscriptions' },
                  { label: 'Browse Catalog', href: '/catalog' },
                  { label: 'Wholesale Program', href: '/wholesale' },
                  { label: 'Dispensary Sign Up', href: '/dispensary-signup' },
                  { label: 'Contact Support', href: '/contact' },
                ].map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      color: 'var(--color-charcoal)',
                      textDecoration: 'none',
                      padding: '8px 0',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    {label}
                    <span style={{ color: 'var(--color-gold)' }}>→</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Subscriptions */}
            {profile?.email && (
              <div id="subscriptions">
                <SubscriptionManager email={profile.email} />
              </div>
            )}

            {/* Order History */}
            {profile?.email && <OrderHistory email={profile.email} />}

            <button
              onClick={handleLogout}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--color-warm-gray)',
                border: '1px solid var(--color-border)',
                borderRadius: 9999,
                padding: '11px 24px',
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 600,
                fontSize: '0.78rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'border-color 150ms ease, color 150ms ease',
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--color-warm-gray)' }}>{label}</span>
      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: highlight ? 'var(--color-royal)' : 'var(--color-charcoal)' }}>
        {value}
      </span>
    </div>
  );
}
