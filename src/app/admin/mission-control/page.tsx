'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Stats {
  total_contacts: number;
  total_companies: number;
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
}

interface RecentContact {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

interface RecentOrder {
  id: string;
  order_number: string;
  email: string;
  total: number;
  status: string;
  created_at: string;
}

interface ContentPipeline {
  draft: number;
  scheduled: number;
  published: number;
}

interface Alert {
  type: string;
  message: string;
  count: number;
}

interface MissionControlData {
  stats: Stats;
  recent_contacts: RecentContact[];
  recent_orders: RecentOrder[];
  content_pipeline: ContentPipeline;
  alerts: Alert[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function statusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'paid':
      return '#4ade80';
    case 'pending':
      return '#C8A23C';
    case 'cancelled':
    case 'refunded':
      return '#f87171';
    default:
      return '#94a3b8';
  }
}

/* ------------------------------------------------------------------ */
/*  Inline styles                                                      */
/* ------------------------------------------------------------------ */

const PAGE_BG =
  'linear-gradient(135deg, #0f1f15 0%, #1a2e20 50%, #1e293b 100%)';

const glass = (opacity = 0.07): React.CSSProperties => ({
  background: `rgba(255,255,255,${opacity})`,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 16,
});

const TEXT_PRIMARY = '#ffffff';
const TEXT_SECONDARY = '#cbd5e1';
const TEXT_MUTED = '#94a3b8';
const AMBER = '#C8A23C';
const RED = '#f87171';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function MissionControlPage() {
  const [data, setData] = useState<MissionControlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/mission-control', {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_ANALYTICS_TOKEN}`,
        },
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? 'Failed to load');
      setData(json.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (document.getElementById('mc-pulse-kf')) return;
    const style = document.createElement('style');
    style.id = 'mc-pulse-kf';
    style.textContent = `
      @keyframes mcPulse {
        0%, 100% { opacity: .4; }
        50% { opacity: .8; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  const Skeleton = ({ w = '100%', h = 20 }: { w?: string | number; h?: number }) => (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 8,
        background: 'rgba(255,255,255,0.08)',
        animation: 'mcPulse 1.6s ease-in-out infinite',
      }}
    />
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: PAGE_BG,
        padding: '40px 24px 80px',
        color: TEXT_PRIMARY,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* ========== Header ========== */}
        <div style={{ marginBottom: 40 }}>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Mission Control
          </h1>
          <p style={{ margin: '6px 0 0', color: TEXT_MUTED, fontSize: 15 }}>
            Business overview &mdash;{' '}
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* ========== Error ========== */}
        {error && (
          <div
            style={{
              ...glass(0.08),
              padding: '16px 24px',
              marginBottom: 32,
              borderColor: 'rgba(248,113,113,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ color: RED, fontSize: 14 }}>{error}</span>
            <button
              onClick={fetchData}
              style={{
                marginLeft: 'auto',
                padding: '6px 16px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.08)',
                color: TEXT_PRIMARY,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ========== Hero Stats Row ========== */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 20,
            marginBottom: 32,
          }}
        >
          {loading || !data
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ ...glass(), padding: 28 }}>
                  <Skeleton w={80} h={14} />
                  <div style={{ marginTop: 14 }}>
                    <Skeleton w={100} h={32} />
                  </div>
                </div>
              ))
            : [
                {
                  label: 'Total Contacts',
                  value: data.stats.total_contacts.toLocaleString(),
                },
                {
                  label: 'Companies',
                  value: data.stats.total_companies.toLocaleString(),
                },
                {
                  label: 'Total Orders',
                  value: data.stats.total_orders.toLocaleString(),
                },
                {
                  label: 'Revenue',
                  value: formatCurrency(data.stats.total_revenue),
                },
                {
                  label: 'Pending Orders',
                  value: data.stats.pending_orders.toLocaleString(),
                  accent: data.stats.pending_orders > 0 ? AMBER : undefined,
                },
              ].map((card) => (
                <div
                  key={card.label}
                  style={{
                    ...glass(),
                    padding: 28,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: TEXT_MUTED,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {card.label}
                  </span>
                  <span
                    style={{
                      fontSize: 30,
                      fontWeight: 700,
                      color: ('accent' in card && card.accent) || TEXT_PRIMARY,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {card.value}
                  </span>
                </div>
              ))}
        </div>

        {/* ========== Two-Column Body ========== */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
            marginBottom: 40,
          }}
        >
          {/* ---------- Left Column ---------- */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Recent Contacts */}
            <div style={{ ...glass(), padding: 28 }}>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  margin: '0 0 20px',
                  color: TEXT_SECONDARY,
                }}
              >
                Recent Contacts
              </h2>
              {loading || !data ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} h={16} />
                  ))}
                </div>
              ) : data.recent_contacts.length === 0 ? (
                <p style={{ color: TEXT_MUTED, fontSize: 14, margin: 0 }}>
                  No contacts yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {data.recent_contacts.map((c, i) => (
                    <div
                      key={c.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 0',
                        borderTop:
                          i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: TEXT_PRIMARY,
                          }}
                        >
                          {c.full_name || '(unnamed)'}
                        </div>
                        <div
                          style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 2 }}
                        >
                          {c.email}
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: TEXT_MUTED, flexShrink: 0 }}>
                        {formatDate(c.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Orders */}
            <div style={{ ...glass(), padding: 28 }}>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  margin: '0 0 20px',
                  color: TEXT_SECONDARY,
                }}
              >
                Recent Orders
              </h2>
              {loading || !data ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} h={16} />
                  ))}
                </div>
              ) : data.recent_orders.length === 0 ? (
                <p style={{ color: TEXT_MUTED, fontSize: 14, margin: 0 }}>
                  No orders yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {data.recent_orders.map((o, i) => (
                    <div
                      key={o.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr auto auto',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 0',
                        borderTop:
                          i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 500 }}>
                        #{o.order_number || o.id.slice(0, 8)}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          color: TEXT_MUTED,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {o.email}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 600, textAlign: 'right' }}>
                        {formatCurrency(Number(o.total))}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: statusColor(o.status),
                          textTransform: 'capitalize',
                          textAlign: 'right',
                          minWidth: 72,
                        }}
                      >
                        {o.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ---------- Right Column ---------- */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Content Pipeline */}
            <div style={{ ...glass(), padding: 28 }}>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  margin: '0 0 24px',
                  color: TEXT_SECONDARY,
                }}
              >
                Content Pipeline
              </h2>
              {loading || !data ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} h={24} />
                  ))}
                </div>
              ) : (
                (() => {
                  const pipeline = data.content_pipeline;
                  const total =
                    pipeline.draft + pipeline.scheduled + pipeline.published || 1;
                  const stages: {
                    label: string;
                    count: number;
                    color: string;
                  }[] = [
                    { label: 'Draft', count: pipeline.draft, color: TEXT_MUTED },
                    { label: 'Scheduled', count: pipeline.scheduled, color: AMBER },
                    { label: 'Published', count: pipeline.published, color: '#4ade80' },
                  ];

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                        }}
                      >
                        {stages.map((s, i) => (
                          <div
                            key={s.label}
                            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                          >
                            <div
                              style={{
                                textAlign: 'center',
                                padding: '12px 20px',
                                borderRadius: 12,
                                background: 'rgba(255,255,255,0.06)',
                                border: `1px solid ${s.color}40`,
                                minWidth: 80,
                              }}
                            >
                              <div
                                style={{ fontSize: 24, fontWeight: 700, color: s.color }}
                              >
                                {s.count}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: TEXT_MUTED,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.06em',
                                  marginTop: 4,
                                }}
                              >
                                {s.label}
                              </div>
                            </div>
                            {i < stages.length - 1 && (
                              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 18 }}>
                                &#8594;
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      <div
                        style={{
                          height: 6,
                          borderRadius: 3,
                          background: 'rgba(255,255,255,0.06)',
                          overflow: 'hidden',
                          display: 'flex',
                        }}
                      >
                        {stages.map((s) => (
                          <div
                            key={s.label}
                            style={{
                              width: `${(s.count / total) * 100}%`,
                              background: s.color,
                              transition: 'width 0.4s ease',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Action Items */}
            <div style={{ ...glass(), padding: 28 }}>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  margin: '0 0 20px',
                  color: TEXT_SECONDARY,
                }}
              >
                Action Items
              </h2>
              {loading || !data ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} h={48} />
                  ))}
                </div>
              ) : data.alerts.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '24px 0',
                    color: '#4ade80',
                    fontSize: 14,
                  }}
                >
                  All clear -- no action items right now.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {data.alerts.map((alert, i) => {
                    const isWarning = alert.type === 'warning';
                    const accentColor = isWarning ? AMBER : TEXT_MUTED;

                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          padding: '14px 18px',
                          borderRadius: 12,
                          background: isWarning
                            ? 'rgba(200,146,42,0.08)'
                            : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${accentColor}30`,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: `${accentColor}18`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 16,
                            fontWeight: 700,
                            color: accentColor,
                            flexShrink: 0,
                          }}
                        >
                          {alert.count}
                        </div>
                        <span style={{ fontSize: 14, color: TEXT_SECONDARY }}>
                          {alert.message}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========== Quick Actions Bar ========== */}
        <div
          style={{
            ...glass(0.05),
            padding: '20px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          {[
            { label: 'Add Contact', href: '/admin/crm' },
            { label: 'Create Order', href: '/admin/accounting' },
            { label: 'New Content', href: '/admin/marketing' },
            { label: 'View Reports', href: '/admin/analytics' },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              style={{
                padding: '10px 24px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)',
                color: TEXT_SECONDARY,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  'rgba(255,255,255,0.12)';
                (e.currentTarget as HTMLElement).style.color = TEXT_PRIMARY;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  'rgba(255,255,255,0.06)';
                (e.currentTarget as HTMLElement).style.color = TEXT_SECONDARY;
              }}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
