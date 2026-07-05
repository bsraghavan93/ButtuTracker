-- Migration: share Aryan's data across all signed-in users.
-- Run this once in the Supabase SQL editor against the existing project
-- (schema.sql alone won't update policies already applied to a live DB).

-- Replace the per-owner RLS policies with shared ones: any authenticated
-- user can read/write, instead of only the row's original creator.
drop policy if exists "babies_owner" on babies;
drop policy if exists "sleep_logs_owner" on sleep_logs;
drop policy if exists "feed_logs_owner" on feed_logs;
drop policy if exists "solid_logs_owner" on solid_logs;
drop policy if exists "diaper_logs_owner" on diaper_logs;
drop policy if exists "growth_logs_owner" on growth_logs;

drop policy if exists "babies_shared" on babies;
create policy "babies_shared" on babies
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "sleep_logs_shared" on sleep_logs;
create policy "sleep_logs_shared" on sleep_logs
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "feed_logs_shared" on feed_logs;
create policy "feed_logs_shared" on feed_logs
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "solid_logs_shared" on solid_logs;
create policy "solid_logs_shared" on solid_logs
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "diaper_logs_shared" on diaper_logs;
create policy "diaper_logs_shared" on diaper_logs
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "growth_logs_shared" on growth_logs;
create policy "growth_logs_shared" on growth_logs
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- Make sure the baby's profile reflects the real name/DOB.
update babies set name = 'Aryan', dob = '2026-01-10';

-- Sanity check: the app expects exactly one shared baby row. If this
-- returns more than one, each signed-up user previously auto-created their
-- own row; consolidate/delete duplicates and repoint any logs' baby_id
-- at the row you want to keep before relying on this migration.
select count(*) as baby_row_count from babies;
