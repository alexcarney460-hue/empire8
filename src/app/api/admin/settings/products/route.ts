import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });
  }

  const url = new URL(req.url);
  const brandId = url.searchParams.get('brand_id');

  let query = supabase
    .from('brand_products')
    .select('*, brands(name)')
    .order('name', { ascending: true });

  if (brandId) {
    query = query.eq('brand_id', brandId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Admin] products list error:', error.message);
    return NextResponse.json({ ok: false, error: 'Failed to fetch products' }, { status: 500 });
  }

  const products = (data ?? []).map((product) => {
    const { brands: brand, ...rest } = product;
    return {
      ...rest,
      brand_name: brand && typeof brand === 'object' && 'name' in brand
        ? (brand as { name: string }).name
        : null,
    };
  });

  return NextResponse.json({ ok: true, products });
}

export async function POST(req: Request) {
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

  const { name, brand_id, category, unit_price_cents } = body as Record<string, unknown>;

  if (!name || !(name as string).trim()) {
    return NextResponse.json({ ok: false, error: 'Product name is required' }, { status: 400 });
  }
  if (!brand_id) {
    return NextResponse.json({ ok: false, error: 'Brand ID is required' }, { status: 400 });
  }
  if (!category || !(category as string).trim()) {
    return NextResponse.json({ ok: false, error: 'Category is required' }, { status: 400 });
  }
  if (unit_price_cents === undefined || unit_price_cents === null) {
    return NextResponse.json({ ok: false, error: 'Unit price is required' }, { status: 400 });
  }

  const slug = body.slug
    ? (body.slug as string).trim()
    : (name as string).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Validate that brand_id references an existing active brand
  const { data: brandExists } = await supabase
    .from('brands')
    .select('id')
    .eq('id', brand_id as string)
    .eq('is_active', true)
    .maybeSingle();

  if (!brandExists) {
    return NextResponse.json(
      { ok: false, error: 'Brand not found or is inactive' },
      { status: 400 },
    );
  }

  // Check slug uniqueness within the same brand
  const { data: existingSlug } = await supabase
    .from('brand_products')
    .select('id')
    .eq('slug', slug)
    .eq('brand_id', brand_id as string)
    .maybeSingle();

  if (existingSlug) {
    return NextResponse.json(
      { ok: false, error: 'A product with this slug already exists for this brand' },
      { status: 409 },
    );
  }

  const { data, error } = await supabase
    .from('brand_products')
    .insert({
      name: (name as string).trim(),
      slug,
      description: body.description ? (body.description as string).trim() : null,
      brand_id,
      category: (category as string).trim(),
      unit_price_cents: Number(unit_price_cents),
      unit_type: body.unit_type ? (body.unit_type as string).trim() : 'unit',
      min_order_qty: body.min_order_qty ? Number(body.min_order_qty) : 1,
      image_url: body.image_url ? (body.image_url as string).trim() : null,
      is_available: true,
    })
    .select('*, brands(name)')
    .single();

  if (error) {
    console.error('[Admin] product create error:', error.message);
    return NextResponse.json({ ok: false, error: 'Failed to create product' }, { status: 500 });
  }

  const { brands: brand, ...rest } = data;
  const product = {
    ...rest,
    brand_name: brand && typeof brand === 'object' && 'name' in brand
      ? (brand as { name: string }).name
      : null,
  };

  return NextResponse.json({ ok: true, product }, { status: 201 });
}

export async function PATCH(req: Request) {
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

  const { id } = body;
  if (!id) {
    return NextResponse.json({ ok: false, error: 'Missing product id' }, { status: 400 });
  }

  const allowedFields = [
    'name', 'slug', 'description', 'category',
    'unit_price_cents', 'unit_type', 'min_order_qty',
    'image_url', 'is_available', 'brand_id',
  ];
  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: false, error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('brand_products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Admin] product update error:', error.message);
    return NextResponse.json({ ok: false, error: 'Failed to update product' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, product: data });
}
