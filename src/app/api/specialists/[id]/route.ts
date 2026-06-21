import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"

type PatchPayload = {
  name?: string
  role?: string | null
  cohort_focus?: number[]
  active?: boolean
  property_id?: string
}

function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

async function loadAndAuthz(
  id: string,
  me: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>,
) {
  const { data: specialist, error } = await supabaseAdmin
    .from("specialists")
    .select("id, name, role, cohort_focus, active, property_id, created_at")
    .eq("id", id)
    .maybeSingle()
  if (error || !specialist) return { error: bad("specialist not found", 404) as NextResponse }

  if (me.role === "admin") return { specialist }
  if (
    me.role === "partner" &&
    me.partner_property_id &&
    specialist.property_id === me.partner_property_id
  ) {
    return { specialist }
  }
  return { error: bad("forbidden", 403) as NextResponse }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getSessionUser()
  if (!me) return bad("unauthorized", 401)
  const { id } = await params
  const { specialist, error } = await loadAndAuthz(id, me)
  if (error) return error
  return NextResponse.json({ success: true, specialist })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getSessionUser()
  if (!me) return bad("unauthorized", 401)
  const { id } = await params
  const { specialist, error } = await loadAndAuthz(id, me)
  if (error) return error

  let body: PatchPayload
  try {
    body = (await req.json()) as PatchPayload
  } catch {
    return bad("invalid JSON body")
  }

  const update: Record<string, unknown> = {}
  if (body.name !== undefined) update.name = (body.name ?? "").trim()
  if (body.role !== undefined) update.role = body.role?.trim() || null
  if (body.cohort_focus !== undefined) {
    update.cohort_focus = Array.isArray(body.cohort_focus)
      ? body.cohort_focus.filter((n) => Number.isInteger(n) && n >= 1 && n <= 4)
      : []
  }
  if (body.active !== undefined) update.active = !!body.active
  // Partner cannot move specialist between properties
  if (body.property_id !== undefined) {
    if (me.role !== "admin") return bad("only admin can re-assign property", 403)
    update.property_id = body.property_id
  }

  if (Object.keys(update).length === 0) return bad("no fields to update")

  const { data, error: updErr } = await supabaseAdmin
    .from("specialists")
    .update(update)
    .eq("id", specialist!.id)
    .select("id, name, role, cohort_focus, active, property_id, created_at")
    .single()
  if (updErr || !data) return bad(updErr?.message ?? "update failed")

  return NextResponse.json({ success: true, specialist: data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Soft delete — set active=false. We keep booking_specialists history intact.
  const me = await getSessionUser()
  if (!me) return bad("unauthorized", 401)
  const { id } = await params
  const { specialist, error } = await loadAndAuthz(id, me)
  if (error) return error

  const { error: updErr } = await supabaseAdmin
    .from("specialists")
    .update({ active: false })
    .eq("id", specialist!.id)
  if (updErr) return bad(updErr.message)
  return NextResponse.json({ success: true })
}
