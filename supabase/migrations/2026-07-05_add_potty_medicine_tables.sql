-- Migration: add potty_logs and medicine_logs tables for the new dashboard
-- cards. Run this once in the Supabase SQL editor against the existing
-- project (schema.sql alone won't update a live database).

create table if not exists potty_logs (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies(id) on delete cascade,
  type text not null check (type in ('pee', 'poop', 'both')),
  notes text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists medicine_logs (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies(id) on delete cascade,
  medicine_name text not null,
  dose_amount numeric,
  dose_unit text,
  notes text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table potty_logs enable row level security;
alter table medicine_logs enable row level security;

drop policy if exists "potty_logs_shared" on potty_logs;
create policy "potty_logs_shared" on potty_logs
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "medicine_logs_shared" on medicine_logs;
create policy "medicine_logs_shared" on medicine_logs
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create index if not exists idx_potty_logs_baby_time on potty_logs (baby_id, occurred_at desc);
create index if not exists idx_medicine_logs_baby_time on medicine_logs (baby_id, occurred_at desc);
