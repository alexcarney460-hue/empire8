import { createClient } from '@supabase/supabase-js';

const _url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const _key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!_url) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
    'Set it in .env.local or your deployment environment.',
  );
}

if (!_key) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
    'Set it in .env.local or your deployment environment.',
  );
}

const url: string = _url;
const key: string = _key;

let client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!client) client = createClient(url, key);
  return client;
}
