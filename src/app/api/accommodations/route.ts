import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"

type CreateAccommodationPayload = {
  property_id?: string
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

export async function GET(req: Request) {
  const me = await getSessionUser()
  const url = new URL(req.url)
  const propertyId = url.searchParams.get("property_id")

  let q = supabaseAdmin
    .from("accommodation_rates")
    .select("*, properties(id, name, slug)")
    .order("sort_order")
    .order("capacity")

  if (propertyId) q = q.eq("property_id", propertyId)
  if (me?.role !== "admin") q = q.eq("active", true)

  const { data, error } = await q
  if (error) return bad(error.message)
  return NextResponse.json({ success: true, accommodations: data ?? [] })
}

export async function POST(req: Request) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return bad("forbidden", 403)

  let body: CreateAccommodationPayload
  try {
    body = (await req.json()) as CreateAccommodationPayload
  } catch {
    return bad("invalid JSON body")
  }
  if (!body.property_id) return bad("property_id required")
  const room_type = (body.room_type ?? "").trim()
  if (!room_type) return bad("room_type required")
  if (!body.capacity || body.capacity < 1) return bad("capacity >= 1 required")
  if (body.price_thb_per_night == null || body.price_thb_per_night < 0)
    return bad("price_thb_per_night required")

  const insert = {
    property_id: body.property_id,
    room_type,
    capacity: body.capacity,
    has_pool: !!body.has_pool,
    price_thb_per_night: body.price_thb_per_night,
    description: body.description ?? null,
    active: body.active ?? true,
    sort_order: body.sort_order ?? 100,
  }
  const { data, error } = await supabaseAdmin
    .from("accommodation_rates")
    .insert(insert)
    .select("*")
    .single()
  if (error || !data) return bad(error?.message ?? "insert failed")
  return NextResponse.json({ success: true, accommodation: data })
}
