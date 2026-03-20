import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// POST /api/admin/brand-accounts/[id]/approve -- Approve a brand account
// ---------------------------------------------------------------------------
// Sets is_approved = true and approved_at = NOW().
// If the brand account does not yet have a linked `brands` row, one is created
// automatically using the account's company_name. If a brands row with a
// matching slug already exists, the account is linked to that existing row.
// ---------------------------------------------------------------------------

export async function POST(
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

    // Verify brand account exists
    const { data: account, error: fetchError } = await supabase
      .from('brand_accounts')
      .select('id, is_approved, brand_id, company_name, email')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      console.error('[Admin] brand-account approve fetch error:', fetchError.message);
      return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
    }

    if (!account) {
      return NextResponse.json({ ok: false, error: 'Brand account not found' }, { status: 404 });
    }

    if (account.is_approved) {
      return NextResponse.json({ ok: true, message: 'Already approved' });
    }

    // Ensure a brands row exists for this account
    let brandId = account.brand_id;

    if (!brandId) {
      const slug = (account.company_name ?? 'brand')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Check if a brand with this slug already exists
      const { data: existingBrand } = await supabase
        .from('brands')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (existingBrand) {
        brandId = existingBrand.id;
      } else {
        // Create a new brands row
        const { data: newBrand, error: brandCreateError } = await supabase
          .from('brands')
          .insert({
            name: account.company_name,
            slug,
            contact_email: account.email,
            is_active: true,
          })
          .select('id')
          .single();

        if (brandCreateError) {
          console.error('[Admin] brand-account approve brand create error:', brandCreateError.message);
          return NextResponse.json(
            { ok: false, error: 'Failed to create brand record.' },
            { status: 500 },
          );
        }

        brandId = newBrand.id;
      }
    }

    // Approve the brand account and link to the brands row
    const { data, error } = await supabase
      .from('brand_accounts')
      .update({
        is_approved: true,
        approved_at: new Date().toISOString(),
        brand_id: brandId,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[Admin] brand-account approve error:', error.message);
      return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error('[brand-account-approve] Unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
  }
}
