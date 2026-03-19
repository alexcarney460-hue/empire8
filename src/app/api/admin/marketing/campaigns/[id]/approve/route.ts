import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';
import { queueSendsForStep } from '@/lib/marketing/personalizer';

/** Approve a campaign: personalize content and queue sends for review */
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

  // Get first sequence step with template
  const { data: steps } = await supabase
    .from('sequence_steps')
    .select('id, template_id, templates(*)')
    .eq('campaign_id', id)
    .order('step_number')
    .limit(1);

  const step = steps?.[0];
  if (!step) return NextResponse.json({ ok: false, error: 'Campaign has no sequence steps or templates' }, { status: 400 });

  const template = step.templates as unknown as Record<string, unknown> | null;
  if (!template) return NextResponse.json({ ok: false, error: 'Template not found for step' }, { status: 400 });

  const channel = (campaign.channel === 'both' ? 'email' : campaign.channel) as 'email' | 'sms';

  const { queued, skipped } = await queueSendsForStep(
    id,
    step.id,
    campaign.segment_id,
    channel,
    template.subject as string | null,
    template.body_html as string | null,
    (template.body_text as string) || ''
  );

  // Update campaign status
  await supabase.from('campaigns').update({
    status: 'approved',
    total_recipients: queued,
    started_at: new Date().toISOString(),
  }).eq('id', id);

  return NextResponse.json({ ok: true, queued, skipped, status: 'approved' });
}
