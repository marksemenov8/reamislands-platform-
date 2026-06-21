-- ============================================================
-- DIT Tier 1 — migration 2: RLS policies per role
-- Apply AFTER 01_profiles_and_roles.sql.
-- ============================================================

-- Helper: role lookup as a stable SQL function (avoids recursive RLS issues)
create or replace function current_user_role() returns user_role
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function current_user_property() returns uuid
language sql stable security definer
set search_path = public
as $$
  select partner_property_id from public.profiles where id = auth.uid()
$$;

-- ─── PROPERTIES ─────────────────────────────────────────────
drop policy if exists "public_read_properties" on properties;
drop policy if exists "properties_read"        on properties;
drop policy if exists "properties_admin_write" on properties;

-- Authenticated: admin sees all, others see only active
create policy "properties_read" on properties
  for select to authenticated using (
    current_user_role() = 'admin' or active = true
  );

create policy "properties_admin_write" on properties
  for all to authenticated
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- ─── PROGRAMS ───────────────────────────────────────────────
drop policy if exists "public_read_programs"     on programs;
drop policy if exists "programs_read"            on programs;
drop policy if exists "programs_admin_write"     on programs;

create policy "programs_read" on programs
  for select to authenticated using (
    current_user_role() = 'admin' or active = true
  );

create policy "programs_admin_write" on programs
  for all to authenticated
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- ─── PROGRAM_PROPERTIES (junction) ──────────────────────────
drop policy if exists "public_read_prog_props"   on program_properties;
drop policy if exists "prog_props_read"          on program_properties;
drop policy if exists "prog_props_admin_write"   on program_properties;

-- Anyone authenticated can read the linkage (needed for catalog rendering)
create policy "prog_props_read" on program_properties
  for select to authenticated using (true);

create policy "prog_props_admin_write" on program_properties
  for all to authenticated
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- ─── PROGRAM_SPECIALISTS (junction) ─────────────────────────
drop policy if exists "prog_specs_read"        on program_specialists;
drop policy if exists "prog_specs_admin_write" on program_specialists;

create policy "prog_specs_read" on program_specialists
  for select to authenticated using (
    current_user_role() in ('admin','partner')
  );

create policy "prog_specs_admin_write" on program_specialists
  for all to authenticated
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- ─── SPECIALISTS ────────────────────────────────────────────
drop policy if exists "specialists_read"          on specialists;
drop policy if exists "specialists_admin_write"   on specialists;

-- Admin sees all; partner sees specialists of their property
create policy "specialists_read" on specialists
  for select to authenticated using (
    current_user_role() = 'admin'
    or (current_user_role() = 'partner' and property_id = current_user_property())
  );

create policy "specialists_admin_write" on specialists
  for all to authenticated
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- ─── USERS (guests) ─ contains PII ──────────────────────────
drop policy if exists "users_read"          on users;
drop policy if exists "users_admin_write"   on users;

-- Admin only. Partners NEVER read this table directly — they consume partner views.
-- Future: if guests log in and view their own record, add `or id = auth.uid()` when guest auth lands.
create policy "users_read" on users
  for select to authenticated using (current_user_role() = 'admin');

create policy "users_admin_write" on users
  for all to authenticated
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- ─── BOOKINGS ───────────────────────────────────────────────
drop policy if exists "bookings_read"          on bookings;
drop policy if exists "bookings_admin_write"   on bookings;

create policy "bookings_read" on bookings
  for select to authenticated using (current_user_role() = 'admin');

create policy "bookings_admin_write" on bookings
  for all to authenticated
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- ─── SPECIALIST_OUTCOMES (no PII, but partner reads via view) ─
drop policy if exists "spec_outcomes_read"        on specialist_outcomes;
drop policy if exists "spec_outcomes_admin_write" on specialist_outcomes;

create policy "spec_outcomes_read" on specialist_outcomes
  for select to authenticated using (
    current_user_role() = 'admin'
    or (
      current_user_role() = 'partner'
      and specialist_id in (
        select id from specialists where property_id = current_user_property()
      )
    )
  );

create policy "spec_outcomes_admin_write" on specialist_outcomes
  for all to authenticated
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');
