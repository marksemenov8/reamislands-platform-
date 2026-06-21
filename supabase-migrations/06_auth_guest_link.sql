-- ============================================================
-- DIT Tier 3 — link auth.users ⇄ public.users (guest)
-- Adds users.auth_user_id, extends handle_new_user to backfill it,
-- and exposes guests' own row via RLS once logged in.
-- ============================================================

alter table public.users
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create unique index if not exists uq_users_auth_user
  on public.users(auth_user_id) where auth_user_id is not null;

-- Extend handle_new_user: on new auth user, link any matching public.users.email
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

  -- Backfill the guest row to the newly-minted auth user
  update public.users set auth_user_id = new.id
   where email = new.email and auth_user_id is null;

  return new;
end;
$$;

-- Guest can read their own users row once linked.
drop policy if exists "users_self_read" on users;
create policy "users_self_read" on users
  for select to authenticated
  using (auth_user_id = auth.uid());

-- Guests can also see their own bookings (used by /me)
drop policy if exists "bookings_self_read" on bookings;
create policy "bookings_self_read" on bookings
  for select to authenticated
  using (
    user_id in (
      select id from public.users where auth_user_id = auth.uid()
    )
  );
