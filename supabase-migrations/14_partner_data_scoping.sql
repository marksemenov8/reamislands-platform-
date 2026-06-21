-- ============================================================
-- DIT — partner data scoping
-- Closes data-isolation gaps surfaced by 2026-05-24 audit:
--   1. program_properties was readable in full — partner could enumerate
--      foreign property-program links. Scope to their property.
--   2. program_specialists same problem — scope via programs at their property.
--   3. bookings was admin-only — partner couldn't see their own guests'
--      bookings, breaking /partner/guests aggregation. Add partner scope
--      via program_properties; also add guest self-read.
--   4. accommodation_rates was visible to all authenticated — partner could
--      see competitor rates. Scope partner to their own property.
-- ============================================================

-- 1. program_properties: partner sees only their property's links
drop policy if exists "prog_props_read" on program_properties;
create policy "prog_props_read" on program_properties
  for select to authenticated using (
    current_user_role() = 'admin'
    or (current_user_role() = 'partner' and property_id = current_user_property())
    or current_user_role() = 'user'
  );

-- 2. program_specialists: partner sees only specialists at their property's programs
drop policy if exists "prog_specs_read" on program_specialists;
create policy "prog_specs_read" on program_specialists
  for select to authenticated using (
    current_user_role() = 'admin'
    or (
      current_user_role() = 'partner'
      and program_id in (
        select program_id from program_properties where property_id = current_user_property()
      )
    )
  );

-- 3. bookings: partner sees bookings whose program runs at their property;
--    guest (user) sees own bookings.
drop policy if exists "bookings_read" on bookings;
create policy "bookings_read" on bookings
  for select to authenticated using (
    current_user_role() = 'admin'
    or (
      current_user_role() = 'partner'
      and program_id in (
        select program_id from program_properties where property_id = current_user_property()
      )
    )
    or (
      current_user_role() = 'user'
      and user_id in (select id from public.users where auth_user_id = auth.uid())
    )
  );

-- 4. accommodation_rates: partner scoped to their own property
drop policy if exists "accommodation_rates_read" on accommodation_rates;
create policy "accommodation_rates_read" on accommodation_rates
  for select to authenticated using (
    current_user_role() = 'admin'
    or (current_user_role() = 'partner' and property_id = current_user_property())
    or (current_user_role() = 'user' and active = true)
  );
