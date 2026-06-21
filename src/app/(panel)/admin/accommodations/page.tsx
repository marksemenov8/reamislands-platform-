import { supabaseAdmin } from "@/lib/supabase-server"
import AccommodationsView, { type AccommodationRow, type PropertyOption } from "./AccommodationsView"

export const dynamic = "force-dynamic"

export default async function AccommodationsPage() {
  const [accRes, propsRes] = await Promise.all([
    supabaseAdmin
      .from("accommodation_rates")
      .select("*, properties(id, name, slug)")
      .order("property_id")
      .order("sort_order")
      .order("capacity"),
    supabaseAdmin.from("properties").select("id, name, slug, active").order("name"),
  ])

  return (
    <AccommodationsView
      rows={(accRes.data ?? []) as AccommodationRow[]}
      propertyOptions={((propsRes.data ?? []) as PropertyOption[]).filter((p) => p.active)}
      errorMessage={accRes.error?.message ?? null}
    />
  )
}
