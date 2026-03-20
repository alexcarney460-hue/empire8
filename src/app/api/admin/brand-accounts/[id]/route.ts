import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// GET /api/admin/brand-accounts/[id] -- Single brand account detail
// ---------------------------------------------------------------------------

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    const { id } = await params;

    if (!UUID_RE.test(id)) {
      return NextResponse.json({ ok: false, error: 'Invalid ID format' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });
    }

    // Fetch brand account
    const { data: account, error: accountError } = await supabase
      .from('brand_accounts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (accountError) {
      console.error('[Admin] brand-account detail error:', accountError.message);
      return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
    }

    if (!account) {
      return NextResponse.json({ ok: false, error: 'Brand account not found' }, { status: 404 });
    }

    // Fetch linked brand info if brand_id is set
    let brand = null;
    if (account.brand_id) {
      const { data: brandRow, error: brandError } = await supabase
        .from('brands')
        .select('id, name, slug, logo_url, is_active')
        .eq('id', account.brand_id)
        .maybeSingle();

      if (brandError) {
        console.error('[Admin] brand-account brand lookup error:', brandError.message);
      }
      brand = brandRow;
    }

    // Fetch product count for this brand
    let productCount = 0;
    if (account.brand_id) {
      const { count } = await supabase
        .from('brand_products')
        .select('id', { count: 'exact', head: true })
        .eq('brand_id', account.brand_id);
      productCount = count ?? 0;
    }

    return NextResponse.json({
      ok: true,
      data: {
        ...account,
        brand,
        product_count: productCount,
      },
    });
  } catch (err) {
    console.error('[brand-account-detail] Unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/brand-accounts/[id] -- Update brand account fields
// ---------------------------------------------------------------------------

const ALLOWED_FIELDS = new Set([
  'contact_name',
  'phone',
  'website',
  'description',
  'license_number',
  'notes',
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    const { id } = await params;

    if (!UUID_RE.test(id)) {
      return NextResponse.json({ ok: false, error: 'Invalid ID format' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
    }

    // Whitelist fields
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (ALLOWED_FIELDS.has(key) && typeof value === 'string') {
        updates[key] = value.trim() || null;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: false, error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('brand_accounts')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[Admin] brand-account update error:', error.message);
      return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error('[brand-account-patch] Unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
  }
}
