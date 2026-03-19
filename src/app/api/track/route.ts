import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * Lightweight page view tracker.
 * Called from a client-side hook on every navigation.
 * POST { path, referrer }
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(`track:${ip}`, 30, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false }, { status: 503 });

  try {
    const body = await req.json();
    const path = typeof body.path === 'string' ? body.path.slice(0, 500) : '/';
    const referrer = typeof body.referrer === 'string' ? body.referrer.slice(0, 1000) : null;
    const ua = req.headers.get('user-agent')?.slice(0, 500) ?? null;
    const country = req.headers.get('x-vercel-ip-country') ?? null;

    await supabase.from('page_views').insert({
      path,
      referrer: referrer || null,
      user_agent: ua,
      country,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
