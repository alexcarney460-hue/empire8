import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const url = new URL(req.url);
  const status = url.searchParams.get('status');

  let query = supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, data });
}

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const body = await req.json();
  const { name, description, channel, campaign_type, segment_id, scheduled_at } = body;

  if (!name) return NextResponse.json({ ok: false, error: 'name is required' }, { status: 400 });

  const { data, error } = await supabase.from('campaigns').insert({
    name,
    description: description || null,
    channel: channel || 'email',
    campaign_type: campaign_type || 'one_shot',
    segment_id: segment_id || null,
    scheduled_at: scheduled_at || null,
    status: 'draft',
  }).select().single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, data }, { status: 201 });
}
