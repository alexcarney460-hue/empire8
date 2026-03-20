import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { getStaticBrandBySlug, getStaticProductsByBrandId } from '@/lib/brands-data';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
  const { slug } = await ctx.params;

  if (!slug || typeof slug !== 'string') {
    return NextResponse.json(
      { success: false, data: null, error: 'Missing brand slug' },
      { status: 400 },
    );
  }

  // Try Supabase first
  try {
    const supabase = getSupabaseServer();

    if (supabase) {
      const { data: brand, error: brandError } = await supabase
        .from('brands')
        .select('id, name, slug, description, logo_url, website_url, category')
        .eq('slug', slug)
        .eq('active', true)
        .single();

      if (!brandError && brand) {
        const { data: products, error: productsError } = await supabase
          .from('brand_products')
          .select(
            'id, name, slug, description, category, image_url, unit_price_cents, unit_type, min_order_qty',
          )
          .eq('brand_id', brand.id)
          .eq('active', true)
          .order('category', { ascending: true })
          .order('name', { ascending: true });

        if (productsError) {
          console.error('[api/brands/slug] Products error:', productsError.message);
        }

        return NextResponse.json({
          success: true,
          data: { brand, products: products ?? [] },
          error: null,
        });
      }

      if (brandError && brandError.code !== 'PGRST116') {
        // PGRST116 = "no rows returned" from .single() — expected when brand isn't in DB
        console.error('[api/brands/slug] Brand error:', brandError.message);
      }
    }
  } catch (err) {
    console.error('[api/brands/slug] Unexpected error, falling back to static data:', err);
  }

  // Fallback to static seed data
  const staticBrand = getStaticBrandBySlug(slug);

  if (!staticBrand) {
    return NextResponse.json(
      { success: false, data: null, error: 'Brand not found' },
      { status: 404 },
    );
  }

  const brand = {
    id: staticBrand.id,
    name: staticBrand.name,
    slug: staticBrand.slug,
    description: staticBrand.description,
    logo_url: staticBrand.logo_url,
    website_url: staticBrand.website_url,
    category: staticBrand.category,
  };

  const products = getStaticProductsByBrandId(staticBrand.id).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    category: p.category,
    image_url: p.image_url,
    unit_price_cents: p.unit_price_cents,
    unit_type: p.unit_type,
    min_order_qty: p.min_order_qty,
  }));

  return NextResponse.json({
    success: true,
    data: { brand, products },
    error: null,
  });
}
