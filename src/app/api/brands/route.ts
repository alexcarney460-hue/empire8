import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { getStaticBrandRows } from '@/lib/brands-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Try Supabase first
  try {
    const supabase = getSupabaseServer();

    if (supabase) {
      const { data: brands, error } = await supabase
        .from('brands')
        .select('id, name, slug, description, logo_url, category')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (!error && brands && brands.length > 0) {
        return NextResponse.json({ success: true, data: brands, error: null });
      }

      if (error) {
        console.error('[api/brands] Supabase error:', error.message);
      }
    }
  } catch (err) {
    console.error('[api/brands] Unexpected error, falling back to static data:', err);
  }

  // Fallback to static seed data
  const staticBrands = getStaticBrandRows().map(
    ({ id, name, slug, description, logo_url, category }) => ({
      id,
      name,
      slug,
      description,
      logo_url,
      category,
    }),
  );

  return NextResponse.json({ success: true, data: staticBrands, error: null });
}
