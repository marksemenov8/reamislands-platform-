import { supabaseAdmin } from "@/lib/supabase-server"
import UsersView, {
  type UserRow,
  type ProgramOption,
  type PropertyOption,
} from "./UsersView"

export const dynamic = "force-dynamic"

type DbUser = {
  id: string
  name: string | null
  email: string | null
  whatsapp: string | null
  country: string | null
  wbs_score: number | null
  cohort: number | null
  source: string | null
  created_at: string
}

type DbBooking = {
  id: string
  user_id: string | null
  program_id: string | null
  pre_wbs: number | null
  post_wbs: number | null
  status: string | null
  created_at: string
}

type DbProgram = {
  id: string
  name: string
  cohort: number | null
  tier: string | null
}

type DbProgramProperty = {
  program_id: string
  property_id: string
  role: string | null
}

type DbProperty = {
  id: string
  name: string
  slug: string
  active: boolean
}

export default async function Users({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; property?: string }>
}) {
  const filters = await searchParams

  const [usersRes, bookingsRes, programsRes, ppRes, propsRes] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select(
        "id, name, email, whatsapp, country, wbs_score, cohort, source, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200),
    supabaseAdmin
      .from("bookings")
      .select("id, user_id, program_id, pre_wbs, post_wbs, status, created_at")
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("programs").select("id, name, cohort, tier").order("name"),
    supabaseAdmin.from("program_properties").select("program_id, property_id, role"),
    supabaseAdmin
      .from("properties")
      .select("id, name, slug, active")
      .order("name"),
  ])

  const programsById = new Map<string, DbProgram>(
    ((programsRes.data ?? []) as DbProgram[]).map((p) => [p.id, p]),
  )
  const propsById = new Map<string, DbProperty>(
    ((propsRes.data ?? []) as DbProperty[]).map((p) => [p.id, p]),
  )

  // program_id → [property_id]
  const programToProperties = new Map<string, string[]>()
  for (const link of (ppRes.data ?? []) as DbProgramProperty[]) {
    const arr = programToProperties.get(link.program_id) ?? []
    arr.push(link.property_id)
    programToProperties.set(link.program_id, arr)
  }

  // Aggregate per user: latest booking, all programs touched, all properties touched
  type Agg = {
    latest_pre_wbs: number | null
    latest_post_wbs: number | null
    latest_status: string | null
    program_ids: Set<string>
    property_ids: Set<string>
  }
  const aggByUser = new Map<string, Agg>()
  for (const b of (bookingsRes.data ?? []) as DbBooking[]) {
    if (!b.user_id) continue
    let agg = aggByUser.get(b.user_id)
    if (!agg) {
      agg = {
        latest_pre_wbs: b.pre_wbs,
        latest_post_wbs: b.post_wbs,
        latest_status: b.status,
        program_ids: new Set(),
        property_ids: new Set(),
      }
      aggByUser.set(b.user_id, agg)
    }
    if (b.program_id) {
      agg.program_ids.add(b.program_id)
      for (const pid of programToProperties.get(b.program_id) ?? []) {
        agg.property_ids.add(pid)
      }
    }
  }

  const allUsers = ((usersRes.data ?? []) as DbUser[]).map((u) => {
    const agg = aggByUser.get(u.id)
    const programNames: string[] = []
    const propertyNames: string[] = []
    if (agg) {
      for (const pid of agg.program_ids) {
        const p = programsById.get(pid)
        if (p) programNames.push(p.name)
      }
      for (const pid of agg.property_ids) {
        const p = propsById.get(pid)
        if (p) propertyNames.push(p.name)
      }
    }
    return {
      ...u,
      latest_pre_wbs: agg?.latest_pre_wbs ?? null,
      latest_post_wbs: agg?.latest_post_wbs ?? null,
      latest_status: agg?.latest_status ?? null,
      program_ids: Array.from(agg?.program_ids ?? []),
      property_ids: Array.from(agg?.property_ids ?? []),
      program_names: programNames,
      property_names: propertyNames,
    } satisfies UserRow
  })

  const rows = allUsers.filter((r) => {
    if (filters.program && !r.program_ids.includes(filters.program)) return false
    if (filters.property && !r.property_ids.includes(filters.property)) return false
    return true
  })

  const programOptions: ProgramOption[] = ((programsRes.data ?? []) as DbProgram[]).map((p) => ({
    id: p.id,
    name: p.name,
    cohort: p.cohort,
    tier: p.tier,
  }))
  const propertyOptions: PropertyOption[] = ((propsRes.data ?? []) as DbProperty[])
    .filter((p) => p.active)
    .map((p) => ({ id: p.id, name: p.name, slug: p.slug }))

  return (
    <UsersView
      rows={rows}
      programOptions={programOptions}
      propertyOptions={propertyOptions}
      activeFilters={{ program: filters.program ?? null, property: filters.property ?? null }}
      errorMessage={usersRes.error?.message ?? null}
    />
  )
}
