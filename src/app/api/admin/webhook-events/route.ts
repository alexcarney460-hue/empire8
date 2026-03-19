import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';
import { processSquareEvent } from '@/app/api/square/webhook/route';

/**
 * GET /api/admin/webhook-events
 *
 * List recent webhook events with optional status filter.
 * Query params:
 *   - status: 'pending' | 'processed' | 'failed' (optional)
 *   - limit: number (default 50, max 200)
 *   - offset: number (default 0)
 */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });
  }

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get('status');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 200);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10) || 0;

  let query = supabase
    .from('webhook_events')
    .select('id, event_id, event_type, status, error_message, attempts, created_at, processed_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (statusFilter && ['pending', 'processed', 'failed'].includes(statusFilter)) {
    query = query.eq('status', statusFilter);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data, total: count ?? 0, limit, offset });
}

/**
 * POST /api/admin/webhook-events
 *
 * Actions on webhook events.
 * Body: { action: 'retry', event_id: string }
 *   - Retrieves the stored payload and re-processes the event.
 *
 * Body: { action: 'retry_all_failed' }
 *   - Re-processes all failed events (up to 50 at a time).
 */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });
  }

  let body: { action?: string; event_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { action, event_id } = body;

  if (action === 'retry' && event_id) {
    return await retryEvent(supabase, event_id);
  }

  if (action === 'retry_all_failed') {
    return await retryAllFailed(supabase);
  }

  return NextResponse.json(
    { ok: false, error: 'Invalid action. Supported: retry (with event_id), retry_all_failed' },
    { status: 400 },
  );
}

// ---------------------------------------------------------------------------
// Retry a single event by its webhook_events.event_id
// ---------------------------------------------------------------------------
async function retryEvent(
  supabase: ReturnType<typeof getSupabaseServer> & object,
  eventId: string,
): Promise<NextResponse> {
  const { data: webhookEvent, error } = await supabase
    .from('webhook_events')
    .select('id, event_id, event_type, payload, status, attempts')
    .eq('event_id', eventId)
    .limit(1)
    .single();

  if (error || !webhookEvent) {
    return NextResponse.json({ ok: false, error: 'Event not found' }, { status: 404 });
  }

  if (webhookEvent.status === 'processed') {
    return NextResponse.json({ ok: true, message: 'Event already processed', event_id: eventId });
  }

  // Mark as pending before retrying
  await supabase
    .from('webhook_events')
    .update({ status: 'pending' })
    .eq('id', webhookEvent.id);

  try {
    const payload = webhookEvent.payload as { type: string; event_id?: string; data?: { object?: Record<string, unknown> } };
    await processSquareEvent(payload, supabase);

    await supabase
      .from('webhook_events')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
        attempts: (webhookEvent.attempts ?? 0) + 1,
      })
      .eq('id', webhookEvent.id);

    return NextResponse.json({ ok: true, message: 'Event reprocessed successfully', event_id: eventId });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    await supabase
      .from('webhook_events')
      .update({
        status: 'failed',
        error_message: `Retry failed: ${errorMsg}`,
        attempts: (webhookEvent.attempts ?? 0) + 1,
      })
      .eq('id', webhookEvent.id);

    return NextResponse.json({ ok: false, error: `Retry failed: ${errorMsg}`, event_id: eventId }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Retry all failed events (batch, up to 50)
// ---------------------------------------------------------------------------
async function retryAllFailed(
  supabase: ReturnType<typeof getSupabaseServer> & object,
): Promise<NextResponse> {
  const { data: failedEvents, error } = await supabase
    .from('webhook_events')
    .select('id, event_id, event_type, payload, attempts')
    .eq('status', 'failed')
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!failedEvents || failedEvents.length === 0) {
    return NextResponse.json({ ok: true, message: 'No failed events to retry', retried: 0 });
  }

  const results: Array<{ event_id: string; success: boolean; error?: string }> = [];

  for (const webhookEvent of failedEvents) {
    try {
      const payload = webhookEvent.payload as { type: string; event_id?: string; data?: { object?: Record<string, unknown> } };
      await processSquareEvent(payload, supabase);

      await supabase
        .from('webhook_events')
        .update({
          status: 'processed',
          processed_at: new Date().toISOString(),
          attempts: (webhookEvent.attempts ?? 0) + 1,
        })
        .eq('id', webhookEvent.id);

      results.push({ event_id: webhookEvent.event_id, success: true });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      await supabase
        .from('webhook_events')
        .update({
          status: 'failed',
          error_message: `Batch retry failed: ${errorMsg}`,
          attempts: (webhookEvent.attempts ?? 0) + 1,
        })
        .eq('id', webhookEvent.id);

      results.push({ event_id: webhookEvent.event_id, success: false, error: errorMsg });
    }
  }

  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return NextResponse.json({
    ok: true,
    message: `Retried ${results.length} events: ${succeeded} succeeded, ${failed} failed`,
    retried: results.length,
    succeeded,
    failed,
    results,
  });
}
