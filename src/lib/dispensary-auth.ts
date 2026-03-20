import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export interface DispensaryAccount {
  id: string;
  user_id: string;
  company_name: string;
  license_number: string;
  license_type: string;
  contact_name: string;
  email: string;
  phone: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  is_approved: boolean;
  created_at: string;
}

/**
 * Authenticate a dispensary user from the Supabase session cookie.
 * Returns the dispensary account row or null if unauthenticated.
 *
 * Uses the service role key on the server to look up the user from the
 * access token stored in the sb-*-auth-token cookie.
 */
export async function getAuthenticatedDispensary(): Promise<DispensaryAccount | null> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !(serviceKey || anonKey)) return null;

  const supabase = createClient(url, serviceKey || anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Read the Supabase auth cookie
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // Find the sb-*-auth-token cookie (format varies by project ref)
  const authCookie = allCookies.find((c) => c.name.match(/^sb-.*-auth-token$/));
  if (!authCookie) return null;

  let accessToken: string | null = null;

  try {
    // The cookie value can be a JSON-encoded array [access_token, refresh_token, ...]
    // or a base64-encoded JSON object
    const raw = decodeURIComponent(authCookie.value);
    if (raw.startsWith('[')) {
      const parts = JSON.parse(raw);
      accessToken = typeof parts[0] === 'string' ? parts[0] : null;
    } else if (raw.startsWith('base64-')) {
      const decoded = Buffer.from(raw.slice(7), 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      accessToken = parsed.access_token ?? null;
    } else {
      // Try parsing as JSON object
      const parsed = JSON.parse(raw);
      accessToken = parsed.access_token ?? parsed[0] ?? null;
    }
  } catch {
    // Not parseable, try using cookie value directly
    accessToken = authCookie.value;
  }

  if (!accessToken) return null;

  // Verify the token and get the user
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) return null;

  // Look up the dispensary account
  const { data: dispensary, error: dispError } = await supabase
    .from('dispensary_accounts')
    .select('*')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (dispError || !dispensary) return null;

  const account = dispensary as unknown as DispensaryAccount;

  // Reject unapproved dispensary accounts
  if (!account.is_approved) return null;

  return account;
}
