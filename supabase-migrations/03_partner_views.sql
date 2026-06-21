-- ============================================================
-- DIT Tier 1 — migration 3: partner-safe SQL views (structural privacy)
-- Apply AFTER 02_rls_policies.sql.
-- security_invoker=on so the base-table RLS still applies through the view.
-- ============================================================

-- Outcomes per program×property: aggregate WBS deltas, completed booking counts.
-- NO user_id, NO booking_id, NO PII columns leak out.
create or replace view partner_program_outcomes
with (security_invoker = on) as
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
group by p.id, p.name, p.cohort, p.tier, p.is_composite, pp.property_id;

-- Specialist contribution: aggregate delta_avg per specialist×outcome.
-- The base specialist_outcomes table has no user_id by design — anonymization is structural.
create or replace view partner_specialist_contribution
with (security_invoker = on) as
select
  s.id           as specialist_id,
  s.name         as specialist_name,
  s.role         as specialist_role,
  s.property_id,
  so.outcome_metric,
  avg(so.delta_avg) as delta_avg,
  sum(so.sample_count) as sample_count,
  max(so.recorded_at)  as last_recorded_at
from specialists s
left join specialist_outcomes so on so.specialist_id = s.id
where s.active = true
group by s.id, s.name, s.role, s.property_id, so.outcome_metric;

-- Grant select to authenticated (RLS on base tables still gates rows).
grant select on partner_program_outcomes      to authenticated;
grant select on partner_specialist_contribution to authenticated;
