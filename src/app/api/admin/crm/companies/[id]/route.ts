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

  const { data: company, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !company) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

  const [contactsRes, dealsRes, activitiesRes] = await Promise.all([
    supabase.from('contacts').select('*').eq('company_id', id).order('created_at', { ascending: false }),
    supabase.from('deals').select('*').eq('company_id', id).order('created_at', { ascending: false }),
    supabase.from('activities').select('*').eq('company_id', id).order('created_at', { ascending: false }),
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      ...company,
      contacts: contactsRes.data || [],
      deals: dealsRes.data || [],
      activities: activitiesRes.data || [],
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
  const allowedFields = ['name', 'domain', 'phone', 'city', 'state', 'industry', 'description', 'website', 'employee_count', 'source', 'rating', 'notes', 'address'];
  const update: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) update[key] = body[key];
  }
  update.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from('companies').update(update).eq('id', id).select().single();

  if (error) {
    console.error('[Admin] companies/:id error:', error.message);
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
  const { error } = await supabase.from('companies').delete().eq('id', id);

  if (error) {
    console.error('[Admin] companies/:id error:', error.message);
    return NextResponse.json({ ok: false, error: 'An internal error occurred' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
