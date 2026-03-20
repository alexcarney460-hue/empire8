'use client';

import { useState, useEffect, useCallback } from 'react';

/* ── Types ─────────────────────────────────────────────────────────── */

interface BrandInfo {
  readonly id: string;
  readonly company_name: string;
  readonly contact_name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly license_number: string | null;
  readonly license_type: string | null;
  readonly website: string | null;
  readonly description: string | null;
  readonly is_approved: boolean;
  readonly account_type: string;
}

interface FormState {
  contact_name: string;
  phone: string;
  website: string;
  description: string;
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

/* ── Page ──────────────────────────────────────────────────────────── */

export default function BrandSettingsPage() {
  const [brandInfo, setBrandInfo] = useState<BrandInfo | null>(null);
  const [form, setForm] = useState<FormState>({
    contact_name: '',
    phone: '',
    website: '',
    description: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load brand info
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/brand-dashboard/settings');
        if (cancelled) return;

        if (!res.ok) {
          setError('Unable to load account information.');
          setLoading(false);
          return;
        }

        const json = await res.json();
        if (json.ok && json.data) {
          const info = json.data as BrandInfo;
          setBrandInfo(info);
          setForm({
            contact_name: info.contact_name || '',
            phone: info.phone || '',
            website: info.website || '',
            description: info.description || '',
          });
        }
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
    if (!brandInfo) return;

    setError('');
    setSuccess('');
    setSaving(true);

    if (!form.contact_name.trim()) {
      setError('Contact name is required.');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/brand-dashboard/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_name: form.contact_name.trim(),
          phone: form.phone.trim() || null,
          website: form.website.trim() || null,
          description: form.description.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || 'Failed to update settings.');
      } else {
        setSuccess('Settings updated successfully.');
        setBrandInfo((prev) =>
          prev
            ? {
                ...prev,
                contact_name: form.contact_name.trim(),
                phone: form.phone.trim() || null,
                website: form.website.trim() || null,
                description: form.description.trim() || null,
              }
            : prev,
        );
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  }, [brandInfo, form]);

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

  if (!brandInfo && error) {
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
          Manage your brand account information.
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
          <InfoRow label="Company Name" value={brandInfo?.company_name ?? '--'} />
          <InfoRow label="Email" value={brandInfo?.email ?? '--'} />
          <InfoRow label="License Number" value={brandInfo?.license_number ?? '--'} />
          <InfoRow label="License Type" value={brandInfo?.license_type ?? '--'} />
          <InfoRow label="Account Type" value={brandInfo?.account_type ?? '--'} />
          <InfoRow
            label="Status"
            value={brandInfo?.is_approved ? 'Approved' : 'Pending Approval'}
            highlight={brandInfo?.is_approved}
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
          Company name, license, and email cannot be changed. Contact support if you need to update these fields.
        </p>
      </div>

      {/* API Key for Menu Upload */}
      <ApiKeySection />

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
          Contact & Details
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
            <label style={labelStyle}>Website</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => handleChange('website', e.target.value)}
              style={inputStyle}
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label style={labelStyle}>Brand Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
              placeholder="Tell dispensaries about your brand..."
            />
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
    </div>
  );
}

/* ── ApiKeySection ────────────────────────────────────────────────── */

function ApiKeySection() {
  const [hasKey, setHasKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState('');
  const [newKey, setNewKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/brand-dashboard/api-key', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { setHasKey(d.has_key); setMaskedKey(d.masked_key || ''); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleGenerate() {
    if (hasKey && !confirm('This will replace your existing API key. Continue?')) return;
    setGenerating(true);
    setError('');
    setNewKey('');
    try {
      const res = await fetch('/api/brand-dashboard/api-key', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); return; }
      setNewKey(data.api_key);
      setHasKey(true);
      setMaskedKey(data.api_key.slice(0, 10) + '...' + data.api_key.slice(-4));
    } catch { setError('Network error'); } finally { setGenerating(false); }
  }

  async function handleRevoke() {
    if (!confirm('Revoke your API key? Menu uploads via API will stop working.')) return;
    await fetch('/api/brand-dashboard/api-key', { method: 'DELETE', credentials: 'include' });
    setHasKey(false);
    setMaskedKey('');
    setNewKey('');
  }

  function copyKey() {
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, padding: '28px 24px', marginBottom: 24 }}>
      <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.gold, margin: '0 0 8px 0', fontFamily: "'Barlow', Arial, sans-serif" }}>
        API Key
      </p>
      <p style={{ fontSize: '0.82rem', color: COLORS.textSecondary, margin: '0 0 20px 0', lineHeight: 1.6 }}>
        Use your API key to upload your product menu programmatically. Send a POST to <code style={{ color: COLORS.gold, fontSize: '0.78rem' }}>/api/brands/menu</code> with your key in the Authorization header.
      </p>

      {loading ? (
        <p style={{ color: COLORS.textMuted, fontSize: '0.85rem' }}>Loading...</p>
      ) : newKey ? (
        <div>
          <div style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(34,197,94,0.25)', backgroundColor: 'rgba(34,197,94,0.06)', marginBottom: 12 }}>
            <p style={{ color: '#22C55E', fontSize: '0.78rem', fontWeight: 600, margin: '0 0 8px 0' }}>
              Save this key — it will not be shown again.
            </p>
            <code style={{ color: COLORS.textPrimary, fontSize: '0.82rem', wordBreak: 'break-all', fontFamily: 'monospace' }}>{newKey}</code>
          </div>
          <button onClick={copyKey} style={{ padding: '8px 18px', borderRadius: 8, border: `1px solid ${COLORS.cardBorder}`, backgroundColor: 'transparent', color: copied ? '#22C55E' : COLORS.textSecondary, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      ) : hasKey ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22C55E' }} />
            <code style={{ color: COLORS.textPrimary, fontSize: '0.82rem', fontFamily: 'monospace' }}>{maskedKey}</code>
          </div>
          <button onClick={handleGenerate} disabled={generating} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${COLORS.cardBorder}`, backgroundColor: 'transparent', color: COLORS.textSecondary, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
            Regenerate
          </button>
          <button onClick={handleRevoke} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'transparent', color: '#EF4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
            Revoke
          </button>
        </div>
      ) : (
        <button onClick={handleGenerate} disabled={generating} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', backgroundColor: COLORS.gold, color: '#0F0520', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}>
          {generating ? 'Generating...' : 'Generate API Key'}
        </button>
      )}

      {error && <p style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: 12 }}>{error}</p>}

      <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${COLORS.cardBorder}` }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: COLORS.textMuted, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Usage Example</p>
        <pre style={{ color: COLORS.textSecondary, fontSize: '0.72rem', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5, fontFamily: 'monospace' }}>
{`curl -X POST https://empire8ny.com/api/brands/menu \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"brand_slug":"your-brand","products":[...]}'`}
        </pre>
      </div>
    </div>
  );
}

/* ── InfoRow ───────────────────────────────────────────────────────── */

function InfoRow({
  label,
  value,
  highlight,
}: {
  readonly label: string;
  readonly value: string;
  readonly highlight?: boolean;
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
