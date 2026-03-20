import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET(req: Request) {
  try {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    const supabase = getSupabaseServer();
    if (!supabase) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

    const [contactsRes, companiesRes, dealsRes, newWeekRes] = await Promise.all([
      supabase.from('contacts').select('*', { count: 'exact', head: true }),
      supabase.from('companies').select('*', { count: 'exact', head: true }),
      supabase.from('deals').select('*', { count: 'exact', head: true }).not('stage', 'in', '("closed_won","closed_lost")'),
      supabase.from('contacts').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        contacts: contactsRes.count ?? 0,
        companies: companiesRes.count ?? 0,
        deals: dealsRes.count ?? 0,
        new_this_week: newWeekRes.count ?? 0,
      },
    });
  } catch (err) {
    console.error('[crm-stats] Unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
  }
}
