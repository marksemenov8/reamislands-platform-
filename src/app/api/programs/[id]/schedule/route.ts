import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"

type CreateItemPayload = {
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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { data, error } = await supabaseAdmin
    .from("program_schedule_items")
    .select("*")
    .eq("program_id", id)
    .order("day_no")
    .order("sort_order")
  if (error) return bad(error.message)
  return NextResponse.json({ success: true, items: data ?? [] })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return bad("forbidden", 403)
  const { id } = await params

  let body: CreateItemPayload
  try {
    body = (await req.json()) as CreateItemPayload
  } catch {
    return bad("invalid JSON body")
  }
  if (!body.day_no || body.day_no < 1) return bad("day_no >= 1 required")
  const title = (body.title ?? "").trim()
  if (!title) return bad("title required")

  const insert = {
    program_id: id,
    day_no: body.day_no,
    start_time: body.start_time ?? null,
    end_time: body.end_time ?? null,
    title,
    description: body.description ?? null,
    kind: body.kind ?? null,
    sort_order: body.sort_order ?? 100,
  }
  const { data, error } = await supabaseAdmin
    .from("program_schedule_items")
    .insert(insert)
    .select("*")
    .single()
  if (error || !data) return bad(error?.message ?? "insert failed")
  return NextResponse.json({ success: true, item: data })
}
