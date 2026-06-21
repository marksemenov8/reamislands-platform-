// Wellness Baseline Score (WBS) — schema + scoring
// Source: Wellness Baseline Score (WBS) assessment.pdf (Notion export)
// Tune weights here; all UI/intake reads from this module.

export type WbsSection =
  | "movement"
  | "recovery"
  | "lifestyle_risk"
  | "emotional"
  | "context"

export type WbsOption = { value: string; label: string; score: number }

export type WbsQuestion =
  | {
      id: string
      section: WbsSection
      title: string
      hint?: string
      type: "choice"
      required: boolean
      options: WbsOption[]
    }
  | {
      id: string
      section: WbsSection
      title: string
      hint?: string
      type: "number"
      required: boolean
      min?: number
      max?: number
      unit?: string
    }

export const WBS_SECTION_LABELS: Record<WbsSection, string> = {
  movement: "Movement & Physical Load",
  recovery: "Sleep & Recovery",
  lifestyle_risk: "Lifestyle & Risk",
  emotional: "Social, Emotional & Stress",
  context: "Body & Medical Context",
}

export const WBS_QUESTIONS: WbsQuestion[] = [
  // Section 1 — Movement
  {
    id: "steps",
    section: "movement",
    title: "Daily steps",
    hint: "How many steps do you usually take per day? (Phone or smartwatch.)",
    type: "choice",
    required: true,
    options: [
      { value: "lt3k", label: "Less than 3,000", score: 0 },
      { value: "3to6k", label: "3,000 – 5,999", score: 0.25 },
      { value: "6to9k", label: "6,000 – 8,999", score: 0.5 },
      { value: "9to12k", label: "9,000 – 11,999", score: 0.75 },
      { value: "12kplus", label: "12,000+", score: 1 },
    ],
  },
  {
    id: "cardio",
    section: "movement",
    title: "Cardio / elevated HR per week",
    hint: "Fast walking, running, cycling, swimming — minutes per week",
    type: "choice",
    required: true,
    options: [
      { value: "lt60", label: "Less than 60 min", score: 0 },
      { value: "60to149", label: "60–149 min", score: 0.25 },
      { value: "150to299", label: "150–299 min", score: 0.5 },
      { value: "300to449", label: "300–449 min", score: 0.75 },
      { value: "450plus", label: "450+ min", score: 1 },
    ],
  },
  {
    id: "strength",
    section: "movement",
    title: "Strength / resistance training",
    hint: "Do you regularly do strength training?",
    type: "choice",
    required: true,
    options: [
      { value: "no", label: "No", score: 0 },
      { value: "1x", label: "1× per week", score: 0.33 },
      { value: "2to3x", label: "2–3× per week", score: 0.66 },
      { value: "4plus", label: "4+ × per week", score: 1 },
    ],
  },

  // Section 2 — Sleep & Recovery
  {
    id: "sleep_hours",
    section: "recovery",
    title: "Average sleep duration",
    hint: "Hours per night, typical",
    type: "choice",
    required: true,
    options: [
      { value: "lt5", label: "Less than 5 h", score: 0 },
      { value: "5to6", label: "5–5.9 h", score: 0.25 },
      { value: "6to7", label: "6–6.9 h", score: 0.5 },
      { value: "7to8", label: "7–7.9 h", score: 1 },
      { value: "8plus", label: "8+ h", score: 1 },
    ],
  },
  {
    id: "sleep_quality",
    section: "recovery",
    title: "Sleep quality (subjective)",
    hint: "How rested do you feel when you wake up?",
    type: "choice",
    required: true,
    options: [
      { value: "very_tired", label: "Very tired", score: 0 },
      { value: "somewhat_tired", label: "Somewhat tired", score: 0.25 },
      { value: "neutral", label: "Neutral", score: 0.5 },
      { value: "mostly_rested", label: "Mostly rested", score: 0.75 },
      { value: "fully_rested", label: "Fully rested", score: 1 },
    ],
  },

  // Section 3 — Lifestyle Risk
  {
    id: "smoking",
    section: "lifestyle_risk",
    title: "Smoking / nicotine use",
    hint: "Cigarettes, vapes, IQOS, pods, cigars, hookah",
    type: "choice",
    required: true,
    options: [
      { value: "never", label: "Never", score: 1 },
      { value: "former", label: "Former user", score: 0.75 },
      { value: "occasional", label: "Occasionally", score: 0.25 },
      { value: "daily", label: "Daily", score: 0 },
    ],
  },
  {
    id: "alcohol",
    section: "lifestyle_risk",
    title: "Alcohol — drinks per week",
    hint: "1 drink = wine / beer / spirits",
    type: "choice",
    required: true,
    options: [
      { value: "0", label: "0", score: 1 },
      { value: "1to3", label: "1–3", score: 0.85 },
      { value: "4to7", label: "4–7", score: 0.6 },
      { value: "8to14", label: "8–14", score: 0.25 },
      { value: "15plus", label: "15+", score: 0 },
    ],
  },
  {
    id: "processed_meat",
    section: "lifestyle_risk",
    title: "Processed meat consumption",
    hint: "Bacon, sausages, salami, hot dogs, deli meats",
    type: "choice",
    required: true,
    options: [
      { value: "never", label: "Never / almost never", score: 1 },
      { value: "1to2", label: "1–2 times per week", score: 0.66 },
      { value: "3to4", label: "3–4 times per week", score: 0.33 },
      { value: "5plus", label: "5+ times per week", score: 0 },
    ],
  },
  {
    id: "seatbelt",
    section: "lifestyle_risk",
    title: "Seatbelt use",
    type: "choice",
    required: true,
    options: [
      { value: "always", label: "Always", score: 1 },
      { value: "often", label: "Often", score: 0.66 },
      { value: "sometimes", label: "Sometimes", score: 0.33 },
      { value: "rare", label: "Rarely / Never", score: 0 },
    ],
  },
  {
    id: "phone_driving",
    section: "lifestyle_risk",
    title: "Phone use while driving",
    type: "choice",
    required: true,
    options: [
      { value: "never", label: "Never", score: 1 },
      { value: "rarely", label: "Rarely", score: 0.66 },
      { value: "sometimes", label: "Sometimes", score: 0.33 },
      { value: "often", label: "Often", score: 0 },
    ],
  },
  {
    id: "motorcycle",
    section: "lifestyle_risk",
    title: "Motorcycle riding",
    hint: "As driver or passenger",
    type: "choice",
    required: true,
    options: [
      { value: "no", label: "No", score: 1 },
      { value: "occasional", label: "Occasionally", score: 0.5 },
      { value: "regular", label: "Regularly", score: 0.25 },
    ],
  },

  // Section 5 — Social & Emotional
  {
    id: "quality_time",
    section: "emotional",
    title: "Quality time with close people",
    hint: "Not errands or routine — meaningful time",
    type: "choice",
    required: true,
    options: [
      { value: "rarely", label: "Rarely", score: 0 },
      { value: "1to2_month", label: "1–2 times per month", score: 0.25 },
      { value: "weekly", label: "Weekly", score: 0.5 },
      { value: "several_weekly", label: "Several times per week", score: 0.75 },
      { value: "daily", label: "Almost daily", score: 1 },
    ],
  },
  {
    id: "relationship_status",
    section: "emotional",
    title: "Relationship status",
    type: "choice",
    required: true,
    options: [
      { value: "single", label: "Single", score: 0.5 },
      { value: "in_relationship", label: "In a relationship", score: 0.75 },
      { value: "married", label: "Married / long-term partnership", score: 1 },
    ],
  },
  {
    id: "relationship_satisfaction",
    section: "emotional",
    title: "Relationship satisfaction",
    hint: "Or with your situation if single",
    type: "choice",
    required: true,
    options: [
      { value: "very_diss", label: "Very dissatisfied", score: 0 },
      { value: "diss", label: "Dissatisfied", score: 0.25 },
      { value: "neutral", label: "Neutral", score: 0.5 },
      { value: "sat", label: "Satisfied", score: 0.75 },
      { value: "very_sat", label: "Very satisfied", score: 1 },
    ],
  },
  {
    id: "stress",
    section: "emotional",
    title: "Overall stress level",
    type: "choice",
    required: true,
    options: [
      { value: "very_high", label: "Very high", score: 0 },
      { value: "high", label: "High", score: 0.25 },
      { value: "moderate", label: "Moderate", score: 0.5 },
      { value: "low", label: "Low", score: 0.75 },
      { value: "very_low", label: "Very low", score: 1 },
    ],
  },
  {
    id: "life_satisfaction",
    section: "emotional",
    title: "Life satisfaction overall",
    type: "choice",
    required: true,
    options: [
      { value: "very_diss", label: "Very dissatisfied", score: 0 },
      { value: "diss", label: "Dissatisfied", score: 0.25 },
      { value: "neutral", label: "Neutral", score: 0.5 },
      { value: "sat", label: "Satisfied", score: 0.75 },
      { value: "very_sat", label: "Very satisfied", score: 1 },
    ],
  },

  // Section 7 — Body & Medical Context (not scored; informs flags)
  {
    id: "sex",
    section: "context",
    title: "Biological sex",
    type: "choice",
    required: true,
    options: [
      { value: "female", label: "Female", score: 0 },
      { value: "male", label: "Male", score: 0 },
    ],
  },
  {
    id: "age",
    section: "context",
    title: "Age",
    type: "choice",
    required: true,
    options: [
      { value: "lt25", label: "Under 25", score: 0 },
      { value: "25to34", label: "25–34", score: 0 },
      { value: "35to44", label: "35–44", score: 0 },
      { value: "45to54", label: "45–54", score: 0 },
      { value: "55plus", label: "55+", score: 0 },
    ],
  },
  {
    id: "weight_kg",
    section: "context",
    title: "Body weight (optional)",
    hint: "kg — used as context for program intensity",
    type: "number",
    required: false,
    min: 30,
    max: 250,
    unit: "kg",
  },
  {
    id: "muscle_mass",
    section: "context",
    title: "Above-average muscle mass?",
    hint: "From regular strength training; smart scales or DEXA",
    type: "choice",
    required: true,
    options: [
      { value: "no", label: "No", score: 0 },
      { value: "not_sure", label: "Not sure", score: 0 },
      { value: "yes", label: "Yes", score: 0 },
    ],
  },
  {
    id: "endurance_athlete",
    section: "context",
    title: "Endurance athlete status",
    hint: "Training for / competing in Ironman or similar",
    type: "choice",
    required: true,
    options: [
      { value: "no", label: "No", score: 0 },
      { value: "recreational", label: "Recreational endurance", score: 0 },
      { value: "competitive", label: "Competitive / Ironman", score: 0 },
    ],
  },
  {
    id: "cvd_history",
    section: "context",
    title: "Cardiovascular disease history",
    type: "choice",
    required: true,
    options: [
      { value: "no", label: "No", score: 0 },
      { value: "yes", label: "Yes", score: 0 },
    ],
  },
  {
    id: "cancer_history",
    section: "context",
    title: "Cancer history",
    hint: "Any type, including skin",
    type: "choice",
    required: true,
    options: [
      { value: "no", label: "No", score: 0 },
      { value: "yes", label: "Yes", score: 0 },
    ],
  },
]

export type WbsAnswers = Record<string, string | number | null | undefined>

export type WbsResult = {
  total: number // 0-100, integer
  movement: number // 0-100
  recovery: number
  lifestyle_risk: number
  emotional: number
  cohort: 1 | 2 | 3
  recommendation: "Reset & Recovery" | "Performance & Energy" | "Longevity & Balance"
  flags: { cvd: boolean; cancer: boolean }
}

function answerScore(q: WbsQuestion, answer: string | number | null | undefined): number | null {
  if (q.type !== "choice") return null
  if (typeof answer !== "string") return null
  const opt = q.options.find((o) => o.value === answer)
  return opt?.score ?? null
}

function sectionAvg(answers: WbsAnswers, section: WbsSection): number {
  const qs = WBS_QUESTIONS.filter((q) => q.section === section && q.type === "choice")
  let sum = 0
  let n = 0
  for (const q of qs) {
    const s = answerScore(q, answers[q.id])
    if (s == null) continue
    sum += s
    n += 1
  }
  return n === 0 ? 0 : Math.round((sum / n) * 100)
}

export function computeWbs(answers: WbsAnswers): WbsResult {
  const movement = sectionAvg(answers, "movement")
  const recovery = sectionAvg(answers, "recovery")
  const lifestyle_risk = sectionAvg(answers, "lifestyle_risk")
  const emotional = sectionAvg(answers, "emotional")
  const total = Math.round((movement + recovery + lifestyle_risk + emotional) / 4)

  let cohort: 1 | 2 | 3
  let recommendation: WbsResult["recommendation"]
  if (total >= 70) {
    cohort = 1
    recommendation = "Reset & Recovery"
  } else if (total >= 50) {
    cohort = 2
    recommendation = "Performance & Energy"
  } else {
    cohort = 3
    recommendation = "Longevity & Balance"
  }

  return {
    total,
    movement,
    recovery,
    lifestyle_risk,
    emotional,
    cohort,
    recommendation,
    flags: {
      cvd: answers["cvd_history"] === "yes",
      cancer: answers["cancer_history"] === "yes",
    },
  }
}
