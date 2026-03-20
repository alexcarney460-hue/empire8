import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';
export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const url = new URL(req.url);
  const channel = url.searchParams.get('channel');

  let query = supabase
    .from('templates')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (channel) query = query.eq('channel', channel);

  const { data, error } = await query;
  if (error) {
    console.error('[Admin] templates error:', error.message);
    return NextResponse.json({ ok: false, error: 'An internal error occurred' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const body = await req.json();

  if (body.generate) {
    return NextResponse.json({ ok: false, error: 'AI template generation is not available.' }, { status: 501 });
  }

  // Manual template creation
  const { name, channel, subject, body_html, body_text, category } = body;
  if (!name || !channel) {
    return NextResponse.json({ ok: false, error: 'name and channel are required' }, { status: 400 });
  }

  const { data, error } = await supabase.from('templates').insert({
    name,
    channel,
    subject: subject || null,
    body_html: body_html || null,
    body_text: body_text || '',
    category: category || null,
    created_by: 'manual',
  }).select().single();

  if (error) {
    console.error('[Admin] templates error:', error.message);
    return NextResponse.json({ ok: false, error: 'An internal error occurred' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, data }, { status: 201 });
}
