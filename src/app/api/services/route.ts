import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"
import { isValidSlug, slugify } from "@/lib/slug"

type CreateServicePayload = {
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

export async function GET(req: Request) {
  const me = await getSessionUser()
  const url = new URL(req.url)
  const category = url.searchParams.get("category")
  const search = url.searchParams.get("q")?.trim()

  let q = supabaseAdmin
    .from("services")
    .select("*")
    .order("sort_order")
    .order("name")

  if (category) q = q.eq("category", category)
  if (search) q = q.ilike("name", `%${search}%`)
  if (me?.role !== "admin") q = q.eq("active", true)

  const { data, error } = await q
  if (error) return bad(error.message)
  return NextResponse.json({ success: true, services: data ?? [] })
}

export async function POST(req: Request) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return bad("forbidden", 403)

  let body: CreateServicePayload
  try {
    body = (await req.json()) as CreateServicePayload
  } catch {
    return bad("invalid JSON body")
  }
  const name = (body.name ?? "").trim()
  if (!name) return bad("name required")

  let slug = (body.slug ?? "").trim()
  if (!slug) slug = slugify(name)
  if (!isValidSlug(slug)) return bad("invalid slug")

  const insert = {
    name,
    slug,
    category: body.category ?? null,
    description: body.description ?? null,
    duration_min: body.duration_min ?? null,
    price_thb: body.price_thb ?? null,
    price_usd: body.price_usd ?? null,
    dit_commission_pct: body.dit_commission_pct ?? 15,
    active: body.active ?? true,
    sort_order: body.sort_order ?? 100,
  }
  const { data, error } = await supabaseAdmin.from("services").insert(insert).select("*").single()
  if (error || !data) return bad(error?.message ?? "insert failed")
  return NextResponse.json({ success: true, service: data })
}
