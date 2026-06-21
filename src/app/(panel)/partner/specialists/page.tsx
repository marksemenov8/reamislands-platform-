import { supabaseServer } from "@/lib/supabase-server"
import SpecialistsView, {
  type SpecialistRow,
  type SpecialistRecord,
} from "./SpecialistsView"

export const dynamic = "force-dynamic"

export default async function PartnerSpecialists() {
  const sb = await supabaseServer()
  const [contribRes, listRes] = await Promise.all([
    sb
      .from("partner_specialist_contribution")
      .select(
        "specialist_id, specialist_name, specialist_role, outcome_metric, delta_avg, sample_count, last_recorded_at",
      )
      .order("specialist_name", { ascending: true })
      .order("outcome_metric", { ascending: true }),
    sb
      .from("specialists")
      .select("id, name, role, cohort_focus, active, property_id, created_at")
      .order("name"),
  ])

  return (
    <SpecialistsView
      rows={(contribRes.data ?? []) as SpecialistRow[]}
      specialists={(listRes.data ?? []) as SpecialistRecord[]}
    />
  )
}
