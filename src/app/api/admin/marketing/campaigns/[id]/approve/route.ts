import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

/** Approve a campaign: update status (personalizer removed) */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const { id } = await params;

  // Get campaign
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single();

  if (!campaign) return NextResponse.json({ ok: false, error: 'Campaign not found' }, { status: 404 });
  if (!campaign.segment_id) return NextResponse.json({ ok: false, error: 'Campaign has no audience segment' }, { status: 400 });

  // Update campaign status to approved
  const { error } = await supabase.from('campaigns').update({
    status: 'approved',
    started_at: new Date().toISOString(),
  }).eq('id', id);

  if (error) {
    console.error('[Admin] approve campaign error:', error.message);
    return NextResponse.json({ ok: false, error: 'Failed to approve campaign' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: 'approved' });
}
