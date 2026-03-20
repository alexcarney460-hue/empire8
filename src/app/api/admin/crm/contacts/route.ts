import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const url = new URL(req.url);
  const q = url.searchParams.get('q') || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '25')));
  const offset = (page - 1) * limit;

  let query = supabase
    .from('contacts')
    .select('*, companies(id, name, domain)', { count: 'exact' });

  if (q) {
    // Sanitize search query to prevent PostgREST filter injection
    const sanitized = q.replace(/[^a-zA-Z0-9\s@.\-_#]/g, '');
    if (sanitized) {
      query = query.or(`firstname.ilike.%${sanitized}%,lastname.ilike.%${sanitized}%,email.ilike.%${sanitized}%,phone.ilike.%${sanitized}%`);
    }
  }

  // Apply filters sent by the UI
  const leadStatus = url.searchParams.get('lead_status');
  const lifecycleStage = url.searchParams.get('lifecycle_stage');
  const source = url.searchParams.get('source');
  if (leadStatus) query = query.eq('lead_status', leadStatus);
  if (lifecycleStage) query = query.eq('lifecycle_stage', lifecycleStage);
  if (source) query = query.eq('source', source);

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[Admin] contacts error:', error.message);
    return NextResponse.json({ ok: false, error: 'An internal error occurred' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data, total: count ?? 0 });
}

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const body = await req.json();
  const allowedFields = ['firstname', 'lastname', 'email', 'phone', 'city', 'state', 'role', 'source', 'lead_status', 'lifecycle_stage', 'company_id'];
  const filtered = Object.fromEntries(Object.entries(body).filter(([k]) => allowedFields.includes(k)));
  const { data, error } = await supabase.from('contacts').insert(filtered).select().single();

  if (error) {
    console.error('[Admin] contacts error:', error.message);
    return NextResponse.json({ ok: false, error: 'An internal error occurred' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data }, { status: 201 });
}
