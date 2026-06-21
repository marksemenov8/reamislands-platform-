import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"

type PatchPayload = {
  name?: string
  slug?: string
  parent_id?: string | null
  island?: string
  country?: string
  cohort_tags?: number[]
  certified?: boolean
  active?: boolean
  contact_wa?: string | null
  description?: string | null
}

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
    .from("properties")
    .select(
      "id, name, slug, parent_id, island, country, cohort_tags, certified, active, contact_wa, description, created_at",
    )
    .eq("id", id)
    .maybeSingle()
  if (error || !data) return bad("property not found", 404)
  return NextResponse.json({ success: true, property: data })
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

  const update: Record<string, unknown> = {}
  if (body.name !== undefined) update.name = body.name.trim()
  if (body.slug !== undefined) update.slug = body.slug.trim()
  if (body.parent_id !== undefined) update.parent_id = body.parent_id || null
  if (body.island !== undefined) update.island = body.island.trim() || null
  if (body.country !== undefined) update.country = body.country.trim() || null
  if (body.cohort_tags !== undefined)
    update.cohort_tags = Array.isArray(body.cohort_tags)
      ? body.cohort_tags.filter((n) => Number.isInteger(n) && n >= 1 && n <= 4)
      : []
  if (body.certified !== undefined) update.certified = !!body.certified
  if (body.active !== undefined) update.active = !!body.active
  if (body.contact_wa !== undefined) update.contact_wa = body.contact_wa?.trim() || null
  if (body.description !== undefined) update.description = body.description?.trim() || null

  if (Object.keys(update).length === 0) return bad("no fields to update")

  const { data, error } = await supabaseAdmin
    .from("properties")
    .update(update)
    .eq("id", id)
    .select(
      "id, name, slug, parent_id, island, country, cohort_tags, certified, active, contact_wa, description, created_at",
    )
    .single()
  if (error || !data) return bad(error?.message ?? "update failed")
  return NextResponse.json({ success: true, property: data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Soft delete — set active=false. Cascading hard-delete would risk losing bookings.
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return bad("forbidden", 403)
  const { id } = await params

  const { error } = await supabaseAdmin
    .from("properties")
    .update({ active: false })
    .eq("id", id)
  if (error) return bad(error.message)
  return NextResponse.json({ success: true })
}
