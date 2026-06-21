-- ============================================================
-- DIT — program schedule items (per-day, per-time-slot activities)
-- ============================================================

create table if not exists program_schedule_items (
  id          uuid primary key default gen_random_uuid(),
  program_id  uuid not null references programs(id) on delete cascade,
  day_no      int  not null,
  start_time  time,
  end_time    time,
  title       text not null,
  description text,
  kind        text,                    -- 'meal' | 'session' | 'protocol' | 'free'
  sort_order  int  default 100,
  created_at  timestamptz not null default now()
);

create index if not exists program_schedule_program_day_idx
  on program_schedule_items(program_id, day_no, sort_order);

alter table program_schedule_items enable row level security;
