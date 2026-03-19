import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';
import PRODUCTS from '@/lib/products';

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();

  // Try Supabase products table first; fall back to static list
  if (supabase) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (!error && data && data.length > 0) {
      return NextResponse.json({ ok: true, source: 'db', products: data });
    }
  }

  // Fallback: return static products from products.ts
  const products = PRODUCTS.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    short_name: p.shortName,
    category: p.category,
    price: p.price,
    unit: p.unit,
    badge: p.badge,
    img: p.img,
    description: p.description,
    in_stock: p.inStock,
    sort_order: p.id, // default sort by id
  }));

  return NextResponse.json({ ok: true, source: 'static', products });
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

  const allowedFields = ['name', 'short_name', 'slug', 'category', 'price', 'unit', 'badge', 'img', 'description', 'in_stock', 'sort_order', 'box_price', 'case_price', 'quantity_on_hand', 'low_stock_threshold', 'weight_lbs'];
  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, product: data });
}
