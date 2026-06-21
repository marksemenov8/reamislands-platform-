import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"

type PatchItemPayload = {
  day_no?: number
  start_time?: string | null
  end_time?: string | null
  title?: string
  description?: string | null
  kind?: string | null
  sort_order?: number
}

function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; sid: string }> },
) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return bad("forbidden", 403)
  const { id, sid } = await params

  let body: PatchItemPayload
  try {
    body = (await req.json()) as PatchItemPayload
  } catch {
    return bad("invalid JSON body")
  }
  const update: Record<string, unknown> = {}
  if (body.day_no !== undefined) {
    if (body.day_no < 1) return bad("day_no >= 1")
    update.day_no = body.day_no
  }
  if (body.start_time !== undefined) update.start_time = body.start_time
  if (body.end_time !== undefined) update.end_time = body.end_time
  if (body.title !== undefined) update.title = body.title.trim()
  if (body.description !== undefined) update.description = body.description
  if (body.kind !== undefined) update.kind = body.kind
  if (body.sort_order !== undefined) update.sort_order = body.sort_order

  if (Object.keys(update).length === 0) return bad("no fields to update")

  const { data, error } = await supabaseAdmin
    .from("program_schedule_items")
    .update(update)
    .eq("id", sid)
    .eq("program_id", id)
    .select("*")
    .single()
  if (error || !data) return bad(error?.message ?? "item not found", 404)
  return NextResponse.json({ success: true, item: data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; sid: string }> },
) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return bad("forbidden", 403)
  const { id, sid } = await params
  const { error } = await supabaseAdmin
    .from("program_schedule_items")
    .delete()
    .eq("id", sid)
    .eq("program_id", id)
  if (error) return bad(error.message)
  return NextResponse.json({ success: true })
}
