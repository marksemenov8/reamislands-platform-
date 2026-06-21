import { NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { supabaseAdmin } from "@/lib/supabase-server"
import { sendEmail, adminInbox } from "@/lib/email"
import { intakeReceived } from "@/lib/email-templates"

type IntakePayload = {
  name?: string | null
  whatsapp?: string
  country?: string | null
  email?: string | null
  wbs_score?: number
  cohort?: number
  source?: string
  intent?: string
  focus?: string
  program_code?: string
  recommended_duration?: number
  confidence?: number
  sub_body?: number
  sub_recovery?: number
  sub_metabolic?: number
  sub_mind?: number
  sub_risk?: number
  medical_review_required?: boolean
  medical_flags?: string[]
  longstay_candidate?: boolean
  height_cm?: number | null
  weight_kg?: number | null
  raw_answers?: Record<string, unknown>
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

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
          { status: 401, headers: cors },
        )
      }
    }

    if (!payload.whatsapp) {
      return NextResponse.json(
        { success: false, error: "whatsapp is required" },
        { status: 400, headers: cors },
      )
    }

    const { data: user, error: userErr } = await supabaseAdmin
      .from("users")
      .insert({
        name: payload.name ?? null,
        email: payload.email ?? null,
        whatsapp: payload.whatsapp,
        country: payload.country ?? null,
        wbs_score: payload.wbs_score ?? null,
        cohort: payload.cohort ?? null,
        source: payload.source ?? "wbs_form",
        raw_payload: {
          wbs_version: 2,
          intent: payload.intent,
          focus: payload.focus,
          program_code: payload.program_code,
          recommendation: payload.focus,
          sub_scores: {
            body: payload.sub_body,
            recovery: payload.sub_recovery,
            metabolic: payload.sub_metabolic,
            mind: payload.sub_mind,
            risk: payload.sub_risk,
          },
          flags: {
            cvd: payload.raw_answers?.["cvd_history"] === "yes",
            cancer: payload.raw_answers?.["cancer_history"] === "yes",
          },
          medical_review_required: payload.medical_review_required ?? false,
          longstay_candidate: payload.longstay_candidate ?? false,
        },
      })
      .select()
      .single()

    if (userErr) {
      return NextResponse.json(
        { success: false, error: userErr.message },
        { status: 400, headers: cors },
      )
    }

    const { data: assessment } = await supabaseAdmin
      .from("assessments")
      .insert({
        user_id: user.id,
        intent: payload.intent ?? null,
        score: payload.wbs_score ?? null,
        sub_body: payload.sub_body ?? null,
        sub_recovery: payload.sub_recovery ?? null,
        sub_metabolic: payload.sub_metabolic ?? null,
        sub_mind: payload.sub_mind ?? null,
        sub_risk: payload.sub_risk ?? null,
        confidence: payload.confidence ?? null,
        focus: payload.focus ?? null,
        duration_days: payload.recommended_duration ?? null,
        source: payload.source ?? "wbs_form",
        raw_answers: {
          ...(payload.raw_answers ?? {}),
          height_cm: payload.height_cm ?? null,
          weight_kg: payload.weight_kg ?? null,
        },
      })
      .select()
      .single()

    if (assessment && payload.medical_flags && payload.medical_flags.length > 0) {
      const slaMs = 48 * 60 * 60 * 1000
      const flagRows = payload.medical_flags.map((flag) => ({
        user_id: user.id,
        assessment_id: assessment.id,
        flag,
        review_status: "pending",
        sla_due_at: new Date(Date.now() + slaMs).toISOString(),
      }))
      await supabaseAdmin.from("medical_flags").insert(flagRows)
    }

    const { data: programs } = await supabaseAdmin
      .from("programs")
      .select(
        "id, name, cohort, tier, duration_days, price_usd, outcomes, is_composite, program_properties(role, properties(name, island, country))",
      )
      .eq("cohort", payload.cohort ?? 1)
      .eq("active", true)
      .order("price_usd", { ascending: true })
      .limit(3)

    const inbox = adminInbox()
    if (inbox.length > 0) {
      const publicOrigin = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? new URL(req.url).origin
      const mail = intakeReceived({
        guestName: user.name,
        whatsapp: user.whatsapp,
        wbsScore: user.wbs_score,
        cohort: user.cohort,
        recommendation: payload.focus ?? null,
        matchedUrl: `${publicOrigin}/matched/${user.id}`,
      })
      void sendEmail({ to: inbox, ...mail, tag: "intake_received" })
    }

    return NextResponse.json(
      { success: true, user, assessment, matched_programs: programs ?? [] },
      { headers: cors },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500, headers: cors },
    )
  }
}
