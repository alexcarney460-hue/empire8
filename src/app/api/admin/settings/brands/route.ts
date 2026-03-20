import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET(req: Request) {
  try {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });
    }

    const { data: brands, error } = await supabase
      .from('brands')
      .select('*, brand_products(id)')
      .order('name', { ascending: true });

    if (error) {
      console.error('[Admin] brands list error:', error.message);
      return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
    }

    const brandsWithCount = (brands ?? []).map((brand) => {
      const { brand_products: products, ...rest } = brand;
      return {
        ...rest,
        product_count: Array.isArray(products) ? products.length : 0,
      };
    });

    return NextResponse.json({ ok: true, brands: brandsWithCount });
  } catch (err) {
    console.error('[brands-list] Unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const denied = await requireAdmin(req);
    if (denied) return denied;

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

    const { name, slug, description, contact_email, category, website, logo_url } = body as Record<string, string>;

    if (!name || !name.trim()) {
      return NextResponse.json({ ok: false, error: 'Brand name is required' }, { status: 400 });
    }
    if (!contact_email || !contact_email.trim()) {
      return NextResponse.json({ ok: false, error: 'Contact email is required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact_email.trim())) {
      return NextResponse.json({ ok: false, error: 'Invalid email format for contact_email' }, { status: 400 });
    }

    const brandSlug = slug?.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Check slug uniqueness
    const { data: existing } = await supabase
      .from('brands')
      .select('id')
      .eq('slug', brandSlug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: false, error: 'A brand with this slug already exists' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('brands')
      .insert({
        name: name.trim(),
        slug: brandSlug,
        description: description?.trim() || null,
        contact_email: contact_email.trim(),
        category: category?.trim() || null,
        website: website?.trim() || null,
        logo_url: logo_url?.trim() || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[Admin] brand create error:', error.message);
      return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, brand: data }, { status: 201 });
  } catch (err) {
    console.error('[brands-create] Unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
  }
}
