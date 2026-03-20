'use client';

import { useCallback, useEffect, useState } from 'react';
import { COLORS } from '@/lib/admin/theme';

/* ── Local theme tokens ── */
const TEXT_PRIMARY = '#ffffff';
const TEXT_SECONDARY = 'rgba(255,255,255,0.55)';
const TEXT_MUTED = 'rgba(255,255,255,0.35)';
const BORDER = 'rgba(200,162,60,0.12)';
const GOLD = '#C8A23C';
const CARD_BG = 'rgba(255,255,255,0.04)';

const STATUS_COLORS: Record<string, string> = {
  pending: '#EAB308',
  running: '#3B82F6',
  complete: '#22C55E',
  completed: '#22C55E',
  failed: '#EF4444',
};

/* ── Types ── */
interface ExpertProfile {
  readonly name: string;
  readonly title: string;
  readonly expertise_areas: readonly string[];
  readonly perspective_bias: string;
  readonly argumentation_style: string;
}

interface DebateRoundEntry {
  readonly expert_name: string;
  readonly argument: string;
}

interface DebateRound {
  readonly round_number: number;
  readonly entries: readonly DebateRoundEntry[];
}

interface DebateSynthesis {
  readonly agreements: readonly string[];
  readonly disagreements: readonly string[];
  readonly recommendations: readonly string[];
  readonly summary?: string;
}

interface Debate {
  readonly id: string;
  readonly title: string;
  readonly question: string;
  readonly context: string | null;
  readonly expert_count: number;
  readonly status: string;
  readonly experts: readonly ExpertProfile[] | null;
  readonly rounds: readonly DebateRound[] | null;
  readonly synthesis: DebateSynthesis | null;
  readonly created_at: string;
  readonly completed_at: string | null;
}

/* ── Helpers ── */
function adminFetch(path: string, opts: RequestInit = {}) {
  const token = process.env.NEXT_PUBLIC_ADMIN_ANALYTICS_TOKEN || '';
  const headers: Record<string, string> = {
    ...(opts.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (opts.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  return fetch(path, { ...opts, headers }).then((r) => r.json());
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ── Shared styles ── */
const cardStyle: React.CSSProperties = {
  background: CARD_BG,
  border: `1px solid ${BORDER}`,
  borderRadius: 16,
  padding: 24,
  marginBottom: 32,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1.15rem',
  fontWeight: 700,
  color: TEXT_PRIMARY,
  marginBottom: 16,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  border: `1px solid ${BORDER}`,
  background: 'rgba(255,255,255,0.04)',
  color: TEXT_PRIMARY,
  fontSize: '0.85rem',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 600,
  color: TEXT_SECONDARY,
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const btnPrimary: React.CSSProperties = {
  padding: '10px 24px',
  borderRadius: 10,
  fontSize: '0.85rem',
  fontWeight: 700,
  border: 'none',
  background: GOLD,
  color: '#0F0520',
  cursor: 'pointer',
  transition: 'opacity 150ms',
};

const errorBoxStyle: React.CSSProperties = {
  background: 'rgba(239,68,68,0.08)',
  border: '1px solid rgba(239,68,68,0.25)',
  borderRadius: 10,
  padding: '10px 14px',
  marginBottom: 16,
  color: '#f87171',
  fontSize: '0.85rem',
};

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left' as const,
  fontSize: '0.72rem',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  color: TEXT_MUTED,
  whiteSpace: 'nowrap' as const,
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  color: TEXT_SECONDARY,
  fontSize: '0.84rem',
};

/* ── StatusBadge ── */
function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? TEXT_MUTED;
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const bgAlpha = `rgba(${r},${g},${b},0.12)`;
  const borderAlpha = `rgba(${r},${g},${b},0.25)`;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 9999,
        fontSize: '0.72rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        background: bgAlpha,
        color,
        border: `1px solid ${borderAlpha}`,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

/* ── NewDebateSection ── */
function NewDebateSection({ onDebateCreated }: { onDebateCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [expertCount, setExpertCount] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!title.trim() || !question.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await adminFetch('/api/admin/thinktank/debates', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          question: question.trim(),
          context: context.trim() || undefined,
          expert_count: expertCount,
        }),
      });

      if (res.ok) {
        setTitle('');
        setQuestion('');
        setContext('');
        setExpertCount(5);
        onDebateCreated();
      } else {
        setError(res.error || 'Failed to create debate');
      }
    } catch {
      setError('Network error creating debate.');
    }

    setSubmitting(false);
  }

  const canSubmit = title.trim().length > 0 && question.trim().length > 0 && !submitting;

  return (
    <div style={cardStyle}>
      <h2 style={sectionTitleStyle}>New Debate</h2>

      {error && <div style={errorBoxStyle}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, marginBottom: 20 }}>
        {/* Title */}
        <div>
          <label style={labelStyle}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Pricing Strategy for Q2 2026"
            style={inputStyle}
          />
        </div>

        {/* Question */}
        <div>
          <label style={labelStyle}>Question</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="The question experts will debate, e.g. Should Empire 8 adopt tiered pricing based on dispensary volume?"
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {/* Context */}
        <div>
          <label style={labelStyle}>Context (optional)</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Additional context for the debate. If left empty, Empire 8 business data is auto-injected."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
          <div style={{ fontSize: '0.72rem', color: TEXT_MUTED, marginTop: 4 }}>
            Leave empty to auto-enrich with live Empire 8 data (brands, products, dispensaries, orders).
          </div>
        </div>

        {/* Expert Count Slider */}
        <div>
          <label style={labelStyle}>Expert Count: {expertCount}</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.78rem', color: TEXT_MUTED }}>3</span>
            <input
              type="range"
              min={3}
              max={10}
              step={1}
              value={expertCount}
              onChange={(e) => setExpertCount(Number(e.target.value))}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                appearance: 'none',
                background: `linear-gradient(to right, ${GOLD} 0%, ${GOLD} ${((expertCount - 3) / 7) * 100}%, rgba(255,255,255,0.1) ${((expertCount - 3) / 7) * 100}%, rgba(255,255,255,0.1) 100%)`,
                cursor: 'pointer',
                outline: 'none',
              }}
            />
            <span style={{ fontSize: '0.78rem', color: TEXT_MUTED }}>10</span>
          </div>
        </div>
      </div>

      <button
        style={{
          ...btnPrimary,
          opacity: canSubmit ? 1 : 0.5,
        }}
        onClick={handleSubmit}
        disabled={!canSubmit}
      >
        {submitting ? 'Creating...' : 'Start Debate'}
      </button>
    </div>
  );
}

/* ── DebateDetails (expanded view) ── */
function DebateDetails({ debate }: { debate: Debate }) {
  const experts = debate.experts ?? [];
  const rounds = debate.rounds ?? [];
  const synthesis = debate.synthesis;

  if (debate.status === 'pending') {
    return (
      <div style={{ padding: '16px 16px 20px 36px', color: TEXT_MUTED, fontSize: '0.85rem' }}>
        Debate is queued and will begin shortly.
      </div>
    );
  }

  if (debate.status === 'running') {
    return (
      <div style={{ padding: '16px 16px 20px 36px', color: TEXT_MUTED, fontSize: '0.85rem' }}>
        Debate is currently running. Results will appear here when complete.
      </div>
    );
  }

  if (debate.status === 'failed') {
    return (
      <div style={{ padding: '16px 16px 20px 36px', color: '#f87171', fontSize: '0.85rem' }}>
        This debate failed. Check server logs for details.
      </div>
    );
  }

  return (
    <div style={{ padding: '0 16px 20px 36px', borderTop: `1px solid rgba(200,162,60,0.06)` }}>
      {/* Expert Panel */}
      {experts.length > 0 && (
        <div style={{ marginTop: 16, marginBottom: 20 }}>
          <h4 style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: TEXT_SECONDARY,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: 10,
          }}>
            Expert Panel ({experts.length})
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 12,
          }}>
            {experts.map((expert, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 10,
                  padding: '12px 14px',
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 2 }}>
                  {expert.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: GOLD, marginBottom: 6 }}>
                  {expert.title}
                </div>
                <div style={{ fontSize: '0.72rem', color: TEXT_MUTED }}>
                  Bias: {expert.perspective_bias}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debate Rounds */}
      {rounds.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h4 style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: TEXT_SECONDARY,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: 10,
          }}>
            Debate Rounds ({rounds.length})
          </h4>
          <div style={{
            maxHeight: 420,
            overflowY: 'auto',
            borderRadius: 10,
            border: `1px solid ${BORDER}`,
          }}>
            {rounds.map((round, rIdx) => (
              <div key={rIdx}>
                <div style={{
                  padding: '10px 16px',
                  background: 'rgba(74,14,120,0.15)',
                  borderBottom: `1px solid ${BORDER}`,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: GOLD,
                }}>
                  Round {round.round_number}
                </div>
                {(round.entries ?? []).map((entry, eIdx) => (
                  <div
                    key={eIdx}
                    style={{
                      padding: '12px 16px',
                      borderBottom: eIdx < (round.entries?.length ?? 0) - 1 || rIdx < rounds.length - 1
                        ? `1px solid ${BORDER}`
                        : 'none',
                      display: 'flex',
                      gap: 16,
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ minWidth: 140 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: TEXT_PRIMARY }}>
                        {entry.expert_name}
                      </div>
                    </div>
                    <div style={{ flex: 1, fontSize: '0.82rem', color: TEXT_SECONDARY, lineHeight: 1.5 }}>
                      {entry.argument}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Synthesis */}
      {synthesis && (
        <div>
          <h4 style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: TEXT_SECONDARY,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: 10,
          }}>
            Synthesis
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {/* Agreements */}
            {synthesis.agreements && synthesis.agreements.length > 0 && (
              <div style={{
                background: 'rgba(34,197,94,0.06)',
                border: '1px solid rgba(34,197,94,0.15)',
                borderRadius: 10,
                padding: '14px 16px',
              }}>
                <div style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#22C55E',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: 8,
                }}>
                  Agreements
                </div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {synthesis.agreements.map((a, i) => (
                    <li key={i} style={{ fontSize: '0.82rem', color: TEXT_SECONDARY, lineHeight: 1.6, marginBottom: 4 }}>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disagreements */}
            {synthesis.disagreements && synthesis.disagreements.length > 0 && (
              <div style={{
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: 10,
                padding: '14px 16px',
              }}>
                <div style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#EF4444',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: 8,
                }}>
                  Disagreements
                </div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {synthesis.disagreements.map((d, i) => (
                    <li key={i} style={{ fontSize: '0.82rem', color: TEXT_SECONDARY, lineHeight: 1.6, marginBottom: 4 }}>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {synthesis.recommendations && synthesis.recommendations.length > 0 && (
              <div style={{
                background: 'rgba(200,162,60,0.06)',
                border: `1px solid rgba(200,162,60,0.15)`,
                borderRadius: 10,
                padding: '14px 16px',
              }}>
                <div style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: GOLD,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: 8,
                }}>
                  Recommendations
                </div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {synthesis.recommendations.map((r, i) => (
                    <li key={i} style={{ fontSize: '0.82rem', color: TEXT_SECONDARY, lineHeight: 1.6, marginBottom: 4 }}>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Summary */}
          {synthesis.summary && (
            <div style={{
              marginTop: 16,
              padding: '14px 16px',
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${BORDER}`,
              borderRadius: 10,
              fontSize: '0.85rem',
              color: TEXT_SECONDARY,
              lineHeight: 1.6,
            }}>
              {synthesis.summary}
            </div>
          )}
        </div>
      )}

      {/* No results yet for complete debate without data */}
      {!synthesis && rounds.length === 0 && experts.length === 0 && (
        <div style={{ padding: '16px 0', color: TEXT_MUTED, fontSize: '0.85rem' }}>
          No debate data available yet.
        </div>
      )}
    </div>
  );
}

/* ── DebateHistorySection ── */
function DebateHistorySection({ refreshKey }: { refreshKey: number }) {
  const [debates, setDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchDebates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminFetch('/api/admin/thinktank/debates');
      if (res.ok) {
        setDebates(res.data ?? []);
      } else {
        setError(res.error || 'Failed to load debates');
      }
    } catch {
      setError('Network error loading debates.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchDebates(); }, [fetchDebates, refreshKey]);

  function truncate(text: string, max: number): string {
    if (text.length <= max) return text;
    return text.slice(0, max) + '...';
  }

  return (
    <div style={cardStyle}>
      <h2 style={sectionTitleStyle}>Debate History</h2>

      {error && <div style={errorBoxStyle}>{error}</div>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              {['Title', 'Question', 'Experts', 'Status', 'Created'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} style={{ padding: '14px 16px' }}>
                      <div style={{
                        height: 14,
                        borderRadius: 6,
                        background: 'rgba(255,255,255,0.06)',
                        width: '70%',
                        animation: 'pulse 1.5s ease-in-out infinite',
                      }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : debates.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', padding: '36px 16px', color: TEXT_MUTED }}>
                  No debates yet. Start your first ThinkTank debate above.
                </td>
              </tr>
            ) : (
              debates.map((d) => {
                const isExpanded = expandedId === d.id;
                return (
                  <tr key={d.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td colSpan={5} style={{ padding: 0 }}>
                      {/* Row summary */}
                      <div
                        onClick={() => setExpandedId(isExpanded ? null : d.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') setExpandedId(isExpanded ? null : d.id);
                        }}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1.5fr 2fr 0.7fr 0.8fr 1fr',
                          cursor: 'pointer',
                          transition: 'background 120ms',
                          alignItems: 'center',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{ ...tdStyle, color: TEXT_PRIMARY, fontWeight: 600 }}>
                          <span style={{
                            display: 'inline-block',
                            width: 12,
                            marginRight: 8,
                            color: TEXT_MUTED,
                            fontSize: '0.7rem',
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 150ms',
                          }}>
                            {'>'}
                          </span>
                          {d.title}
                        </div>
                        <div style={{ ...tdStyle, color: TEXT_SECONDARY }}>
                          {truncate(d.question, 80)}
                        </div>
                        <div style={{ ...tdStyle, textAlign: 'center' }}>
                          {d.expert_count}
                        </div>
                        <div style={tdStyle}>
                          <StatusBadge status={d.status} />
                        </div>
                        <div style={{ ...tdStyle, fontSize: '0.8rem', color: TEXT_MUTED }}>
                          {formatDate(d.created_at)}
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && <DebateDetails debate={d} />}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }`}</style>
    </div>
  );
}

/* ── Main Page ── */
export default function ThinkTankPage() {
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bgPage, padding: '32px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: TEXT_PRIMARY, marginBottom: 4 }}>
            ThinkTank
          </h1>
          <p style={{ fontSize: '0.85rem', color: TEXT_SECONDARY }}>
            Simulate expert panel debates to generate strategic insights. Domain specialists argue different perspectives on your question.
          </p>
        </div>

        {/* Section A: New Debate */}
        <NewDebateSection onDebateCreated={() => setHistoryRefreshKey((k) => k + 1)} />

        {/* Section B: Debate History */}
        <DebateHistorySection refreshKey={historyRefreshKey} />
      </div>
    </div>
  );
}
