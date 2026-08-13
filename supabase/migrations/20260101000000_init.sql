-- NameClear — initial schema
-- Tables for the 1-hour check cache and one-time paid reports.

create table if not exists public.search_cache (
  searched_name text primary key,
  results_json jsonb not null default '{}'::jsonb,
  checked_at timestamptz not null default now()
);

create index if not exists search_cache_checked_at_idx
  on public.search_cache (checked_at);

create table if not exists public.paid_reports (
  id uuid primary key default gen_random_uuid(),
  searched_name text not null,
  email text not null,
  stripe_payment_id text not null unique,
  pdf_url text,
  created_at timestamptz not null default now()
);

create index if not exists paid_reports_created_at_idx
  on public.paid_reports (created_at desc);

-- PDF storage bucket for paid reports (the report PDFs live here).
insert into storage.buckets (id, name, public)
values ('reports', 'reports', false)
on conflict (id) do nothing;
