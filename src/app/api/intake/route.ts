import { NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { supabaseAdmin } from "@/lib/supabase-server"
import { sendEmail, adminInbox } from "@/lib/email"
import { intakeReceived } from "@/lib/email-templates"

type IntakePayload = {
  name?: string
  whatsapp?: string
  country?: string
  email?: string
  wbs_score?: number
  cohort?: number
  source?: "cura" | "wbs_form" | "instagram" | "direct" | string
  raw_payload?: Record<string, unknown>
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

// Sources that require x-webhook-secret. wbs_form / direct / instagram remain open
// (form lives on our domain; direct/instagram are operator-entered).
const PROTECTED_SOURCES = new Set(["cura"])

function constTimeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: cors })
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as IntakePayload

    if (payload.source && PROTECTED_SOURCES.has(payload.source)) {
      const expected = process.env.INTAKE_WEBHOOK_SECRET
      const presented = req.headers.get("x-webhook-secret") ?? ""
      if (!expected || !presented || !constTimeEq(expected, presented)) {
        return NextResponse.json(
          { success: false, error: "invalid webhook secret" },
          { status: 401, headers: cors }
        )
      }
    }

    if (!payload.whatsapp) {
      return NextResponse.json(
        { success: false, error: "whatsapp is required" },
        { status: 400, headers: cors }
      )
    }

    let cohort = payload.cohort
    if (!cohort && payload.wbs_score != null) {
      if (payload.wbs_score >= 70) cohort = 1
      else if (payload.wbs_score >= 50) cohort = 2
      else cohort = 3
    }

    const { data: user, error: userErr } = await supabaseAdmin
      .from("users")
      .insert({
        name: payload.name ?? null,
        email: payload.email ?? null,
        whatsapp: payload.whatsapp,
        country: payload.country ?? null,
        wbs_score: payload.wbs_score ?? null,
        cohort: cohort ?? null,
        source: payload.source ?? "direct",
        raw_payload: payload.raw_payload ?? payload,
      })
      .select()
      .single()

    if (userErr) {
      return NextResponse.json(
        { success: false, error: userErr.message },
        { status: 400, headers: cors }
      )
    }

    const { data: programs } = await supabaseAdmin
      .from("programs")
      .select(
        "id, name, cohort, tier, duration_days, price_usd, outcomes, is_composite, program_properties(role, properties(name, island, country))"
      )
      .eq("cohort", cohort ?? 1)
      .eq("active", true)
      .order("price_usd", { ascending: true })
      .limit(3)

    const inbox = adminInbox()
    if (inbox.length > 0) {
      const publicOrigin = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? new URL(req.url).origin
      const recommendation =
        (payload.raw_payload as { recommendation?: string } | undefined)?.recommendation ?? null
      const mail = intakeReceived({
        guestName: user.name,
        whatsapp: user.whatsapp,
        wbsScore: user.wbs_score,
        cohort: user.cohort,
        recommendation,
        matchedUrl: `${publicOrigin}/matched/${user.id}`,
      })
      void sendEmail({ to: inbox, ...mail, tag: "intake_received" })
    }

    return NextResponse.json(
      { success: true, user, matched_programs: programs ?? [] },
      { headers: cors }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500, headers: cors }
    )
  }
}
