-- CV Agent - Supabase schema (Adim 10)
-- Supabase Dashboard > SQL Editor icinde calistirin.

-- ============================================================
-- profiles
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Yeni kullanici kaydolunca otomatik profil olustur.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  -- Yeni kullaniciya varsayilan free plan ata.
  insert into public.user_plans (user_id, plan, monthly_limit)
  values (new.id, 'free', 3)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- applications
-- ============================================================
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  target_position text not null,
  language text not null,
  style text not null,
  input_source text,
  cv_text_preview text,
  parsed_cv jsonb,
  job_analysis jsonb,
  match_result jsonb,
  tailored_cv jsonb,
  cover_letter_result jsonb,
  linkedin_profile jsonb,
  quality_checks jsonb,
  editable_cv text,
  editable_cover_letter text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists applications_user_id_idx
  on public.applications (user_id, created_at desc);

alter table public.applications enable row level security;

-- Kullanici yalnizca kendi kayitlarini gorebilir/yazabilir.
drop policy if exists "applications_select_own" on public.applications;
create policy "applications_select_own" on public.applications
  for select using (auth.uid() = user_id);

drop policy if exists "applications_insert_own" on public.applications;
create policy "applications_insert_own" on public.applications
  for insert with check (auth.uid() = user_id);

drop policy if exists "applications_update_own" on public.applications;
create policy "applications_update_own" on public.applications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "applications_delete_own" on public.applications;
create policy "applications_delete_own" on public.applications
  for delete using (auth.uid() = user_id);

-- NOT: Backend service role key ile baglandigi icin RLS'i bypass eder; yine de
-- politikalar dogru tanimlidir. Frontend dogrudan tabloya YAZMAZ, tum yazma
-- islemleri backend uzerinden user_id kontrolu ile yapilir.

-- ============================================================
-- user_plans (plan + aylik limit)
-- ============================================================
create table if not exists public.user_plans (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free',
  monthly_limit integer,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_plans_stripe_customer_idx
  on public.user_plans (stripe_customer_id);
create index if not exists user_plans_stripe_subscription_idx
  on public.user_plans (stripe_subscription_id);

alter table public.user_plans enable row level security;

-- Kullanici sadece kendi planini gorebilir. Insert/update/delete backend
-- service role uzerinden yapilir (RLS'i bypass eder).
drop policy if exists "user_plans_select_own" on public.user_plans;
create policy "user_plans_select_own" on public.user_plans
  for select using (auth.uid() = user_id);

-- ============================================================
-- usage_logs (kullanim kayitlari)
-- ============================================================
create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  application_id uuid references public.applications (id) on delete set null,
  tokens_used integer,
  cost_estimate numeric,
  created_at timestamptz not null default now()
);

create index if not exists usage_logs_user_action_idx
  on public.usage_logs (user_id, action, created_at desc);

alter table public.usage_logs enable row level security;

drop policy if exists "usage_logs_select_own" on public.usage_logs;
create policy "usage_logs_select_own" on public.usage_logs
  for select using (auth.uid() = user_id);
