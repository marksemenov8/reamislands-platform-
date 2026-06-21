import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"

type CreatePayload = {
  name?: string
  role?: string | null
  cohort_focus?: number[]
  active?: boolean
  property_id?: string
}

function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(req: Request) {
  const me = await getSessionUser()
  if (!me) return bad("unauthorized", 401)
  if (me.role !== "admin" && me.role !== "partner") return bad("forbidden", 403)

  let body: CreatePayload
  try {
    body = (await req.json()) as CreatePayload
  } catch {
    return bad("invalid JSON body")
  }

  const name = (body.name ?? "").trim()
  if (!name) return bad("name required")

  // Partner can only insert specialists on their own property
  let propertyId = body.property_id ?? null
  if (me.role === "partner") {
    if (!me.partner_property_id) return bad("partner has no linked property", 403)
    propertyId = me.partner_property_id
  } else {
    if (!propertyId) return bad("property_id required")
  }

  const cohortFocus = Array.isArray(body.cohort_focus)
    ? body.cohort_focus.filter((n) => Number.isInteger(n) && n >= 1 && n <= 4)
    : []

  const { data, error } = await supabaseAdmin
    .from("specialists")
    .insert({
      name,
      role: body.role?.trim() || null,
      cohort_focus: cohortFocus,
      active: body.active ?? true,
      property_id: propertyId,
    })
    .select("id, name, role, cohort_focus, active, property_id, created_at")
    .single()

  if (error) return bad(error.message)
  return NextResponse.json({ success: true, specialist: data })
}
