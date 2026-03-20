import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* -- GET /api/admin/crowdtest/tests/[id] -----------------------------------
 * Fetch a single CrowdTest test with full results.
 * ----------------------------------------------------------------------- */
export async function GET(req: NextRequest, ctx: RouteContext) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await ctx.params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid test ID' },
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
      .from('crowdtest_tests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[crowdtest/tests/id] Query error:', error.message);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch test' },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: 'Test not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[crowdtest/tests/id] Unexpected error:', msg);
    return NextResponse.json(
      { ok: false, error: 'Unexpected error' },
      { status: 500 },
    );
  }
}

/* -- DELETE /api/admin/crowdtest/tests/[id] --------------------------------
 * Delete a CrowdTest test.
 * ----------------------------------------------------------------------- */
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await ctx.params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid test ID' },
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
      .from('crowdtest_tests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[crowdtest/tests/id] Delete error:', error.message);
      return NextResponse.json(
        { ok: false, error: 'Failed to delete test' },
        { status: 500 },
      );
    }

    if (count === 0) {
      return NextResponse.json(
        { ok: false, error: 'Test not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[crowdtest/tests/id] Unexpected error:', msg);
    return NextResponse.json(
      { ok: false, error: 'Unexpected error' },
      { status: 500 },
    );
  }
}
