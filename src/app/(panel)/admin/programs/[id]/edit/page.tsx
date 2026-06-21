import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase-server"
import EditView, { type ProgramFull, type PropertyOption, type ServiceOption } from "./EditView"

export const dynamic = "force-dynamic"

export default async function ProgramEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [programRes, propsRes, servicesRes] = await Promise.all([
    supabaseAdmin
      .from("programs")
      .select(
        "id, name, slug, status, cohort, tier, duration_days, price_usd, summary, goal, target_guest, " +
          "how_we_achieve, guest_feels, included_services, contraindications, hero_image_url, outcomes, " +
          "max_guests, is_composite, active, sort_order, published_at, " +
          "program_properties(property_id), " +
          "program_variants(id, label, duration_days, duration_nights, price_basic_usd, price_vip_usd, active, sort_order), " +
          "program_schedule_items(id, day_no, start_time, end_time, title, description, kind, sort_order), " +
          "program_services(service_id, is_included, sort_order)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabaseAdmin.from("properties").select("id, name, slug, active").order("name"),
    supabaseAdmin.from("services").select("id, name, slug, category, price_usd").order("name"),
  ])

  if (!programRes.data) notFound()

  const propertyOptions: PropertyOption[] = ((propsRes.data ?? []) as PropertyOption[])
    .filter((p) => p.active)

  const serviceOptions: ServiceOption[] = (servicesRes.data ?? []) as ServiceOption[]

  return (
    <EditView
      program={programRes.data as unknown as ProgramFull}
      propertyOptions={propertyOptions}
      serviceOptions={serviceOptions}
    />
  )
}
