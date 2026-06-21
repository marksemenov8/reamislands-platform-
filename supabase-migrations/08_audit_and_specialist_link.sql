-- ============================================================
-- DIT Tier 3 — Block X foundation
-- 1. user_revisions — append-only audit for non-destructive edits
-- 2. booking_specialists junction (multi-spec per stay)
-- 3. broaden specialists.write to include partner-of-property
-- 4. partner_guests view (scope by user's property via bookings⋈program_properties)
-- 5. specialist_guests view (specialist card → guests they worked with)
-- ============================================================

-- 1. AUDIT --------------------------------------------------
create table if not exists user_revisions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  edited_by   uuid references auth.users(id),
  edited_at   timestamptz not null default now(),
  changed     jsonb not null,   -- {field: {from, to}}
  snapshot    jsonb not null    -- full row pre-change
);
create index if not exists idx_user_revisions_user_id on user_revisions(user_id);

alter table user_revisions enable row level security;

drop policy if exists "user_revisions_admin_read"   on user_revisions;
drop policy if exists "user_revisions_partner_read" on user_revisions;

create policy "user_revisions_admin_read" on user_revisions
  for select to authenticated using (current_user_role() = 'admin');

create policy "user_revisions_partner_read" on user_revisions
  for select to authenticated using (
    current_user_role() = 'partner'
    and user_id in (
      select distinct b.user_id
      from bookings b
      join program_properties pp on pp.program_id = b.program_id
      where pp.property_id = current_user_property()
    )
  );

-- 2. SPECIALIST ⇄ BOOKING JUNCTION --------------------------
create table if not exists booking_specialists (
  booking_id    uuid references bookings(id) on delete cascade,
  specialist_id uuid references specialists(id) on delete cascade,
  role          text,
  created_at    timestamptz default now(),
  primary key (booking_id, specialist_id)
);

alter table booking_specialists enable row level security;

drop policy if exists "bs_admin_all"     on booking_specialists;
drop policy if exists "bs_partner_write" on booking_specialists;
drop policy if exists "bs_partner_scope" on booking_specialists;

create policy "bs_admin_all" on booking_specialists
  for all to authenticated
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

create policy "bs_partner_write" on booking_specialists
  for all to authenticated
  using (
    current_user_role() = 'partner'
    and specialist_id in (select id from specialists where property_id = current_user_property())
  )
  with check (
    current_user_role() = 'partner'
    and specialist_id in (select id from specialists where property_id = current_user_property())
  );

-- 3. BROADEN specialists.write to partner ------------------
drop policy if exists "specialists_admin_write" on specialists;
drop policy if exists "specialists_write"        on specialists;

create policy "specialists_write" on specialists
  for all to authenticated
  using (
    current_user_role() = 'admin'
    or (current_user_role() = 'partner' and property_id = current_user_property())
  )
  with check (
    current_user_role() = 'admin'
    or (current_user_role() = 'partner' and property_id = current_user_property())
  );

-- 4. partner_guests view -----------------------------------
-- security_invoker=off so the JOIN through bookings (admin-only RLS) works.
-- Scope predicate is embedded inline; runs as definer.
drop view if exists partner_guests;
create view partner_guests
with (security_invoker = off) as
select distinct
  u.id,
  u.name,
  u.email,
  u.whatsapp,
  u.country,
  u.cohort,
  u.wbs_score,
  u.source,
  u.auth_user_id,
  u.created_at,
  pp.property_id as scope_property_id
from public.users u
join bookings b on b.user_id = u.id
join program_properties pp on pp.program_id = b.program_id
where current_user_role() = 'admin'
   or (current_user_role() = 'partner' and pp.property_id = current_user_property());

grant select on partner_guests to authenticated;

-- 5. specialist_guests view --------------------------------
drop view if exists specialist_guests;
create view specialist_guests
with (security_invoker = off) as
select
  bs.specialist_id,
  bs.role as specialist_role_on_booking,
  u.id   as user_id,
  u.name as guest_name,
  u.country,
  b.id   as booking_id,
  b.pre_wbs,
  b.post_wbs,
  b.status,
  b.arrival,
  b.departure,
  s.property_id
from booking_specialists bs
join bookings b on b.id = bs.booking_id
join public.users u on u.id = b.user_id
join specialists s on s.id = bs.specialist_id
where current_user_role() = 'admin'
   or (current_user_role() = 'partner' and s.property_id = current_user_property());

grant select on specialist_guests to authenticated;
