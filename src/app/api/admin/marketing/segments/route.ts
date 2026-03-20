import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';
export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const { data, error } = await supabase
    .from('segments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Admin] segments error:', error.message);
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

  // AI-powered segment creation removed (agent-runner deleted)
  if (body.generate) {
    return NextResponse.json({ ok: false, error: 'AI segment generation is not available.' }, { status: 501 });
  }

  // Manual segment creation
  const { name, description, filter_criteria } = body;
  if (!name) return NextResponse.json({ ok: false, error: 'name is required' }, { status: 400 });

  const { data, error } = await supabase.from('segments').insert({
    name,
    description: description || null,
    filter_criteria: filter_criteria || {},
  }).select().single();

  if (error) {
    console.error('[Admin] segments error:', error.message);
    return NextResponse.json({ ok: false, error: 'An internal error occurred' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, data }, { status: 201 });
}
