-- Migration 004: Stripe abonelik alanlari (test mode)
-- Mevcut Supabase projesi olanlar SQL Editor'da bunu calistirir.

alter table public.user_plans
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists current_period_end timestamptz;

create index if not exists user_plans_stripe_customer_idx
  on public.user_plans (stripe_customer_id);

create index if not exists user_plans_stripe_subscription_idx
  on public.user_plans (stripe_subscription_id);
