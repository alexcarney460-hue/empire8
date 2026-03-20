import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase-server';

export type DispensaryAccount = {
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
  approved_at: string | null;
  created_at: string;
};

export type AuthResult = {
  dispensary: DispensaryAccount;
  user: { id: string; email: string };
};

/**
 * Get the currently authenticated dispensary account.
 *
 * - Validates the Supabase session
 * - Looks up the dispensary_accounts row linked to the auth user
 * - Redirects to /login if no session or no dispensary row found
 * - Returns dispensary + user if approved, or throws redirect if not approved
 */
export async function getAuthenticatedDispensary(): Promise<AuthResult> {
  const supabase = getSupabaseServer();

  if (!supabase) {
    redirect('/login');
  }

  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData.user) {
    redirect('/login');
  }

  const user = userData.user;

  const { data: dispensary, error: dbError } = await supabase
    .from('dispensary_accounts')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (dbError || !dispensary) {
    redirect('/login');
  }

  const account = dispensary as unknown as DispensaryAccount;

  if (!account.is_approved) {
    redirect('/login?error=pending_approval');
  }

  return {
    dispensary: account,
    user: {
      id: user.id,
      email: user.email ?? account.email,
    },
  };
}

/**
 * Lighter check that only verifies session exists.
 * Does NOT check dispensary approval status.
 * Useful for pages like "pending approval" status screens.
 */
export async function getSessionUser(): Promise<{ id: string; email: string } | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  return {
    id: data.user.id,
    email: data.user.email ?? '',
  };
}
