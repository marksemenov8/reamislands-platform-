import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"

type Payload = {
  booking_id?: string
  kind?: "pre" | "post"
  score?: number
}

function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(req: Request) {
  const me = await getSessionUser()
  if (!me) return bad("unauthorized", 401)
  if (!me.guest_user_id) return bad("no linked guest profile", 403)

  let body: Payload
  try {
    body = (await req.json()) as Payload
  } catch {
    return bad("invalid JSON body")
  }
  const bookingId = (body.booking_id ?? "").trim()
  const kind = body.kind
  const score = Number(body.score)
  if (!bookingId) return bad("booking_id required")
  if (kind !== "pre" && kind !== "post") return bad("kind must be 'pre' or 'post'")
  if (!Number.isFinite(score) || score < 0 || score > 100) return bad("score 0–100 required")

  // Verify ownership
  const { data: booking, error } = await supabaseAdmin
    .from("bookings")
    .select("id, user_id, status, pre_wbs, post_wbs")
    .eq("id", bookingId)
    .maybeSingle()
  if (error || !booking) return bad("booking not found", 404)
  if (booking.user_id !== me.guest_user_id) return bad("forbidden", 403)

  const update: Record<string, number> = {}
  if (kind === "pre") update.pre_wbs = score
  else update.post_wbs = score

  const { data: updated, error: updErr } = await supabaseAdmin
    .from("bookings")
    .update(update)
    .eq("id", bookingId)
    .select("id, status, pre_wbs, post_wbs")
    .single()
  if (updErr || !updated) return bad(updErr?.message ?? "update failed")

  return NextResponse.json({ success: true, booking: updated })
}
