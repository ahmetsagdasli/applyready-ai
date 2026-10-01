-- Migration 003: plan + kullanim takibi (user_plans, usage_logs)
-- Mevcut Supabase projesi olanlar SQL Editor'da bunu calistirir.

-- ============================================================
-- user_plans
-- ============================================================
create table if not exists public.user_plans (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free',
  monthly_limit integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_plans enable row level security;

drop policy if exists "user_plans_select_own" on public.user_plans;
create policy "user_plans_select_own" on public.user_plans
  for select using (auth.uid() = user_id);

-- ============================================================
-- usage_logs
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

-- ============================================================
-- Yeni kullanici trigger'ini guncelle (free plan da olustur)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  insert into public.user_plans (user_id, plan, monthly_limit)
  values (new.id, 'free', 3)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- ============================================================
-- Mevcut kullanicilar icin free plan backfill
-- ============================================================
insert into public.user_plans (user_id, plan, monthly_limit)
select id, 'free', 3 from auth.users
on conflict (user_id) do nothing;
