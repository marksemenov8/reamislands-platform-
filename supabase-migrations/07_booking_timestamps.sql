-- ============================================================
-- DIT Tier 3 — booking lifecycle timestamps
-- Each status transition stamps its column via BEFORE UPDATE trigger.
-- Allowed-graph guards live in /api/bookings/[id]/transition, not here.
-- ============================================================

alter table bookings
  add column if not exists confirmed_at timestamptz,
  add column if not exists started_at   timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists cancelled_at timestamptz;

create or replace function set_booking_timestamps() returns trigger
language plpgsql as $$
begin
  if NEW.status is distinct from OLD.status then
    if NEW.status = 'confirmed' then
      NEW.confirmed_at := coalesce(NEW.confirmed_at, now());
    elsif NEW.status = 'active' then
      NEW.started_at := coalesce(NEW.started_at, now());
    elsif NEW.status = 'completed' then
      NEW.completed_at := coalesce(NEW.completed_at, now());
    elsif NEW.status = 'cancelled' then
      NEW.cancelled_at := coalesce(NEW.cancelled_at, now());
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_booking_timestamps on bookings;
create trigger trg_booking_timestamps
  before update on bookings
  for each row execute function set_booking_timestamps();
