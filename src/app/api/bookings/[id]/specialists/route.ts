import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"

type LinkPayload = { specialist_id?: string; role?: string | null }

function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

async function authzForBookingAndSpec(
  bookingId: string,
  specialistId: string,
  me: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>,
) {
  if (me.role === "admin") return { ok: true as const }
  if (me.role !== "partner" || !me.partner_property_id) {
    return { error: bad("forbidden", 403) }
  }

  const { data: specialist } = await supabaseAdmin
    .from("specialists")
    .select("property_id")
    .eq("id", specialistId)
    .maybeSingle()
  if (!specialist || specialist.property_id !== me.partner_property_id) {
    return { error: bad("specialist not in your property", 403) }
  }

  // Optional sanity: ensure the booking touches the partner's property too
  const { data: booking } = await supabaseAdmin
    .from("bookings")
    .select("program_id, programs(program_properties(property_id))")
    .eq("id", bookingId)
    .maybeSingle()
  if (!booking) return { error: bad("booking not found", 404) }
  const links = (booking as unknown as {
    programs: { program_properties: Array<{ property_id: string }> } | null
  }).programs?.program_properties ?? []
  const matchesScope = links.some((pp) => pp.property_id === me.partner_property_id)
  if (!matchesScope) return { error: bad("booking not on your property", 403) }
  return { ok: true as const }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getSessionUser()
  if (!me) return bad("unauthorized", 401)
  const { id: bookingId } = await params

  let body: LinkPayload
  try {
    body = (await req.json()) as LinkPayload
  } catch {
    return bad("invalid JSON body")
  }
  const specialistId = (body.specialist_id ?? "").trim()
  if (!specialistId) return bad("specialist_id required")

  const z = await authzForBookingAndSpec(bookingId, specialistId, me)
  if ("error" in z) return z.error

  const { data, error } = await supabaseAdmin
    .from("booking_specialists")
    .upsert({ booking_id: bookingId, specialist_id: specialistId, role: body.role ?? null })
    .select("booking_id, specialist_id, role")
    .single()
  if (error) return bad(error.message)
  return NextResponse.json({ success: true, link: data })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getSessionUser()
  if (!me) return bad("unauthorized", 401)
  const { id: bookingId } = await params
  const url = new URL(req.url)
  const specialistId = url.searchParams.get("specialist_id") ?? ""
  if (!specialistId) return bad("specialist_id query param required")

  const z = await authzForBookingAndSpec(bookingId, specialistId, me)
  if ("error" in z) return z.error

  const { error } = await supabaseAdmin
    .from("booking_specialists")
    .delete()
    .eq("booking_id", bookingId)
    .eq("specialist_id", specialistId)
  if (error) return bad(error.message)
  return NextResponse.json({ success: true })
}
