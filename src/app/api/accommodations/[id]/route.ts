import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"

type PatchAccommodationPayload = {
  room_type?: string
  capacity?: number
  has_pool?: boolean
  price_thb_per_night?: number
  description?: string | null
  active?: boolean
  sort_order?: number
}

function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return bad("forbidden", 403)
  const { id } = await params

  let body: PatchAccommodationPayload
  try {
    body = (await req.json()) as PatchAccommodationPayload
  } catch {
    return bad("invalid JSON body")
  }
  const update: Record<string, unknown> = {}
  if (body.room_type !== undefined) update.room_type = body.room_type.trim()
  if (body.capacity !== undefined) {
    if (body.capacity < 1) return bad("capacity >= 1")
    update.capacity = body.capacity
  }
  if (body.has_pool !== undefined) update.has_pool = !!body.has_pool
  if (body.price_thb_per_night !== undefined) {
    if (body.price_thb_per_night < 0) return bad("price_thb_per_night >= 0")
    update.price_thb_per_night = body.price_thb_per_night
  }
  if (body.description !== undefined) update.description = body.description
  if (body.active !== undefined) update.active = !!body.active
  if (body.sort_order !== undefined) update.sort_order = body.sort_order

  if (Object.keys(update).length === 0) return bad("no fields to update")

  const { data, error } = await supabaseAdmin
    .from("accommodation_rates")
    .update(update)
    .eq("id", id)
    .select("*")
    .single()
  if (error || !data) return bad(error?.message ?? "not found", 404)
  return NextResponse.json({ success: true, accommodation: data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return bad("forbidden", 403)
  const { id } = await params
  const { error } = await supabaseAdmin.from("accommodation_rates").update({ active: false }).eq("id", id)
  if (error) return bad(error.message)
  return NextResponse.json({ success: true })
}
