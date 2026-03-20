import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });
    }

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '25', 10)));
    const search = url.searchParams.get('q')?.trim() || '';
    const status = url.searchParams.get('status') || ''; // 'pending' | 'approved' | ''

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('dispensary_accounts')
      .select('*', { count: 'exact' });

    // Status filter
    if (status === 'pending') {
      query = query.eq('is_approved', false);
    } else if (status === 'approved') {
      query = query.eq('is_approved', true);
    }

    // Search filter: company_name, email, or license_number
    if (search) {
      const sanitized = search.replace(/[^a-zA-Z0-9\s@.\-_#]/g, '');
      if (sanitized) {
        query = query.or(
          `company_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%,license_number.ilike.%${sanitized}%`
        );
      }
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[Admin] dispensaries list error:', error.message);
      return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
    }

    // Get pending count for badge
    const { count: pendingCount, error: pendingError } = await supabase
      .from('dispensary_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('is_approved', false);

    if (pendingError) {
      console.error('[Admin] dispensaries pending count error:', pendingError.message);
    }

    return NextResponse.json({
      ok: true,
      data: data ?? [],
      total: count ?? 0,
      pending_count: pendingCount ?? 0,
      page,
      limit,
    });
  } catch (err) {
    console.error('[dispensaries-list] Unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
  }
}
