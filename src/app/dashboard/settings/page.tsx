'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import NotificationPreferences from '@/components/NotificationPreferences';

/* ── Types ─────────────────────────────────────────────────────────── */

interface DispensaryInfo {
  id: string;
  company_name: string;
  license_number: string;
  license_type: string;
  contact_name: string;
  email: string;
  phone: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  is_approved: boolean;
}

interface FormState {
  contact_name: string;
  phone: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
}

/* ── Constants ─────────────────────────────────────────────────────── */

const COLORS = {
  card: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(200,162,60,0.12)',
  gold: '#C8A23C',
  goldSubtle: 'rgba(200,162,60,0.10)',
  textPrimary: '#fff',
  textSecondary: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.4)',
  inputBg: 'rgba(255,255,255,0.06)',
  inputBorder: 'rgba(200,162,60,0.2)',
} as const;

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  border: `1px solid ${COLORS.inputBorder}`,
  fontSize: '0.88rem',
  color: COLORS.textPrimary,
  background: COLORS.inputBg,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const readOnlyInputStyle: React.CSSProperties = {
  ...inputStyle,
  backgroundColor: 'rgba(255,255,255,0.02)',
  color: COLORS.textMuted,
  cursor: 'not-allowed',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 8,
  fontSize: '0.68rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: COLORS.textMuted,
  fontFamily: "'Barlow', Arial, sans-serif",
};

const LICENSE_TYPE_LABELS: Record<string, string> = {
  adult_use_retail: 'Adult-Use Retail',
  medical_retail: 'Medical Retail',
  microbusiness: 'Microbusiness',
  delivery: 'Delivery',
  'CAURD Dispensary': 'CAURD Dispensary',
  'Adult-Use Retail Dispensary': 'Adult-Use Retail Dispensary',
  'Registered Organization': 'Registered Organization',
};

/* ── Page ──────────────────────────────────────────────────────────── */

export default function SettingsPage() {
  const [dispensary, setDispensary] = useState<DispensaryInfo | null>(null);
  const [form, setForm] = useState<FormState>({
    contact_name: '',
    phone: '',
    address_street: '',
    address_city: '',
    address_state: '',
    address_zip: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load dispensary info
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = getSupabase();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          setError('Please sign in to view settings.');
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('dispensary_accounts')
          .select('*')
          .eq('user_id', userData.user.id)
          .maybeSingle();

        if (cancelled) return;

        if (fetchError || !data) {
          setError('Unable to load account information.');
          setLoading(false);
          return;
        }

        const info = data as unknown as DispensaryInfo;
        setDispensary(info);
        setForm({
          contact_name: info.contact_name || '',
          phone: info.phone || '',
          address_street: info.address_street || '',
          address_city: info.address_city || '',
          address_state: info.address_state || 'NY',
          address_zip: info.address_zip || '',
        });
      } catch {
        if (!cancelled) setError('Unable to load account information.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const handleChange = useCallback((field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess('');
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispensary) return;

    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // Validate required fields
      if (!form.contact_name.trim()) {
        setError('Contact name is required.');
        setSaving(false);
        return;
      }

      const res = await fetch('/api/dashboard/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_name: form.contact_name.trim(),
          phone: form.phone.trim() || null,
          address_street: form.address_street.trim() || null,
          address_city: form.address_city.trim() || null,
          address_state: form.address_state.trim() || 'NY',
          address_zip: form.address_zip.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || 'Failed to update settings. Please try again.');
      } else {
        setSuccess('Settings updated successfully.');
        // Update local state immutably
        setDispensary((prev) =>
          prev
            ? {
                ...prev,
                contact_name: form.contact_name.trim(),
                phone: form.phone.trim() || null,
                address_street: form.address_street.trim() || null,
                address_city: form.address_city.trim() || null,
                address_state: form.address_state.trim() || 'NY',
                address_zip: form.address_zip.trim() || null,
              }
            : prev,
        );
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  }, [dispensary, form]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: `3px solid ${COLORS.cardBorder}`,
            borderTopColor: COLORS.gold,
            animation: 'e8-spin 0.7s linear infinite',
          }}
        />
        <style>{`@keyframes e8-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!dispensary && error) {
    return (
      <div
        style={{
          backgroundColor: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 12,
          padding: '20px 24px',
          color: '#f87171',
          fontSize: '0.88rem',
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 'clamp(1.3rem, 3vw, 1.75rem)',
            fontWeight: 700,
            color: COLORS.textPrimary,
            margin: '0 0 6px 0',
          }}
        >
          Account Settings
        </h1>
        <p style={{ fontSize: '0.88rem', color: COLORS.textSecondary, margin: 0 }}>
          Manage your dispensary account information.
        </p>
      </div>

      {/* Read-only company info */}
      <div
        style={{
          backgroundColor: COLORS.card,
          border: `1px solid ${COLORS.cardBorder}`,
          borderRadius: 16,
          padding: '28px 24px',
          marginBottom: 20,
        }}
      >
        <p
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.gold,
            margin: '0 0 20px 0',
            fontFamily: "'Barlow', Arial, sans-serif",
          }}
        >
          Company Information
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <InfoRow label="Company Name" value={dispensary?.company_name ?? '--'} />
          <InfoRow label="License Number" value={dispensary?.license_number ?? '--'} />
          <InfoRow
            label="License Type"
            value={LICENSE_TYPE_LABELS[dispensary?.license_type ?? ''] ?? dispensary?.license_type ?? '--'}
          />
          <InfoRow label="Email" value={dispensary?.email ?? '--'} />
          <InfoRow
            label="Status"
            value={dispensary?.is_approved ? 'Approved' : 'Pending Approval'}
            highlight={dispensary?.is_approved}
          />
        </div>

        <p
          style={{
            fontSize: '0.75rem',
            color: COLORS.textMuted,
            marginTop: 16,
            marginBottom: 0,
            lineHeight: 1.6,
          }}
        >
          Company name, license number, and email cannot be changed. Contact support if you need to update these fields.
        </p>
      </div>

      {/* Editable contact info */}
      <div
        style={{
          backgroundColor: COLORS.card,
          border: `1px solid ${COLORS.cardBorder}`,
          borderRadius: 16,
          padding: '28px 24px',
        }}
      >
        <p
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.gold,
            margin: '0 0 24px 0',
            fontFamily: "'Barlow', Arial, sans-serif",
          }}
        >
          Contact & Address
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={labelStyle}>Contact Name *</label>
            <input
              type="text"
              required
              value={form.contact_name}
              onChange={(e) => handleChange('contact_name', e.target.value)}
              style={inputStyle}
              placeholder="Full name"
            />
          </div>

          <div>
            <label style={labelStyle}>Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              style={inputStyle}
              placeholder="(555) 000-0000"
            />
          </div>

          <div>
            <label style={labelStyle}>Street Address</label>
            <input
              type="text"
              value={form.address_street}
              onChange={(e) => handleChange('address_street', e.target.value)}
              style={inputStyle}
              placeholder="123 Main St"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px', gap: 12 }}>
            <div>
              <label style={labelStyle}>City</label>
              <input
                type="text"
                value={form.address_city}
                onChange={(e) => handleChange('address_city', e.target.value)}
                style={inputStyle}
                placeholder="City"
              />
            </div>
            <div>
              <label style={labelStyle}>State</label>
              <input
                type="text"
                value={form.address_state}
                readOnly
                style={readOnlyInputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Zip</label>
              <input
                type="text"
                value={form.address_zip}
                onChange={(e) => handleChange('address_zip', e.target.value)}
                style={inputStyle}
                placeholder="10001"
              />
            </div>
          </div>

          {error && (
            <div
              style={{
                fontSize: '0.82rem',
                color: '#f87171',
                backgroundColor: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 10,
                padding: '10px 14px',
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                fontSize: '0.82rem',
                color: '#4ade80',
                backgroundColor: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 10,
                padding: '10px 14px',
              }}
            >
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              alignSelf: 'flex-start',
              backgroundColor: saving ? COLORS.textMuted : COLORS.gold,
              color: '#1A0633',
              border: 'none',
              borderRadius: 9999,
              padding: '12px 28px',
              fontFamily: "'Barlow', Arial, sans-serif",
              fontWeight: 700,
              fontSize: '0.78rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'background-color 150ms ease',
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Notification Preferences */}
      <NotificationPreferences />
    </div>
  );
}

/* ── InfoRow ───────────────────────────────────────────────────────── */

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: '0.82rem', color: COLORS.textMuted }}>{label}</span>
      <span
        style={{
          fontSize: '0.88rem',
          fontWeight: 600,
          color: highlight ? COLORS.gold : COLORS.textPrimary,
        }}
      >
        {value}
      </span>
    </div>
  );
}
