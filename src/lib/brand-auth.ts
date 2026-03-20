import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

/* -- Types ----------------------------------------------------------------- */

export interface BrandAccount {
  readonly id: string;
  readonly user_id: string;
  readonly brand_id: string | null;
  readonly company_name: string;
  readonly contact_name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly license_number: string | null;
  readonly license_type: string | null;
  readonly website: string | null;
  readonly description: string | null;
  readonly is_approved: boolean;
  readonly approved_at: string | null;
  readonly account_type: string;
  readonly created_at: string;
}

export interface AuthenticatedBrand {
  readonly brandAccount: BrandAccount;
  readonly brandId: string | null;
}

/**
 * Authenticate a brand owner from the Supabase session cookie.
 * Returns the brand account row and brand ID, or null if unauthenticated / unapproved.
 *
 * Mirrors the dispensary-auth pattern: reads the sb-*-auth-token cookie,
 * verifies via service role, then looks up `brand_accounts` by user_id.
 */
export async function getAuthenticatedBrand(): Promise<AuthenticatedBrand | null> {
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

  const authCookie = allCookies.find((c) => c.name.match(/^sb-.*-auth-token$/));
  if (!authCookie) return null;

  let accessToken: string | null = null;

  try {
    const raw = decodeURIComponent(authCookie.value);
    if (raw.startsWith('[')) {
      const parts = JSON.parse(raw);
      accessToken = typeof parts[0] === 'string' ? parts[0] : null;
    } else if (raw.startsWith('base64-')) {
      const decoded = Buffer.from(raw.slice(7), 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      accessToken = parsed.access_token ?? null;
    } else {
      const parsed = JSON.parse(raw);
      accessToken = parsed.access_token ?? parsed[0] ?? null;
    }
  } catch {
    accessToken = authCookie.value;
  }

  if (!accessToken) return null;

  // Verify the token and get the user
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) return null;

  // Look up the brand account
  const { data: brandRow, error: brandError } = await supabase
    .from('brand_accounts')
    .select('*')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (brandError || !brandRow) return null;

  const account = brandRow as unknown as BrandAccount;

  // Reject unapproved brand accounts
  if (!account.is_approved) return null;

  return {
    brandAccount: account,
    brandId: account.brand_id,
  };
}
