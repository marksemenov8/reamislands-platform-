import { supabaseAdmin } from "@/lib/supabase-server"
import ProgramsView, { type ProgramRow, type PropertyOption } from "./ProgramsView"

export const dynamic = "force-dynamic"

type DbProgram = {
  id: string
  name: string
  slug: string | null
  status: "draft" | "published" | "archived"
  cohort: number
  tier: string | null
  duration_days: number
  price_usd: number
  outcomes: string[] | null
  max_guests: number | null
  is_composite: boolean
  active: boolean
  summary: string | null
}

type DbProgramProperty = {
  program_id: string
  property_id: string
  role: string | null
}

type DbProperty = { id: string; name: string; slug: string; active: boolean }

export default async function Programs() {
  const [programsRes, ppRes, propsRes] = await Promise.all([
    supabaseAdmin
      .from("programs")
      .select(
        "id, name, slug, status, cohort, tier, duration_days, price_usd, outcomes, max_guests, is_composite, active, summary",
      )
      .order("sort_order")
      .order("cohort")
      .order("duration_days"),
    supabaseAdmin.from("program_properties").select("program_id, property_id, role"),
    supabaseAdmin
      .from("properties")
      .select("id, name, slug, active")
      .order("name"),
  ])

  const propsById = new Map<string, DbProperty>(
    ((propsRes.data ?? []) as DbProperty[]).map((p) => [p.id, p]),
  )
  const linkedByProgram = new Map<string, Array<{ id: string; name: string }>>()
  for (const link of (ppRes.data ?? []) as DbProgramProperty[]) {
    const prop = propsById.get(link.property_id)
    if (!prop) continue
    const arr = linkedByProgram.get(link.program_id) ?? []
    arr.push({ id: prop.id, name: prop.name })
    linkedByProgram.set(link.program_id, arr)
  }

  const rows: ProgramRow[] = ((programsRes.data ?? []) as DbProgram[]).map((p) => ({
    ...p,
    properties: linkedByProgram.get(p.id) ?? [],
  }))

  const propertyOptions: PropertyOption[] = ((propsRes.data ?? []) as DbProperty[])
    .filter((p) => p.active)
    .map((p) => ({ id: p.id, name: p.name, slug: p.slug }))

  return (
    <ProgramsView
      rows={rows}
      propertyOptions={propertyOptions}
      errorMessage={programsRes.error?.message ?? null}
    />
  )
}
