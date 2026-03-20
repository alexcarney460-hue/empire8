import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
    'Set it in .env.local or your deployment environment.',
  );
}

if (!key) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
    'Set it in .env.local or your deployment environment.',
  );
}

let client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!client) client = createClient(url, key);
  return client;
}
