-- ============================================================
-- DIT Tier 2.5 — team management
-- 1. password_set_by_admin flag on profiles (badge in UI, future: force-rotate)
-- 2. partner_password_resets audit table (admin RLS only, no plaintext stored)
-- ============================================================

alter table profiles
  add column if not exists password_set_by_admin boolean not null default false;

create table if not exists partner_password_resets (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  reset_by    uuid not null references auth.users(id),
  reset_at    timestamptz not null default now(),
  was_invite  boolean not null default false
);

create index if not exists idx_ppr_user_id on partner_password_resets(user_id);

alter table partner_password_resets enable row level security;

drop policy if exists "ppr_admin_read"  on partner_password_resets;
drop policy if exists "ppr_admin_write" on partner_password_resets;

create policy "ppr_admin_read" on partner_password_resets
  for select to authenticated using (current_user_role() = 'admin');

create policy "ppr_admin_write" on partner_password_resets
  for all to authenticated
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');
