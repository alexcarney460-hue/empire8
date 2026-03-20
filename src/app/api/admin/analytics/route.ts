import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase)
    return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

    // Check if table exists
    const { error: tableErr } = await supabase
      .from('page_views')
      .select('id', { count: 'exact', head: true });

    if (tableErr) {
      // Table doesn't exist yet — return empty state
      return NextResponse.json({
        ok: true,
        data: {
          totals: { today: 0, thisWeek: 0, thisMonth: 0 },
          daily: [],
          topPages: [],
          topReferrers: [],
          topCountries: [],
        },
      });
    }

    // Run all queries in parallel
    const [
      { count: today },
      { count: thisWeek },
      { count: thisMonth },
      { data: last30 },
      { data: pathRows },
      { data: refRows },
      { data: countryRows },
    ] = await Promise.all([
      supabase.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
      supabase.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabase.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
      supabase.from('page_views').select('created_at').gte('created_at', thirtyDaysAgo).order('created_at', { ascending: true }).limit(10000),
      supabase.from('page_views').select('path').gte('created_at', thirtyDaysAgo).limit(10000),
      supabase.from('page_views').select('referrer').gte('created_at', thirtyDaysAgo).not('referrer', 'is', null).limit(10000),
      supabase.from('page_views').select('country').gte('created_at', thirtyDaysAgo).not('country', 'is', null).limit(10000),
    ]);

    // Daily views for last 30 days
    const dailyMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      dailyMap[key] = 0;
    }
    for (const row of last30 ?? []) {
      const key = new Date(row.created_at).toISOString().slice(0, 10);
      if (dailyMap[key] !== undefined) dailyMap[key]++;
    }
    const daily = Object.entries(dailyMap).map(([date, views]) => ({ date, views }));

    // Top pages
    const pageMap: Record<string, number> = {};
    for (const row of pathRows ?? []) {
      const p = row.path || '/';
      pageMap[p] = (pageMap[p] || 0) + 1;
    }
    const topPages = Object.entries(pageMap)
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Top referrers
    const refMap: Record<string, number> = {};
    for (const row of refRows ?? []) {
      let ref = row.referrer || '';
      if (!ref) continue;
      // Extract domain from referrer URL
      try {
        ref = new URL(ref).hostname;
      } catch {
        // keep as-is
      }
      refMap[ref] = (refMap[ref] || 0) + 1;
    }
    const topReferrers = Object.entries(refMap)
      .map(([referrer, views]) => ({ referrer, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Top countries
    const countryMap: Record<string, number> = {};
    for (const row of countryRows ?? []) {
      const c = row.country || 'Unknown';
      countryMap[c] = (countryMap[c] || 0) + 1;
    }
    const topCountries = Object.entries(countryMap)
      .map(([country, views]) => ({ country, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    return NextResponse.json({
      ok: true,
      data: {
        totals: {
          today: today ?? 0,
          thisWeek: thisWeek ?? 0,
          thisMonth: thisMonth ?? 0,
        },
        daily,
        topPages,
        topReferrers,
        topCountries,
      },
    });
  } catch (err: unknown) {
    console.error('[analytics] error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
  }
}
