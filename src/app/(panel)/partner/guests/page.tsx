import { getSessionUser } from "@/lib/auth"
import { supabaseServer } from "@/lib/supabase-server"
import UsersView, {
  type UserRow,
  type ProgramOption,
  type PropertyOption,
} from "../../admin/users/UsersView"

export const dynamic = "force-dynamic"

type PartnerGuestRow = {
  id: string
  name: string | null
  email: string | null
  whatsapp: string | null
  country: string | null
  cohort: number | null
  wbs_score: number | null
  source: string | null
  created_at: string
  scope_property_id: string
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

type DbProgram = { id: string; name: string; cohort: number | null; tier: string | null }
type DbProgramProperty = { program_id: string; property_id: string }
type DbProperty = { id: string; name: string; slug: string }

export default async function PartnerGuests({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; property?: string }>
}) {
  const filters = await searchParams
  const me = await getSessionUser()
  const partnerPropId = me?.partner_property_id ?? null
  const sb = await supabaseServer()

  const [guestsRes, bookingsRes, programsRes, ppRes, propsRes] = await Promise.all([
    sb
      .from("partner_guests")
      .select(
        "id, name, email, whatsapp, country, cohort, wbs_score, source, created_at, scope_property_id",
      ),
    sb
      .from("bookings")
      .select("id, user_id, program_id, pre_wbs, post_wbs, status, created_at")
      .order("created_at", { ascending: false }),
    sb.from("programs").select("id, name, cohort, tier").eq("active", true).order("name"),
    sb.from("program_properties").select("program_id, property_id"),
    sb.from("properties").select("id, name, slug").eq("active", true).order("name"),
  ])

  const guests = (guestsRes.data ?? []) as PartnerGuestRow[]
  const bookings = (bookingsRes.data ?? []) as DbBooking[]
  const programsById = new Map<string, DbProgram>(
    ((programsRes.data ?? []) as DbProgram[]).map((p) => [p.id, p]),
  )
  const propsById = new Map<string, DbProperty>(
    ((propsRes.data ?? []) as DbProperty[]).map((p) => [p.id, p]),
  )
  const programToProperties = new Map<string, string[]>()
  for (const link of (ppRes.data ?? []) as DbProgramProperty[]) {
    const arr = programToProperties.get(link.program_id) ?? []
    arr.push(link.property_id)
    programToProperties.set(link.program_id, arr)
  }

  type Agg = {
    latest_pre_wbs: number | null
    latest_post_wbs: number | null
    latest_status: string | null
    program_ids: Set<string>
    property_ids: Set<string>
  }
  const aggByUser = new Map<string, Agg>()
  for (const b of bookings) {
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

  // Dedup partner_guests rows by id (view emits row-per-property-scope)
  const uniqueGuests = new Map<string, PartnerGuestRow>()
  for (const g of guests) {
    if (!uniqueGuests.has(g.id)) uniqueGuests.set(g.id, g)
  }

  const allRows: UserRow[] = Array.from(uniqueGuests.values()).map((g) => {
    const agg = aggByUser.get(g.id)
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
      id: g.id,
      name: g.name,
      email: g.email,
      whatsapp: g.whatsapp,
      country: g.country,
      wbs_score: g.wbs_score,
      cohort: g.cohort,
      source: g.source,
      created_at: g.created_at,
      latest_pre_wbs: agg?.latest_pre_wbs ?? null,
      latest_post_wbs: agg?.latest_post_wbs ?? null,
      latest_status: agg?.latest_status ?? null,
      program_ids: Array.from(agg?.program_ids ?? []),
      property_ids: Array.from(agg?.property_ids ?? []),
      program_names: programNames,
      property_names: propertyNames,
    }
  })

  const rows = allRows.filter((r) => {
    if (filters.program && !r.program_ids.includes(filters.program)) return false
    if (filters.property && !r.property_ids.includes(filters.property)) return false
    return true
  })

  // Scope program + property options to the partner's property only.
  // Properties RLS allows partner to see all active properties (they're not PII),
  // but the filter UI must reflect only what the partner actually owns.
  const partnerProgramIds = new Set<string>()
  for (const link of (ppRes.data ?? []) as DbProgramProperty[]) {
    if (partnerPropId && link.property_id === partnerPropId) partnerProgramIds.add(link.program_id)
  }
  const programOptions: ProgramOption[] = ((programsRes.data ?? []) as DbProgram[])
    .filter((p) => partnerProgramIds.has(p.id))
    .map((p) => ({
      id: p.id,
      name: p.name,
      cohort: p.cohort,
      tier: p.tier,
    }))
  const propertyOptions: PropertyOption[] = ((propsRes.data ?? []) as DbProperty[])
    .filter((p) => p.id === partnerPropId)
    .map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
    }))

  return (
    <UsersView
      rows={rows}
      programOptions={programOptions}
      propertyOptions={propertyOptions}
      activeFilters={{ program: filters.program ?? null, property: filters.property ?? null }}
      errorMessage={guestsRes.error?.message ?? null}
      basePath="/partner/guests"
      role="partner"
      title={`${rows.length} ${rows.length === 1 ? "guest" : "guests"} on your property`}
    />
  )
}
