import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"

const ADMIN_EDITABLE = [
  "name",
  "email",
  "whatsapp",
  "country",
  "wbs_score",
  "cohort",
  "source",
] as const

const PARTNER_EDITABLE = ["name", "whatsapp", "country", "wbs_score"] as const

const SELF_EDITABLE = ["name", "whatsapp", "country"] as const

type Editable = typeof ADMIN_EDITABLE[number]

function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

async function partnerCanSeeGuest(
  partnerPropertyId: string,
  guestId: string,
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("bookings")
    .select("id, program_id, programs!inner(program_properties!inner(property_id))")
    .eq("user_id", guestId)
  if (!data || data.length === 0) return false
  for (const row of data as unknown as Array<{
    programs: { program_properties: Array<{ property_id: string }> } | null
  }>) {
    for (const pp of row.programs?.program_properties ?? []) {
      if (pp.property_id === partnerPropertyId) return true
    }
  }
  return false
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getSessionUser()
  if (!me) return bad("unauthorized", 401)
  const { id } = await params

  const isAdmin = me.role === "admin"
  const isPartner = me.role === "partner" && !!me.partner_property_id
  const isSelf = me.guest_user_id === id

  if (!isAdmin && !isPartner && !isSelf) return bad("forbidden", 403)
  if (isPartner && !isAdmin && !isSelf) {
    const ok = await partnerCanSeeGuest(me.partner_property_id!, id)
    if (!ok) return bad("forbidden", 403)
  }

  const [{ data: user, error }, revisionsRes] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select("id, name, email, whatsapp, country, wbs_score, cohort, source, raw_payload, created_at, auth_user_id")
      .eq("id", id)
      .maybeSingle(),
    isAdmin || isPartner
      ? supabaseAdmin
          .from("user_revisions")
          .select("id, edited_by, edited_at, changed")
          .eq("user_id", id)
          .order("edited_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] as Array<{ id: string; edited_by: string | null; edited_at: string; changed: Record<string, unknown> }> }),
  ])
  if (error || !user) return bad("user not found", 404)

  return NextResponse.json({
    success: true,
    user,
    revisions: revisionsRes.data ?? [],
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getSessionUser()
  if (!me) return bad("unauthorized", 401)
  const { id } = await params

  let body: Partial<Record<Editable, string | number | null>>
  try {
    body = (await req.json()) as Partial<Record<Editable, string | number | null>>
  } catch {
    return bad("invalid JSON body")
  }

  const isAdmin = me.role === "admin"
  const isPartner = me.role === "partner" && !!me.partner_property_id
  const isSelf = me.guest_user_id === id

  if (!isAdmin && !isPartner && !isSelf) return bad("forbidden", 403)
  if (isPartner && !isAdmin && !isSelf) {
    const ok = await partnerCanSeeGuest(me.partner_property_id!, id)
    if (!ok) return bad("forbidden", 403)
  }

  const allowed: readonly string[] = isAdmin
    ? ADMIN_EDITABLE
    : isPartner
      ? PARTNER_EDITABLE
      : SELF_EDITABLE

  const update: Record<string, string | number | null> = {}
  for (const key of Object.keys(body)) {
    if (!allowed.includes(key)) {
      return bad(`field "${key}" not editable by your role`, 403)
    }
    update[key] = body[key as Editable] ?? null
  }
  if (Object.keys(update).length === 0) return bad("no fields to update")

  // Snapshot current row
  const { data: before, error: beforeErr } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", id)
    .single()
  if (beforeErr || !before) return bad("user not found", 404)

  // Compute changed diff (only fields in update that actually changed)
  const changed: Record<string, { from: unknown; to: unknown }> = {}
  for (const [key, nextVal] of Object.entries(update)) {
    const prevVal = (before as Record<string, unknown>)[key]
    if (prevVal !== nextVal) {
      changed[key] = { from: prevVal ?? null, to: nextVal }
    }
  }

  if (Object.keys(changed).length === 0) {
    return NextResponse.json({ success: true, user: before, no_changes: true })
  }

  // Apply update
  const { data: updated, error: updErr } = await supabaseAdmin
    .from("users")
    .update(update)
    .eq("id", id)
    .select("id, name, email, whatsapp, country, wbs_score, cohort, source, created_at")
    .single()
  if (updErr || !updated) return bad(updErr?.message ?? "update failed")

  // Append audit row
  await supabaseAdmin.from("user_revisions").insert({
    user_id: id,
    edited_by: me.id,
    changed,
    snapshot: before,
  })

  return NextResponse.json({ success: true, user: updated })
}
