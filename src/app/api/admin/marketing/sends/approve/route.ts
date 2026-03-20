import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

/** Batch approve sends — marks pending_review sends as approved */
export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const body = await req.json();
  const { campaign_id, send_ids } = body;

  if (!campaign_id && !send_ids) {
    return NextResponse.json({ ok: false, error: 'campaign_id or send_ids required' }, { status: 400 });
  }

  let query = supabase
    .from('sends')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('status', 'pending_review');

  if (send_ids && Array.isArray(send_ids)) {
    query = query.in('id', send_ids);
  } else if (campaign_id) {
    query = query.eq('campaign_id', campaign_id);
  }

  const { data, error } = await query.select('id');

  if (error) {
    console.error('[Admin] sends/approve error:', error.message);
    return NextResponse.json({ ok: false, error: 'An internal error occurred' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, approved: data?.length ?? 0 });
}
