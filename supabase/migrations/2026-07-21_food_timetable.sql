-- Migration: Food Timetable feature.
-- Adds a recurring meal-plan schedule, an extensible food catalog (beyond
-- the hardcoded FOOD_BANK in src/lib/foods.ts), and web-push subscriptions
-- so the app can send a real push notification the evening before a food
-- that needs prep is scheduled.
--
-- Run this once in the Supabase SQL editor against the existing project
-- (schema.sql alone won't update a live database).

-- ============ food_catalog_items ============
-- User-added foods, layered on top of the static FOOD_BANK suggestion list
-- so the timetable's food picker can grow over time.
create table if not exists food_catalog_items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null check (category in ('grain', 'legume', 'vegetable', 'fruit', 'protein', 'dairy', 'other')) default 'other',
  created_at timestamptz not null default now()
);

-- ============ meal_plan_items ============
-- Each row is a scheduled (and optionally recurring) food timetable entry.
create table if not exists meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies(id) on delete cascade,
  food_name text not null,
  category text not null check (category in ('grain', 'legume', 'vegetable', 'fruit', 'protein', 'dairy', 'other')) default 'other',
  meal_slot text not null check (meal_slot in ('breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner')) default 'lunch',
  start_date date not null default current_date,
  end_date date,
  repeat_type text not null check (repeat_type in ('none', 'daily', 'every_other_day', 'weekly')) default 'none',
  repeat_days int[] not null default '{}',
  prep_previous_day boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ push_subscriptions ============
-- Web Push subscriptions for any signed-in device in the household. Every
-- stored subscription receives the daily prep-reminder push.
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- ============ Row Level Security ============
alter table food_catalog_items enable row level security;
alter table meal_plan_items enable row level security;
alter table push_subscriptions enable row level security;

drop policy if exists "food_catalog_items_shared" on food_catalog_items;
create policy "food_catalog_items_shared" on food_catalog_items
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "meal_plan_items_shared" on meal_plan_items;
create policy "meal_plan_items_shared" on meal_plan_items
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "push_subscriptions_shared" on push_subscriptions;
create policy "push_subscriptions_shared" on push_subscriptions
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ============ Helpful indexes ============
create index if not exists idx_meal_plan_items_baby_date on meal_plan_items (baby_id, start_date desc);
create index if not exists idx_food_catalog_items_name on food_catalog_items (name);
