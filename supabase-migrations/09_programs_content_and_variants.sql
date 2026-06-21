-- ============================================================
-- DIT — programs content fields + variants table
-- 1. ENUM program_status (draft|published|archived)
-- 2. ALTER programs: add slug, status, content fields, published_at, sort_order, hero_image_url
-- 3. NEW table program_variants (per-duration pricing, basic/VIP)
-- ============================================================

-- 1. ENUM ---------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'program_status') then
    create type program_status as enum ('draft', 'published', 'archived');
  end if;
end$$;

-- 2. ALTER programs -----------------------------------------
alter table programs
  add column if not exists slug                text,
  add column if not exists status              program_status not null default 'draft',
  add column if not exists summary             text,
  add column if not exists goal                text,
  add column if not exists target_guest        text,
  add column if not exists how_we_achieve      text,
  add column if not exists guest_feels         text,
  add column if not exists included_services   text,
  add column if not exists contraindications   text,
  add column if not exists hero_image_url      text,
  add column if not exists published_at        timestamptz,
  add column if not exists sort_order          int default 100;

-- Unique slug (nullable to allow legacy rows without slug)
do $$
begin
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and indexname = 'programs_slug_unique'
  ) then
    create unique index programs_slug_unique on programs(slug) where slug is not null;
  end if;
end$$;

create index if not exists programs_status_idx
  on programs(status) where status = 'published';

-- 3. NEW program_variants -----------------------------------
create table if not exists program_variants (
  id              uuid primary key default gen_random_uuid(),
  program_id      uuid not null references programs(id) on delete cascade,
  label           text not null,
  duration_days   int  not null,
  duration_nights int  not null,
  price_basic_usd numeric(10,2) not null,
  price_vip_usd   numeric(10,2),
  active          boolean default true,
  sort_order      int default 100,
  created_at      timestamptz not null default now()
);

create index if not exists program_variants_program_idx
  on program_variants(program_id, sort_order);

alter table program_variants enable row level security;
