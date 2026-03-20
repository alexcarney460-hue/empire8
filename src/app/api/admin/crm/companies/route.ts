import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET(req: Request) {
  try {
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
      .from('companies')
      .select('*, contacts(id)', { count: 'exact' });

    if (q) {
      // Sanitize search query to prevent PostgREST filter injection
      const sanitized = q.replace(/[^a-zA-Z0-9\s@.\-_#]/g, '');
      if (sanitized) {
        query = query.or(`name.ilike.%${sanitized}%,domain.ilike.%${sanitized}%,city.ilike.%${sanitized}%,industry.ilike.%${sanitized}%`);
      }
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[Admin] companies error:', error.message);
      return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
    }

    const rows = (data || []).map((c: any) => ({
      ...c,
      contacts_count: Array.isArray(c.contacts) ? c.contacts.length : 0,
      contacts: undefined,
    }));

    return NextResponse.json({ ok: true, data: rows, total: count ?? 0 });
  } catch (err) {
    console.error('[companies-list] Unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    const supabase = getSupabaseServer();
    if (!supabase) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

    const body = await req.json();
    const allowedFields = ['name', 'domain', 'phone', 'city', 'state', 'industry', 'description', 'website', 'employee_count', 'source', 'rating', 'notes', 'address'];
    const filtered = Object.fromEntries(Object.entries(body).filter(([k]) => allowedFields.includes(k)));
    if (!filtered.name) return NextResponse.json({ ok: false, error: 'name is required' }, { status: 400 });
    const { data, error } = await supabase.from('companies').insert(filtered).select().single();

    if (error) {
      console.error('[Admin] companies error:', error.message);
      return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (err) {
    console.error('[companies-create] Unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
  }
}
