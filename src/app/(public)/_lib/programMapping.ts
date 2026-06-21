// Mapping layer between Supabase `programs` rows and the LandingProgram shape
// the design components expect. Lives only on the public side.

export const COHORT_LABELS: Record<number, { name: string; tagline: string; color: string }> = {
  1: { name: "Reset", tagline: "Detox & recovery", color: "var(--reset)" },
  2: { name: "Performance", tagline: "Energy & fitness", color: "var(--lean)" },
  3: { name: "Mind", tagline: "Clarity & calm", color: "var(--sleep)" },
  4: { name: "Immersion", tagline: "Deep transformation", color: "var(--accent)" },
}

export const TRACKS = [
  { id: "Reset", label: "Reset", desc: "Down-regulate, detox, re-sleep.", cohort: 1 },
  { id: "Performance", label: "Performance", desc: "Train smarter; rebuild capacity.", cohort: 2 },
  { id: "Mind", label: "Mind", desc: "Calm the nervous system; restore focus.", cohort: 3 },
  { id: "Immersion", label: "Immersion", desc: "Composite, longer-stay protocols.", cohort: 4 },
] as const

export const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Take the Wellness Baseline",
    body: "22 questions, about 5 minutes. We score Movement, Recovery, Lifestyle Risk and Emotional Health on a 0–100 scale.",
  },
  {
    n: "02",
    title: "See your matched programs",
    body: "Three retreats across SE Asia, ranked by your baseline. Composite stays for deep work, focused tracks for one priority.",
  },
  {
    n: "03",
    title: "We WhatsApp you within a day",
    body: "Real humans confirm dates, run pre-arrival prep, and stay with you through the protocol.",
  },
] as const

const COUNTRY_FLAGS: Record<string, string> = {
  Indonesia: "🇮🇩",
  Thailand: "🇹🇭",
  Singapore: "🇸🇬",
  Malaysia: "🇲🇾",
  Vietnam: "🇻🇳",
  Philippines: "🇵🇭",
}

export type DbProperty = {
  id: string
  name: string
  island: string | null
  country: string | null
  contact_wa: string | null
}

export type DbVariant = {
  duration_days: number
  duration_nights: number
  price_basic_usd: number
  price_vip_usd: number | null
  active: boolean
}

export type DbProgramRow = {
  id: string
  name: string
  slug: string | null
  summary: string | null
  cohort: number
  tier: string | null
  duration_days: number
  price_usd: number
  outcomes: string[] | null
  is_composite: boolean
  hero_image_url: string | null
  program_properties: Array<{ role: string | null; properties: DbProperty }>
  program_variants: DbVariant[]
}

export type LandingProgram = {
  id: string
  slug: string | null
  name: string
  blurb: string
  track: string
  cohort: number
  trackColor: string
  tier: string | null
  type: "Composite" | "Rebuild"
  duration: string
  price: string
  tags: string[]
  location: string
  flag: string
  hero_image_url: string | null
  contact_wa: string | null
}

export function mapProgram(row: DbProgramRow): LandingProgram {
  const cohort = COHORT_LABELS[row.cohort] ?? { name: "Reset", tagline: "", color: "var(--accent)" }
  const variants = (row.program_variants ?? []).filter((v) => v.active)

  const days = variants.map((v) => v.duration_days).filter((n) => n > 0)
  const dMin = days.length ? Math.min(...days) : row.duration_days
  const dMax = days.length ? Math.max(...days) : row.duration_days
  const duration = dMin === dMax ? `${dMin} days` : `${dMin}–${dMax} days`

  const prices = variants
    .map((v) => Number(v.price_basic_usd))
    .filter((n) => n > 0)
  const minPrice = prices.length ? Math.min(...prices) : Number(row.price_usd)
  const price = `from $${minPrice.toLocaleString()}`

  const firstProp = row.program_properties?.[0]?.properties
  const locationParts: string[] = []
  if (firstProp?.island) locationParts.push(firstProp.island)
  if (firstProp?.country) locationParts.push(firstProp.country)
  const location = locationParts.join(", ") || (firstProp?.name ?? "")
  const flag = firstProp?.country ? (COUNTRY_FLAGS[firstProp.country] ?? "") : ""

  const contact_wa =
    row.program_properties?.map((pp) => pp.properties?.contact_wa).find((wa) => !!wa) ?? null

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    blurb: row.summary ?? "",
    track: cohort.name,
    cohort: row.cohort,
    trackColor: cohort.color,
    tier: row.tier,
    type: row.is_composite ? "Composite" : "Rebuild",
    duration,
    price,
    tags: row.outcomes ?? [],
    location,
    flag,
    hero_image_url: row.hero_image_url,
    contact_wa,
  }
}
