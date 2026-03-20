import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ ok: false, error: 'Invalid ID format' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

  return NextResponse.json({ ok: true, data });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ ok: false, error: 'Invalid ID format' }, { status: 400 });
  }
  const body = await req.json();

  const allowed = ['status', 'tracking_number', 'shipping_carrier', 'notes'];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }
  update.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from('orders').update(update).eq('id', id).select().single();
  if (error) {
    console.error('[Admin] orders/:id error:', error.message);
    return NextResponse.json({ ok: false, error: 'An internal error occurred' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}
