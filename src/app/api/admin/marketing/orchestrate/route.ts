import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { orchestrateCampaign } from '@/lib/marketing/orchestrator';

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { brief, channel, campaign_type } = body;

    if (!brief || typeof brief !== 'string' || brief.trim().length < 10) {
      return NextResponse.json({ ok: false, error: 'brief must be at least 10 characters' }, { status: 400 });
    }

    const result = await orchestrateCampaign({
      brief: brief.trim(),
      channel: channel || undefined,
      campaign_type: campaign_type || undefined,
    });

    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[orchestrate] error:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
