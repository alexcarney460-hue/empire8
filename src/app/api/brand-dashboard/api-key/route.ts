import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedBrand } from '@/lib/brand-auth';
import { getSupabaseServer } from '@/lib/supabase-server';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * GET /api/brand-dashboard/api-key
 * Check if the brand has an API key configured.
 */
export async function GET() {
  try {
    const brand = await getAuthenticatedBrand();
    if (!brand) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 503 });
    }

    const { data } = await supabase
      .from('crowdtest_api_keys')
      .select('id, name, api_key, is_active, created_at, last_used_at')
      .eq('name', `brand_${brand.brandAccount.id}`)
      .maybeSingle();

    if (!data) {
      return NextResponse.json({ ok: true, has_key: false });
    }

    const masked = data.api_key.length > 12
      ? data.api_key.slice(0, 10) + '...' + data.api_key.slice(-4)
      : '****';

    return NextResponse.json({
      ok: true,
      has_key: true,
      masked_key: masked,
      is_active: data.is_active,
      created_at: data.created_at,
      last_used_at: data.last_used_at,
    });
  } catch (err) {
    console.error('[brand-dashboard/api-key] GET error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
  }
}

/**
 * POST /api/brand-dashboard/api-key
 * Generate a new API key for this brand.
 */
export async function POST() {
  try {
    const brand = await getAuthenticatedBrand();
    if (!brand) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 503 });
    }

    const apiKey = `e8b_${randomBytes(32).toString('hex')}`;
    const keyName = `brand_${brand.brandAccount.id}`;

    // Delete existing key for this brand (one key per brand)
    await supabase
      .from('crowdtest_api_keys')
      .delete()
      .eq('name', keyName);

    // Insert new key
    const { error } = await supabase
      .from('crowdtest_api_keys')
      .insert({
        name: keyName,
        api_key: apiKey,
        is_active: true,
      });

    if (error) {
      console.error('[brand-dashboard/api-key] Insert error:', error.message);
      return NextResponse.json({ ok: false, error: 'Failed to generate key' }, { status: 500 });
    }

    // Return the FULL key only on creation (never shown again)
    return NextResponse.json({
      ok: true,
      api_key: apiKey,
      message: 'Save this key — it will not be shown again.',
    });
  } catch (err) {
    console.error('[brand-dashboard/api-key] POST error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
  }
}

/**
 * DELETE /api/brand-dashboard/api-key
 * Revoke the brand's API key.
 */
export async function DELETE() {
  try {
    const brand = await getAuthenticatedBrand();
    if (!brand) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 503 });
    }

    await supabase
      .from('crowdtest_api_keys')
      .delete()
      .eq('name', `brand_${brand.brandAccount.id}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[brand-dashboard/api-key] DELETE error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
  }
}
