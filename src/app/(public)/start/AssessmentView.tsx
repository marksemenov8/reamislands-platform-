"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  WBS_QUESTIONS,
  WBS_SECTION_LABELS,
  computeWbs,
  type WbsAnswers,
  type WbsQuestion,
} from "@/lib/wbs"
import { Icon } from "../_components/Icon"

const CHAT_QUESTIONS: Array<Extract<WbsQuestion, { type: "choice" }>> = WBS_QUESTIONS.filter(
  (q): q is Extract<WbsQuestion, { type: "choice" }> => q.type === "choice",
)

type Phase = "questions" | "contact" | "submitting" | "done"

type ContactForm = {
  name: string
  whatsapp: string
  email: string
  country: string
}

export default function AssessmentView() {
  const router = useRouter()
  const total = CHAT_QUESTIONS.length

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [phase, setPhase] = useState<Phase>("questions")
  const [contact, setContact] = useState<ContactForm>({ name: "", whatsapp: "", email: "", country: "" })
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [score, setScore] = useState<ReturnType<typeof computeWbs> | null>(null)

  const scrollerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new question / phase change
  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" })
    }
  }, [step, phase])

  const current = CHAT_QUESTIONS[step]
  const progress = Math.min(step / total, 1)

  function pickAnswer(value: string) {
    const newAnswers = { ...answers, [current.id]: value }
    setAnswers(newAnswers)
    if (step + 1 >= total) {
      setStep(total)
      setTimeout(() => setPhase("contact"), 350)
    } else {
      setStep(step + 1)
    }
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
      for (const q of WBS_QUESTIONS) wbsAnswers[q.id] = answers[q.id] ?? null
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
          raw_payload: {
            wbs_version: 1,
            answers: wbsAnswers,
            sub_scores: {
              movement: result.movement,
              recovery: result.recovery,
              lifestyle_risk: result.lifestyle_risk,
              emotional: result.emotional,
            },
            recommendation: result.recommendation,
            flags: result.flags,
          },
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

  // Section transitions to render inline
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
          {CHAT_QUESTIONS.slice(0, step).map((q) => {
            const sectionLabel = WBS_SECTION_LABELS[q.section]
            const showSection = !renderedSections.has(q.section)
            if (showSection) renderedSections.add(q.section)
            const answerValue = answers[q.id]
            const opt = q.options.find((o) => o.value === answerValue)
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
                  <div className="bubble bubble-answer">{opt?.label ?? answerValue}</div>
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
                <div
                  className="rise"
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  <div className="bubble bubble-prompt">
                    {current.title}
                    {current.hint && (
                      <div className="body-sm" style={{ marginTop: 4, color: "var(--ink-3)" }}>
                        {current.hint}
                      </div>
                    )}
                  </div>
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
                  We&apos;ll send your baseline score and matched programs to WhatsApp.
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

          {/* Submitting */}
          {phase === "submitting" && (
            <div className="bubble bubble-prompt">Computing your score…</div>
          )}

          {/* Done */}
          {phase === "done" && score && (
            <div className="rise" style={{ marginTop: 8 }}>
              <div className="card" style={{ padding: 28, textAlign: "center" }}>
                <div style={{ fontSize: 42, marginBottom: 6 }}>🌿</div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Baseline complete</div>
                <h2
                  className="display"
                  style={{ margin: "0 0 8px", fontSize: 32, color: "var(--accent)" }}
                >
                  <span className="display-italic">Beautiful.</span>
                </h2>
                <p className="body" style={{ margin: "0 0 16px" }}>
                  Redirecting to your matched programs…
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

function ScoreReveal({ score }: { score: ReturnType<typeof computeWbs> }) {
  const cats = useMemo(
    () => [
      { label: "Movement", val: score.movement },
      { label: "Recovery", val: score.recovery },
      { label: "Lifestyle", val: score.lifestyle_risk },
      { label: "Emotional", val: score.emotional },
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
      <div className="body-sm" style={{ marginBottom: 18, textAlign: "center" }}>
        {score.recommendation}
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
              style={{
                height: 8,
                borderRadius: 4,
                background: "var(--surface)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${c.val}%`,
                  background: "var(--accent)",
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
