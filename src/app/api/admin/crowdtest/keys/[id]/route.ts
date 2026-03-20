import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* -- PATCH /api/admin/crowdtest/keys/[id] ----------------------------------
 * Toggle is_active status of an API key.
 * Body: { is_active: boolean }
 * ----------------------------------------------------------------------- */
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await ctx.params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid key ID' },
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
    const body = await req.json().catch(() => null);

    if (body === null || typeof body.is_active !== 'boolean') {
      return NextResponse.json(
        { ok: false, error: 'is_active (boolean) is required' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('crowdtest_api_keys')
      .update({ is_active: body.is_active })
      .eq('id', id)
      .select('id, name, is_active')
      .single();

    if (error) {
      console.error('[crowdtest/keys/id] Update error:', error.message);
      return NextResponse.json(
        { ok: false, error: 'Failed to update API key' },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: 'API key not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[crowdtest/keys/id] Unexpected error:', msg);
    return NextResponse.json(
      { ok: false, error: 'Unexpected error' },
      { status: 500 },
    );
  }
}

/* -- DELETE /api/admin/crowdtest/keys/[id] ---------------------------------
 * Permanently delete an API key.
 * ----------------------------------------------------------------------- */
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await ctx.params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid key ID' },
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
      .from('crowdtest_api_keys')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[crowdtest/keys/id] Delete error:', error.message);
      return NextResponse.json(
        { ok: false, error: 'Failed to delete API key' },
        { status: 500 },
      );
    }

    if (count === 0) {
      return NextResponse.json(
        { ok: false, error: 'API key not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[crowdtest/keys/id] Unexpected error:', msg);
    return NextResponse.json(
      { ok: false, error: 'Unexpected error' },
      { status: 500 },
    );
  }
}
