import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"

type ReplacePayload = {
  links?: Array<{ service_id: string; is_included?: boolean; sort_order?: number }>
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
    .from("program_services")
    .select("service_id, is_included, sort_order, services(id, name, slug, category, price_usd)")
    .eq("program_id", id)
    .order("sort_order")
  if (error) return bad(error.message)
  return NextResponse.json({ success: true, links: data ?? [] })
}

// PUT replaces the full set of links for a program (idempotent).
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return bad("forbidden", 403)
  const { id } = await params

  let body: ReplacePayload
  try {
    body = (await req.json()) as ReplacePayload
  } catch {
    return bad("invalid JSON body")
  }
  const links = Array.isArray(body.links) ? body.links : []
  for (const l of links) {
    if (!l.service_id || typeof l.service_id !== "string") return bad("each link needs service_id")
  }

  const { error: delErr } = await supabaseAdmin
    .from("program_services")
    .delete()
    .eq("program_id", id)
  if (delErr) return bad(delErr.message)

  if (links.length > 0) {
    const rows = links.map((l, idx) => ({
      program_id: id,
      service_id: l.service_id,
      is_included: !!l.is_included,
      sort_order: l.sort_order ?? idx * 10,
    }))
    const { error: insErr } = await supabaseAdmin.from("program_services").insert(rows)
    if (insErr) return bad(insErr.message)
  }

  return NextResponse.json({ success: true, count: links.length })
}
