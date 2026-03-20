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

  const { data: contact, error } = await supabase
    .from('contacts')
    .select('*, companies(id, name, domain)')
    .eq('id', id)
    .single();

  if (error || !contact) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

  const [activitiesRes, commsRes, ordersRes] = await Promise.all([
    supabase.from('activities').select('*').eq('contact_id', id).order('created_at', { ascending: false }),
    supabase.from('communications').select('*').eq('contact_id', id).order('created_at', { ascending: false }),
    supabase.from('orders').select('*').eq('contact_id', id).order('created_at', { ascending: false }),
  ]);

  const company = contact.companies || null;
  const { companies: _, ...contactFields } = contact;

  return NextResponse.json({
    ok: true,
    data: {
      ...contactFields,
      company,
      activities: activitiesRes.data || [],
      communications: commsRes.data || [],
      orders: ordersRes.data || [],
    },
  });
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
  const allowedFields = ['firstname', 'lastname', 'email', 'phone', 'city', 'state', 'role', 'source', 'lead_status', 'lifecycle_stage', 'company_id', 'owner', 'notes', 'last_contacted_at'];
  const update: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) update[key] = body[key];
  }
  update.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from('contacts').update(update).eq('id', id).select().single();

  if (error) {
    console.error('[Admin] contacts/:id error:', error.message);
    return NextResponse.json({ ok: false, error: 'An internal error occurred' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ ok: false, error: 'Invalid ID format' }, { status: 400 });
  }
  const { error } = await supabase.from('contacts').delete().eq('id', id);

  if (error) {
    console.error('[Admin] contacts/:id error:', error.message);
    return NextResponse.json({ ok: false, error: 'An internal error occurred' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
