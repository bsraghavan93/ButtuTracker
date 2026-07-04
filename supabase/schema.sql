-- Buttu Tracker database schema (Supabase / Postgres)
-- Run this in the Supabase SQL editor for a fresh project.
--
-- This app is for personal/family use only: every authenticated user
-- shares the same baby record and logs (not scoped per account).

create extension if not exists "pgcrypto";

-- ============ babies ============
create table if not exists babies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Aryan',
  dob date not null default '2026-01-10',
  family_culture text default 'Tamil',
  food_restrictions text[] default array['beef','pork'],
  timezone text default 'America/New_York',
  created_at timestamptz not null default now()
);

-- ============ sleep_logs ============
create table if not exists sleep_logs (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies(id) on delete cascade,
  type text not null check (type in ('nap', 'night')),
  start_time timestamptz not null,
  end_time timestamptz,
  night_wakings int default 0,
  notes text,
  created_at timestamptz not null default now()
);

-- ============ feed_logs ============
create table if not exists feed_logs (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies(id) on delete cascade,
  type text not null check (type in ('breast', 'bottle', 'pump')),
  side text check (side in ('left', 'right', 'both')),
  duration_min numeric,
  amount_ml numeric,
  occurred_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

-- ============ solid_logs ============
create table if not exists solid_logs (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies(id) on delete cascade,
  food_name text not null,
  date_introduced date not null default current_date,
  quantity text,
  texture text check (texture in ('puree', 'mashed', 'finger_food', 'blw')),
  reaction text check (reaction in ('none', 'rash', 'vomiting', 'gas', 'constipation', 'diarrhea')) default 'none',
  is_iron_rich boolean default false,
  is_tamil_food boolean default false,
  notes text,
  created_at timestamptz not null default now()
);

-- ============ diaper_logs ============
create table if not exists diaper_logs (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies(id) on delete cascade,
  type text not null check (type in ('wet', 'poop', 'both')),
  color text,
  texture text,
  notes text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ============ foods ============
-- User-added food library entries shown as quick-tap tiles in Quick add > Solid,
-- alongside a hardcoded set of common first-foods (kept in the app, not this table).
create table if not exists foods (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies(id) on delete cascade,
  name text not null,
  emoji text default '🍽️',
  created_at timestamptz not null default now()
);

-- ============ growth_logs ============
create table if not exists growth_logs (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies(id) on delete cascade,
  weight_lb numeric,
  length_in numeric,
  head_circumference_in numeric,
  notes text,
  measured_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- ============ Row Level Security ============
alter table babies enable row level security;
alter table sleep_logs enable row level security;
alter table feed_logs enable row level security;
alter table solid_logs enable row level security;
alter table diaper_logs enable row level security;
alter table growth_logs enable row level security;
alter table foods enable row level security;

-- Any authenticated user can see and modify all data — there is no
-- per-account ownership. drop+create makes this block safe to re-run
-- on a project that already has the old per-user policies.
drop policy if exists "babies_owner" on babies;
drop policy if exists "babies_shared" on babies;
create policy "babies_shared" on babies
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "sleep_logs_owner" on sleep_logs;
drop policy if exists "sleep_logs_shared" on sleep_logs;
create policy "sleep_logs_shared" on sleep_logs
  for all using (auth.uid() is not null and baby_id in (select id from babies))
  with check (auth.uid() is not null and baby_id in (select id from babies));

drop policy if exists "feed_logs_owner" on feed_logs;
drop policy if exists "feed_logs_shared" on feed_logs;
create policy "feed_logs_shared" on feed_logs
  for all using (auth.uid() is not null and baby_id in (select id from babies))
  with check (auth.uid() is not null and baby_id in (select id from babies));

drop policy if exists "solid_logs_owner" on solid_logs;
drop policy if exists "solid_logs_shared" on solid_logs;
create policy "solid_logs_shared" on solid_logs
  for all using (auth.uid() is not null and baby_id in (select id from babies))
  with check (auth.uid() is not null and baby_id in (select id from babies));

drop policy if exists "diaper_logs_owner" on diaper_logs;
drop policy if exists "diaper_logs_shared" on diaper_logs;
create policy "diaper_logs_shared" on diaper_logs
  for all using (auth.uid() is not null and baby_id in (select id from babies))
  with check (auth.uid() is not null and baby_id in (select id from babies));

drop policy if exists "growth_logs_owner" on growth_logs;
drop policy if exists "growth_logs_shared" on growth_logs;
create policy "growth_logs_shared" on growth_logs
  for all using (auth.uid() is not null and baby_id in (select id from babies))
  with check (auth.uid() is not null and baby_id in (select id from babies));

drop policy if exists "foods_owner" on foods;
drop policy if exists "foods_shared" on foods;
create policy "foods_shared" on foods
  for all using (auth.uid() is not null and baby_id in (select id from babies))
  with check (auth.uid() is not null and baby_id in (select id from babies));

-- ============ Helpful indexes ============
create index if not exists idx_sleep_logs_baby_time on sleep_logs (baby_id, start_time desc);
create index if not exists idx_feed_logs_baby_time on feed_logs (baby_id, occurred_at desc);
create index if not exists idx_solid_logs_baby_date on solid_logs (baby_id, date_introduced desc);
create index if not exists idx_diaper_logs_baby_time on diaper_logs (baby_id, occurred_at desc);
create index if not exists idx_growth_logs_baby_date on growth_logs (baby_id, measured_at desc);
create index if not exists idx_foods_baby on foods (baby_id, created_at desc);

-- ============ One-time cleanup if you already had data ============
-- If you'd already logged in before this change, you may have one
-- "Buttu" baby row per account. This renames all of them to Aryan so
-- whichever one the app picks up (the oldest) has the right name/dob.
-- Safe to re-run — it only touches rows still named the placeholder.
update babies set name = 'Aryan', dob = '2026-01-10' where name = 'Buttu';

-- If that left you with more than one baby row (one per account you'd
-- tested with), the app only ever shows the oldest one going forward,
-- so the rest are just harmless leftovers. To see if you have extras
-- and delete them (this also deletes their logs via cascade):
--   select * from babies order by created_at;
--   delete from babies where id = '<id-of-the-one-you-do-not-want>';
