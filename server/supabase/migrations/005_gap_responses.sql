-- Migration 005: Interaktif gap-filling cevaplari (Gorev 1)
-- Kullanicinin, ilanda olup CV'de gorunmeyen keyword'ler icin verdigi gercek
-- cevaplari ve bunlardan uretilen ATS bullet'lari saklar.
-- Mevcut Supabase projesi olanlar SQL Editor'da bunu calistirir.

create table if not exists public.gap_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  application_id uuid references public.applications (id) on delete cascade,
  keyword text not null,
  user_answer text,
  generated_bullet text,
  accepted boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists gap_responses_user_idx
  on public.gap_responses (user_id, created_at desc);
create index if not exists gap_responses_app_idx
  on public.gap_responses (application_id);

alter table public.gap_responses enable row level security;

-- Kullanici sadece kendi cevaplarini gorebilir. Yazma islemleri backend
-- service role uzerinden yapilir (RLS'i bypass eder).
drop policy if exists "gap_responses_select_own" on public.gap_responses;
create policy "gap_responses_select_own" on public.gap_responses
  for select using (auth.uid() = user_id);
