-- ============================================================
-- DIT — RLS policies for content tables added in migrations 09-12
-- Pattern: authenticated → admin sees all + active=true rows visible.
-- Anon access for public landing happens via supabaseAdmin (service role,
-- bypasses RLS) — see src/app/page.tsx — so no anon policies needed.
-- ============================================================

-- ─── PROGRAM_VARIANTS ───────────────────────────────────────
drop policy if exists "program_variants_read"        on program_variants;
drop policy if exists "program_variants_admin_write" on program_variants;

create policy "program_variants_read" on program_variants
  for select to authenticated using (
    current_user_role() = 'admin'
    or program_id in (select id from programs where status = 'published' and active = true)
  );

create policy "program_variants_admin_write" on program_variants
  for all to authenticated
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- ─── PROGRAM_SCHEDULE_ITEMS ─────────────────────────────────
drop policy if exists "program_schedule_read"        on program_schedule_items;
drop policy if exists "program_schedule_admin_write" on program_schedule_items;

create policy "program_schedule_read" on program_schedule_items
  for select to authenticated using (
    current_user_role() = 'admin'
    or program_id in (select id from programs where status = 'published' and active = true)
  );

create policy "program_schedule_admin_write" on program_schedule_items
  for all to authenticated
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- ─── SERVICES ───────────────────────────────────────────────
drop policy if exists "services_read"        on services;
drop policy if exists "services_admin_write" on services;

create policy "services_read" on services
  for select to authenticated using (
    current_user_role() = 'admin' or active = true
  );

create policy "services_admin_write" on services
  for all to authenticated
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- ─── PROGRAM_SERVICES (junction) ────────────────────────────
drop policy if exists "program_services_read"        on program_services;
drop policy if exists "program_services_admin_write" on program_services;

create policy "program_services_read" on program_services
  for select to authenticated using (
    current_user_role() = 'admin'
    or program_id in (select id from programs where status = 'published' and active = true)
  );

create policy "program_services_admin_write" on program_services
  for all to authenticated
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- ─── ACCOMMODATION_RATES ────────────────────────────────────
drop policy if exists "accommodation_rates_read"        on accommodation_rates;
drop policy if exists "accommodation_rates_admin_write" on accommodation_rates;

create policy "accommodation_rates_read" on accommodation_rates
  for select to authenticated using (
    current_user_role() = 'admin' or active = true
  );

create policy "accommodation_rates_admin_write" on accommodation_rates
  for all to authenticated
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');
