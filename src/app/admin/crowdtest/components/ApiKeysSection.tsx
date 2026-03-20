'use client';

import { useCallback, useEffect, useState } from 'react';
import { ModalOverlay } from './ModalOverlay';
import {
  ApiKey,
  adminFetch,
  formatDate,
  maskKey,
  cardStyle,
  sectionTitleStyle,
  inputStyle,
  btnPrimary,
  btnSecondary,
  labelStyle,
  thStyle,
  tdStyle,
  errorBoxStyle,
  BORDER,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
} from './shared';

const PULSE_CSS = `@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }`;

export function ApiKeysSection() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminFetch('/api/admin/crowdtest/keys');
      if (res.ok || res.success) {
        setKeys(res.data ?? []);
      } else {
        setError(res.error || 'Failed to load API keys');
      }
    } catch {
      setError('Network error loading API keys.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  async function handleCreate() {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await adminFetch('/api/admin/crowdtest/keys', {
        method: 'POST',
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      if (res.ok || res.success) {
        setShowModal(false);
        setNewKeyName('');
        await fetchKeys();
      } else {
        setError(res.error || 'Failed to generate key');
      }
    } catch {
      setError('Network error creating key.');
    }
    setCreating(false);
  }

  async function handleDelete(id: string) {
    try {
      await adminFetch(`/api/admin/crowdtest/keys?id=${id}`, { method: 'DELETE' });
      setConfirmDeleteId(null);
      await fetchKeys();
    } catch {
      setError('Failed to delete key.');
    }
  }

  async function handleToggle(id: string, currentActive: boolean) {
    try {
      await adminFetch('/api/admin/crowdtest/keys', {
        method: 'PATCH',
        body: JSON.stringify({ id, is_active: !currentActive }),
      });
      await fetchKeys();
    } catch {
      setError('Failed to toggle key.');
    }
  }

  function handleCopy(key: string, id: string) {
    navigator.clipboard.writeText(key).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={sectionTitleStyle}>API Keys</h2>
        <button style={btnPrimary} onClick={() => setShowModal(true)}>
          Generate New Key
        </button>
      </div>

      {error && <div style={errorBoxStyle}>{error}</div>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              {['Name', 'Key', 'Status', 'Created', 'Last Used', 'Actions'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} style={{ padding: '14px 16px' }}>
                      <div style={{
                        height: 14, borderRadius: 6,
                        background: 'rgba(255,255,255,0.06)',
                        width: '70%',
                        animation: 'pulse 1.5s ease-in-out infinite',
                      }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : keys.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', padding: '36px 16px', color: TEXT_MUTED }}>
                  No API keys yet. Generate one to get started.
                </td>
              </tr>
            ) : (
              keys.map((k) => (
                <tr key={k.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ ...tdStyle, color: TEXT_PRIMARY, fontWeight: 600 }}>{k.name}</td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    <span>{maskKey(k.key)}</span>
                    <button
                      onClick={() => handleCopy(k.key, k.id)}
                      title="Copy to clipboard"
                      style={{
                        marginLeft: 8,
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        border: `1px solid ${BORDER}`,
                        background: copiedId === k.id ? 'rgba(34,197,94,0.12)' : 'transparent',
                        color: copiedId === k.id ? '#22C55E' : TEXT_MUTED,
                        cursor: 'pointer',
                      }}
                    >
                      {copiedId === k.id ? 'Copied' : 'Copy'}
                    </button>
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => handleToggle(k.id, k.is_active)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 12px',
                        borderRadius: 9999,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        border: 'none',
                        background: k.is_active ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.1)',
                        color: k.is_active ? '#22C55E' : '#EF4444',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: k.is_active ? '#22C55E' : '#EF4444',
                      }} />
                      {k.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td style={{ ...tdStyle, fontSize: '0.8rem', color: TEXT_MUTED }}>{formatDate(k.created_at)}</td>
                  <td style={{ ...tdStyle, fontSize: '0.8rem', color: TEXT_MUTED }}>
                    {k.last_used_at ? formatDate(k.last_used_at) : 'Never'}
                  </td>
                  <td style={tdStyle}>
                    {confirmDeleteId === k.id ? (
                      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: '#f87171' }}>Confirm?</span>
                        <button
                          onClick={() => handleDelete(k.id)}
                          style={{ ...btnSecondary, color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)', fontSize: '0.72rem', padding: '4px 10px' }}
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          style={{ ...btnSecondary, fontSize: '0.72rem', padding: '4px 10px' }}
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(k.id)}
                        style={{ ...btnSecondary, color: '#EF4444', borderColor: 'rgba(239,68,68,0.2)', fontSize: '0.72rem', padding: '4px 10px' }}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Generate Key Modal */}
      <ModalOverlay open={showModal} onClose={() => { setShowModal(false); setNewKeyName(''); }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 16 }}>
          Generate New API Key
        </h3>
        <label style={labelStyle}>Key Name</label>
        <input
          type="text"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder="e.g. Production, Staging, Testing..."
          style={{ ...inputStyle, marginBottom: 20 }}
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
        />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button style={btnSecondary} onClick={() => { setShowModal(false); setNewKeyName(''); }}>
            Cancel
          </button>
          <button
            style={{ ...btnPrimary, opacity: creating || !newKeyName.trim() ? 0.5 : 1 }}
            onClick={handleCreate}
            disabled={creating || !newKeyName.trim()}
          >
            {creating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </ModalOverlay>

      <style>{PULSE_CSS}</style>
    </div>
  );
}
