'use client';

import { useState, useEffect, FormEvent, CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, AlertCircle, Info } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

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
  inputBorder: 'rgba(200,162,60,0.2)',
  inputFocus: 'rgba(200,162,60,0.4)',
  errorBg: 'rgba(192,57,43,0.12)',
  errorBorder: 'rgba(192,57,43,0.3)',
  errorText: '#E74C3C',
} as const;

const CATEGORIES = [
  { value: 'flower', label: 'Flower' },
  { value: 'concentrate', label: 'Concentrates' },
  { value: 'edible', label: 'Edibles' },
  { value: 'pre-roll', label: 'Pre-Rolls' },
  { value: 'vape', label: 'Vape' },
  { value: 'topical', label: 'Topical' },
  { value: 'tincture', label: 'Tinctures' },
  { value: 'other', label: 'Other' },
] as const;

const UNITS = ['lbs', 'oz', 'units', 'cases', 'pallets'] as const;

const GROW_METHODS = [
  { value: 'indoor', label: 'Indoor' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'greenhouse', label: 'Greenhouse' },
  { value: 'mixed-light', label: 'Mixed Light' },
] as const;

const DURATIONS: readonly { label: string; hours: number }[] = [
  { label: '24 hours', hours: 24 },
  { label: '3 days', hours: 72 },
  { label: '5 days', hours: 120 },
  { label: '7 days', hours: 168 },
  { label: '14 days', hours: 336 },
] as const;

/* ------------------------------------------------------------------ */
/*  Shared styles                                                      */
/* ------------------------------------------------------------------ */

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  border: `1px solid ${COLORS.inputBorder}`,
  fontSize: '0.88rem',
  color: COLORS.textWhite,
  background: COLORS.inputBg,
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 180ms ease, box-shadow 180ms ease',
};

const labelStyle: CSSProperties = {
  display: 'block',
  marginBottom: 8,
  fontSize: '0.68rem',
  color: 'rgba(255,255,255,0.7)',
};

const fieldGap: CSSProperties = { marginBottom: 20 };

/* ------------------------------------------------------------------ */
/*  Form state                                                         */
/* ------------------------------------------------------------------ */

interface FormState {
  title: string;
  category: string;
  description: string;
  quantity: string;
  unit: string;
  strain_name: string;
  grow_method: string;
  thc_percentage: string;
  cbd_percentage: string;
  starting_price: string;
  reserve_price: string;
  buy_now_price: string;
  duration_hours: number;
  lab_results_url: string;
  image_url: string;
}

const INITIAL_STATE: FormState = {
  title: '',
  category: '',
  description: '',
  quantity: '',
  unit: 'lbs',
  strain_name: '',
  grow_method: '',
  thc_percentage: '',
  cbd_percentage: '',
  starting_price: '',
  reserve_price: '',
  buy_now_price: '',
  duration_hours: 168,
  lab_results_url: '',
  image_url: '',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function dollarsToCents(value: string): number | null {
  const n = parseFloat(value);
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}

function handleFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = COLORS.inputFocus;
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(200,162,60,0.1)';
}

function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = COLORS.inputBorder;
  e.currentTarget.style.boxShadow = 'none';
}

/* ------------------------------------------------------------------ */
/*  Tooltip                                                            */
/* ------------------------------------------------------------------ */

function Tooltip({ text }: { text: string }) {
  return (
    <span
      title={text}
      aria-label={text}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        marginLeft: 6,
        cursor: 'help',
      }}
    >
      <Info size={13} color={COLORS.textFaint} />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function CreateLotPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  /* Auth guard */
  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/login');
        return;
      }
      setAuthChecked(true);
    });
  }, [router]);

  /* Field updater (immutable) */
  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  /* Validation */
  function validate(): string | null {
    if (!form.title.trim()) return 'Title is required.';
    if (!form.category) return 'Category is required.';
    if (!form.quantity || Number(form.quantity) <= 0) return 'Quantity must be greater than zero.';
    if (!form.starting_price || Number(form.starting_price) <= 0) return 'Starting price is required.';

    const startCents = dollarsToCents(form.starting_price);
    if (startCents === null) return 'Starting price is invalid.';

    if (form.reserve_price) {
      const reserveCents = dollarsToCents(form.reserve_price);
      if (reserveCents === null) return 'Reserve price is invalid.';
      if (reserveCents < startCents) return 'Reserve price cannot be lower than starting price.';
    }

    if (form.buy_now_price) {
      const buyCents = dollarsToCents(form.buy_now_price);
      if (buyCents === null) return 'Buy now price is invalid.';
      if (buyCents <= startCents) return 'Buy now price must be higher than starting price.';
    }

    if (form.thc_percentage && (Number(form.thc_percentage) < 0 || Number(form.thc_percentage) > 100)) {
      return 'THC % must be between 0 and 100.';
    }
    if (form.cbd_percentage && (Number(form.cbd_percentage) < 0 || Number(form.cbd_percentage) > 100)) {
      return 'CBD % must be between 0 and 100.';
    }

    if (form.lab_results_url) {
      try {
        const parsed = new URL(form.lab_results_url);
        if (parsed.protocol !== 'https:') {
          return 'Lab results URL must use HTTPS.';
        }
      } catch {
        return 'Lab results URL is not a valid URL.';
      }
    }

    return null;
  }

  /* Submit */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    const endsAt = new Date(Date.now() + form.duration_hours * 60 * 60 * 1000).toISOString();

    const payload = {
      title: form.title.trim(),
      category: form.category,
      description: form.description.trim() || null,
      quantity: Number(form.quantity),
      unit: form.unit,
      strain_name: form.strain_name.trim() || null,
      grow_method: form.grow_method || null,
      thc_percentage: form.thc_percentage ? Number(form.thc_percentage) : null,
      cbd_percentage: form.cbd_percentage ? Number(form.cbd_percentage) : null,
      starting_price_cents: dollarsToCents(form.starting_price),
      reserve_price_cents: form.reserve_price ? dollarsToCents(form.reserve_price) : null,
      buy_now_price_cents: form.buy_now_price ? dollarsToCents(form.buy_now_price) : null,
      ends_at: endsAt,
      lab_results_url: form.lab_results_url.trim() || null,
      images: form.image_url.trim() ? [form.image_url.trim()] : [],
    };

    try {
      const res = await fetch('/api/marketplace/lots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create lot. Please try again.');
        setLoading(false);
        return;
      }

      const lotId = data.data?.id || data.id;
      router.push(`/marketplace/${lotId}`);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  /* ---- Render ---- */

  if (!authChecked) {
    return (
      <div
        style={{
          paddingTop: 'var(--nav-height)',
          backgroundColor: COLORS.bg,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: COLORS.textMuted, fontSize: '0.95rem' }}>Loading...</p>
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
            right: '10%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,162,60,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <span
            className="label-caps"
            style={{ color: COLORS.gold, display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16 }}
          >
            <span style={{ width: 24, height: 1.5, backgroundColor: COLORS.gold, display: 'inline-block', borderRadius: 99 }} />
            Weedbay Marketplace
            <span style={{ width: 24, height: 1.5, backgroundColor: COLORS.gold, display: 'inline-block', borderRadius: 99 }} />
          </span>
          <h1
            className="font-display"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', lineHeight: 1.05, color: COLORS.textWhite, marginBottom: 12 }}
          >
            Create a Lot
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: '0.95rem', lineHeight: 1.7 }}>
            List your product for auction on the Weedbay marketplace. Fill out the details below to get started.
          </p>
        </div>
      </section>

      {/* Form */}
      <section style={{ flex: 1, padding: '48px 24px 80px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 620 }}>
          <div
            style={{
              backgroundColor: COLORS.cardBg,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 24,
              padding: '40px 36px',
            }}
          >
            <form onSubmit={handleSubmit} noValidate>
              {/* Error banner */}
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

              {/* ---- Lot Details ---- */}
              <p
                className="label-caps"
                style={{ color: COLORS.gold, fontSize: '0.65rem', marginBottom: 20, letterSpacing: '0.12em' }}
              >
                Lot Details
              </p>

              {/* Title */}
              <div style={fieldGap}>
                <label className="label-caps" htmlFor="title" style={labelStyle}>
                  Title *
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  placeholder="e.g. Premium Indoor OG Kush - 10 lbs"
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={inputStyle}
                />
              </div>

              {/* Category */}
              <div style={fieldGap}>
                <label className="label-caps" htmlFor="category" style={labelStyle}>
                  Category *
                </label>
                <select
                  id="category"
                  required
                  value={form.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={inputStyle}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div style={fieldGap}>
                <label className="label-caps" htmlFor="description" style={labelStyle}>
                  Description
                </label>
                <textarea
                  id="description"
                  rows={4}
                  placeholder="Describe your product, quality, trim, cure, etc."
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* Quantity + Unit */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12, ...fieldGap }}>
                <div>
                  <label className="label-caps" htmlFor="quantity" style={labelStyle}>
                    Quantity *
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    required
                    min={1}
                    step={1}
                    placeholder="10"
                    value={form.quantity}
                    onChange={(e) => updateField('quantity', e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="label-caps" htmlFor="unit" style={labelStyle}>
                    Unit
                  </label>
                  <select
                    id="unit"
                    value={form.unit}
                    onChange={(e) => updateField('unit', e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    style={inputStyle}
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ---- Strain Info ---- */}
              <div style={{ borderTop: `1px solid rgba(200,162,60,0.1)`, marginTop: 12, paddingTop: 28, marginBottom: 8 }}>
                <p
                  className="label-caps"
                  style={{ color: COLORS.gold, fontSize: '0.65rem', marginBottom: 20, letterSpacing: '0.12em' }}
                >
                  Strain Information
                </p>
              </div>

              {/* Strain Name */}
              <div style={fieldGap}>
                <label className="label-caps" htmlFor="strain_name" style={labelStyle}>
                  Strain Name
                </label>
                <input
                  id="strain_name"
                  type="text"
                  placeholder="e.g. OG Kush, Blue Dream"
                  value={form.strain_name}
                  onChange={(e) => updateField('strain_name', e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={inputStyle}
                />
              </div>

              {/* Grow Method */}
              <div style={fieldGap}>
                <label className="label-caps" htmlFor="grow_method" style={labelStyle}>
                  Grow Method
                </label>
                <select
                  id="grow_method"
                  value={form.grow_method}
                  onChange={(e) => updateField('grow_method', e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={inputStyle}
                >
                  <option value="">Select grow method</option>
                  {GROW_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* THC % + CBD % */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, ...fieldGap }}>
                <div>
                  <label className="label-caps" htmlFor="thc_percentage" style={labelStyle}>
                    THC %
                  </label>
                  <input
                    id="thc_percentage"
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    placeholder="0.0"
                    value={form.thc_percentage}
                    onChange={(e) => updateField('thc_percentage', e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="label-caps" htmlFor="cbd_percentage" style={labelStyle}>
                    CBD %
                  </label>
                  <input
                    id="cbd_percentage"
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    placeholder="0.0"
                    value={form.cbd_percentage}
                    onChange={(e) => updateField('cbd_percentage', e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Product Image URL */}
              <div style={fieldGap}>
                <label className="label-caps" htmlFor="image_url" style={labelStyle}>
                  Product Image URL
                </label>
                <input
                  id="image_url"
                  type="url"
                  placeholder="https://example.com/product-photo.jpg"
                  value={form.image_url}
                  onChange={(e) => updateField('image_url', e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={inputStyle}
                />
                <p style={{ fontSize: '0.72rem', color: COLORS.textFaint, marginTop: 6 }}>
                  Paste a direct link to your product photo. Supported: JPG, PNG, WebP.
                </p>
              </div>

              {/* Lab Results URL */}
              <div style={fieldGap}>
                <label className="label-caps" htmlFor="lab_results_url" style={labelStyle}>
                  Lab Results URL
                </label>
                <input
                  id="lab_results_url"
                  type="url"
                  placeholder="https://lab-results.example.com/report/123"
                  value={form.lab_results_url}
                  onChange={(e) => updateField('lab_results_url', e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={inputStyle}
                />
              </div>

              {/* ---- Pricing ---- */}
              <div style={{ borderTop: `1px solid rgba(200,162,60,0.1)`, marginTop: 12, paddingTop: 28, marginBottom: 8 }}>
                <p
                  className="label-caps"
                  style={{ color: COLORS.gold, fontSize: '0.65rem', marginBottom: 20, letterSpacing: '0.12em' }}
                >
                  Pricing &amp; Duration
                </p>
              </div>

              {/* Starting Price */}
              <div style={fieldGap}>
                <label className="label-caps" htmlFor="starting_price" style={labelStyle}>
                  Starting Price ($) *
                </label>
                <input
                  id="starting_price"
                  type="number"
                  required
                  min={0.01}
                  step={0.01}
                  placeholder="0.00"
                  value={form.starting_price}
                  onChange={(e) => updateField('starting_price', e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={inputStyle}
                />
              </div>

              {/* Reserve Price + Buy Now Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, ...fieldGap }}>
                <div>
                  <label className="label-caps" htmlFor="reserve_price" style={labelStyle}>
                    Reserve Price ($)
                    <Tooltip text="Lot won't sell below this price" />
                  </label>
                  <input
                    id="reserve_price"
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    value={form.reserve_price}
                    onChange={(e) => updateField('reserve_price', e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="label-caps" htmlFor="buy_now_price" style={labelStyle}>
                    Buy Now Price ($)
                    <Tooltip text="Instant purchase at this price" />
                  </label>
                  <input
                    id="buy_now_price"
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    value={form.buy_now_price}
                    onChange={(e) => updateField('buy_now_price', e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Auction Duration */}
              <div style={fieldGap}>
                <label className="label-caps" htmlFor="duration" style={labelStyle}>
                  Auction Duration
                </label>
                <select
                  id="duration"
                  value={form.duration_hours}
                  onChange={(e) => updateField('duration_hours', Number(e.target.value))}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={inputStyle}
                >
                  {DURATIONS.map((d) => (
                    <option key={d.hours} value={d.hours}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ---- Footer notes ---- */}
              <div
                style={{
                  borderTop: `1px solid rgba(200,162,60,0.1)`,
                  marginTop: 12,
                  paddingTop: 24,
                  marginBottom: 28,
                }}
              >
                <p style={{ color: COLORS.textFaint, fontSize: '0.78rem', lineHeight: 1.7, margin: '0 0 6px' }}>
                  A 5% platform fee applies to the winning bid amount.
                </p>
                <p style={{ color: COLORS.textFaint, fontSize: '0.78rem', lineHeight: 1.7, margin: 0 }}>
                  Your listing will be anonymous. Buyer identity is revealed only after auction closes.
                </p>
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
                  boxShadow: '0 4px 24px rgba(200,162,60,0.35)',
                }}
              >
                {loading ? 'Creating Lot...' : 'Create Lot'}
                {!loading && <ArrowRight size={14} />}
              </button>
            </form>
          </div>
        </div>
      </section>
      <style>{`select option { background: #1A0E2E; color: #fff; }`}</style>
    </div>
  );
}
