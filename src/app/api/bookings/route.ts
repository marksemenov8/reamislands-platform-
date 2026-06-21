import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"

type CreateBookingPayload = {
  user_id?: string
  program_id?: string
  arrival?: string
  departure?: string
  pax?: number
  amount_usd?: number
  deposit_usd?: number
  status?: "inquiry" | "confirmed" | "active" | "completed" | "cancelled"
  pre_wbs?: number
  post_wbs?: number
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: cors })
}

export async function POST(req: Request) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") {
    return NextResponse.json(
      { success: false, error: "forbidden" },
      { status: 403, headers: cors }
    )
  }
  let payload: CreateBookingPayload
  try {
    payload = (await req.json()) as CreateBookingPayload
  } catch {
    return NextResponse.json(
      { success: false, error: "invalid JSON body" },
      { status: 400, headers: cors }
    )
  }

  if (!payload.user_id) {
    return NextResponse.json(
      { success: false, error: "user_id is required" },
      { status: 400, headers: cors }
    )
  }
  if (!payload.program_id) {
    return NextResponse.json(
      { success: false, error: "program_id is required" },
      { status: 400, headers: cors }
    )
  }

  const insert = {
    user_id: payload.user_id,
    program_id: payload.program_id,
    arrival: payload.arrival ?? null,
    departure: payload.departure ?? null,
    pax: payload.pax ?? 1,
    amount_usd: payload.amount_usd ?? null,
    deposit_usd: payload.deposit_usd ?? 0,
    status: payload.status ?? "inquiry",
    pre_wbs: payload.pre_wbs ?? null,
    post_wbs: payload.post_wbs ?? null,
  }

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .insert(insert)
    .select(
      "id, arrival, departure, pax, amount_usd, deposit_usd, status, pre_wbs, post_wbs, created_at, user:user_id(name, country), program:program_id(name, tier)"
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
