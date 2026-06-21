import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"
import { isValidSlug } from "@/lib/slug"

const PROGRAM_STATUSES = ["draft", "published", "archived"] as const
type ProgramStatus = (typeof PROGRAM_STATUSES)[number]

type PatchPayload = {
  name?: string
  slug?: string
  status?: ProgramStatus
  cohort?: number
  tier?: string | null
  duration_days?: number
  price_usd?: number
  outcomes?: string[]
  max_guests?: number
  is_composite?: boolean
  active?: boolean
  summary?: string | null
  goal?: string | null
  target_guest?: string | null
  how_we_achieve?: string | null
  guest_feels?: string | null
  included_services?: string | null
  contraindications?: string | null
  hero_image_url?: string | null
  sort_order?: number
  property_ids?: string[]
}

const FULL_SELECT =
  "id, name, slug, status, cohort, tier, duration_days, price_usd, summary, goal, target_guest, " +
  "how_we_achieve, guest_feels, included_services, contraindications, hero_image_url, outcomes, " +
  "max_guests, is_composite, active, sort_order, published_at, " +
  "program_properties(property_id, role), " +
  "program_variants(id, label, duration_days, duration_nights, price_basic_usd, price_vip_usd, active, sort_order), " +
  "program_schedule_items(id, day_no, start_time, end_time, title, description, kind, sort_order), " +
  "program_services(is_included, sort_order, services(id, name, slug, category, price_usd, dit_commission_pct))"

function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return bad("forbidden", 403)
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from("programs")
    .select(FULL_SELECT)
    .eq("id", id)
    .maybeSingle()
  if (error || !data) return bad("program not found", 404)
  return NextResponse.json({ success: true, program: data })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return bad("forbidden", 403)
  const { id } = await params

  let body: PatchPayload
  try {
    body = (await req.json()) as PatchPayload
  } catch {
    return bad("invalid JSON body")
  }

  // Read current row to detect status transition for published_at
  const { data: current, error: readErr } = await supabaseAdmin
    .from("programs")
    .select("status, published_at")
    .eq("id", id)
    .maybeSingle()
  if (readErr || !current) return bad("program not found", 404)

  const update: Record<string, unknown> = {}
  if (body.name !== undefined) update.name = body.name.trim()
  if (body.slug !== undefined) {
    const s = body.slug.trim()
    if (!isValidSlug(s)) return bad("slug must match ^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$")
    update.slug = s
  }
  if (body.status !== undefined) {
    if (!PROGRAM_STATUSES.includes(body.status)) return bad("status must be draft|published|archived")
    update.status = body.status
    if (body.status === "published" && current.status !== "published") {
      update.published_at = new Date().toISOString()
    }
  }
  if (body.cohort !== undefined) {
    if (body.cohort < 1 || body.cohort > 4) return bad("cohort 1-4")
    update.cohort = body.cohort
  }
  if (body.tier !== undefined) {
    const t = body.tier?.trim() || null
    if (t && !["RESET", "REBUILD", "TRANSFORM"].includes(t)) {
      return bad("tier must be RESET, REBUILD or TRANSFORM")
    }
    update.tier = t
  }
  if (body.duration_days !== undefined) {
    if (body.duration_days < 1) return bad("duration_days >= 1")
    update.duration_days = body.duration_days
  }
  if (body.price_usd !== undefined) {
    if (body.price_usd < 0) return bad("price_usd >= 0")
    update.price_usd = body.price_usd
  }
  if (body.outcomes !== undefined) {
    update.outcomes = Array.isArray(body.outcomes)
      ? body.outcomes.map((s) => s.trim()).filter(Boolean)
      : []
  }
  if (body.max_guests !== undefined) update.max_guests = body.max_guests
  if (body.is_composite !== undefined) update.is_composite = !!body.is_composite
  if (body.active !== undefined) update.active = !!body.active

  for (const k of [
    "summary",
    "goal",
    "target_guest",
    "how_we_achieve",
    "guest_feels",
    "included_services",
    "contraindications",
    "hero_image_url",
  ] as const) {
    if (body[k] !== undefined) update[k] = body[k]
  }
  if (body.sort_order !== undefined) update.sort_order = body.sort_order

  if (Object.keys(update).length > 0) {
    const { error: updErr } = await supabaseAdmin.from("programs").update(update).eq("id", id)
    if (updErr) return bad(updErr.message)
  }

  if (body.property_ids !== undefined) {
    const propertyIds = Array.isArray(body.property_ids)
      ? body.property_ids.filter((s): s is string => typeof s === "string" && s.length > 0)
      : []
    const { error: delErr } = await supabaseAdmin
      .from("program_properties")
      .delete()
      .eq("program_id", id)
    if (delErr) return bad(`unlink failed: ${delErr.message}`)
    if (propertyIds.length > 0) {
      const { error: insErr } = await supabaseAdmin.from("program_properties").insert(
        propertyIds.map((pid) => ({ program_id: id, property_id: pid, role: "primary" })),
      )
      if (insErr) return bad(`link failed: ${insErr.message}`)
    }
  }

  const { data, error } = await supabaseAdmin
    .from("programs")
    .select(FULL_SELECT)
    .eq("id", id)
    .single()
  if (error || !data) return bad("post-update read failed")
  return NextResponse.json({ success: true, program: data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return bad("forbidden", 403)
  const { id } = await params
  const { error } = await supabaseAdmin
    .from("programs")
    .update({ active: false, status: "archived" })
    .eq("id", id)
  if (error) return bad(error.message)
  return NextResponse.json({ success: true })
}
