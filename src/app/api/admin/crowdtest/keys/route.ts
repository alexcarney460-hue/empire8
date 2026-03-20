import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

/* -- GET /api/admin/crowdtest/keys -----------------------------------------
 * List all CrowdTest API keys with masked values (last 8 chars visible).
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

  try {
    const { data, error } = await supabase
      .from('crowdtest_api_keys')
      .select('id, name, api_key, is_active, last_used_at, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[crowdtest/keys] Query error:', error.message);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch API keys' },
        { status: 500 },
      );
    }

    // Mask key values -- only show last 8 characters
    const masked = (data ?? []).map((row: Record<string, unknown>) => ({
      ...row,
      api_key: maskKey(row.api_key as string),
    }));

    return NextResponse.json({ ok: true, data: masked });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[crowdtest/keys] Unexpected error:', msg);
    return NextResponse.json(
      { ok: false, error: 'Unexpected error' },
      { status: 500 },
    );
  }
}

/* -- POST /api/admin/crowdtest/keys ----------------------------------------
 * Generate a new CrowdTest API key.
 * Body: { name: string }
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
    const name = typeof body?.name === 'string' ? body.name.trim() : '';

    if (!name) {
      return NextResponse.json(
        { ok: false, error: 'name is required' },
        { status: 400 },
      );
    }

    if (name.length > 200) {
      return NextResponse.json(
        { ok: false, error: 'name must be 200 characters or fewer' },
        { status: 400 },
      );
    }

    const apiKey = `e8ct_${randomBytes(32).toString('hex')}`;

    const { data, error } = await supabase
      .from('crowdtest_api_keys')
      .insert({ name, api_key: apiKey })
      .select('id, name, api_key, is_active, created_at')
      .single();

    if (error) {
      console.error('[crowdtest/keys] Insert error:', error.message);
      return NextResponse.json(
        { ok: false, error: 'Failed to create API key' },
        { status: 500 },
      );
    }

    // Return the full key ONLY on creation -- this is the only time
    // the caller can see the unmasked value.
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[crowdtest/keys] Unexpected error:', msg);
    return NextResponse.json(
      { ok: false, error: 'Unexpected error' },
      { status: 500 },
    );
  }
}

/* -- Helpers -------------------------------------------------------------- */

function maskKey(key: string): string {
  if (!key || key.length <= 8) return key;
  const visible = key.slice(-8);
  return `${'*'.repeat(key.length - 8)}${visible}`;
}
