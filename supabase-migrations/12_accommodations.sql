-- ============================================================
-- DIT — accommodation rates per property (rooms / villas)
-- ============================================================

create table if not exists accommodation_rates (
  id                   uuid primary key default gen_random_uuid(),
  property_id          uuid not null references properties(id) on delete cascade,
  room_type            text not null,         -- "Single Room", "Classic Villa"
  capacity             int  not null,
  has_pool             boolean default false,
  price_thb_per_night  int not null,
  description          text,
  active               boolean default true,
  sort_order           int default 100,
  created_at           timestamptz not null default now()
);

create index if not exists accommodation_rates_property_idx
  on accommodation_rates(property_id, sort_order);

alter table accommodation_rates enable row level security;
