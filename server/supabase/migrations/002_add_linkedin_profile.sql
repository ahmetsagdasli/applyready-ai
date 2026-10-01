-- Migration 002: applications tablosuna linkedin_profile alani ekle.
-- Mevcut Supabase projesi olanlar SQL Editor'da bunu calistirir.

alter table public.applications
  add column if not exists linkedin_profile jsonb;
