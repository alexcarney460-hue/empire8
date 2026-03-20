import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/crowdtest/llm-config
 * Check if an LLM API key is configured. Returns masked version only.
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 503 });
  }

  const { data } = await supabase
    .from('crowdtest_api_keys')
    .select('id, name, api_key, is_active')
    .eq('name', 'anthropic_llm_key')
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ ok: true, has_key: false, masked_key: null });
  }

  const key = data.api_key;
  const masked = key.length > 12
    ? key.slice(0, 7) + '...' + key.slice(-4)
    : '****';

  return NextResponse.json({ ok: true, has_key: true, masked_key: masked });
}

/**
 * PUT /api/admin/crowdtest/llm-config
 * Save or update the Anthropic API key.
 */
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.api_key !== 'string' || !body.api_key.trim()) {
    return NextResponse.json({ ok: false, error: 'api_key is required' }, { status: 400 });
  }

  const apiKey = body.api_key.trim();

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 503 });
  }

  // Upsert: update if exists, insert if not
  const { data: existing } = await supabase
    .from('crowdtest_api_keys')
    .select('id')
    .eq('name', 'anthropic_llm_key')
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('crowdtest_api_keys')
      .update({ api_key: apiKey, is_active: true })
      .eq('id', existing.id);

    if (error) {
      console.error('[llm-config] Update error:', error.message);
      return NextResponse.json({ ok: false, error: 'Failed to update key' }, { status: 500 });
    }
  } else {
    const { error } = await supabase
      .from('crowdtest_api_keys')
      .insert({ name: 'anthropic_llm_key', api_key: apiKey, is_active: true });

    if (error) {
      console.error('[llm-config] Insert error:', error.message);
      return NextResponse.json({ ok: false, error: 'Failed to save key' }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/admin/crowdtest/llm-config
 * Remove the Anthropic API key.
 */
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 503 });
  }

  await supabase
    .from('crowdtest_api_keys')
    .delete()
    .eq('name', 'anthropic_llm_key');

  return NextResponse.json({ ok: true });
}
