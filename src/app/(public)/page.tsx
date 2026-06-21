import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import HomeView from "./_components/HomeView"
import { mapProgram, type DbProgramRow } from "./_lib/programMapping"

export const dynamic = "force-dynamic"

const PANEL_HOSTS = new Set(["panel.dreamislands.org"])
const PUBLIC_HOSTS = new Set(["dreamislands.org", "www.dreamislands.org"])

export default async function Root() {
  const host = ((await headers()).get("host") ?? "").toLowerCase().split(":")[0]
  const isPanel = PANEL_HOSTS.has(host)
  const isPublic = PUBLIC_HOSTS.has(host)

  const user = await getSessionUser()

  if (isPanel) {
    if (!user) redirect("/login")
    if (user.role === "admin") redirect("/admin")
    if (user.role === "partner") redirect("/partner")
    redirect("/me")
  }

  if (!isPublic) {
    if (user?.role === "admin") redirect("/admin")
    if (user?.role === "partner") redirect("/partner")
    if (user?.role === "user") redirect("/me")
  }

  const { data: rows } = await supabaseAdmin
    .from("programs")
    .select(
      "id, name, slug, summary, cohort, tier, duration_days, price_usd, outcomes, is_composite, hero_image_url, " +
        "program_properties(role, properties(id, name, island, country, contact_wa)), " +
        "program_variants(duration_days, duration_nights, price_basic_usd, price_vip_usd, active)",
    )
    .eq("active", true)
    .eq("status", "published")
    .order("sort_order")
    .order("cohort")
    .order("duration_days")

  const programs = ((rows ?? []) as unknown as DbProgramRow[]).map(mapProgram)
  return <HomeView programs={programs} />
}
