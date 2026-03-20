import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { closeExpiredAuctions } from '@/lib/marketplace/auction';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET /api/cron/close-auctions
// Called by Vercel Cron every 5 minutes. Resolves all auctions whose end
// time has passed: marks them 'sold' (with winner) or 'ended' (no sale).
// Protected by CRON_SECRET (set automatically by Vercel for cron jobs).
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sets this automatically for cron jobs)
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 });
  }

  try {
    const results = await closeExpiredAuctions(supabase);

    const sold = results.filter((r) => r.outcome === 'sold').length;
    const ended = results.filter((r) => r.outcome === 'ended').length;

    return NextResponse.json({
      ok: true,
      closed: results.length,
      sold,
      ended,
      lots: results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[cron/close-auctions] Fatal error:', message);
    return NextResponse.json(
      { ok: false, error: 'Failed to close auctions.', detail: message },
      { status: 500 },
    );
  }
}
