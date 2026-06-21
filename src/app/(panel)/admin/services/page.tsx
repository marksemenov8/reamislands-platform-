import { supabaseAdmin } from "@/lib/supabase-server"
import ServicesView, { type ServiceRow } from "./ServicesView"

export const dynamic = "force-dynamic"

export default async function ServicesPage() {
  const { data, error } = await supabaseAdmin
    .from("services")
    .select(
      "id, name, slug, category, description, duration_min, price_thb, price_usd, dit_commission_pct, active, sort_order",
    )
    .order("category")
    .order("sort_order")
    .order("name")

  return (
    <ServicesView
      rows={(data ?? []) as ServiceRow[]}
      errorMessage={error?.message ?? null}
    />
  )
}
