import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

/* ── GET  /api/admin/marketing/queue ─────────────────────── */
export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase)
    return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');

  let query = supabase
    .from('content_queue')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (type) query = query.eq('type', type);

  const { data, error } = await query;

  if (error)
    console.error('[Admin] queue error:', error.message);
    return NextResponse.json({ ok: false, error: 'An internal error occurred' }, { status: 500 });

  return NextResponse.json({ ok: true, data });
}

/* ── POST  /api/admin/marketing/queue ────────────────────── */
export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase)
    return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const body = await req.json();
  const { title, type, body: content, platform, tags, scheduled_at } = body;

  if (!title || !type)
    return NextResponse.json({ ok: false, error: 'title and type are required' }, { status: 400 });

  const validTypes = ['blog_post', 'social_media', 'email_campaign', 'newsletter'];
  if (!validTypes.includes(type))
    return NextResponse.json({ ok: false, error: `type must be one of: ${validTypes.join(', ')}` }, { status: 400 });

  const status = scheduled_at ? 'scheduled' : 'draft';

  const { data, error } = await supabase
    .from('content_queue')
    .insert({
      title,
      type,
      body: content ?? '',
      status,
      platform: platform ?? null,
      tags: tags ?? [],
      scheduled_at: scheduled_at ?? null,
    })
    .select()
    .single();

  if (error)
    console.error('[Admin] queue error:', error.message);
    return NextResponse.json({ ok: false, error: 'An internal error occurred' }, { status: 500 });

  return NextResponse.json({ ok: true, data }, { status: 201 });
}
