-- ============================================================
-- DIT Tier 2.2 — fix partner_program_outcomes scoping
-- Problem: with security_invoker=on, partner role hits bookings RLS
-- and gets zero metrics for everything. Solution: run view as
-- definer (security_invoker=off) and embed property scope in the
-- view itself so admin sees all and partner sees only their own.
-- partner_specialist_contribution stays as-is (RLS on specialists
-- already scopes it correctly).
-- ============================================================

drop view if exists partner_program_outcomes;

create view partner_program_outcomes
with (security_invoker = off) as
select
  p.id                                                                    as program_id,
  p.name                                                                  as program_name,
  p.cohort,
  p.tier,
  p.is_composite,
  pp.property_id,
  count(distinct b.id) filter (where b.status = 'completed')              as completed_bookings,
  avg(b.post_wbs - b.pre_wbs)
    filter (where b.pre_wbs is not null and b.post_wbs is not null)       as avg_wbs_delta,
  count(*) filter (where b.pre_wbs is not null and b.post_wbs is not null) as wbs_sample_count
from programs p
join program_properties pp on pp.program_id = p.id
left join bookings b on b.program_id = p.id
where
  current_user_role() = 'admin'
  or (current_user_role() = 'partner' and pp.property_id = current_user_property())
group by p.id, p.name, p.cohort, p.tier, p.is_composite, pp.property_id;

grant select on partner_program_outcomes to authenticated;
