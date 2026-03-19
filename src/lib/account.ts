import { getSupabase } from '@/lib/supabase';

export type AccountType = 'retail' | 'wholesale' | 'distribution';

export type Profile = {
  user_id: string;
  email: string | null;
  account_type: AccountType;
  company_name: string | null;
  approved: boolean;
};

export async function getMyProfile(): Promise<Profile | null> {
  const supabase = getSupabase();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id,email,account_type,company_name,approved')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) return null;
  return (data as unknown as Profile) ?? null;
}

export async function upsertMyProfile(input: {
  account_type: AccountType;
  company_name?: string;
}): Promise<boolean> {
  const supabase = getSupabase();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return false;

  const { error } = await (supabase.from('profiles') as any).upsert(
    {
      user_id: user.id,
      email: user.email ?? null,
      account_type: input.account_type,
      company_name: input.company_name ?? null,
      approved: false,
    },
    { onConflict: 'user_id' }
  );
  return !error;
}

export async function isWholesaleOrAbove(): Promise<boolean> {
  const profile = await getMyProfile();
  return (
    profile?.approved === true &&
    (profile.account_type === 'wholesale' || profile.account_type === 'distribution')
  );
}
