import { getSupabaseServer } from '@/lib/supabase-server';

/**
 * Retrieve the stored Anthropic API key from the database.
 * Returns null if no key is configured.
 */
export async function getAnthropicApiKey(): Promise<string | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from('crowdtest_api_keys')
    .select('api_key, is_active')
    .eq('name', 'anthropic_llm_key')
    .eq('is_active', true)
    .maybeSingle();

  if (!data) return null;

  // Update last_used_at
  await supabase
    .from('crowdtest_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('name', 'anthropic_llm_key');

  return data.api_key;
}

/**
 * Model selection: use the best available Claude model.
 *
 * Priority:
 * 1. claude-sonnet-4-6 — best coding/reasoning model, fast
 * 2. claude-opus-4-6 — deepest reasoning (use for ThinkTank debates)
 * 3. claude-haiku-4-5 — fastest, cheapest (fallback for large persona batches)
 */
export const MODELS = {
  /** Best balance of quality and speed — default for CrowdTest */
  crowdtest: 'claude-sonnet-4-6',
  /** Deepest reasoning — for ThinkTank expert debates */
  thinktank: 'claude-opus-4-6',
  /** Fast and cheap — for generating large persona batches */
  batch: 'claude-haiku-4-5-20251001',
} as const;

/**
 * Call the Anthropic API with the stored key.
 * Returns the response text or throws on error.
 */
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;
const REQUEST_TIMEOUT_MS = 30_000;

export async function callClaude(params: {
  model?: string;
  system?: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  const apiKey = await getAnthropicApiKey();
  if (!apiKey) {
    throw new Error('No Anthropic API key configured. Add one in Admin > CrowdTest > LLM API Key.');
  }

  const model = params.model || MODELS.crowdtest;
  const requestBody = JSON.stringify({
    model,
    max_tokens: params.maxTokens || 4096,
    system: params.system,
    messages: [{ role: 'user', content: params.prompt }],
  });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delayMs = RETRY_BASE_MS * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: requestBody,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const msg = (err as Record<string, unknown>).error
          ? JSON.stringify((err as Record<string, unknown>).error)
          : `API error ${response.status}`;

        // Retry on 429 (rate limited) and 529 (overloaded)
        if ((response.status === 429 || response.status === 529) && attempt < MAX_RETRIES) {
          lastError = new Error(`Anthropic API error: ${msg}`);
          continue;
        }

        throw new Error(`Anthropic API error: ${msg}`);
      }

      const data = await response.json();
      const content = data.content;
      if (Array.isArray(content) && content.length > 0 && content[0].type === 'text') {
        return content[0].text;
      }

      throw new Error('Unexpected API response format');
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof DOMException && err.name === 'AbortError') {
        lastError = new Error('Anthropic API request timed out after 30 seconds');
        if (attempt < MAX_RETRIES) continue;
        throw lastError;
      }

      // If it's a retryable error we already set, continue
      if (lastError && attempt < MAX_RETRIES) continue;

      throw err;
    }
  }

  throw lastError ?? new Error('Anthropic API call failed after retries');
}

/**
 * Call Claude and parse the response as JSON.
 * Strips markdown code fences if present.
 */
export async function callClaudeJson<T = unknown>(params: {
  model?: string;
  system?: string;
  prompt: string;
  maxTokens?: number;
}): Promise<T> {
  const text = await callClaude(params);

  // Strip markdown code fences
  const cleaned = text
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();

  return JSON.parse(cleaned) as T;
}
