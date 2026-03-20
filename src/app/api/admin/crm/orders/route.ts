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
    const contactId = url.searchParams.get('contact_id');
    const companyId = url.searchParams.get('company_id');
    const email = url.searchParams.get('email');
    const status = url.searchParams.get('status');
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '25')));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('sales_orders')
      .select('*, sales_order_items(*)', { count: 'exact' });

    if (contactId) query = query.eq('contact_id', contactId);
    if (companyId) query = query.eq('company_id', companyId);
    if (email) query = query.eq('email', email);
    if (status) query = query.eq('status', status);

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[Admin] orders error:', error.message);
      return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data, total: count ?? 0, page, limit });
  } catch (err) {
    console.error('[orders-list] Unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
  }
}
