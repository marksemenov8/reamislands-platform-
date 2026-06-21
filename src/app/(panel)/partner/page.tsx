import { getSessionUser } from "@/lib/auth"
import { supabaseServer } from "@/lib/supabase-server"
import PartnerOverviewView, {
  type ProgramOutcomeRow,
} from "./PartnerOverviewView"

export const dynamic = "force-dynamic"

export default async function PartnerOverview() {
  const user = await getSessionUser()
  const sb = await supabaseServer()

  let propertyLabel: string | null = null
  if (user?.partner_property_id) {
    const { data } = await sb
      .from("properties")
      .select("name, island, country")
      .eq("id", user.partner_property_id)
      .single()
    if (data) propertyLabel = `${data.name} — ${data.island}, ${data.country}`
  }

  const { data: rows } = await sb
    .from("partner_program_outcomes")
    .select(
      "program_id, program_name, cohort, tier, is_composite, completed_bookings, avg_wbs_delta, wbs_sample_count",
    )
    .order("program_name", { ascending: true })

  return (
    <PartnerOverviewView
      propertyLabel={propertyLabel}
      rows={(rows ?? []) as ProgramOutcomeRow[]}
    />
  )
}
