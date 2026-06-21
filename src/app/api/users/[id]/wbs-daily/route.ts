import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"

const MAX_DAYS = 30

function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

async function partnerCanSeeGuest(
  partnerPropertyId: string,
  guestId: string,
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("bookings")
    .select("program_id, programs!inner(program_properties!inner(property_id))")
    .eq("user_id", guestId)
  for (const row of (data ?? []) as unknown as Array<{
    programs: { program_properties: Array<{ property_id: string }> } | null
  }>) {
    for (const pp of row.programs?.program_properties ?? []) {
      if (pp.property_id === partnerPropertyId) return true
    }
  }
  return false
}

async function authorize(userId: string) {
  const me = await getSessionUser()
  if (!me) return { error: bad("unauthorized", 401) as NextResponse }
  const isAdmin = me.role === "admin"
  const isPartner = me.role === "partner" && !!me.partner_property_id
  const isSelf = me.guest_user_id === userId
  if (!isAdmin && !isPartner && !isSelf) return { error: bad("forbidden", 403) }
  if (isPartner && !isAdmin && !isSelf) {
    const ok = await partnerCanSeeGuest(me.partner_property_id!, userId)
    if (!ok) return { error: bad("forbidden", 403) }
  }
  return { me, isAdmin, isPartner, isSelf }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const auth = await authorize(id)
  if ("error" in auth) return auth.error

  const [userRes, daysRes] = await Promise.all([
    supabaseAdmin.from("users").select("wbs_started_at, wbs_score").eq("id", id).maybeSingle(),
    supabaseAdmin
      .from("user_wbs_daily")
      .select("day_no, score, updated_at")
      .eq("user_id", id)
      .order("day_no"),
  ])
  if (userRes.error || !userRes.data) return bad("user not found", 404)

  return NextResponse.json({
    success: true,
    wbs_started_at: userRes.data.wbs_started_at,
    wbs_score: userRes.data.wbs_score,
    days: daysRes.data ?? [],
  })
}

type PutPayload = {
  wbs_started_at?: string | null
  days?: Array<{ day_no: number; score: number | null }>
}

// PUT replaces the full set of daily scores for the user. Days passed with
// `score: null` are deleted; days with a number are upserted.
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const auth = await authorize(id)
  if ("error" in auth) return auth.error
  // Guests can read but cannot write daily WBS via this endpoint.
  if (!auth.isAdmin && !auth.isPartner) return bad("forbidden", 403)

  let body: PutPayload
  try {
    body = (await req.json()) as PutPayload
  } catch {
    return bad("invalid JSON body")
  }
  const days = Array.isArray(body.days) ? body.days : []

  // Validate
  const toDelete: number[] = []
  const toUpsert: Array<{ user_id: string; day_no: number; score: number }> = []
  for (const d of days) {
    if (!Number.isInteger(d.day_no) || d.day_no < 1 || d.day_no > MAX_DAYS) {
      return bad(`invalid day_no ${d.day_no}`)
    }
    if (d.score == null) {
      toDelete.push(d.day_no)
    } else {
      if (!Number.isFinite(d.score) || d.score < 0 || d.score > 100) {
        return bad(`invalid score ${d.score} for day ${d.day_no}`)
      }
      toUpsert.push({ user_id: id, day_no: d.day_no, score: Math.round(d.score) })
    }
  }

  // Set started_at if provided OR auto-set to today on first save
  const update: Record<string, unknown> = {}
  if (body.wbs_started_at !== undefined) {
    update.wbs_started_at = body.wbs_started_at
  } else if (toUpsert.length > 0) {
    const { data: current } = await supabaseAdmin
      .from("users")
      .select("wbs_started_at")
      .eq("id", id)
      .maybeSingle()
    if (!current?.wbs_started_at) {
      update.wbs_started_at = new Date().toISOString().slice(0, 10)
    }
  }

  if (Object.keys(update).length > 0) {
    const { error: uerr } = await supabaseAdmin.from("users").update(update).eq("id", id)
    if (uerr) return bad(uerr.message)
  }

  if (toDelete.length > 0) {
    const { error: derr } = await supabaseAdmin
      .from("user_wbs_daily")
      .delete()
      .eq("user_id", id)
      .in("day_no", toDelete)
    if (derr) return bad(derr.message)
  }
  if (toUpsert.length > 0) {
    const { error: uperr } = await supabaseAdmin
      .from("user_wbs_daily")
      .upsert(toUpsert, { onConflict: "user_id,day_no" })
    if (uperr) return bad(uperr.message)
  }

  // Also recompute users.wbs_score = latest day's score (highest day_no that has a value)
  const { data: latest } = await supabaseAdmin
    .from("user_wbs_daily")
    .select("score")
    .eq("user_id", id)
    .order("day_no", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (latest) {
    await supabaseAdmin.from("users").update({ wbs_score: latest.score }).eq("id", id)
  }

  return NextResponse.json({ success: true })
}
