import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"

type CreateVariantPayload = {
  label?: string
  duration_days?: number
  duration_nights?: number
  price_basic_usd?: number
  price_vip_usd?: number | null
  active?: boolean
  sort_order?: number
}

function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { data, error } = await supabaseAdmin
    .from("program_variants")
    .select("*")
    .eq("program_id", id)
    .order("sort_order")
  if (error) return bad(error.message)
  return NextResponse.json({ success: true, variants: data ?? [] })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return bad("forbidden", 403)
  const { id } = await params

  let body: CreateVariantPayload
  try {
    body = (await req.json()) as CreateVariantPayload
  } catch {
    return bad("invalid JSON body")
  }
  const label = (body.label ?? "").trim()
  if (!label) return bad("label required")
  if (!body.duration_days || body.duration_days < 1) return bad("duration_days >= 1")
  if (!body.duration_nights || body.duration_nights < 0) return bad("duration_nights >= 0")
  if (body.price_basic_usd == null || body.price_basic_usd < 0) return bad("price_basic_usd required")

  const insert = {
    program_id: id,
    label,
    duration_days: body.duration_days,
    duration_nights: body.duration_nights,
    price_basic_usd: body.price_basic_usd,
    price_vip_usd: body.price_vip_usd ?? null,
    active: body.active ?? true,
    sort_order: body.sort_order ?? 100,
  }
  const { data, error } = await supabaseAdmin
    .from("program_variants")
    .insert(insert)
    .select("*")
    .single()
  if (error || !data) return bad(error?.message ?? "insert failed")
  return NextResponse.json({ success: true, variant: data })
}
