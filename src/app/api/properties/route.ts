import { NextResponse } from "next/server"
import { supabaseAdmin, supabaseServer } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"

type CreatePropertyPayload = {
  name?: string
  slug?: string
  parent_id?: string | null
  island?: string
  country?: string
  cohort_tags?: number[]
  certified?: boolean
  active?: boolean
  contact_wa?: string | null
  description?: string | null
}

function badJson(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status, headers: cors })
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: cors })
}

export async function GET(req: Request) {
  const sb = await supabaseServer()
  const url = new URL(req.url)
  const parentId = url.searchParams.get("parent_id")
  const cohort = url.searchParams.get("cohort")
  const active = url.searchParams.get("active")

  let q = sb
    .from("properties")
    .select(
      "id, name, slug, parent_id, island, country, cohort_tags, certified, active, description"
    )
    .order("created_at")

  if (parentId) q = q.eq("parent_id", parentId)
  if (cohort) q = q.contains("cohort_tags", [Number(cohort)])
  if (active === "true") q = q.eq("active", true)
  else if (active === "false") q = q.eq("active", false)

  const { data, error } = await q
  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400, headers: cors }
    )
  }
  return NextResponse.json({ success: true, properties: data ?? [] }, { headers: cors })
}

export async function POST(req: Request) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return badJson("forbidden", 403)

  let body: CreatePropertyPayload
  try {
    body = (await req.json()) as CreatePropertyPayload
  } catch {
    return badJson("invalid JSON body")
  }
  const name = (body.name ?? "").trim()
  const slug = (body.slug ?? "").trim()
  if (!name) return badJson("name required")
  if (!slug) return badJson("slug required")

  const insert: Record<string, unknown> = {
    name,
    slug,
    parent_id: body.parent_id ?? null,
    island: body.island?.trim() || null,
    country: body.country?.trim() || null,
    cohort_tags: Array.isArray(body.cohort_tags)
      ? body.cohort_tags.filter((n) => Number.isInteger(n) && n >= 1 && n <= 4)
      : [],
    certified: !!body.certified,
    active: body.active ?? true,
    contact_wa: body.contact_wa?.trim() || null,
    description: body.description?.trim() || null,
  }

  const { data, error } = await supabaseAdmin
    .from("properties")
    .insert(insert)
    .select(
      "id, name, slug, parent_id, island, country, cohort_tags, certified, active, contact_wa, description, created_at",
    )
    .single()
  if (error) return badJson(error.message)
  return NextResponse.json({ success: true, property: data }, { headers: cors })
}
