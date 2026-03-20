'use client';

import { useEffect, useState } from 'react';

interface DailyRow { date: string; views: number }
interface PageRow { path: string; views: number }
interface ReferrerRow { referrer: string; views: number }
interface CountryRow { country: string; views: number }

interface TrafficData {
  totals: { today: number; thisWeek: number; thisMonth: number };
  daily: DailyRow[];
  topPages: PageRow[];
  topReferrers: ReferrerRow[];
  topCountries: CountryRow[];
}

const CARD: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  border: '1px solid var(--color-border, #E4E1DB)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  padding: 24,
};

const LABEL: React.CSSProperties = {
  fontSize: '0.72rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--color-warm-gray, #9A9590)',
};

const BIG_NUM: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 900,
  color: 'var(--color-charcoal, #1C1C1C)',
  lineHeight: 1.1,
  marginTop: 4,
};

function fmtNum(n: number): string {
  return n.toLocaleString('en-US');
}

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={CARD}>
      <div style={LABEL}>{label}</div>
      <div style={BIG_NUM}>{value}</div>
    </div>
  );
}

function DailyChart({ data }: { data: DailyRow[] }) {
  const max = Math.max(...data.map((d) => d.views), 1);
  const barCount = data.length;
  // Show labels for every ~5th bar to avoid crowding
  const labelInterval = barCount > 20 ? 5 : barCount > 10 ? 3 : 1;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 180, paddingTop: 12 }}>
      {data.map((d, i) => {
        const pct = (d.views / max) * 100;
        return (
          <div
            key={d.date}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              height: '100%',
              justifyContent: 'flex-end',
            }}
            title={`${fmtDate(d.date)}: ${fmtNum(d.views)} views`}
          >
            <div
              style={{
                width: '100%',
                borderRadius: '4px 4px 1px 1px',
                background: d.views > 0 ? 'var(--color-royal, #4A0E78)' : 'var(--color-border, #E4E1DB)',
                height: Math.max(pct, 3) + '%',
                transition: 'height 600ms ease',
                minHeight: 3,
              }}
            />
            {i % labelInterval === 0 && (
              <div style={{ fontSize: '0.62rem', color: 'var(--color-warm-gray, #9A9590)', whiteSpace: 'nowrap' }}>
                {fmtDate(d.date)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RankedList({ items, color = 'var(--color-royal, #4A0E78)' }: { items: { label: string; count: number }[]; color?: string }) {
  const max = Math.max(...items.map((i) => i.count), 1);
  if (items.length === 0) {
    return <div style={{ fontSize: '0.82rem', color: 'var(--color-warm-gray, #9A9590)', padding: '12px 0' }}>No data yet</div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item) => (
        <div key={item.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-charcoal, #1C1C1C)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
              {item.label}
            </span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-warm-gray, #9A9590)' }}>{fmtNum(item.count)}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--color-border, #E4E1DB)' }}>
            <div style={{ height: '100%', borderRadius: 3, width: (item.count / max) * 100 + '%', background: color, transition: 'width 600ms ease' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<TrafficData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = process.env.NEXT_PUBLIC_ADMIN_ANALYTICS_TOKEN || '';
        const res = await fetch('/api/admin/analytics', {
          headers: { Authorization: 'Bearer ' + (token ?? '') },
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || 'Failed to load analytics');
        setData(json.data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 80, minHeight: '60vh' }}>
        <div style={{ color: 'var(--color-warm-gray, #9A9590)', fontWeight: 600 }}>Loading analytics...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 80, minHeight: '60vh' }}>
        <div style={{ color: '#dc2626', fontWeight: 600 }}>{error || 'Failed to load data'}</div>
      </div>
    );
  }

  const { totals, daily, topPages, topReferrers, topCountries } = data;

  return (
    <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8f8f6 100%)', minHeight: '100vh' }}>
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 64px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-charcoal, #1C1C1C)', margin: 0 }}>Traffic</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-warm-gray, #9A9590)', margin: '4px 0 0' }}>Page views and visitor activity</p>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
          <SummaryCard label="Today" value={fmtNum(totals.today)} />
          <SummaryCard label="This Week" value={fmtNum(totals.thisWeek)} />
          <SummaryCard label="This Month" value={fmtNum(totals.thisMonth)} />
        </div>

        {/* Daily chart */}
        <div style={{ ...CARD, marginBottom: 28 }}>
          <div style={{ ...LABEL, marginBottom: 16 }}>Page Views &mdash; Last 30 Days</div>
          {daily.every((d) => d.views === 0) ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-warm-gray, #9A9590)', fontSize: '0.88rem' }}>
              No traffic recorded yet. Views will appear as visitors browse the site.
            </div>
          ) : (
            <DailyChart data={daily} />
          )}
        </div>

        {/* Top pages + Referrers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, marginBottom: 28 }}>
          <div style={CARD}>
            <div style={{ ...LABEL, marginBottom: 14 }}>Top Pages</div>
            <RankedList items={topPages.map((p) => ({ label: p.path, count: p.views }))} />
          </div>
          <div style={CARD}>
            <div style={{ ...LABEL, marginBottom: 14 }}>Top Referrers</div>
            <RankedList
              items={topReferrers.map((r) => ({ label: r.referrer, count: r.views }))}
              color="var(--color-gold, #C8A23C)"
            />
          </div>
        </div>

        {/* Countries */}
        {topCountries.length > 0 && (
          <div style={CARD}>
            <div style={{ ...LABEL, marginBottom: 14 }}>Top Countries</div>
            <RankedList
              items={topCountries.map((c) => ({ label: c.country, count: c.views }))}
              color="#6366f1"
            />
          </div>
        )}
      </section>
    </div>
  );
}
