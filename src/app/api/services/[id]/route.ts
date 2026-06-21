import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"
import { isValidSlug } from "@/lib/slug"

type PatchServicePayload = {
  name?: string
  slug?: string
  category?: string | null
  description?: string | null
  duration_min?: number | null
  price_thb?: number | null
  price_usd?: number | null
  dit_commission_pct?: number
  active?: boolean
  sort_order?: number
}

function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return bad("forbidden", 403)
  const { id } = await params

  let body: PatchServicePayload
  try {
    body = (await req.json()) as PatchServicePayload
  } catch {
    return bad("invalid JSON body")
  }
  const update: Record<string, unknown> = {}
  if (body.name !== undefined) update.name = body.name.trim()
  if (body.slug !== undefined) {
    const s = body.slug.trim()
    if (!isValidSlug(s)) return bad("invalid slug")
    update.slug = s
  }
  for (const k of [
    "category",
    "description",
    "duration_min",
    "price_thb",
    "price_usd",
    "dit_commission_pct",
    "sort_order",
  ] as const) {
    if (body[k] !== undefined) update[k] = body[k]
  }
  if (body.active !== undefined) update.active = !!body.active

  if (Object.keys(update).length === 0) return bad("no fields to update")

  const { data, error } = await supabaseAdmin
    .from("services")
    .update(update)
    .eq("id", id)
    .select("*")
    .single()
  if (error || !data) return bad(error?.message ?? "service not found", 404)
  return NextResponse.json({ success: true, service: data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return bad("forbidden", 403)
  const { id } = await params
  // Soft delete — service may be linked to existing programs
  const { error } = await supabaseAdmin.from("services").update({ active: false }).eq("id", id)
  if (error) return bad(error.message)
  return NextResponse.json({ success: true })
}
