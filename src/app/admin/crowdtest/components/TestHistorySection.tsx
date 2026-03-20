'use client';

import { useCallback, useEffect, useState } from 'react';
import { StatusBadge } from './StatusBadge';
import {
  TestResult,
  adminFetch,
  formatDate,
  cardStyle,
  sectionTitleStyle,
  thStyle,
  tdStyle,
  errorBoxStyle,
  BORDER,
  GOLD,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
} from './shared';

function MetricCard({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${BORDER}`,
      borderRadius: 10,
      padding: '12px 14px',
    }}>
      <div style={{
        fontSize: '0.7rem',
        fontWeight: 600,
        color: TEXT_MUTED,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: small ? '0.78rem' : '1.1rem',
        fontWeight: 700,
        color: GOLD,
        lineHeight: 1.3,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as const,
      }}>
        {value}
      </div>
    </div>
  );
}

export function TestHistorySection({ refreshKey }: { refreshKey: number }) {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminFetch('/api/admin/crowdtest/tests');
      if (res.ok || res.success) {
        setTests(res.data ?? []);
      } else {
        setError(res.error || 'Failed to load tests');
      }
    } catch {
      setError('Network error loading tests.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTests(); }, [fetchTests, refreshKey]);

  return (
    <div style={cardStyle}>
      <h2 style={sectionTitleStyle}>Test History</h2>

      {error && <div style={errorBoxStyle}>{error}</div>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              {['Title', 'Type', 'Personas', 'Status', 'Sentiment', 'Created'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
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
            ) : tests.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', padding: '36px 16px', color: TEXT_MUTED }}>
                  No tests yet. Run your first CrowdTest above.
                </td>
              </tr>
            ) : (
              tests.map((t) => {
                const isExpanded = expandedId === t.id;
                return (
                  <tr key={t.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td colSpan={6} style={{ padding: 0 }}>
                      {/* Row summary */}
                      <div
                        onClick={() => setExpandedId(isExpanded ? null : t.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpandedId(isExpanded ? null : t.id); }}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 0.8fr 1fr 1fr 1fr',
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
                          {t.title}
                        </div>
                        <div style={tdStyle}>
                          {t.stimulus_type.charAt(0).toUpperCase() + t.stimulus_type.slice(1)}
                        </div>
                        <div style={tdStyle}>{t.persona_count}</div>
                        <div style={tdStyle}><StatusBadge status={t.status} /></div>
                        <div style={{ ...tdStyle, color: t.avg_sentiment != null ? GOLD : TEXT_MUTED, fontWeight: 600 }}>
                          {t.avg_sentiment != null ? `${(t.avg_sentiment * 100).toFixed(0)}%` : '--'}
                        </div>
                        <div style={{ ...tdStyle, fontSize: '0.8rem', color: TEXT_MUTED }}>
                          {formatDate(t.created_at)}
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && t.status === 'complete' && (
                        <div style={{ padding: '0 16px 20px 36px', borderTop: `1px solid rgba(200,162,60,0.06)` }}>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: 16,
                            marginTop: 16,
                            marginBottom: 20,
                          }}>
                            <MetricCard
                              label="Avg Sentiment"
                              value={t.avg_sentiment != null ? `${(t.avg_sentiment * 100).toFixed(0)}%` : 'N/A'}
                            />
                            <MetricCard
                              label="Would Buy"
                              value={t.would_buy_pct != null ? `${t.would_buy_pct.toFixed(0)}%` : 'N/A'}
                            />
                            <MetricCard
                              label="Top Objections"
                              value={t.top_objections?.length > 0 ? t.top_objections.slice(0, 3).join(', ') : 'None'}
                              small
                            />
                            <MetricCard
                              label="Top Praise"
                              value={t.top_praise?.length > 0 ? t.top_praise.slice(0, 3).join(', ') : 'None'}
                              small
                            />
                          </div>

                          {t.reactions && t.reactions.length > 0 && (
                            <div>
                              <h4 style={{
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: TEXT_SECONDARY,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                marginBottom: 10,
                              }}>
                                Individual Reactions ({t.reactions.length})
                              </h4>
                              <div style={{
                                maxHeight: 320,
                                overflowY: 'auto',
                                borderRadius: 10,
                                border: `1px solid ${BORDER}`,
                              }}>
                                {t.reactions.map((r, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      padding: '12px 16px',
                                      borderBottom: idx < t.reactions.length - 1 ? `1px solid ${BORDER}` : 'none',
                                      display: 'flex',
                                      gap: 16,
                                      alignItems: 'flex-start',
                                    }}
                                  >
                                    <div style={{ minWidth: 120 }}>
                                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: TEXT_PRIMARY }}>
                                        {r.persona_name}
                                      </div>
                                      <div style={{ fontSize: '0.72rem', color: TEXT_MUTED, marginTop: 2 }}>
                                        Sentiment: {(r.sentiment * 100).toFixed(0)}%
                                        {' | '}
                                        {r.would_buy ? 'Would buy' : 'Would not buy'}
                                      </div>
                                    </div>
                                    <div style={{ flex: 1, fontSize: '0.82rem', color: TEXT_SECONDARY, lineHeight: 1.5 }}>
                                      {r.reaction}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {isExpanded && t.status !== 'complete' && (
                        <div style={{ padding: '16px 16px 20px 36px', color: TEXT_MUTED, fontSize: '0.85rem' }}>
                          {t.status === 'running'
                            ? 'Test is currently running. Results will appear here when complete.'
                            : t.status === 'pending'
                              ? 'Test is queued and will begin shortly.'
                              : 'This test failed. Check server logs for details.'}
                        </div>
                      )}
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
