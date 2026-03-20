import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';
import { generateExperts } from '@/lib/thinktank/experts';
import { buildEmpire8Context } from '@/lib/crowdtest/context';

const MIN_EXPERTS = 3;
const MAX_EXPERTS = 10;
const DEFAULT_EXPERTS = 5;

/* -- GET /api/admin/thinktank/debates --------------------------------------
 * List all ThinkTank debates with pagination, newest first.
 *
 * Query params:
 *   page   (default 1)
 *   limit  (default 25, max 100)
 *   status (pending | running | complete | failed)
 * ----------------------------------------------------------------------- */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Database unavailable' },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || '25')));
  const status = (url.searchParams.get('status') || '').trim();
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('thinktank_debates')
      .select(
        'id, title, question, context, expert_count, status, experts, rounds, synthesis, created_at, completed_at',
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && ['pending', 'running', 'complete', 'failed'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('[thinktank/debates] Query error:', error.message);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch debates' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      data: data ?? [],
      total: count ?? 0,
      page,
      limit,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[thinktank/debates] Unexpected error:', msg);
    return NextResponse.json(
      { ok: false, error: 'Unexpected error' },
      { status: 500 },
    );
  }
}

/* -- POST /api/admin/thinktank/debates -------------------------------------
 * Create a new ThinkTank debate.
 *
 * Body: {
 *   title: string,
 *   question: string,
 *   context?: string,
 *   expert_count?: number (3-10, default 5)
 * }
 *
 * If context is omitted or empty, it is auto-enriched with Empire 8 data.
 * Expert profiles are generated from the built-in template pool.
 * ----------------------------------------------------------------------- */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Database unavailable' },
      { status: 503 },
    );
  }

  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { ok: false, error: 'Request body is required' },
        { status: 400 },
      );
    }

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const question = typeof body.question === 'string' ? body.question.trim() : '';
    const rawContext = typeof body.context === 'string' ? body.context.trim() : '';
    const expertCount = typeof body.expert_count === 'number'
      ? Math.min(MAX_EXPERTS, Math.max(MIN_EXPERTS, Math.round(body.expert_count)))
      : DEFAULT_EXPERTS;

    // -- Validation --
    if (!title) {
      return NextResponse.json(
        { ok: false, error: 'title is required' },
        { status: 400 },
      );
    }

    if (title.length > 500) {
      return NextResponse.json(
        { ok: false, error: 'title must be 500 characters or fewer' },
        { status: 400 },
      );
    }

    if (!question) {
      return NextResponse.json(
        { ok: false, error: 'question is required' },
        { status: 400 },
      );
    }

    if (question.length > 2000) {
      return NextResponse.json(
        { ok: false, error: 'question must be 2000 characters or fewer' },
        { status: 400 },
      );
    }

    // -- Auto-enrich context with Empire 8 data if not provided --
    let context = rawContext;
    if (!context) {
      try {
        context = await buildEmpire8Context();
      } catch {
        context = '';
      }
    }

    // -- Generate expert panel --
    const experts = generateExperts(expertCount);

    // -- Insert debate record --
    const { data, error } = await supabase
      .from('thinktank_debates')
      .insert({
        title,
        question,
        context: context || null,
        expert_count: expertCount,
        status: 'pending',
        experts,
        rounds: null,
        synthesis: null,
      })
      .select('id, title, question, expert_count, status, experts, created_at')
      .single();

    if (error) {
      console.error('[thinktank/debates] Insert error:', error.message);
      return NextResponse.json(
        { ok: false, error: 'Failed to create debate' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[thinktank/debates] Unexpected error:', msg);
    return NextResponse.json(
      { ok: false, error: 'Unexpected error' },
      { status: 500 },
    );
  }
}
