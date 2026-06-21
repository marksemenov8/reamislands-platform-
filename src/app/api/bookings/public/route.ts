import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { sendEmail, adminInbox } from "@/lib/email"
import { bookingInquiry } from "@/lib/email-templates"

type PublicBookingPayload = {
  user_id?: string
  program_id?: string
  arrival?: string
  departure?: string
  pax?: number
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status, headers: cors })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: cors })
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export async function POST(req: Request) {
  let body: PublicBookingPayload
  try {
    body = (await req.json()) as PublicBookingPayload
  } catch {
    return bad("invalid JSON body")
  }

  const userId = (body.user_id ?? "").trim()
  const programId = (body.program_id ?? "").trim()
  const arrival = (body.arrival ?? "").trim()
  const departure = (body.departure ?? "").trim()
  const pax = Number(body.pax ?? 1)

  if (!userId) return bad("user_id required")
  if (!programId) return bad("program_id required")
  if (!ISO_DATE.test(arrival)) return bad("arrival must be YYYY-MM-DD")
  if (!ISO_DATE.test(departure)) return bad("departure must be YYYY-MM-DD")
  if (departure <= arrival) return bad("departure must be after arrival")
  if (!Number.isInteger(pax) || pax < 1 || pax > 20) return bad("pax must be 1–20")

  // Confirm user + program exist, get max_guests for upper bound
  const [{ data: user }, { data: program }] = await Promise.all([
    supabaseAdmin.from("users").select("id").eq("id", userId).maybeSingle(),
    supabaseAdmin
      .from("programs")
      .select("id, max_guests, active")
      .eq("id", programId)
      .maybeSingle(),
  ])
  if (!user) return bad("unknown user_id", 404)
  if (!program || !program.active) return bad("unknown or inactive program_id", 404)
  if (program.max_guests && pax > program.max_guests) {
    return bad(`pax exceeds program max_guests (${program.max_guests})`)
  }

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .insert({
      user_id: userId,
      program_id: programId,
      arrival,
      departure,
      pax,
      status: "inquiry",
    })
    .select("id, status, arrival, departure, pax")
    .single()

  if (error) return bad(error.message)

  // Fire notification to admin + (if any) partners of properties linked to this program.
  // No await — never block the response.
  void notifyInquiry({ req, userId, programId, bookingId: data.id, arrival, departure, pax })

  return NextResponse.json({ success: true, booking: data }, { headers: cors })
}

async function notifyInquiry(args: {
  req: Request
  userId: string
  programId: string
  bookingId: string
  arrival: string
  departure: string
  pax: number
}) {
  try {
    const origin = new URL(args.req.url).origin
    const [{ data: guest }, { data: program }] = await Promise.all([
      supabaseAdmin.from("users").select("name, whatsapp").eq("id", args.userId).maybeSingle(),
      supabaseAdmin
        .from("programs")
        .select("name, program_properties(properties(id, name))")
        .eq("id", args.programId)
        .maybeSingle(),
    ])
    if (!guest || !program) return

    type PP = { properties: { id: string; name: string } | null }
    const propertyLinks =
      ((program as unknown as { program_properties?: PP[] }).program_properties ?? []) as PP[]
    const firstProperty = propertyLinks.find((pp) => pp.properties)?.properties ?? null
    const propertyIds = propertyLinks
      .map((pp) => pp.properties?.id)
      .filter((x): x is string => !!x)

    let partnerEmails: string[] = []
    if (propertyIds.length > 0) {
      const { data: partners } = await supabaseAdmin
        .from("profiles")
        .select("id, partner_property_id")
        .eq("role", "partner")
        .in("partner_property_id", propertyIds)
      const ids = (partners ?? []).map((p) => p.id)
      if (ids.length > 0) {
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 })
        partnerEmails = users
          .filter((u) => ids.includes(u.id) && u.email)
          .map((u) => u.email as string)
      }
    }

    const recipients = Array.from(new Set([...adminInbox(), ...partnerEmails]))
    if (recipients.length === 0) return

    const mail = bookingInquiry({
      guestName: guest.name,
      whatsapp: guest.whatsapp,
      programName: program.name,
      propertyName: firstProperty?.name ?? null,
      arrival: args.arrival,
      departure: args.departure,
      pax: args.pax,
      adminBookingUrl: `${origin}/admin/bookings`,
    })
    await sendEmail({ to: recipients, ...mail, tag: "booking_inquiry" })
  } catch (err) {
    console.error("[notifyInquiry] failed:", err)
  }
}
