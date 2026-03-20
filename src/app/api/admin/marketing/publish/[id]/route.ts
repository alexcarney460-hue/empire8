import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Ctx = { params: Promise<{ id: string }> };

/* ── POST  /api/admin/marketing/publish/:id ──────────────── */
export async function POST(req: Request, ctx: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase)
    return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ ok: false, error: 'Invalid ID format' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('content_queue')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error)
    console.error('[Admin] publish/:id error:', error.message);
    return NextResponse.json({ ok: false, error: 'An internal error occurred' }, { status: 500 });

  return NextResponse.json({ ok: true, data });
}
