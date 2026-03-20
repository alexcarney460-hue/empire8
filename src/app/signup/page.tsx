'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import {
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  MapPin,
  FileText,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

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
  successBg: 'rgba(39,174,96,0.08)',
  successBorder: 'rgba(39,174,96,0.25)',
  successText: '#27AE60',
} as const;

const LICENSE_OPTIONS = [
  { value: 'adult_use_retail', label: 'Adult-Use Retail Dispensary' },
  { value: 'medical_retail', label: 'Medical Retail Dispensary' },
  { value: 'microbusiness', label: 'Microbusiness' },
  { value: 'delivery', label: 'Delivery License' },
] as const;

function makeInputStyle(hasIcon: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: hasIcon ? '14px 16px 14px 44px' : '14px 16px',
    backgroundColor: COLORS.inputBg,
    border: `1px solid ${COLORS.inputBorder}`,
    borderRadius: 12,
    color: COLORS.textWhite,
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 180ms ease, box-shadow 180ms ease',
    fontFamily: 'inherit',
  };
}

function focusHandler(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = COLORS.inputFocus;
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(200,162,60,0.1)';
}

function blurHandler(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = COLORS.inputBorder;
  e.currentTarget.style.boxShadow = 'none';
}

type FormFields = {
  company_name: string;
  license_number: string;
  license_type: string;
  contact_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
};

const INITIAL_FORM: FormFields = {
  company_name: '',
  license_number: '',
  license_type: 'adult_use_retail',
  contact_name: '',
  email: '',
  phone: '',
  password: '',
  confirm_password: '',
  address_street: '',
  address_city: '',
  address_state: 'NY',
  address_zip: '',
};

export default function SignupPage() {
  const [form, setForm] = useState<FormFields>(INITIAL_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function updateField(field: keyof FormFields, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          company_name: form.company_name,
          license_number: form.license_number,
          license_type: form.license_type,
          contact_name: form.contact_name,
          phone: form.phone || undefined,
          address_street: form.address_street || undefined,
          address_city: form.address_city || undefined,
          address_state: form.address_state || undefined,
          address_zip: form.address_zip || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed.');
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

  // Success state
  if (success) {
    return (
      <div
        style={{
          paddingTop: 'var(--nav-height)',
          backgroundColor: COLORS.bg,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 520,
            textAlign: 'center',
            backgroundColor: COLORS.cardBg,
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 24,
            padding: '56px 40px',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: COLORS.successBg,
              border: `2px solid ${COLORS.successBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <CheckCircle2 size={28} color={COLORS.successText} />
          </div>
          <h1 className="font-display" style={{ fontSize: '1.75rem', color: COLORS.textWhite, marginBottom: 16 }}>
            Application Submitted
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: '0.95rem', lineHeight: 1.8, marginBottom: 32 }}>
            Thank you for applying to partner with Empire 8 Sales Direct. Your dispensary account is pending
            approval. We will review your license information and notify you by email within 2 business days.
          </p>
          <Link
            href="/login"
            className="e8-btn-gold"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: COLORS.gold,
              color: '#1A0633',
              padding: '14px 32px',
              borderRadius: 9999,
              fontFamily: "'Barlow', Arial, sans-serif",
              fontWeight: 700,
              fontSize: '0.82rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            Go to Login <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
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
            left: '5%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,162,60,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ maxWidth: 580, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <span
            className="label-caps"
            style={{ color: COLORS.gold, display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16 }}
          >
            <span style={{ width: 24, height: 1.5, backgroundColor: COLORS.gold, display: 'inline-block', borderRadius: 99 }} />
            Dispensary Registration
            <span style={{ width: 24, height: 1.5, backgroundColor: COLORS.gold, display: 'inline-block', borderRadius: 99 }} />
          </span>
          <h1 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', lineHeight: 1.05, color: COLORS.textWhite, marginBottom: 12 }}>
            Apply for a Wholesale Account
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: '0.95rem', lineHeight: 1.7 }}>
            Complete the form below to apply for a dispensary wholesale account. A valid NYS cannabis license is required.
          </p>
        </div>
      </section>

      {/* Form */}
      <section style={{ flex: 1, padding: '48px 24px 80px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 560 }}>
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

              {/* Section: Business Info */}
              <p className="label-caps" style={{ color: COLORS.gold, marginBottom: 20, fontSize: '0.6rem' }}>
                Business Information
              </p>

              {/* Company Name */}
              <div style={{ marginBottom: 18 }}>
                <label className="label-caps" htmlFor="company_name" style={{ color: COLORS.textMuted, display: 'block', marginBottom: 8, fontSize: '0.6rem' }}>
                  Company Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={16} color={COLORS.textMuted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input id="company_name" type="text" required placeholder="Dispensary name" value={form.company_name} onChange={(e) => updateField('company_name', e.target.value)} style={makeInputStyle(true)} onFocus={focusHandler} onBlur={blurHandler} />
                </div>
              </div>

              {/* License Number + Type (side by side) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }} className="e8-name-row">
                <div>
                  <label className="label-caps" htmlFor="license_number" style={{ color: COLORS.textMuted, display: 'block', marginBottom: 8, fontSize: '0.6rem' }}>
                    License Number *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <FileText size={16} color={COLORS.textMuted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input id="license_number" type="text" required placeholder="OCM-XXXX-XXXX" value={form.license_number} onChange={(e) => updateField('license_number', e.target.value)} style={makeInputStyle(true)} onFocus={focusHandler} onBlur={blurHandler} />
                  </div>
                </div>
                <div>
                  <label className="label-caps" htmlFor="license_type" style={{ color: COLORS.textMuted, display: 'block', marginBottom: 8, fontSize: '0.6rem' }}>
                    License Type *
                  </label>
                  <select
                    id="license_type"
                    required
                    value={form.license_type}
                    onChange={(e) => updateField('license_type', e.target.value)}
                    style={{
                      ...makeInputStyle(false),
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 14px center',
                      paddingRight: 36,
                    }}
                    onFocus={focusHandler}
                    onBlur={blurHandler}
                  >
                    {LICENSE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} style={{ backgroundColor: '#1A0633', color: '#fff' }}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, backgroundColor: 'rgba(200,162,60,0.1)', margin: '28px 0' }} />

              {/* Section: Contact */}
              <p className="label-caps" style={{ color: COLORS.gold, marginBottom: 20, fontSize: '0.6rem' }}>
                Contact Information
              </p>

              {/* Contact Name */}
              <div style={{ marginBottom: 18 }}>
                <label className="label-caps" htmlFor="contact_name" style={{ color: COLORS.textMuted, display: 'block', marginBottom: 8, fontSize: '0.6rem' }}>
                  Contact Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color={COLORS.textMuted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input id="contact_name" type="text" required placeholder="Full name" value={form.contact_name} onChange={(e) => updateField('contact_name', e.target.value)} style={makeInputStyle(true)} onFocus={focusHandler} onBlur={blurHandler} />
                </div>
              </div>

              {/* Email + Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }} className="e8-name-row">
                <div>
                  <label className="label-caps" htmlFor="email" style={{ color: COLORS.textMuted, display: 'block', marginBottom: 8, fontSize: '0.6rem' }}>
                    Email *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color={COLORS.textMuted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input id="email" type="email" required autoComplete="email" placeholder="you@company.com" value={form.email} onChange={(e) => updateField('email', e.target.value)} style={makeInputStyle(true)} onFocus={focusHandler} onBlur={blurHandler} />
                  </div>
                </div>
                <div>
                  <label className="label-caps" htmlFor="phone" style={{ color: COLORS.textMuted, display: 'block', marginBottom: 8, fontSize: '0.6rem' }}>
                    Phone
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} color={COLORS.textMuted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input id="phone" type="tel" autoComplete="tel" placeholder="(555) 000-0000" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} style={makeInputStyle(true)} onFocus={focusHandler} onBlur={blurHandler} />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, backgroundColor: 'rgba(200,162,60,0.1)', margin: '28px 0' }} />

              {/* Section: Address */}
              <p className="label-caps" style={{ color: COLORS.gold, marginBottom: 20, fontSize: '0.6rem' }}>
                Business Address
              </p>

              {/* Street */}
              <div style={{ marginBottom: 18 }}>
                <label className="label-caps" htmlFor="address_street" style={{ color: COLORS.textMuted, display: 'block', marginBottom: 8, fontSize: '0.6rem' }}>
                  Street Address
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} color={COLORS.textMuted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input id="address_street" type="text" autoComplete="street-address" placeholder="123 Main St" value={form.address_street} onChange={(e) => updateField('address_street', e.target.value)} style={makeInputStyle(true)} onFocus={focusHandler} onBlur={blurHandler} />
                </div>
              </div>

              {/* City, State, Zip */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14, marginBottom: 18 }} className="e8-name-row">
                <div>
                  <label className="label-caps" htmlFor="address_city" style={{ color: COLORS.textMuted, display: 'block', marginBottom: 8, fontSize: '0.6rem' }}>
                    City
                  </label>
                  <input id="address_city" type="text" autoComplete="address-level2" placeholder="New York" value={form.address_city} onChange={(e) => updateField('address_city', e.target.value)} style={makeInputStyle(false)} onFocus={focusHandler} onBlur={blurHandler} />
                </div>
                <div>
                  <label className="label-caps" htmlFor="address_state" style={{ color: COLORS.textMuted, display: 'block', marginBottom: 8, fontSize: '0.6rem' }}>
                    State
                  </label>
                  <input id="address_state" type="text" autoComplete="address-level1" placeholder="NY" value={form.address_state} onChange={(e) => updateField('address_state', e.target.value)} style={makeInputStyle(false)} onFocus={focusHandler} onBlur={blurHandler} />
                </div>
                <div>
                  <label className="label-caps" htmlFor="address_zip" style={{ color: COLORS.textMuted, display: 'block', marginBottom: 8, fontSize: '0.6rem' }}>
                    Zip Code
                  </label>
                  <input id="address_zip" type="text" autoComplete="postal-code" placeholder="10001" value={form.address_zip} onChange={(e) => updateField('address_zip', e.target.value)} style={makeInputStyle(false)} onFocus={focusHandler} onBlur={blurHandler} />
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, backgroundColor: 'rgba(200,162,60,0.1)', margin: '28px 0' }} />

              {/* Section: Password */}
              <p className="label-caps" style={{ color: COLORS.gold, marginBottom: 20, fontSize: '0.6rem' }}>
                Account Password
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 32 }} className="e8-name-row">
                <div>
                  <label className="label-caps" htmlFor="password" style={{ color: COLORS.textMuted, display: 'block', marginBottom: 8, fontSize: '0.6rem' }}>
                    Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color={COLORS.textMuted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input id="password" type="password" required autoComplete="new-password" placeholder="Min 8 characters" value={form.password} onChange={(e) => updateField('password', e.target.value)} style={makeInputStyle(true)} onFocus={focusHandler} onBlur={blurHandler} />
                  </div>
                </div>
                <div>
                  <label className="label-caps" htmlFor="confirm_password" style={{ color: COLORS.textMuted, display: 'block', marginBottom: 8, fontSize: '0.6rem' }}>
                    Confirm Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color={COLORS.textMuted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input id="confirm_password" type="password" required autoComplete="new-password" placeholder="Repeat password" value={form.confirm_password} onChange={(e) => updateField('confirm_password', e.target.value)} style={makeInputStyle(true)} onFocus={focusHandler} onBlur={blurHandler} />
                  </div>
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
                {loading ? 'Submitting Application...' : 'Submit Application'}
                {!loading && <ArrowRight size={14} />}
              </button>

              <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: '0.75rem', lineHeight: 1.7, marginTop: 20, marginBottom: 0 }}>
                By submitting, you confirm that the license information provided is accurate and that you are authorized to represent this dispensary.
              </p>
            </form>

            {/* Login link */}
            <p style={{ textAlign: 'center', marginTop: 28, color: COLORS.textMuted, fontSize: '0.875rem' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: COLORS.gold, textDecoration: 'none', fontWeight: 600 }}>
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
