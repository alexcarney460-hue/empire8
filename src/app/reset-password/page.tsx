'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Lock, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

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
  inputBg: 'rgba(255,255,255,0.06)',
  inputBorder: 'rgba(255,255,255,0.12)',
  inputFocus: 'rgba(200,162,60,0.4)',
  errorBg: 'rgba(192,57,43,0.12)',
  errorBorder: 'rgba(192,57,43,0.3)',
  errorText: '#E74C3C',
  successBg: 'rgba(39,174,96,0.12)',
  successBorder: 'rgba(39,174,96,0.3)',
  successText: '#27AE60',
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

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { getSupabase } = await import('@/lib/supabase');
      const supabase = getSupabase();

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
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
            Password Recovery
            <span style={{ width: 24, height: 1.5, backgroundColor: COLORS.gold, display: 'inline-block', borderRadius: 99 }} />
          </span>
          <h1 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', lineHeight: 1.05, color: COLORS.textWhite, marginBottom: 12 }}>
            Set a New Password
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: '0.95rem', lineHeight: 1.7 }}>
            Enter your new password below to regain access to your account.
          </p>
        </div>
      </section>

      {/* Form */}
      <section style={{ flex: 1, padding: '48px 24px 80px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div
            style={{
              backgroundColor: COLORS.cardBg,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 24,
              padding: '40px 36px',
            }}
          >
            {success ? (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    padding: '16px 20px',
                    backgroundColor: COLORS.successBg,
                    border: `1px solid ${COLORS.successBorder}`,
                    borderRadius: 12,
                    marginBottom: 24,
                  }}
                >
                  <CheckCircle size={18} color={COLORS.successText} style={{ flexShrink: 0 }} />
                  <p style={{ color: COLORS.successText, fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
                    Your password has been reset successfully.
                  </p>
                </div>
                <Link
                  href="/login"
                  className="e8-btn-gold"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: COLORS.gold,
                    color: '#1A0633',
                    padding: '13px 32px',
                    borderRadius: 9999,
                    fontFamily: "'Barlow', Arial, sans-serif",
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                  }}
                >
                  Sign In
                  <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
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

                {/* New Password */}
                <div style={{ marginBottom: 20 }}>
                  <label
                    className="label-caps"
                    htmlFor="password"
                    style={{ color: COLORS.textMuted, display: 'block', marginBottom: 8, fontSize: '0.65rem' }}
                  >
                    New Password
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
                      autoComplete="new-password"
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = COLORS.inputFocus;
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(200,162,60,0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = COLORS.inputBorder;
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: 32 }}>
                  <label
                    className="label-caps"
                    htmlFor="confirm-password"
                    style={{ color: COLORS.textMuted, display: 'block', marginBottom: 8, fontSize: '0.65rem' }}
                  >
                    Confirm Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={16}
                      color={COLORS.textMuted}
                      style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                    />
                    <input
                      id="confirm-password"
                      type="password"
                      required
                      autoComplete="new-password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = COLORS.inputFocus;
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(200,162,60,0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = COLORS.inputBorder;
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
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
                  {loading ? 'Resetting...' : 'Reset Password'}
                  {!loading && <ArrowRight size={14} />}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
