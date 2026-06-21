import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"

type UpdateBookingPayload = {
  user_id?: string
  program_id?: string
  arrival?: string | null
  departure?: string | null
  pax?: number | null
  amount_usd?: number | null
  deposit_usd?: number | null
  status?: "inquiry" | "confirmed" | "active" | "completed" | "cancelled"
  pre_wbs?: number | null
  post_wbs?: number | null
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "PATCH, OPTIONS",
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: cors })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") {
    return NextResponse.json(
      { success: false, error: "forbidden" },
      { status: 403, headers: cors }
    )
  }
  const { id } = await params
  if (!id) {
    return NextResponse.json(
      { success: false, error: "id is required" },
      { status: 400, headers: cors }
    )
  }

  let payload: UpdateBookingPayload
  try {
    payload = (await req.json()) as UpdateBookingPayload
  } catch {
    return NextResponse.json(
      { success: false, error: "invalid JSON body" },
      { status: 400, headers: cors }
    )
  }

  const allowedKeys: (keyof UpdateBookingPayload)[] = [
    "user_id",
    "program_id",
    "arrival",
    "departure",
    "pax",
    "amount_usd",
    "deposit_usd",
    "status",
    "pre_wbs",
    "post_wbs",
  ]
  const update: Record<string, unknown> = {}
  for (const k of allowedKeys) {
    if (k in payload) update[k] = payload[k] ?? null
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { success: false, error: "no fields to update" },
      { status: 400, headers: cors }
    )
  }

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .update(update)
    .eq("id", id)
    .select(
      "id, user_id, program_id, arrival, departure, pax, amount_usd, deposit_usd, status, pre_wbs, post_wbs, created_at, user:user_id(name, country), program:program_id(name, tier)"
    )
    .single()

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400, headers: cors }
    )
  }

  return NextResponse.json({ success: true, booking: data }, { headers: cors })
}
