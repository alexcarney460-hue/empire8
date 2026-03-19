-- ValueSuppliers.co — profiles table
-- Run in Supabase SQL editor at https://supabase.com/dashboard/project/hpakqrnvjnzznhffoqaf/sql

create table if not exists public.profiles (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  email         text,
  account_type  text not null default 'retail'
                  check (account_type in ('retail', 'wholesale', 'distribution')),
  company_name  text,
  approved      boolean not null default false,
  applied_at    timestamptz,
  approved_at   timestamptz,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Wholesale/distribution applications queue
create table if not exists public.account_applications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  email         text not null,
  company_name  text,
  operation_type text,
  monthly_volume text,
  website       text,
  notes         text,
  requested_tier text not null check (requested_tier in ('wholesale', 'distribution')),
  status        text not null default 'pending'
                  check (status in ('pending', 'approved', 'rejected')),
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.account_applications enable row level security;

-- Profiles policies
create policy "profiles_read_own" on public.profiles
  for select to authenticated using (auth.uid() = user_id);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = user_id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and approved = false); -- can't self-approve

-- Applications policies
create policy "applications_read_own" on public.account_applications
  for select to authenticated using (auth.uid() = user_id);

create policy "applications_insert_own" on public.account_applications
  for insert to authenticated with check (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
