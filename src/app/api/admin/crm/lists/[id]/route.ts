import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const { id } = await params;

  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

  // Fetch company members for this list
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50')));
  const offset = (page - 1) * limit;
  const search = url.searchParams.get('q') || '';

  let query = supabase
    .from('list_companies')
    .select('company_id, companies!inner(id, name, domain, phone, city, state)', { count: 'exact' })
    .eq('list_id', id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    const safeSearch = search.replace(/[,()*\\"]/g, '');
    if (safeSearch) {
      query = query.ilike('companies.name', `%${safeSearch}%`);
    }
  }

  const { data: members, count: memberCount, error: memberErr } = await query;

  const companies = (members ?? []).map((m: any) => m.companies);

  return NextResponse.json({
    ok: true,
    data,
    companies,
    totalCompanies: memberCount ?? 0,
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const { id } = await params;
  const body = await req.json();
  const allowedFields = ['name', 'description', 'type', 'filter_criteria'];
  const update: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) update[key] = body[key];
  }
  update.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from('lists').update(update).eq('id', id).select().single();

  if (error) {
    console.error('[Admin] lists/:id error:', error.message);
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
  const { error } = await supabase.from('lists').delete().eq('id', id);

  if (error) {
    console.error('[Admin] lists/:id error:', error.message);
    return NextResponse.json({ ok: false, error: 'An internal error occurred' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
