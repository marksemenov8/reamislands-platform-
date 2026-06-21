import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase-server"
import ProgramDetailView, { type ProgramDetail, type AccommodationItem } from "./ProgramDetailView"

export const dynamic = "force-dynamic"

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const { data, error } = await supabaseAdmin
    .from("programs")
    .select(
      "id, name, slug, cohort, tier, summary, goal, target_guest, how_we_achieve, guest_feels, " +
        "included_services, contraindications, hero_image_url, outcomes, is_composite, " +
        "program_properties(role, properties(id, name, slug, island, country, contact_wa)), " +
        "program_variants(id, label, duration_days, duration_nights, price_basic_usd, price_vip_usd, active, sort_order), " +
        "program_schedule_items(id, day_no, start_time, end_time, title, description, kind, sort_order), " +
        "program_services(is_included, sort_order, services(id, name, slug, category, description, price_usd, duration_min))",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .eq("active", true)
    .maybeSingle()

  if (error || !data) notFound()

  const program = data as unknown as ProgramDetail

  // Pull accommodations for all linked properties
  const propertyIds = program.program_properties
    .map((pp) => pp.properties?.id)
    .filter((x): x is string => typeof x === "string")

  let accommodations: AccommodationItem[] = []
  if (propertyIds.length > 0) {
    const { data: accData } = await supabaseAdmin
      .from("accommodation_rates")
      .select("id, property_id, room_type, capacity, has_pool, price_thb_per_night, description, sort_order, properties(id, name)")
      .in("property_id", propertyIds)
      .eq("active", true)
      .order("property_id")
      .order("sort_order")
    accommodations = (accData ?? []) as unknown as AccommodationItem[]
  }

  return <ProgramDetailView program={program} accommodations={accommodations} />
}
