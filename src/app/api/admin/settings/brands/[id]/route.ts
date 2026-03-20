import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ ok: false, error: 'Missing brand id' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const allowedFields = [
    'name', 'slug', 'description', 'contact_email',
    'category', 'website', 'logo_url', 'is_active',
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
    .from('brands')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Admin] brand update error:', error.message);
    return NextResponse.json({ ok: false, error: 'Failed to update brand' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, brand: data });
}

export async function DELETE(req: Request, context: RouteContext) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ ok: false, error: 'Missing brand id' }, { status: 400 });
  }

  // Soft delete: set is_active = false
  const { data, error } = await supabase
    .from('brands')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Admin] brand soft-delete error:', error.message);
    return NextResponse.json({ ok: false, error: 'Failed to deactivate brand' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, brand: data });
}
