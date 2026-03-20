'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  adminFetch,
  cardStyle,
  sectionTitleStyle,
  inputStyle,
  btnPrimary,
  btnSecondary,
  labelStyle,
  errorBoxStyle,
  BORDER,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  GOLD,
} from './shared';

export function ApiKeysSection() {
  const [apiKey, setApiKey] = useState('');
  const [maskedKey, setMaskedKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  const loadKey = useCallback(async () => {
    try {
      const data = await adminFetch('/api/admin/crowdtest/llm-config');
      if (data.has_key) {
        setHasKey(true);
        setMaskedKey(data.masked_key || '');
      } else {
        setHasKey(false);
        setMaskedKey('');
      }
    } catch {
      // No key configured yet
      setHasKey(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadKey(); }, [loadKey]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await adminFetch('/api/admin/crowdtest/llm-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey.trim() }),
      });
      setSuccess('API key saved successfully');
      setApiKey('');
      setEditing(false);
      await loadKey();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Remove the LLM API key? CrowdTest and ThinkTank will stop working.')) return;
    try {
      await adminFetch('/api/admin/crowdtest/llm-config', { method: 'DELETE' });
      setHasKey(false);
      setMaskedKey('');
      setSuccess('API key removed');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove');
    }
  };

  return (
    <div style={{ ...cardStyle, marginBottom: 28 }}>
      <h2 style={sectionTitleStyle}>LLM API Key</h2>
      <p style={{ fontSize: '0.82rem', color: TEXT_SECONDARY, marginBottom: 20 }}>
        CrowdTest and ThinkTank require an Anthropic (Claude) API key to generate personas and run simulations.
        Your key is stored encrypted and never exposed to the client.
      </p>

      {loading ? (
        <div style={{ padding: 20, textAlign: 'center', color: TEXT_MUTED, fontSize: '0.85rem' }}>
          Loading configuration...
        </div>
      ) : hasKey && !editing ? (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 18px', borderRadius: 10,
            border: `1px solid rgba(34,197,94,0.25)`,
            backgroundColor: 'rgba(34,197,94,0.06)',
            marginBottom: 16,
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              backgroundColor: '#22C55E', flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', color: TEXT_PRIMARY, fontWeight: 600 }}>
                Anthropic API Key Configured
              </div>
              <div style={{ fontSize: '0.78rem', color: TEXT_MUTED, marginTop: 2 }}>
                {maskedKey}
              </div>
            </div>
            <button onClick={() => setEditing(true)} style={{ ...btnSecondary, padding: '6px 14px', fontSize: '0.75rem' }}>
              Update
            </button>
            <button onClick={handleDelete} style={{
              ...btnSecondary, padding: '6px 14px', fontSize: '0.75rem',
              borderColor: 'rgba(239,68,68,0.3)', color: '#EF4444',
            }}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Anthropic API Key *</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setError(''); }}
              placeholder="sk-ant-api03-..."
              style={{ ...inputStyle, fontFamily: 'monospace' }}
            />
            <p style={{ fontSize: '0.72rem', color: TEXT_MUTED, marginTop: 6 }}>
              Get your API key from{' '}
              <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer"
                style={{ color: GOLD, textDecoration: 'underline' }}>
                console.anthropic.com
              </a>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSave} disabled={saving} style={btnPrimary}>
              {saving ? 'Saving...' : 'Save API Key'}
            </button>
            {editing && (
              <button onClick={() => { setEditing(false); setApiKey(''); setError(''); }} style={btnSecondary}>
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {error && <div style={{ ...errorBoxStyle, marginTop: 12 }}>{error}</div>}
      {success && (
        <div style={{
          marginTop: 12, padding: '10px 16px', borderRadius: 8,
          backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
          color: '#22C55E', fontSize: '0.82rem',
        }}>
          {success}
        </div>
      )}
    </div>
  );
}
