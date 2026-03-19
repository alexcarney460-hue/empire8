import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase)
    return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  try {
    // --- Quick Stats ---

    const [
      { count: totalContacts },
      { count: totalCompanies },
    ] = await Promise.all([
      supabase.from('contacts').select('*', { count: 'exact', head: true }),
      supabase.from('companies').select('*', { count: 'exact', head: true }),
    ]);

    // orders table may not exist yet
    let orders: { id: string; email: string; total: number; status: string; created_at: string }[] = [];
    try {
      const { data: allOrders, error: ordersErr } = await supabase
        .from('orders')
        .select('id, email, total, status, created_at');
      if (!ordersErr && allOrders) orders = allOrders as typeof orders;
    } catch {
      // orders table doesn't exist yet
    }
    const activeOrders = orders.filter(
      (o) => o.status !== 'refunded' && o.status !== 'cancelled',
    );
    const totalRevenue = activeOrders.reduce(
      (sum, o) => sum + (Number(o.total) || 0),
      0,
    );
    const pendingOrders = orders.filter((o) => o.status === 'pending');

    const stats = {
      total_contacts: totalContacts ?? 0,
      total_companies: totalCompanies ?? 0,
      total_orders: activeOrders.length,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      pending_orders: pendingOrders.length,
    };

    // --- Recent Contacts (latest 5) ---

    const { data: recentContactsRaw } = await supabase
      .from('contacts')
      .select('id, firstname, lastname, email, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    const recentContacts = (recentContactsRaw ?? []).map((c: any) => ({
      id: c.id,
      full_name: [c.firstname, c.lastname].filter(Boolean).join(' ') || '(unnamed)',
      email: c.email ?? '',
      created_at: c.created_at,
    }));

    // --- Recent Orders (latest 5) ---

    const recentOrders = [...orders]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, 5);

    // --- Content Pipeline ---

    let contentPipeline = { draft: 0, scheduled: 0, published: 0 };
    try {
      const { data: contentItems } = await supabase
        .from('content_queue')
        .select('status');

      if (contentItems) {
        for (const item of contentItems) {
          const s = (item.status || '').toLowerCase();
          if (s === 'draft') contentPipeline.draft++;
          else if (s === 'scheduled') contentPipeline.scheduled++;
          else if (s === 'published') contentPipeline.published++;
        }
      }
    } catch {
      // content_queue table may not exist yet -- return zeros
    }

    // --- Alerts ---

    const alerts: { type: string; message: string; count: number }[] = [];

    // Orders pending > 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const stalePending = pendingOrders.filter(
      (o) => new Date(o.created_at) < threeDaysAgo,
    );
    if (stalePending.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${stalePending.length} order${stalePending.length > 1 ? 's' : ''} pending for more than 3 days`,
        count: stalePending.length,
      });
    }

    // Uncontacted leads
    try {
      const { count: uncontacted } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .is('last_contacted_at', null);

      if (uncontacted && uncontacted > 0) {
        alerts.push({
          type: 'info',
          message: `${uncontacted} contact${uncontacted > 1 ? 's' : ''} have not been reached out to yet`,
          count: uncontacted,
        });
      }
    } catch {
      // last_contacted column may not exist
    }

    return NextResponse.json({
      ok: true,
      data: {
        stats,
        recent_contacts: recentContacts,
        recent_orders: recentOrders.map((o: any) => ({ ...o, order_number: String(o.id).slice(-8) })),
        content_pipeline: contentPipeline,
        alerts,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
