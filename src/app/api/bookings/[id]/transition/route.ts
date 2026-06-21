import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"
import { sendEmail, adminInbox } from "@/lib/email"
import {
  bookingConfirmed,
  preWbsReminder,
  postWbsReminder,
} from "@/lib/email-templates"

type Status = "inquiry" | "confirmed" | "active" | "completed" | "cancelled"

type TransitionPayload = {
  to?: Status
  pre_wbs?: number
  post_wbs?: number
}

const ALLOWED: Record<Status, Status[]> = {
  inquiry: ["confirmed", "cancelled"],
  confirmed: ["active", "cancelled"],
  active: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
}

function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return bad("forbidden", 403)
  const { id } = await params

  let body: TransitionPayload
  try {
    body = (await req.json()) as TransitionPayload
  } catch {
    return bad("invalid JSON body")
  }
  const to = body.to
  if (!to || !["inquiry", "confirmed", "active", "completed", "cancelled"].includes(to)) {
    return bad("invalid target status")
  }

  const { data: bookingRaw, error: fetchErr } = await supabaseAdmin
    .from("bookings")
    .select(
      "id, user_id, program_id, arrival, departure, status, pre_wbs, post_wbs, " +
        "users:user_id(name, email), programs:program_id(name, program_properties(properties(name)))",
    )
    .eq("id", id)
    .maybeSingle()
  if (fetchErr || !bookingRaw) return bad("booking not found", 404)

  const booking = bookingRaw as unknown as {
    id: string
    status: Status
    pre_wbs: number | null
    post_wbs: number | null
    arrival: string | null
    departure: string | null
    users: { name: string | null; email: string | null } | null
    programs: {
      name: string | null
      program_properties: Array<{ properties: { name: string } | null }>
    } | null
  }
  const current = booking.status
  if (!ALLOWED[current].includes(to)) {
    return bad(`cannot move from ${current} to ${to}`)
  }

  const update: Record<string, unknown> = { status: to }
  let preWbs = booking.pre_wbs
  let postWbs = booking.post_wbs

  if (to === "active") {
    const provided = body.pre_wbs
    if (preWbs == null && (provided == null || provided < 0 || provided > 100)) {
      return bad("pre_wbs (0–100) required to start stay")
    }
    if (provided != null) {
      update.pre_wbs = provided
      preWbs = provided
    }
  }
  if (to === "completed") {
    const provided = body.post_wbs
    if (postWbs == null && (provided == null || provided < 0 || provided > 100)) {
      return bad("post_wbs (0–100) required to complete stay")
    }
    if (provided != null) {
      update.post_wbs = provided
      postWbs = provided
    }
  }

  const { data: updated, error: updErr } = await supabaseAdmin
    .from("bookings")
    .update(update)
    .eq("id", id)
    .select("id, status, pre_wbs, post_wbs, confirmed_at, started_at, completed_at, cancelled_at")
    .single()
  if (updErr || !updated) return bad(updErr?.message ?? "update failed")

  // Notifications (fire-and-forget; never block on email)
  void notifyTransition({
    req,
    to,
    booking,
    pre: preWbs,
    post: postWbs,
  })

  return NextResponse.json({ success: true, booking: updated })
}

type BookingShape = {
  arrival: string | null
  departure: string | null
  users: { name: string | null; email: string | null } | null
  programs: {
    name: string | null
    program_properties: Array<{ properties: { name: string } | null }>
  } | null
}

async function notifyTransition(args: {
  req: Request
  to: Status
  booking: unknown
  pre: number | null
  post: number | null
}) {
  try {
    const b = args.booking as unknown as BookingShape
    const panelOrigin = process.env.NEXT_PUBLIC_PANEL_SITE_URL ?? new URL(args.req.url).origin
    const guestName = b.users?.name ?? null
    const guestEmail = b.users?.email ?? null
    const programName = b.programs?.name ?? "your stay"
    const arrival = b.arrival ?? ""
    const departure = b.departure ?? ""
    const meUrl = `${panelOrigin}/me`

    if (args.to === "confirmed" && guestEmail) {
      const mail = bookingConfirmed({ guestName, programName, arrival, departure, meUrl })
      await sendEmail({ to: guestEmail, ...mail, tag: "booking_confirmed" })
    } else if (args.to === "active" && guestEmail) {
      const mail = preWbsReminder({ guestName, programName, meUrl })
      await sendEmail({ to: guestEmail, ...mail, tag: "pre_wbs_reminder" })
    } else if (args.to === "completed" && guestEmail) {
      const mail = postWbsReminder({ guestName, programName, meUrl })
      await sendEmail({ to: guestEmail, ...mail, tag: "post_wbs_reminder" })
    } else if (args.to === "cancelled") {
      const inbox = adminInbox()
      if (inbox.length > 0) {
        await sendEmail({
          to: inbox,
          subject: `🛑 Cancelled: ${programName} — ${guestName ?? "guest"}`,
          html: `<p>Booking cancelled.</p><p>${programName} · ${arrival} → ${departure}</p>`,
          text: `Cancelled: ${programName} (${arrival} → ${departure})`,
          tag: "booking_cancelled",
        })
      }
    }
  } catch (err) {
    console.error("[notifyTransition] failed:", err)
  }
}
