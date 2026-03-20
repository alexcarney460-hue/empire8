import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Database connection unavailable' },
      { status: 500 },
    );
  }

  try {
    const [
      activeResult,
      pendingResult,
      ordersResult,
      revenueResult,
    ] = await Promise.all([
      // Active dispensaries: approved accounts
      supabase
        .from('dispensary_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('is_approved', true),

      // Pending approvals: not-yet-approved accounts
      supabase
        .from('dispensary_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('is_approved', false),

      // Open orders: submitted or processing
      supabase
        .from('sales_orders')
        .select('id', { count: 'exact', head: true })
        .in('status', ['submitted', 'processing']),

      // Revenue last 30 days: sum of total_cents (exclude cancelled)
      (() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return supabase
          .from('sales_orders')
          .select('total_cents')
          .gte('created_at', thirtyDaysAgo.toISOString())
          .neq('status', 'cancelled');
      })(),
    ]);

    // Check for query errors
    const errors = [
      activeResult.error,
      pendingResult.error,
      ordersResult.error,
      revenueResult.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      console.error('[dashboard/summary] Query errors:', errors);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch dashboard metrics' },
        { status: 500 },
      );
    }

    // Sum revenue from returned rows
    const revenue30d = (revenueResult.data ?? []).reduce(
      (sum: number, row: { total_cents: number | null }) => sum + (row.total_cents ?? 0),
      0,
    );

    return NextResponse.json({
      ok: true,
      data: {
        activeDispensaries: activeResult.count ?? 0,
        pendingApprovals: pendingResult.count ?? 0,
        openOrders: ordersResult.count ?? 0,
        revenue30d,
      },
    });
  } catch (err) {
    console.error('[dashboard/summary] Unexpected error:', err);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
