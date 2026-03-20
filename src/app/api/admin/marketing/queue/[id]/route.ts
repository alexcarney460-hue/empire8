import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

type Ctx = { params: Promise<{ id: string }> };

/* ── GET  /api/admin/marketing/queue/:id ─────────────────── */
export async function GET(req: Request, ctx: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase)
    return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const { id } = await ctx.params;

  const { data, error } = await supabase
    .from('content_queue')
    .select('*')
    .eq('id', id)
    .single();

  if (error)
    console.error('[Admin] queue/:id error:', error.message);
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

  return NextResponse.json({ ok: true, data });
}

/* ── PATCH  /api/admin/marketing/queue/:id ───────────────── */
export async function PATCH(req: Request, ctx: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase)
    return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const { id } = await ctx.params;
  const body = await req.json();

  const allowed = ['title', 'type', 'body', 'status', 'platform', 'tags', 'scheduled_at'];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0)
    return NextResponse.json({ ok: false, error: 'No valid fields to update' }, { status: 400 });

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('content_queue')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error)
    console.error('[Admin] queue/:id error:', error.message);
    return NextResponse.json({ ok: false, error: 'An internal error occurred' }, { status: 500 });

  return NextResponse.json({ ok: true, data });
}

/* ── DELETE  /api/admin/marketing/queue/:id ──────────────── */
export async function DELETE(req: Request, ctx: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase)
    return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const { id } = await ctx.params;

  const { error } = await supabase
    .from('content_queue')
    .delete()
    .eq('id', id);

  if (error)
    console.error('[Admin] queue/:id error:', error.message);
    return NextResponse.json({ ok: false, error: 'An internal error occurred' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
