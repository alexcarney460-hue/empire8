import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* -- GET /api/admin/thinktank/debates/[id] ---------------------------------
 * Fetch a single ThinkTank debate with full results.
 * ----------------------------------------------------------------------- */
export async function GET(req: NextRequest, ctx: RouteContext) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await ctx.params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid debate ID' },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Database unavailable' },
      { status: 503 },
    );
  }

  try {
    const { data, error } = await supabase
      .from('thinktank_debates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[thinktank/debates/id] Query error:', error.message);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch debate' },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: 'Debate not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[thinktank/debates/id] Unexpected error:', msg);
    return NextResponse.json(
      { ok: false, error: 'Unexpected error' },
      { status: 500 },
    );
  }
}

/* -- DELETE /api/admin/thinktank/debates/[id] ------------------------------
 * Delete a ThinkTank debate.
 * ----------------------------------------------------------------------- */
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await ctx.params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid debate ID' },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Database unavailable' },
      { status: 503 },
    );
  }

  try {
    const { error, count } = await supabase
      .from('thinktank_debates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[thinktank/debates/id] Delete error:', error.message);
      return NextResponse.json(
        { ok: false, error: 'Failed to delete debate' },
        { status: 500 },
      );
    }

    if (count === 0) {
      return NextResponse.json(
        { ok: false, error: 'Debate not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[thinktank/debates/id] Unexpected error:', msg);
    return NextResponse.json(
      { ok: false, error: 'Unexpected error' },
      { status: 500 },
    );
  }
}
