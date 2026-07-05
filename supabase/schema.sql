-- Buttu Tracker database schema (Supabase / Postgres)
-- Run this in the Supabase SQL editor for a fresh project.

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

-- ============ potty_logs ============
create table if not exists potty_logs (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies(id) on delete cascade,
  type text not null check (type in ('pee', 'poop', 'both')),
  notes text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ============ medicine_logs ============
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

-- ============ Row Level Security ============
-- There is a single shared baby for the whole family, so every signed-in
-- user (not just the row's original creator) can read and write all data.
-- `babies.user_id` is kept only to record who first created the row.
alter table babies enable row level security;
alter table sleep_logs enable row level security;
alter table feed_logs enable row level security;
alter table solid_logs enable row level security;
alter table diaper_logs enable row level security;
alter table growth_logs enable row level security;
alter table potty_logs enable row level security;
alter table medicine_logs enable row level security;

create policy "babies_shared" on babies
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "sleep_logs_shared" on sleep_logs
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "feed_logs_shared" on feed_logs
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "solid_logs_shared" on solid_logs
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "diaper_logs_shared" on diaper_logs
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "growth_logs_shared" on growth_logs
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "potty_logs_shared" on potty_logs
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "medicine_logs_shared" on medicine_logs
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ============ Helpful indexes ============
create index if not exists idx_sleep_logs_baby_time on sleep_logs (baby_id, start_time desc);
create index if not exists idx_feed_logs_baby_time on feed_logs (baby_id, occurred_at desc);
create index if not exists idx_solid_logs_baby_date on solid_logs (baby_id, date_introduced desc);
create index if not exists idx_diaper_logs_baby_time on diaper_logs (baby_id, occurred_at desc);
create index if not exists idx_growth_logs_baby_date on growth_logs (baby_id, measured_at desc);
create index if not exists idx_potty_logs_baby_time on potty_logs (baby_id, occurred_at desc);
create index if not exists idx_medicine_logs_baby_time on medicine_logs (baby_id, occurred_at desc);
