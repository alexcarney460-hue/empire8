import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';
import { runAgent } from '@/lib/marketing/agent-runner';

/** GET — list all marketing agents */
export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const { data, error } = await supabase
    .from('marketing_agents')
    .select('id, name, description, role, capabilities, triggers, model, is_active, config')
    .order('name');

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}

/** POST — run an agent directly with a prompt */
export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const body = await req.json();
  const { agent_id, prompt, campaign_id } = body;

  if (!agent_id || !prompt) {
    return NextResponse.json({ ok: false, error: 'agent_id and prompt are required' }, { status: 400 });
  }

  try {
    const result = await runAgent(agent_id, prompt, { campaignId: campaign_id });
    return NextResponse.json({
      ok: true,
      run_id: result.run_id,
      agent: result.agent_name,
      output: result.output,
      parsed: result.parsed,
      tokens: { input: result.tokens_input, output: result.tokens_output },
      duration_ms: result.duration_ms,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Agent execution failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
