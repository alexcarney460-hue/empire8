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

  const { data, error } = await supabase
    .from('products')
    .select('id, slug, name, short_name, category, img, quantity_on_hand, low_stock_threshold')
    .order('id', { ascending: true });

  if (error) {
    console.error('[Admin] inventory error:', error.message);
    return NextResponse.json({ ok: false, error: 'An internal error occurred' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, inventory: data });
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

  const { slug } = body;
  if (!slug || typeof slug !== 'string') {
    return NextResponse.json({ ok: false, error: 'Missing product slug' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (typeof body.quantity_on_hand === 'number') {
    const qty = Math.max(0, Math.round(body.quantity_on_hand as number));
    updates.quantity_on_hand = qty;
  }

  if (typeof body.low_stock_threshold === 'number') {
    const threshold = Math.max(0, Math.round(body.low_stock_threshold as number));
    updates.low_stock_threshold = threshold;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: false, error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('slug', slug)
    .select('slug, quantity_on_hand, low_stock_threshold')
    .single();

  if (error) {
    console.error('[Admin] inventory error:', error.message);
    return NextResponse.json({ ok: false, error: 'An internal error occurred' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, product: data });
}
