// Wellness Baseline Score (WBS) v1.0
// Engine spec: DIT Platform Specification v2.2

export type WbsSection = "intent" | "movement" | "sleep" | "lifestyle" | "social" | "medical"

export const WBS_SECTION_LABELS: Record<WbsSection, string> = {
  intent: "Your Goal",
  movement: "Movement & Physical Load",
  sleep: "Sleep & Recovery",
  lifestyle: "Lifestyle & Risk",
  social: "Social & Emotional",
  medical: "Body & Medical Context",
}

export type WbsOption = { value: string; label: string }

export type WbsQuestion =
  | {
      type: "choice"
      id: string
      section: WbsSection
      title: string
      hint?: string
      options: WbsOption[]
    }
  | {
      type: "height_weight"
      id: string
      section: WbsSection
      title: string
      hint?: string
    }

export const WBS_QUESTIONS: WbsQuestion[] = [
  // Q1 — Intent (Q-INT) — must be first
  {
    type: "choice",
    id: "intent",
    section: "intent",
    title: "What brought you here right now?",
    hint: "Choose what fits best — this shapes your personalised programme.",
    options: [
      { value: "A", label: "Body exhausted — no energy, need to reset" },
      { value: "B", label: "Mind won't rest — stress, poor sleep, burnout" },
      { value: "C", label: "Change my body — weight, shape, composition" },
      { value: "D", label: "Improve my appearance — skin, aesthetics, rejuvenation" },
      { value: "E", label: "Optimise — biomarkers, longevity, health data" },
      { value: "F", label: "Physical recovery — sport, training, overreach" },
    ],
  },
  // Q2 — Steps (BODY)
  {
    type: "choice",
    id: "steps",
    section: "movement",
    title: "Daily steps",
    hint: "How many steps do you take on a typical day?",
    options: [
      { value: "lt3k", label: "Less than 3,000" },
      { value: "3to6k", label: "3,000 – 5,999" },
      { value: "6to9k", label: "6,000 – 8,999" },
      { value: "9to12k", label: "9,000 – 11,999" },
      { value: "12kplus", label: "12,000+" },
    ],
  },
  // Q3 — Cardio (BODY)
  {
    type: "choice",
    id: "cardio",
    section: "movement",
    title: "Cardio — elevated heart rate per week",
    hint: "Fast walking, running, cycling, swimming — total minutes per week",
    options: [
      { value: "lt60", label: "Less than 60 min" },
      { value: "60to149", label: "60 – 149 min" },
      { value: "150to299", label: "150 – 299 min" },
      { value: "300to449", label: "300 – 449 min" },
      { value: "450plus", label: "450+ min" },
    ],
  },
  // Q4 — Strength (BODY)
  {
    type: "choice",
    id: "strength",
    section: "movement",
    title: "Strength training",
    hint: "Resistance training — weights, bodyweight, machines",
    options: [
      { value: "no", label: "None" },
      { value: "1x", label: "1× per week" },
      { value: "2to3x", label: "2 – 3× per week" },
      { value: "4plus", label: "4+× per week" },
    ],
  },
  // Q5 — Sleep hours (RECOVERY)
  {
    type: "choice",
    id: "sleep_hours",
    section: "sleep",
    title: "Average sleep duration",
    hint: "Hours per night, most nights",
    options: [
      { value: "lt5", label: "Less than 5 h" },
      { value: "5to6", label: "5 – 5.9 h" },
      { value: "6to7", label: "6 – 6.9 h" },
      { value: "7to8", label: "7 – 7.9 h" },
      { value: "8plus", label: "8+ h" },
    ],
  },
  // Q6 — Sleep quality (RECOVERY ×1.5)
  {
    type: "choice",
    id: "sleep_quality",
    section: "sleep",
    title: "Sleep quality",
    hint: "How rested do you feel on waking?",
    options: [
      { value: "very_tired", label: "Very tired — exhausted on waking" },
      { value: "somewhat_tired", label: "Somewhat tired" },
      { value: "neutral", label: "Neutral — ok but not refreshed" },
      { value: "mostly_rested", label: "Mostly rested" },
      { value: "fully_rested", label: "Fully rested" },
    ],
  },
  // Q7 — Energy (BODY + RECOVERY)
  {
    type: "choice",
    id: "energy",
    section: "sleep",
    title: "Energy through the day",
    hint: "Your typical day — not your best or worst",
    options: [
      { value: "exhausted", label: "Exhausted — hard to function" },
      { value: "low", label: "Low — managing but drained" },
      { value: "moderate", label: "Moderate — some ups and downs" },
      { value: "good", label: "Good — mostly energised" },
      { value: "high", label: "Consistently high" },
    ],
  },
  // Q8 — Disconnect (RECOVERY + MIND)
  {
    type: "choice",
    id: "disconnect",
    section: "sleep",
    title: "Ability to disconnect from work and devices",
    hint: "Outside working hours — evenings, weekends",
    options: [
      { value: "cannot", label: "Cannot at all — always on" },
      { value: "rarely", label: "Rarely manage to switch off" },
      { value: "sometimes", label: "Sometimes — takes effort" },
      { value: "often", label: "Often — mostly succeeds" },
      { value: "easily", label: "Easily — clear boundaries" },
    ],
  },
  // Q9 — Smoking (RISK)
  {
    type: "choice",
    id: "smoking",
    section: "lifestyle",
    title: "Smoking / nicotine use",
    hint: "Cigarettes, vapes, IQOS, pods, cigars, hookah",
    options: [
      { value: "never", label: "Never" },
      { value: "former", label: "Former user" },
      { value: "occasional", label: "Occasionally" },
      { value: "daily", label: "Daily" },
    ],
  },
  // Q10 — Alcohol (RISK + METABOLIC)
  {
    type: "choice",
    id: "alcohol",
    section: "lifestyle",
    title: "Alcohol — drinks per week",
    hint: "1 drink = glass of wine, bottle of beer, or single spirit",
    options: [
      { value: "0", label: "None" },
      { value: "1to3", label: "1 – 3" },
      { value: "4to7", label: "4 – 7" },
      { value: "8to14", label: "8 – 14" },
      { value: "15plus", label: "15+" },
    ],
  },
  // Q11 — Processed meat (METABOLIC + RISK)
  {
    type: "choice",
    id: "processed_meat",
    section: "lifestyle",
    title: "Processed meat consumption",
    hint: "Bacon, sausage, salami, hot dogs, deli meats",
    options: [
      { value: "never", label: "Never / almost never" },
      { value: "1to2", label: "1 – 2 times per week" },
      { value: "3to4", label: "3 – 4 times per week" },
      { value: "5plus", label: "5+ times per week" },
    ],
  },
  // Q12 — Digestion (METABOLIC)
  {
    type: "choice",
    id: "digestion",
    section: "lifestyle",
    title: "Digestive comfort",
    hint: "Bloating, constipation, heaviness after meals — how often?",
    options: [
      { value: "daily", label: "Daily — significant discomfort" },
      { value: "several_week", label: "Several times a week" },
      { value: "sometimes", label: "Sometimes" },
      { value: "rarely", label: "Rarely" },
      { value: "never", label: "Never — no issues" },
    ],
  },
  // Q13 — Quality time (MIND)
  {
    type: "choice",
    id: "quality_time",
    section: "social",
    title: "Quality time with close people",
    hint: "Meaningful time — not errands or routine",
    options: [
      { value: "rarely", label: "Rarely" },
      { value: "1to2_month", label: "1 – 2 times per month" },
      { value: "weekly", label: "Weekly" },
      { value: "several_weekly", label: "Several times per week" },
      { value: "daily", label: "Almost daily" },
    ],
  },
  // Q14 — Relationship satisfaction (MIND)
  {
    type: "choice",
    id: "relationship_sat",
    section: "social",
    title: "Relationship satisfaction",
    hint: "Or with your situation if single",
    options: [
      { value: "very_diss", label: "Very dissatisfied" },
      { value: "diss", label: "Dissatisfied" },
      { value: "neutral", label: "Neutral" },
      { value: "sat", label: "Satisfied" },
      { value: "very_sat", label: "Very satisfied" },
    ],
  },
  // Q15 — Stress (MIND + RECOVERY)
  {
    type: "choice",
    id: "stress",
    section: "social",
    title: "Overall stress level",
    hint: "Your typical week — not a crisis week",
    options: [
      { value: "very_high", label: "Very high" },
      { value: "high", label: "High" },
      { value: "moderate", label: "Moderate" },
      { value: "low", label: "Low" },
      { value: "very_low", label: "Very low" },
    ],
  },
  // Q16 — Life satisfaction (MIND)
  {
    type: "choice",
    id: "life_sat",
    section: "social",
    title: "Life satisfaction overall",
    options: [
      { value: "very_diss", label: "Very dissatisfied" },
      { value: "diss", label: "Dissatisfied" },
      { value: "neutral", label: "Neutral" },
      { value: "sat", label: "Satisfied" },
      { value: "very_sat", label: "Very satisfied" },
    ],
  },
  // Q17 — Sex (RISK baseline)
  {
    type: "choice",
    id: "sex",
    section: "medical",
    title: "Biological sex",
    options: [
      { value: "female", label: "Female" },
      { value: "male", label: "Male" },
      { value: "prefer_not", label: "Prefer not to say" },
    ],
  },
  // Q18 — Age (RISK baseline, 55+ → longstay flag)
  {
    type: "choice",
    id: "age",
    section: "medical",
    title: "Age",
    options: [
      { value: "lt25", label: "Under 25" },
      { value: "25to34", label: "25 – 34" },
      { value: "35to44", label: "35 – 44" },
      { value: "45to54", label: "45 – 54" },
      { value: "55plus", label: "55+" },
    ],
  },
  // Q19 — Height & Weight (METABOLIC — BMI)
  {
    type: "height_weight",
    id: "height_weight",
    section: "medical",
    title: "Height & Weight",
    hint: "Optional — used to compute BMI, a key metabolic marker.",
  },
  // Q20 — Muscle mass (BODY)
  {
    type: "choice",
    id: "muscle_mass",
    section: "medical",
    title: "Above-average muscle mass?",
    hint: "Confirmed by smart scales, DEXA, or consistent heavy training",
    options: [
      { value: "no", label: "No" },
      { value: "not_sure", label: "Not sure" },
      { value: "yes", label: "Yes" },
    ],
  },
  // Q21 — Endurance athlete (BODY)
  {
    type: "choice",
    id: "endurance_athlete",
    section: "medical",
    title: "Endurance athlete status",
    hint: "Training for or competing in Ironman, marathon, triathlon, or similar",
    options: [
      { value: "no", label: "No" },
      { value: "recreational", label: "Recreational endurance" },
      { value: "competitive", label: "Competitive / Ironman-level" },
    ],
  },
  // Q22 — CVD history (RISK + override R7)
  {
    type: "choice",
    id: "cvd_history",
    section: "medical",
    title: "Cardiovascular disease history",
    hint: "Heart attack, stroke, coronary artery disease, heart failure",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes" },
    ],
  },
  // Q23 — Cancer history (RISK + override R1)
  {
    type: "choice",
    id: "cancer_history",
    section: "medical",
    title: "Cancer history",
    hint: "Any type, including skin cancers",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes — in history" },
    ],
  },
]

// ──────────────────────────────────────────
// SCORING ENGINE
// ──────────────────────────────────────────

// answer_value → raw points (0–4).  ×25 converts to 0–100 scale.
// RISK questions: higher pts = riskier. All others: higher = better.
const SCORE: Record<string, Record<string, number>> = {
  "steps:body":             { lt3k: 0, "3to6k": 1, "6to9k": 2, "9to12k": 3, "12kplus": 4 },
  "cardio:body":            { lt60: 0, "60to149": 1, "150to299": 2, "300to449": 3, "450plus": 4 },
  "strength:body":          { no: 0, "1x": 1, "2to3x": 3, "4plus": 4 },
  "energy:body":            { exhausted: 0, low: 1, moderate: 2, good: 3, high: 4 },
  "muscle_mass:body":       { no: 2, not_sure: 2, yes: 4 },
  "endurance_athlete:body": { no: 2, recreational: 3, competitive: 4 },

  "sleep_hours:recovery":   { lt5: 0, "5to6": 1, "6to7": 2, "7to8": 4, "8plus": 3 },
  "sleep_quality:recovery": { very_tired: 0, somewhat_tired: 1, neutral: 2, mostly_rested: 3, fully_rested: 4 },
  "energy:recovery":        { exhausted: 0, low: 1, moderate: 2, good: 3, high: 4 },
  "disconnect:recovery":    { cannot: 0, rarely: 1, sometimes: 2, often: 3, easily: 4 },
  "stress:recovery":        { very_high: 0, high: 1, moderate: 2, low: 3, very_low: 4 },

  "alcohol:metabolic":        { "0": 4, "1to3": 3, "4to7": 2, "8to14": 1, "15plus": 0 },
  "processed_meat:metabolic": { never: 4, "1to2": 3, "3to4": 1, "5plus": 0 },
  "digestion:metabolic":      { daily: 0, several_week: 1, sometimes: 2, rarely: 3, never: 4 },

  "disconnect:mind":       { cannot: 0, rarely: 1, sometimes: 2, often: 3, easily: 4 },
  "quality_time:mind":     { rarely: 0, "1to2_month": 1, weekly: 2, several_weekly: 3, daily: 4 },
  "relationship_sat:mind": { very_diss: 0, diss: 1, neutral: 2, sat: 3, very_sat: 4 },
  "stress:mind":           { very_high: 0, high: 1, moderate: 2, low: 3, very_low: 4 },
  "life_sat:mind":         { very_diss: 0, diss: 1, neutral: 2, sat: 3, very_sat: 4 },

  "smoking:risk":            { never: 0, former: 0.5, occasional: 2, daily: 4 },
  "alcohol:risk":            { "0": 0, "1to3": 0.5, "4to7": 1.5, "8to14": 3, "15plus": 4 },
  "processed_meat:risk":     { never: 0, "1to2": 1, "3to4": 2.5, "5plus": 4 },
  "sex:risk":                { female: 0.5, male: 1, prefer_not: 0.75 },
  "age:risk":                { lt25: 0, "25to34": 0.5, "35to44": 1, "45to54": 2.5, "55plus": 4 },
  "cvd_history:risk":        { no: 0, yes: 4 },
  "cancer_history:risk":     { no: 0, yes: 4 },
}

function sc(qId: string, sub: string, answer: unknown): number | null {
  if (typeof answer !== "string") return null
  const map = SCORE[`${qId}:${sub}`]
  if (!map) return null
  const pts = map[answer]
  return pts != null ? pts * 25 : null
}

function wmean(vals: (number | null)[], weights?: number[]): number {
  let sum = 0, wsum = 0
  for (let i = 0; i < vals.length; i++) {
    const v = vals[i]
    if (v == null) continue
    const w = weights?.[i] ?? 1
    sum += v * w
    wsum += w
  }
  return wsum === 0 ? 50 : Math.round(sum / wsum)
}

function calcBmi(heightCm: unknown, weightKg: unknown): number | null {
  if (typeof heightCm !== "number" || typeof weightKg !== "number") return null
  if (heightCm < 100 || weightKg < 20) return null
  const bmi = weightKg / ((heightCm / 100) ** 2)
  if (bmi < 18.5) return 50
  if (bmi < 23) return 100
  if (bmi < 25) return 75
  if (bmi < 30) return 50
  if (bmi < 35) return 25
  return 0
}

// Intent → focus area, old-style cohort (1–4) for program matching, internal code
const INTENT_MAP: Record<string, { focus: string; cohort: number; code: string }> = {
  A: { focus: "Body & Detox",              cohort: 1, code: "RESET-01" },
  B: { focus: "Sleep & Recovery",          cohort: 3, code: "RESET-05" },
  C: { focus: "Weight & Metabolic Health", cohort: 1, code: "RESET-06" },
  D: { focus: "Beauty & Aesthetics",       cohort: 3, code: "BEAUTY"   },
  E: { focus: "Longevity",                 cohort: 4, code: "RESET-04" },
  F: { focus: "Performance & Energy",      cohort: 2, code: "RESET-02" },
}

export type WbsAnswers = Record<string, string | number | null | undefined>

export type WbsResult = {
  total: number
  body: number
  recovery: number
  metabolic: number
  mind: number
  risk: number
  confidence: number
  intent: string
  focus: string
  cohort: number
  program_code: string
  recommended_duration: number
  medical_review_required: boolean
  medical_flags: string[]
  longstay_candidate: boolean
}

export function computeWbs(answers: WbsAnswers): WbsResult {
  const a = answers
  const bmi = calcBmi(a.height_cm, a.weight_kg)

  const body = wmean([
    sc("steps", "body", a.steps),
    sc("cardio", "body", a.cardio),
    sc("strength", "body", a.strength),
    sc("energy", "body", a.energy),
    sc("muscle_mass", "body", a.muscle_mass),
    sc("endurance_athlete", "body", a.endurance_athlete),
  ])

  const recovery = wmean(
    [
      sc("sleep_hours", "recovery", a.sleep_hours),
      sc("sleep_quality", "recovery", a.sleep_quality),
      sc("energy", "recovery", a.energy),
      sc("disconnect", "recovery", a.disconnect),
      sc("stress", "recovery", a.stress),
    ],
    [1, 1.5, 1, 1, 1],
  )

  const metabolic = wmean(
    [bmi, sc("alcohol", "metabolic", a.alcohol), sc("processed_meat", "metabolic", a.processed_meat), sc("digestion", "metabolic", a.digestion)],
    [1.5, 1, 1, 1],
  )

  const mind = wmean([
    sc("stress", "mind", a.stress),
    sc("life_sat", "mind", a.life_sat),
    sc("relationship_sat", "mind", a.relationship_sat),
    sc("quality_time", "mind", a.quality_time),
    sc("disconnect", "mind", a.disconnect),
  ])

  const risk = wmean([
    sc("smoking", "risk", a.smoking),
    sc("alcohol", "risk", a.alcohol),
    sc("processed_meat", "risk", a.processed_meat),
    sc("sex", "risk", a.sex),
    sc("age", "risk", a.age),
    sc("cvd_history", "risk", a.cvd_history),
    sc("cancer_history", "risk", a.cancer_history),
  ])

  const total = Math.round(0.20 * body + 0.25 * recovery + 0.20 * metabolic + 0.20 * mind + 0.15 * (100 - risk))

  let confidence = 95
  confidence -= Object.values(a).filter((v) => v === "not_sure").length * 3
  if (bmi === null) confidence -= 5
  confidence = Math.max(40, Math.min(95, confidence))

  const medical_flags: string[] = []
  let medical_review_required = false
  if (a.cancer_history === "yes") { medical_flags.push("cancer_history"); medical_review_required = true }
  if (a.cvd_history === "yes") { medical_flags.push("cardiovascular") }
  if (a.smoking === "daily") { medical_flags.push("nicotine_daily") }
  if (a.alcohol === "15plus") { medical_flags.push("alcohol_15plus"); medical_review_required = true }
  else if (a.alcohol === "8to14") { medical_flags.push("alcohol_8to14") }
  if (body < 20 || recovery < 20 || metabolic < 20 || mind < 20 || total < 35) medical_review_required = true

  const longstay_candidate = a.age === "55plus"

  const intent = typeof a.intent === "string" ? a.intent : ""
  let mapping = INTENT_MAP[intent]
  if (!mapping) {
    // R5: intent skipped — route by worst subscale
    const ranked = [
      { s: recovery, key: "B" },
      { s: metabolic, key: "C" },
      { s: body,     key: "A" },
      { s: mind,     key: "B" },
    ].sort((x, y) => x.s - y.s)
    mapping = INTENT_MAP[ranked[0].key]
  }

  // R7: CVD + performance or weight programme → medical review
  if (a.cvd_history === "yes" && (mapping.code === "RESET-02" || mapping.code === "RESET-06")) {
    medical_review_required = true
  }

  let recommended_duration = 8
  if (mapping.code === "RESET-02") {
    recommended_duration = body >= 55 ? 4 : body >= 40 ? 6 : 8
  } else {
    const rel =
      mapping.code === "RESET-05" ? Math.round((recovery + mind) / 2) :
      mapping.code === "RESET-01" || mapping.code === "RESET-06" ? Math.round((body + metabolic) / 2) :
      total
    recommended_duration = rel <= 35 ? 11 : rel <= 55 ? 8 : 6
  }

  return {
    total,
    body,
    recovery,
    metabolic,
    mind,
    risk,
    confidence,
    intent,
    focus: mapping.focus,
    cohort: mapping.cohort,
    program_code: mapping.code,
    recommended_duration,
    medical_review_required,
    medical_flags,
    longstay_candidate,
  }
}
