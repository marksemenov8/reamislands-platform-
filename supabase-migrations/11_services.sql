-- ============================================================
-- DIT — à-la-carte services catalog + program_services junction
-- ============================================================

create table if not exists services (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  slug                text not null unique,
  category            text,            -- 'massage' | 'beauty' | 'iv' | 'mind' | 'medical' | 'other'
  description         text,
  duration_min        int,
  price_thb           int,
  price_usd           numeric(10,2),
  dit_commission_pct  int default 15,
  active              boolean default true,
  sort_order          int default 100,
  created_at          timestamptz not null default now()
);

create index if not exists services_category_idx on services(category) where active = true;

alter table services enable row level security;

create table if not exists program_services (
  program_id  uuid references programs(id) on delete cascade,
  service_id  uuid references services(id) on delete cascade,
  is_included boolean default false,   -- true = в цене программы, false = upsell
  sort_order  int default 100,
  primary key (program_id, service_id)
);

create index if not exists program_services_service_idx on program_services(service_id);

alter table program_services enable row level security;
