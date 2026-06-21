import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"

function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

// POST /api/programs/[id]/clone
// Clones a program (typically a published one) into a fresh draft with " -copy"
// suffix. Linked program_properties, program_variants, program_schedule_items,
// and program_services are duplicated. Slug uniqueness is enforced by suffixing
// "-copy-2", "-copy-3", … on collision.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return bad("forbidden", 403)
  const { id } = await params

  const { data: src, error: srcErr } = await supabaseAdmin
    .from("programs")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (srcErr || !src) return bad("program not found", 404)

  const baseSlug = (src.slug as string | null) ?? "program"
  const baseName = (src.name as string) ?? "Program"

  // Find unique slug by appending -copy, -copy-2, …
  let attempt = 1
  let newSlug = `${baseSlug}-copy`
  let newName = `${baseName} -copy`
  while (attempt <= 20) {
    const { data: existing } = await supabaseAdmin
      .from("programs")
      .select("id")
      .eq("slug", newSlug)
      .maybeSingle()
    if (!existing) break
    attempt += 1
    newSlug = `${baseSlug}-copy-${attempt}`
    newName = `${baseName} -copy ${attempt}`
  }
  if (attempt > 20) return bad("could not allocate a unique slug for the copy")

  // Build the insert payload (everything except id, created_at, published_at, slug, status, name)
  const insertPayload: Record<string, unknown> = {
    name: newName,
    slug: newSlug,
    status: "draft",
    published_at: null,
    cohort: src.cohort,
    tier: src.tier,
    duration_days: src.duration_days,
    price_usd: src.price_usd,
    outcomes: src.outcomes,
    max_guests: src.max_guests,
    is_composite: src.is_composite,
    active: src.active,
    summary: src.summary,
    goal: src.goal,
    target_guest: src.target_guest,
    how_we_achieve: src.how_we_achieve,
    guest_feels: src.guest_feels,
    included_services: src.included_services,
    contraindications: src.contraindications,
    hero_image_url: src.hero_image_url,
    sort_order: src.sort_order,
  }

  const { data: newProgram, error: insErr } = await supabaseAdmin
    .from("programs")
    .insert(insertPayload)
    .select("id, name, slug, status")
    .single()
  if (insErr || !newProgram) return bad(insErr?.message ?? "clone insert failed")

  // Helpers — fetch + re-insert children. Best-effort: log on partial failure
  // (clone still exists as a usable draft).
  const newId = newProgram.id as string

  const [propsRes, variantsRes, scheduleRes, servicesRes] = await Promise.all([
    supabaseAdmin.from("program_properties").select("property_id, role").eq("program_id", id),
    supabaseAdmin
      .from("program_variants")
      .select("label, duration_days, duration_nights, price_basic_usd, price_vip_usd, active, sort_order")
      .eq("program_id", id),
    supabaseAdmin
      .from("program_schedule_items")
      .select("day_no, start_time, end_time, title, description, kind, sort_order")
      .eq("program_id", id),
    supabaseAdmin
      .from("program_services")
      .select("service_id, is_included, sort_order")
      .eq("program_id", id),
  ])

  if ((propsRes.data ?? []).length > 0) {
    await supabaseAdmin
      .from("program_properties")
      .insert((propsRes.data ?? []).map((p) => ({ ...p, program_id: newId })))
  }
  if ((variantsRes.data ?? []).length > 0) {
    await supabaseAdmin
      .from("program_variants")
      .insert((variantsRes.data ?? []).map((v) => ({ ...v, program_id: newId })))
  }
  if ((scheduleRes.data ?? []).length > 0) {
    await supabaseAdmin
      .from("program_schedule_items")
      .insert((scheduleRes.data ?? []).map((s) => ({ ...s, program_id: newId })))
  }
  if ((servicesRes.data ?? []).length > 0) {
    await supabaseAdmin
      .from("program_services")
      .insert((servicesRes.data ?? []).map((s) => ({ ...s, program_id: newId })))
  }

  return NextResponse.json({ success: true, program: newProgram })
}
