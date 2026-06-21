import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"

type PatchVariantPayload = {
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; vid: string }> },
) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return bad("forbidden", 403)
  const { id, vid } = await params

  let body: PatchVariantPayload
  try {
    body = (await req.json()) as PatchVariantPayload
  } catch {
    return bad("invalid JSON body")
  }
  const update: Record<string, unknown> = {}
  if (body.label !== undefined) update.label = body.label.trim()
  if (body.duration_days !== undefined) {
    if (body.duration_days < 1) return bad("duration_days >= 1")
    update.duration_days = body.duration_days
  }
  if (body.duration_nights !== undefined) update.duration_nights = body.duration_nights
  if (body.price_basic_usd !== undefined) {
    if (body.price_basic_usd < 0) return bad("price_basic_usd >= 0")
    update.price_basic_usd = body.price_basic_usd
  }
  if (body.price_vip_usd !== undefined) update.price_vip_usd = body.price_vip_usd
  if (body.active !== undefined) update.active = !!body.active
  if (body.sort_order !== undefined) update.sort_order = body.sort_order

  if (Object.keys(update).length === 0) return bad("no fields to update")

  const { data, error } = await supabaseAdmin
    .from("program_variants")
    .update(update)
    .eq("id", vid)
    .eq("program_id", id)
    .select("*")
    .single()
  if (error || !data) return bad(error?.message ?? "variant not found", 404)
  return NextResponse.json({ success: true, variant: data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; vid: string }> },
) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return bad("forbidden", 403)
  const { id, vid } = await params
  const { error } = await supabaseAdmin
    .from("program_variants")
    .delete()
    .eq("id", vid)
    .eq("program_id", id)
  if (error) return bad(error.message)
  return NextResponse.json({ success: true })
}
