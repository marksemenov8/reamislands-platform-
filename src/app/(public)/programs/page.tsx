import { supabaseAdmin } from "@/lib/supabase-server"
import ProgramsListView from "./ProgramsListView"
import { mapProgram, type DbProgramRow } from "../_lib/programMapping"

export const dynamic = "force-dynamic"

export default async function ProgramsListPage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string }>
}) {
  const sp = await searchParams

  const { data: rows } = await supabaseAdmin
    .from("programs")
    .select(
      "id, name, slug, summary, cohort, tier, duration_days, price_usd, outcomes, is_composite, hero_image_url, " +
        "program_properties(role, properties(id, name, island, country, contact_wa)), " +
        "program_variants(duration_days, duration_nights, price_basic_usd, price_vip_usd, active)",
    )
    .eq("active", true)
    .eq("status", "published")
    .order("sort_order")
    .order("cohort")
    .order("duration_days")

  const programs = ((rows ?? []) as unknown as DbProgramRow[]).map(mapProgram)
  return <ProgramsListView programs={programs} initialFilter={sp.track ?? "All"} />
}
