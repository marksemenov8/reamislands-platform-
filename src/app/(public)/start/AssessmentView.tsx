"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  WBS_QUESTIONS,
  WBS_SECTION_LABELS,
  computeWbs,
  type WbsAnswers,
  type WbsQuestion,
  type WbsResult,
} from "@/lib/wbs"
import { Icon } from "../_components/Icon"

const ALL_QUESTIONS = WBS_QUESTIONS.filter(
  (q): q is Extract<WbsQuestion, { type: "choice" }> | Extract<WbsQuestion, { type: "height_weight" }> =>
    q.type === "choice" || q.type === "height_weight",
)

type Phase = "questions" | "contact" | "submitting" | "done"
type ContactForm = { name: string; whatsapp: string; email: string; country: string }

export default function AssessmentView() {
  const router = useRouter()
  const total = ALL_QUESTIONS.length

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | number | null>>({})
  const [phase, setPhase] = useState<Phase>("questions")
  const [contact, setContact] = useState<ContactForm>({ name: "", whatsapp: "", email: "", country: "" })
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [score, setScore] = useState<WbsResult | null>(null)

  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" })
    }
  }, [step, phase])

  const current = ALL_QUESTIONS[step]
  const progress = Math.min(step / total, 1)

  function advance(newAnswers: Record<string, string | number | null>) {
    setAnswers(newAnswers)
    if (step + 1 >= total) {
      setStep(total)
      setTimeout(() => setPhase("contact"), 350)
    } else {
      setStep(step + 1)
    }
  }

  function pickAnswer(value: string) {
    advance({ ...answers, [current.id]: value })
  }

  function pickHeightWeight(heightCm: number | null, weightKg: number | null) {
    advance({ ...answers, height_cm: heightCm, weight_kg: weightKg })
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (!contact.whatsapp.trim()) {
      setSubmitError("WhatsApp number is required so we can reach you.")
      return
    }
    setPhase("submitting")
    try {
      const wbsAnswers: WbsAnswers = {}
      for (const q of ALL_QUESTIONS) {
        if (q.type === "choice") wbsAnswers[q.id] = answers[q.id] ?? null
      }
      wbsAnswers.height_cm = typeof answers.height_cm === "number" ? answers.height_cm : null
      wbsAnswers.weight_kg = typeof answers.weight_kg === "number" ? answers.weight_kg : null

      const result = computeWbs(wbsAnswers)

      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contact.name.trim() || null,
          whatsapp: contact.whatsapp.trim(),
          email: contact.email.trim() || null,
          country: contact.country.trim() || null,
          wbs_score: result.total,
          cohort: result.cohort,
          source: "wbs_form",
          intent: result.intent,
          focus: result.focus,
          program_code: result.program_code,
          recommended_duration: result.recommended_duration,
          confidence: result.confidence,
          sub_body: result.body,
          sub_recovery: result.recovery,
          sub_metabolic: result.metabolic,
          sub_mind: result.mind,
          sub_risk: result.risk,
          medical_review_required: result.medical_review_required,
          medical_flags: result.medical_flags,
          longstay_candidate: result.longstay_candidate,
          height_cm: wbsAnswers.height_cm,
          weight_kg: wbsAnswers.weight_kg,
          raw_answers: wbsAnswers,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setSubmitError(json.error ?? "Submission failed — please try again.")
        setPhase("contact")
        return
      }
      setScore(result)
      setPhase("done")
      setTimeout(() => router.push(`/matched/${json.user.id}`), 2200)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Network error")
      setPhase("contact")
    }
  }

  const renderedSections = new Set<string>()

  return (
    <div className="page" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <div className="shell" style={{ paddingTop: 16, paddingBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Wellness Baseline</div>
            <div
              style={{
                height: 6,
                borderRadius: 6,
                background: "var(--surface-2)",
                overflow: "hidden",
                border: "1px solid var(--line-2)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress * 100}%`,
                  background: "var(--accent)",
                  transition: "width .35s ease",
                  borderRadius: 6,
                }}
              />
            </div>
            <div className="body-sm" style={{ marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
              {Math.min(step, total)} / {total}
              {current && phase === "questions" ? ` · ${WBS_SECTION_LABELS[current.section]}` : ""}
              {phase === "contact" ? " · Contact details" : ""}
              {phase === "done" ? " · Complete" : ""}
            </div>
          </div>
        </div>
      </div>

      <div
        ref={scrollerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 var(--pad) 32px",
          maxWidth: 560,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <div style={{ padding: "16px 0 24px" }}>
          <h1 className="display" style={{ margin: 0, fontSize: 38, color: "var(--ink)" }}>
            Hello, <span className="display-italic" style={{ color: "var(--accent)" }}>friend</span>.
          </h1>
          <p className="body" style={{ margin: "8px 0 0" }}>
            Let&apos;s find your wellbeing baseline. {total} questions · 5 minutes.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Answered history */}
          {ALL_QUESTIONS.slice(0, step).map((q) => {
            const sectionLabel = WBS_SECTION_LABELS[q.section]
            const showSection = !renderedSections.has(q.section)
            if (showSection) renderedSections.add(q.section)

            let answerDisplay: string
            if (q.type === "height_weight") {
              const hcm = answers.height_cm
              const wkg = answers.weight_kg
              if (hcm || wkg) {
                answerDisplay = [hcm && `${hcm} cm`, wkg && `${wkg} kg`].filter(Boolean).join(" / ")
              } else {
                answerDisplay = "Skipped"
              }
            } else {
              const opt = q.options.find((o) => o.value === answers[q.id])
              answerDisplay = opt?.label ?? String(answers[q.id] ?? "")
            }

            return (
              <div key={q.id}>
                {showSection && <SectionLabel label={sectionLabel} />}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="bubble bubble-prompt">
                    {q.title}
                    {q.hint && (
                      <div className="body-sm" style={{ marginTop: 4, color: "var(--ink-3)" }}>
                        {q.hint}
                      </div>
                    )}
                  </div>
                  <div className="bubble bubble-answer">{answerDisplay}</div>
                </div>
              </div>
            )
          })}

          {/* Current question */}
          {phase === "questions" && current && (() => {
            const sectionLabel = WBS_SECTION_LABELS[current.section]
            const showSection = !renderedSections.has(current.section)
            if (showSection) renderedSections.add(current.section)
            return (
              <div>
                {showSection && <SectionLabel label={sectionLabel} />}
                <div className="rise" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div className="bubble bubble-prompt">
                    {current.title}
                    {current.hint && (
                      <div className="body-sm" style={{ marginTop: 4, color: "var(--ink-3)" }}>
                        {current.hint}
                      </div>
                    )}
                  </div>
                  {current.type === "choice" && (
                    <div style={{ display: "grid", gap: 8, marginTop: 4 }}>
                      {current.options.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => pickAnswer(opt.value)}
                          style={{
                            padding: "14px 18px",
                            background: "var(--accent)",
                            color: "var(--accent-ink)",
                            borderRadius: "var(--r-pill)",
                            fontSize: 15,
                            fontWeight: 500,
                            textAlign: "center",
                            transition: "transform .15s, background .2s",
                            border: 0,
                            cursor: "pointer",
                          }}
                          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.97)")}
                          onMouseUp={(e) => (e.currentTarget.style.transform = "")}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {current.type === "height_weight" && (
                    <HeightWeightCard onContinue={pickHeightWeight} />
                  )}
                </div>
              </div>
            )
          })()}

          {/* Contact form */}
          {phase === "contact" && (
            <div className="rise" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="bubble bubble-prompt">
                Last step — how do we reach you?
                <div className="body-sm" style={{ marginTop: 4, color: "var(--ink-3)" }}>
                  We&apos;ll send your baseline score and matched programmes to WhatsApp.
                </div>
              </div>
              <form
                onSubmit={onSubmit}
                className="card"
                style={{ padding: 22, display: "grid", gap: 12 }}
              >
                <label style={{ display: "block" }}>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>Your name</div>
                  <input
                    className="field"
                    autoFocus
                    placeholder="Alex Carter"
                    value={contact.name}
                    onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  />
                </label>
                <label style={{ display: "block" }}>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>
                    WhatsApp number <span style={{ color: "var(--accent)" }}>*</span>
                  </div>
                  <input
                    className="field"
                    placeholder="+65 9123 4567"
                    value={contact.whatsapp}
                    required
                    onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })}
                  />
                </label>
                <label style={{ display: "block" }}>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>Email (optional)</div>
                  <input
                    className="field"
                    type="email"
                    placeholder="alex@example.com"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  />
                </label>
                <label style={{ display: "block" }}>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>Country (optional)</div>
                  <input
                    className="field"
                    placeholder="Singapore"
                    value={contact.country}
                    onChange={(e) => setContact({ ...contact, country: e.target.value })}
                  />
                </label>
                {submitError && (
                  <div
                    role="alert"
                    style={{
                      padding: "10px 14px",
                      borderRadius: 12,
                      background: "rgba(168,54,43,.1)",
                      color: "#a8362b",
                      fontSize: 13,
                    }}
                  >
                    {submitError}
                  </div>
                )}
                <button type="submit" className="btn btn-primary btn-block btn-lg">
                  See my baseline <Icon.arrow width={16} height={16} />
                </button>
              </form>
            </div>
          )}

          {phase === "submitting" && (
            <div className="bubble bubble-prompt">Computing your score…</div>
          )}

          {phase === "done" && score && (
            <div className="rise" style={{ marginTop: 8 }}>
              <div className="card" style={{ padding: 28, textAlign: "center" }}>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Baseline complete</div>
                <h2 className="display" style={{ margin: "0 0 8px", fontSize: 32, color: "var(--accent)" }}>
                  <span className="display-italic">Beautiful.</span>
                </h2>
                <p className="body" style={{ margin: "0 0 16px" }}>
                  Redirecting to your matched programmes…
                </p>
                <ScoreReveal score={score} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ textAlign: "center", margin: "10px 0 4px" }}>
      <span
        style={{
          fontSize: 11,
          letterSpacing: ".14em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
          fontWeight: 600,
        }}
      >
        — {label} —
      </span>
    </div>
  )
}

function HeightWeightCard({ onContinue }: { onContinue: (hcm: number | null, wkg: number | null) => void }) {
  const [hStr, setHStr] = useState("")
  const [wStr, setWStr] = useState("")

  function handleContinue() {
    const hcm = hStr ? Math.round(parseFloat(hStr)) : null
    const wkg = wStr ? Math.round(parseFloat(wStr) * 10) / 10 : null
    onContinue(
      hcm && hcm >= 100 && hcm <= 250 ? hcm : null,
      wkg && wkg >= 20 && wkg <= 350 ? wkg : null,
    )
  }

  return (
    <div className="card" style={{ padding: 20, display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label style={{ display: "block" }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Height (cm)</div>
          <input
            className="field"
            type="number"
            placeholder="172"
            min={100}
            max={250}
            value={hStr}
            onChange={(e) => setHStr(e.target.value)}
            autoFocus
          />
        </label>
        <label style={{ display: "block" }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Weight (kg)</div>
          <input
            className="field"
            type="number"
            placeholder="68"
            min={20}
            max={350}
            step={0.5}
            value={wStr}
            onChange={(e) => setWStr(e.target.value)}
          />
        </label>
      </div>
      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={handleContinue}
      >
        Continue →
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-block"
        style={{ fontSize: 13 }}
        onClick={() => onContinue(null, null)}
      >
        Skip
      </button>
    </div>
  )
}

function barColor(v: number) {
  return v >= 50 ? "var(--accent)" : "#d4882a"
}

function ScoreReveal({ score }: { score: WbsResult }) {
  const cats = useMemo(
    () => [
      { label: "Body", val: score.body },
      { label: "Recovery", val: score.recovery },
      { label: "Metabolic", val: score.metabolic },
      { label: "Mind", val: score.mind },
      { label: "Safety", val: Math.round(100 - score.risk) },
    ],
    [score],
  )

  return (
    <div style={{ marginTop: 12, textAlign: "left" }}>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 78,
          lineHeight: 1,
          color: "var(--accent)",
          fontVariantNumeric: "tabular-nums",
          textAlign: "center",
        }}
      >
        {score.total}
        <span style={{ fontSize: 28, color: "var(--ink-3)" }}>/100</span>
      </div>
      <div className="body-sm" style={{ marginBottom: 18, textAlign: "center", color: "var(--ink-2)" }}>
        {score.focus}
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {cats.map((c) => (
          <div key={c.label}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                marginBottom: 4,
                color: "var(--ink-2)",
              }}
            >
              <span>{c.label}</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{c.val}</span>
            </div>
            <div
              style={{ height: 8, borderRadius: 4, background: "var(--surface)", overflow: "hidden" }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${c.val}%`,
                  background: barColor(c.val),
                  transition: "width 1s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
