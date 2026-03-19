import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseServer } from '@/lib/supabase-server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface AgentDef {
  id: string;
  name: string;
  model: string;
  system_prompt: string;
  config: Record<string, unknown>;
}

export interface AgentRunResult {
  run_id: string;
  agent_name: string;
  output: string;
  parsed: Record<string, unknown> | null;
  tokens_input: number;
  tokens_output: number;
  duration_ms: number;
}

/** Load an agent definition from the marketing_agents table */
export async function loadAgent(agentId: string): Promise<AgentDef | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('marketing_agents')
    .select('id, name, model, system_prompt, config')
    .eq('id', agentId)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;
  return data as AgentDef;
}

/** Run an agent with a user prompt, log execution to agent_runs */
export async function runAgent(
  agentId: string,
  userPrompt: string,
  options?: { campaignId?: string; inputData?: Record<string, unknown> }
): Promise<AgentRunResult> {
  const supabase = getSupabaseServer();
  if (!supabase) throw new Error('DB unavailable');

  const agent = await loadAgent(agentId);
  if (!agent) throw new Error(`Agent "${agentId}" not found or inactive`);

  // Create run record
  const { data: run, error: runErr } = await supabase
    .from('agent_runs')
    .insert({
      agent_name: agentId,
      campaign_id: options?.campaignId || null,
      input_data: { prompt: userPrompt, ...options?.inputData },
      model_used: agent.model,
      status: 'running',
    })
    .select('id')
    .single();

  if (runErr || !run) throw new Error('Failed to create agent run: ' + runErr?.message);
  const runId = run.id;
  const startTime = Date.now();

  try {
    const response = await client.messages.create({
      model: agent.model,
      max_tokens: 4096,
      system: agent.system_prompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const output = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.type === 'text' ? b.text : '')
      .join('\n');

    const tokensIn = response.usage?.input_tokens ?? 0;
    const tokensOut = response.usage?.output_tokens ?? 0;
    const durationMs = Date.now() - startTime;

    // Try to parse JSON from the output
    let parsed: Record<string, unknown> | null = null;
    const jsonMatch = output.match(/```json\s*([\s\S]*?)```/) || output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch { /* not valid JSON */ }
    }

    // Update run record
    await supabase.from('agent_runs').update({
      status: 'completed',
      output_data: { text: output, parsed },
      tokens_input: tokensIn,
      tokens_output: tokensOut,
      duration_ms: durationMs,
      completed_at: new Date().toISOString(),
    }).eq('id', runId);

    return { run_id: runId, agent_name: agentId, output, parsed, tokens_input: tokensIn, tokens_output: tokensOut, duration_ms: durationMs };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await supabase.from('agent_runs').update({
      status: 'failed',
      error_message: message,
      duration_ms: Date.now() - startTime,
      completed_at: new Date().toISOString(),
    }).eq('id', runId);
    throw err;
  }
}
