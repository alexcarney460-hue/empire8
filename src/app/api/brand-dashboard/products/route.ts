import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedBrand } from '@/lib/brand-auth';
import { getSupabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/* ── GET -- List brand's products ───────────────────────────────────── */

export async function GET() {
  const auth = await getAuthenticatedBrand();
  if (!auth) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { brandId } = auth;
  if (!brandId) {
    return NextResponse.json({ ok: true, data: [] });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('brand_products')
    .select('id, name, slug, category, description, unit_price_cents, unit_type, min_order_qty, is_available, created_at')
    .eq('brand_id', brandId)
    .order('name', { ascending: true });

  if (error) {
    console.error('[brand-dashboard/products] list error:', error.message);
    return NextResponse.json({ ok: false, error: 'Failed to load products' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data: data ?? [] });
}

/* ── POST -- Add a new product ──────────────────────────────────────── */

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedBrand();
  if (!auth) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { brandId } = auth;
  if (!brandId) {
    return NextResponse.json({ ok: false, error: 'Brand account is not linked to a brand' }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const unitPriceCents = typeof body.unit_price_cents === 'number' ? body.unit_price_cents : NaN;
  const unitType = typeof body.unit_type === 'string' ? body.unit_type.trim() : 'unit';
  const minOrderQty = typeof body.min_order_qty === 'number' ? body.min_order_qty : 1;

  if (!name) {
    return NextResponse.json({ ok: false, error: 'Product name is required' }, { status: 400 });
  }
  if (!category) {
    return NextResponse.json({ ok: false, error: 'Category is required' }, { status: 400 });
  }
  if (isNaN(unitPriceCents) || unitPriceCents < 0) {
    return NextResponse.json({ ok: false, error: 'Valid price is required' }, { status: 400 });
  }
  if (minOrderQty < 1) {
    return NextResponse.json({ ok: false, error: 'Minimum order quantity must be at least 1' }, { status: 400 });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Check slug uniqueness within this brand
  const { data: existing } = await supabase
    .from('brand_products')
    .select('id')
    .eq('brand_id', brandId)
    .eq('slug', slug)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: false, error: 'A product with this name already exists' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('brand_products')
    .insert({
      brand_id: brandId,
      name,
      slug,
      category,
      description: description || null,
      unit_price_cents: Math.round(unitPriceCents),
      unit_type: unitType,
      min_order_qty: minOrderQty,
      is_available: true,
    })
    .select()
    .single();

  if (error) {
    console.error('[brand-dashboard/products] insert error:', error.message);
    return NextResponse.json({ ok: false, error: 'Failed to add product' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data }, { status: 201 });
}

/* ── PATCH -- Update product fields ─────────────────────────────────── */

export async function PATCH(req: NextRequest) {
  const auth = await getAuthenticatedBrand();
  if (!auth) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { brandId } = auth;
  if (!brandId) {
    return NextResponse.json({ ok: false, error: 'Brand account is not linked to a brand' }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const productId = typeof body.id === 'string' ? body.id.trim() : '';
  if (!productId) {
    return NextResponse.json({ ok: false, error: 'Product ID is required' }, { status: 400 });
  }

  // Verify the product belongs to this brand
  const { data: product } = await supabase
    .from('brand_products')
    .select('id')
    .eq('id', productId)
    .eq('brand_id', brandId)
    .maybeSingle();

  if (!product) {
    return NextResponse.json({ ok: false, error: 'Product not found' }, { status: 404 });
  }

  const allowedFields = ['unit_price_cents', 'is_available', 'min_order_qty', 'description'];
  const updates: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: false, error: 'No valid fields to update' }, { status: 400 });
  }

  // Validate price if provided
  if (updates.unit_price_cents !== undefined) {
    const price = Number(updates.unit_price_cents);
    if (isNaN(price) || price < 0) {
      return NextResponse.json({ ok: false, error: 'Invalid price' }, { status: 400 });
    }
    updates.unit_price_cents = Math.round(price);
  }

  const { data, error } = await supabase
    .from('brand_products')
    .update(updates)
    .eq('id', productId)
    .select()
    .single();

  if (error) {
    console.error('[brand-dashboard/products] update error:', error.message);
    return NextResponse.json({ ok: false, error: 'Failed to update product' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}
