-- ============================================================
-- DIT Tier 1 — migration 1: profiles + role enum + auto-trigger
-- Apply in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/xbzrtofanbrahasxbisf/sql/new
-- ============================================================

-- Role enum
do $$ begin
  create type user_role as enum ('admin','partner','user');
exception when duplicate_object then null; end $$;

-- profiles: 1:1 with auth.users, holds role + partner scope
create table if not exists profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  role                 user_role not null default 'user',
  full_name            text,
  partner_property_id  uuid references properties(id) on delete set null,
  created_at           timestamptz default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles_self_read" on profiles;
create policy "profiles_self_read" on profiles
  for select using (auth.uid() = id);

-- Auto-create profile on new auth user, with admin whitelist
create or replace function handle_new_user() returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (
    new.id,
    case
      when new.email in ('olegoonline@gmail.com','9679108@gmail.com') then 'admin'::user_role
      else 'user'::user_role
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Backfill: if admin users were already seeded before this migration, give them admin role
insert into public.profiles (id, role)
select id, 'admin'::user_role
from auth.users
where email in ('olegoonline@gmail.com','9679108@gmail.com')
on conflict (id) do update set role = 'admin';
