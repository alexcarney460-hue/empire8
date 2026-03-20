import { getSupabaseServer } from '@/lib/supabase-server';
import { callClaudeJson, MODELS } from '@/lib/crowdtest/llm';
import { buildEmpire8Context } from '@/lib/crowdtest/context';
import { generatePersonas } from '@/lib/crowdtest/personas';

interface PersonaReaction {
  persona_name: string;
  role: string;
  age: number;
  sentiment: number;
  would_buy: boolean;
  reaction: string;
  objections: string[];
  praise: string[];
}

/**
 * Run a CrowdTest simulation. Called fire-and-forget after test creation.
 * Updates the test record in the DB as it progresses.
 */
export async function runCrowdTest(testId: string): Promise<void> {
  const supabase = getSupabaseServer();
  if (!supabase) return;

  try {
    // Fetch the test record
    const { data: test } = await supabase
      .from('crowdtest_tests')
      .select('*')
      .eq('id', testId)
      .single();

    if (!test || test.status !== 'pending') return;

    // Update status to running
    await supabase
      .from('crowdtest_tests')
      .update({ status: 'running', progress_phase: 'generating_personas', progress_current: 0 })
      .eq('id', testId);

    // Generate personas
    const personas = generatePersonas(test.persona_count);
    const context = await buildEmpire8Context();

    // Process in batches of 5
    const batchSize = 5;
    const reactions: PersonaReaction[] = [];

    for (let i = 0; i < personas.length; i += batchSize) {
      const batch = personas.slice(i, i + batchSize);

      // Update progress
      await supabase
        .from('crowdtest_tests')
        .update({
          progress_phase: 'running',
          progress_current: i,
        })
        .eq('id', testId);

      try {
        const batchResults = await callClaudeJson<PersonaReaction[]>({
          model: MODELS.crowdtest,
          system: `You are a market research simulator. You will receive a list of personas and a stimulus.
For each persona, generate an authentic reaction AS THAT PERSON — not as an AI.
Return a JSON array of objects with these fields:
- persona_name (string)
- role (string — their professional role)
- age (number)
- sentiment (number 0-1, where 0 is very negative and 1 is very positive)
- would_buy (boolean — would they purchase/engage)
- reaction (string — 2-3 sentence authentic reaction in their voice)
- objections (string array — specific concerns)
- praise (string array — what they like)

Context about the business: ${context}`,
          prompt: `PERSONAS:
${batch.map((p) => `- ${p.name}, ${p.role}, age ${p.age}. Concerns: ${p.concerns.join(', ')}. Values: ${p.values.join(', ')}.`).join('\n')}

STIMULUS TO EVALUATE:
${test.stimulus_content}

${test.audience_description ? `TARGET AUDIENCE: ${test.audience_description}` : ''}

Return a JSON array with one reaction object per persona. No markdown, just raw JSON.`,
          maxTokens: 4096,
        });

        if (Array.isArray(batchResults)) {
          reactions.push(...batchResults);
        }
      } catch (err) {
        console.error(`[crowdtest/runner] Batch ${i} error:`, err instanceof Error ? err.message : err);
        // Continue with remaining batches
      }
    }

    // Analyze results
    const totalReactions = reactions.length;
    const avgSentiment = totalReactions > 0
      ? Math.round((reactions.reduce((s, r) => s + (r.sentiment ?? 0), 0) / totalReactions) * 100) / 100
      : 0;
    const wouldBuyPct = totalReactions > 0
      ? Math.round((reactions.filter((r) => r.would_buy).length / totalReactions) * 100)
      : 0;

    // Aggregate objections and praise
    const objectionCounts: Record<string, number> = {};
    const praiseCounts: Record<string, number> = {};

    for (const r of reactions) {
      for (const o of r.objections ?? []) {
        objectionCounts[o] = (objectionCounts[o] ?? 0) + 1;
      }
      for (const p of r.praise ?? []) {
        praiseCounts[p] = (praiseCounts[p] ?? 0) + 1;
      }
    }

    const topObjections = Object.entries(objectionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([text]) => text);

    const topPraise = Object.entries(praiseCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([text]) => text);

    // Save results
    await supabase
      .from('crowdtest_tests')
      .update({
        status: 'complete',
        progress_phase: 'complete',
        progress_current: test.persona_count,
        completed_at: new Date().toISOString(),
        results: {
          avg_sentiment: avgSentiment,
          would_buy_pct: wouldBuyPct,
          top_objections: topObjections,
          top_praise: topPraise,
          reactions,
          total_reactions: totalReactions,
        },
      })
      .eq('id', testId);

  } catch (err) {
    console.error('[crowdtest/runner] Fatal error:', err instanceof Error ? err.message : err);

    // Mark as failed
    await supabase
      .from('crowdtest_tests')
      .update({
        status: 'failed',
        progress_phase: 'failed',
        results: { error: err instanceof Error ? err.message : 'Unknown error' },
      })
      .eq('id', testId);
  }
}
