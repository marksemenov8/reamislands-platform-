import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"
import { isValidSlug, slugify } from "@/lib/slug"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
}

const PROGRAM_STATUSES = ["draft", "published", "archived"] as const
type ProgramStatus = (typeof PROGRAM_STATUSES)[number]

type CreateProgramPayload = {
  name?: string
  slug?: string
  status?: ProgramStatus
  cohort?: number
  tier?: string
  duration_days?: number
  price_usd?: number
  outcomes?: string[]
  max_guests?: number
  is_composite?: boolean
  active?: boolean
  summary?: string
  goal?: string
  target_guest?: string
  how_we_achieve?: string
  guest_feels?: string
  included_services?: string
  contraindications?: string
  hero_image_url?: string
  sort_order?: number
  property_ids?: string[]
}

function badJson(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status, headers: cors })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: cors })
}

const PUBLIC_SELECT =
  "id, name, slug, status, cohort, tier, duration_days, price_usd, summary, goal, target_guest, " +
  "how_we_achieve, guest_feels, included_services, contraindications, hero_image_url, outcomes, " +
  "is_composite, active, sort_order, published_at, " +
  "program_properties(role, properties(id, name, island, country, contact_wa)), " +
  "program_variants(id, label, duration_days, duration_nights, price_basic_usd, price_vip_usd, active, sort_order), " +
  "program_schedule_items(id, day_no, start_time, end_time, title, description, kind, sort_order), " +
  "program_services(is_included, sort_order, services(id, name, slug, category, price_usd, dit_commission_pct))"

export async function GET(req: Request) {
  const me = await getSessionUser()
  const url = new URL(req.url)
  const cohort = url.searchParams.get("cohort")
  const tier = url.searchParams.get("tier")
  const isComposite = url.searchParams.get("is_composite")
  const slug = url.searchParams.get("slug")
  const status = url.searchParams.get("status")

  let q = supabaseAdmin
    .from("programs")
    .select(PUBLIC_SELECT)
    .order("sort_order")
    .order("cohort")
    .order("duration_days")

  if (slug) q = q.eq("slug", slug)
  if (cohort) q = q.eq("cohort", Number(cohort))
  if (tier) q = q.eq("tier", tier)
  if (isComposite === "true") q = q.eq("is_composite", true)
  else if (isComposite === "false") q = q.eq("is_composite", false)

  if (me?.role === "admin") {
    if (status && PROGRAM_STATUSES.includes(status as ProgramStatus)) q = q.eq("status", status)
  } else {
    q = q.eq("status", "published").eq("active", true)
  }

  // Partner scope: restrict to programs linked to the partner's property.
  if (me?.role === "partner" && me.partner_property_id) {
    const { data: links } = await supabaseAdmin
      .from("program_properties")
      .select("program_id")
      .eq("property_id", me.partner_property_id)
    const ids = (links ?? []).map((l) => l.program_id as string)
    if (ids.length === 0) {
      return NextResponse.json({ success: true, programs: [] }, { headers: cors })
    }
    q = q.in("id", ids)
  }

  const { data, error } = await q
  if (error) return badJson(error.message)
  return NextResponse.json({ success: true, programs: data ?? [] }, { headers: cors })
}

export async function POST(req: Request) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return badJson("forbidden", 403)

  let body: CreateProgramPayload
  try {
    body = (await req.json()) as CreateProgramPayload
  } catch {
    return badJson("invalid JSON body")
  }
  const name = (body.name ?? "").trim()
  if (!name) return badJson("name required")
  if (!body.cohort || body.cohort < 1 || body.cohort > 4) return badJson("cohort 1-4 required")
  if (!body.duration_days || body.duration_days < 1) return badJson("duration_days required")
  if (body.price_usd == null || body.price_usd < 0) return badJson("price_usd required")
  const tier = (body.tier ?? "").trim() || null
  if (tier && !["RESET", "REBUILD", "TRANSFORM"].includes(tier)) {
    return badJson("tier must be RESET, REBUILD or TRANSFORM")
  }

  let slug = (body.slug ?? "").trim()
  if (!slug) slug = slugify(name)
  if (!isValidSlug(slug)) return badJson("slug must match ^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$")

  const status: ProgramStatus =
    body.status && PROGRAM_STATUSES.includes(body.status) ? body.status : "draft"

  const insert: Record<string, unknown> = {
    name,
    slug,
    status,
    cohort: body.cohort,
    tier,
    duration_days: body.duration_days,
    price_usd: body.price_usd,
    outcomes: Array.isArray(body.outcomes) ? body.outcomes.map((s) => s.trim()).filter(Boolean) : [],
    max_guests: body.max_guests ?? 10,
    is_composite: !!body.is_composite,
    active: body.active ?? true,
    summary: body.summary ?? null,
    goal: body.goal ?? null,
    target_guest: body.target_guest ?? null,
    how_we_achieve: body.how_we_achieve ?? null,
    guest_feels: body.guest_feels ?? null,
    included_services: body.included_services ?? null,
    contraindications: body.contraindications ?? null,
    hero_image_url: body.hero_image_url ?? null,
    sort_order: body.sort_order ?? 100,
    published_at: status === "published" ? new Date().toISOString() : null,
  }

  const { data: program, error } = await supabaseAdmin
    .from("programs")
    .insert(insert)
    .select("id, name, slug, status")
    .single()
  if (error || !program) return badJson(error?.message ?? "insert failed")

  const propertyIds = Array.isArray(body.property_ids)
    ? body.property_ids.filter((s): s is string => typeof s === "string" && s.length > 0)
    : []
  if (propertyIds.length > 0) {
    const links = propertyIds.map((pid) => ({
      program_id: program.id,
      property_id: pid,
      role: "primary",
    }))
    const { error: linkErr } = await supabaseAdmin.from("program_properties").insert(links)
    if (linkErr) return badJson(`program created but property linking failed: ${linkErr.message}`)
  }

  return NextResponse.json({ success: true, program }, { headers: cors })
}
