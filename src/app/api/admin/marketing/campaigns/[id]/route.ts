import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const { id } = await params;

  const [campaignRes, stepsRes, sendsRes, runsRes] = await Promise.all([
    supabase.from('campaigns').select('*').eq('id', id).single(),
    supabase.from('sequence_steps').select('*, templates(*)').eq('campaign_id', id).order('step_number'),
    supabase.from('sends').select('id, channel, status, to_email, to_phone, subject, sent_at, created_at').eq('campaign_id', id).order('created_at', { ascending: false }).limit(100),
    supabase.from('agent_runs').select('id, agent_name, status, tokens_input, tokens_output, duration_ms, started_at').eq('campaign_id', id).order('started_at', { ascending: false }),
  ]);

  if (campaignRes.error || !campaignRes.data) {
    return NextResponse.json({ ok: false, error: 'Campaign not found' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    data: campaignRes.data,
    steps: stepsRes.data || [],
    sends: sendsRes.data || [],
    agent_runs: runsRes.data || [],
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const { id } = await params;
  const body = await req.json();

  const allowed = ['name', 'description', 'status', 'scheduled_at', 'send_window_start', 'send_window_end', 'send_days', 'batch_size'];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  const { data, error } = await supabase.from('campaigns').update(update).eq('id', id).select().single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, data });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const { id } = await params;
  const { error } = await supabase.from('campaigns').delete().eq('id', id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
