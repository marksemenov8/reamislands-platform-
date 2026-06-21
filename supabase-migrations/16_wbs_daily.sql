-- ============================================================
-- DIT — per-day WBS tracking for guests during their stay (up to 30 days).
--   users.wbs_started_at — anchor date for day 1 (auto-set on first save)
--   user_wbs_daily — score per day (1..30), one row per guest+day
-- RLS: admin sees all; partner sees rows for guests booked into their property
-- (matches the [[feedback-partner-rls-scope]] pattern from migration 14).
-- ============================================================

alter table users add column if not exists wbs_started_at date;

create table if not exists user_wbs_daily (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  day_no      int  not null check (day_no >= 1 and day_no <= 30),
  score       int  not null check (score >= 0 and score <= 100),
  updated_at  timestamptz not null default now(),
  unique (user_id, day_no)
);

create index if not exists user_wbs_daily_user_idx on user_wbs_daily(user_id, day_no);

alter table user_wbs_daily enable row level security;

drop policy if exists "wbs_daily_read"  on user_wbs_daily;
drop policy if exists "wbs_daily_write" on user_wbs_daily;

create policy "wbs_daily_read" on user_wbs_daily
  for select to authenticated using (
    current_user_role() = 'admin'
    or (
      current_user_role() = 'partner'
      and user_id in (
        select distinct b.user_id
        from bookings b
        join program_properties pp on pp.program_id = b.program_id
        where pp.property_id = current_user_property()
      )
    )
    or (
      current_user_role() = 'user'
      and user_id in (select id from public.users where auth_user_id = auth.uid())
    )
  );

create policy "wbs_daily_write" on user_wbs_daily
  for all to authenticated
  using (
    current_user_role() = 'admin'
    or (
      current_user_role() = 'partner'
      and user_id in (
        select distinct b.user_id
        from bookings b
        join program_properties pp on pp.program_id = b.program_id
        where pp.property_id = current_user_property()
      )
    )
  )
  with check (
    current_user_role() = 'admin'
    or (
      current_user_role() = 'partner'
      and user_id in (
        select distinct b.user_id
        from bookings b
        join program_properties pp on pp.program_id = b.program_id
        where pp.property_id = current_user_property()
      )
    )
  );
