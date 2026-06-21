"use client"

import Link from "next/link"
import { useState } from "react"
import { COHORT_LABELS } from "../../_lib/programMapping"
import { Icon } from "../../_components/Icon"
import ProgramImage from "../../_components/ProgramImage"

export type MatchedProperty = {
  name: string
  island: string | null
  country: string | null
  contact_wa: string | null
}

export type MatchedProgram = {
  id: string
  name: string
  slug: string | null
  cohort: number
  tier: string | null
  duration_days: number
  price_usd: number
  outcomes: string[] | null
  is_composite: boolean
  hero_image_url: string | null
  summary: string | null
  program_properties: { role: string | null; properties: MatchedProperty }[]
  program_variants: Array<{
    duration_days: number
    duration_nights: number
    price_basic_usd: number
    active: boolean
  }>
}

type SubScores = {
  body?: number
  recovery?: number
  metabolic?: number
  mind?: number
  risk?: number
}

function scoreColor(s: number): string {
  if (s >= 70) return "var(--accent)"
  if (s >= 50) return "#d4882a"
  return "#a87840"
}

export default function MatchedView({
  userId,
  name,
  wbsScore,
  cohort,
  focus,
  subScores,
  flags,
  programs,
}: {
  userId: string
  name: string | null
  wbsScore: number | null
  cohort: number | null
  focus: string | null
  subScores: SubScores
  flags: { cvd?: boolean; cancer?: boolean }
  programs: MatchedProgram[]
}) {
  const [reserveTarget, setReserveTarget] = useState<MatchedProgram | null>(null)
  const [reservedIds, setReservedIds] = useState<Set<string>>(new Set())
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitOk, setSubmitOk] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [arrival, setArrival] = useState("")
  const [departure, setDeparture] = useState("")
  const [pax, setPax] = useState(1)

  const cohortLabel = cohort != null ? COHORT_LABELS[cohort] : null
  const hasFlag = flags.cvd || flags.cancer
  const today = new Date().toISOString().slice(0, 10)

  const safetyScore = subScores.risk != null ? Math.round(100 - subScores.risk) : undefined

  function openReserve(p: MatchedProgram) {
    setReserveTarget(p)
    setArrival("")
    setDeparture("")
    setPax(1)
    setSubmitError(null)
  }
  function closeReserve() {
    setReserveTarget(null)
    setSubmitError(null)
  }

  async function onReserveSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reserveTarget) return
    if (!arrival || !departure) { setSubmitError("Pick arrival and departure dates"); return }
    if (departure <= arrival) { setSubmitError("Departure must be after arrival"); return }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch("/api/bookings/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, program_id: reserveTarget.id, arrival, departure, pax }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) { setSubmitError(json.error ?? "Could not save inquiry"); return }
      setReservedIds((s) => new Set(s).add(reserveTarget.id))
      setSubmitOk(`Inquiry sent for ${reserveTarget.name}. We'll WhatsApp you within one business day.`)
      setReserveTarget(null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page" style={{ paddingBottom: 80 }}>
      <section className="shell" style={{ paddingTop: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Your wellness baseline</div>
        <h1
          className="display"
          style={{ margin: 0, fontSize: "clamp(40px, 10vw, 72px)", color: "var(--ink)" }}
        >
          {name ? (
            <>
              {name}, <span className="display-italic" style={{ color: "var(--accent)" }}>welcome</span>.
            </>
          ) : (
            <>
              Welcome, <span className="display-italic" style={{ color: "var(--accent)" }}>friend</span>.
            </>
          )}
        </h1>
        <p className="body-lg" style={{ marginTop: 16, maxWidth: 620 }}>
          Here&apos;s your baseline score and matched programmes. Reserve dates inline or chat with
          our team on WhatsApp.
        </p>

        <div className="matched-summary" style={{ display: "grid", gap: 16, marginTop: 32 }}>
          <div className="card" style={{ padding: 28, textAlign: "center" }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Baseline score</div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 96,
                lineHeight: 1,
                color: wbsScore != null ? scoreColor(wbsScore) : "var(--ink-3)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {wbsScore ?? "—"}
              <span style={{ fontSize: 32, color: "var(--ink-3)" }}>/100</span>
            </div>
          </div>
          <div className="card" style={{ padding: 28 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Primary focus</div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 28,
                color: "var(--ink)",
                marginBottom: 10,
              }}
            >
              {focus ?? "—"}
            </div>
            {cohortLabel && (
              <span className="tag" style={{ background: cohortLabel.color, color: "white" }}>
                {cohortLabel.name} · {cohortLabel.tagline}
              </span>
            )}
          </div>
        </div>

        {hasFlag && (
          <div
            role="alert"
            className="card"
            style={{
              padding: 18,
              marginTop: 20,
              background: "rgba(168,54,43,.06)",
              borderColor: "rgba(168,54,43,.2)",
            }}
          >
            <div style={{ fontWeight: 600, color: "#a8362b", marginBottom: 6 }}>
              Medical context noted
            </div>
            <div className="body-sm" style={{ color: "var(--ink-2)" }}>
              You flagged
              {flags.cvd ? " cardiovascular history" : ""}
              {flags.cvd && flags.cancer ? " and" : ""}
              {flags.cancer ? " cancer history" : ""} — please mention this when our team reaches
              out so we can match a doctor-supervised protocol.
            </div>
          </div>
        )}

        <div className="card" style={{ padding: 24, marginTop: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Sub-scores</div>
          <div className="subscore-grid">
            <SubScore label="Body" value={subScores.body} />
            <SubScore label="Recovery" value={subScores.recovery} />
            <SubScore label="Metabolic" value={subScores.metabolic} />
            <SubScore label="Mind" value={subScores.mind} />
            <SubScore label="Safety" value={safetyScore} note="100 − risk" />
          </div>
        </div>

        <div style={{ marginTop: 48 }}>
          <h2
            style={{
              margin: "0 0 8px",
              fontFamily: "var(--font-display)",
              fontSize: 36,
              fontWeight: 400,
              color: "var(--ink)",
            }}
          >
            {programs.length} matched{" "}
            <span className="display-italic">{programs.length === 1 ? "programme" : "programmes"}</span>.
          </h2>
          <p className="body" style={{ marginBottom: 24 }}>
            Top picks in your cohort, sorted by entry price.
          </p>

          {submitOk && (
            <div
              className="card"
              style={{
                padding: 16,
                marginBottom: 20,
                background: "var(--accent-soft)",
                borderColor: "var(--accent-soft)",
                color: "var(--accent-deep)",
              }}
            >
              {submitOk}
            </div>
          )}

          <div className="matched-grid">
            {programs.map((p) => (
              <MatchedCard
                key={p.id}
                program={p}
                name={name}
                reserved={reservedIds.has(p.id)}
                onReserve={() => openReserve(p)}
              />
            ))}
            {programs.length === 0 && (
              <div className="card" style={{ padding: 24 }}>
                <div className="body">
                  No active programmes match your cohort right now. Our team will WhatsApp you with
                  the best alternative.
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="body-sm" style={{ marginTop: 40, textAlign: "center", color: "var(--ink-3)" }}>
          Save this page if you want to review later — your baseline lives at the URL above.
        </p>
      </section>

      {reserveTarget && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeReserve}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(20,32,27,.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 520,
              maxHeight: "92dvh",
              overflowY: "auto",
              background: "var(--bg)",
              borderTopLeftRadius: "var(--r-lg)",
              borderTopRightRadius: "var(--r-lg)",
              padding: "24px 22px 32px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div className="eyebrow">Reserve dates</div>
              <button
                type="button"
                onClick={closeReserve}
                aria-label="Close"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--surface-2)",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--ink)",
                }}
              >
                <Icon.close width={16} height={16} />
              </button>
            </div>
            <h3 className="display" style={{ margin: "0 0 12px", fontSize: 26, color: "var(--ink)" }}>
              {reserveTarget.name}
            </h3>
            <p className="body-sm" style={{ marginBottom: 18 }}>
              Pick a start and end date. Our team confirms availability and final pricing on WhatsApp.
            </p>
            <form onSubmit={onReserveSubmit} style={{ display: "grid", gap: 12 }}>
              <label>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Arrival</div>
                <input className="field" type="date" value={arrival} min={today} onChange={(e) => setArrival(e.target.value)} required />
              </label>
              <label>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Departure</div>
                <input className="field" type="date" value={departure} min={arrival || today} onChange={(e) => setDeparture(e.target.value)} required />
              </label>
              <label>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Guests</div>
                <input className="field" type="number" min={1} max={20} value={pax} onChange={(e) => setPax(Math.max(1, parseInt(e.target.value || "1", 10)))} required />
              </label>
              {submitError && (
                <div role="alert" style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(168,54,43,.1)", color: "#a8362b", fontSize: 13 }}>
                  {submitError}
                </div>
              )}
              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
                {submitting ? "Sending…" : "Send inquiry"}
              </button>
              <button type="button" className="btn btn-ghost btn-block" onClick={closeReserve}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 700px) {
          .matched-summary { grid-template-columns: 1fr 1.5fr; align-items: stretch; }
          .matched-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
        }
        .matched-grid { display: grid; gap: 16px; grid-template-columns: 1fr; }
        .subscore-grid { display: grid; gap: 16px; grid-template-columns: repeat(2, 1fr); }
        @media (min-width: 640px) { .subscore-grid { grid-template-columns: repeat(5, 1fr); } }
      `}</style>
    </div>
  )
}

function SubScore({ label, value, note }: { label: string; value: number | undefined; note?: string }) {
  const color = value != null ? scoreColor(value) : "var(--ink-3)"
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 4 }}>{label}</div>
      {note && <div style={{ fontSize: 10, color: "var(--ink-3)", marginBottom: 2 }}>{note}</div>}
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 32,
          color,
          marginBottom: 6,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value ?? "—"}
      </div>
      <div style={{ height: 6, borderRadius: 4, background: "var(--surface-2)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value ?? 0}%`, background: color, transition: "width 1s ease" }} />
      </div>
    </div>
  )
}

function MatchedCard({
  program: p,
  name,
  reserved,
  onReserve,
}: {
  program: MatchedProgram
  name: string | null
  reserved: boolean
  onReserve: () => void
}) {
  const cohort = COHORT_LABELS[p.cohort]
  const properties = p.program_properties.map((pp) => pp.properties)
  const firstWa = properties.find((pr) => pr.contact_wa)?.contact_wa
  const greeting = name ? `Hi! I'm ${name}` : "Hi"
  const waHref = firstWa
    ? `https://wa.me/${firstWa.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
        `${greeting} — I just took the WBS and "${p.name}" came up as a match. Can we lock in dates?`,
      )}`
    : null

  const activeVariants = p.program_variants?.filter((v) => v.active) ?? []
  const prices = activeVariants.map((v) => Number(v.price_basic_usd)).filter((x) => x > 0)
  const minPrice = prices.length ? Math.min(...prices) : Number(p.price_usd)

  return (
    <article className="card" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Link href={p.slug ? `/programs/${p.slug}` : "#"} style={{ display: "block", position: "relative" }}>
        <ProgramImage url={p.hero_image_url} cohort={p.cohort} alt={p.name} aspect="16 / 10" />
        <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6 }}>
          {cohort && (
            <span className="tag" style={{ background: "rgba(255,255,255,.92)", color: "var(--ink)" }}>
              {cohort.name}
            </span>
          )}
          {p.tier && (
            <span className="tag" style={{ background: "rgba(255,255,255,.92)", color: "var(--ink-2)" }}>
              {p.tier}
            </span>
          )}
        </div>
      </Link>
      <div style={{ padding: "18px 18px 20px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        <div>
          <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 600, color: "var(--ink)" }}>{p.name}</h3>
          {p.summary && <p className="body-sm" style={{ margin: 0, color: "var(--ink-2)" }}>{p.summary}</p>}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="body-sm">{p.duration_days} days</span>
          <span style={{ fontWeight: 600, color: "var(--ink)" }}>from ${Number(minPrice).toLocaleString()}</span>
        </div>
        <div style={{ display: "grid", gap: 8, marginTop: "auto" }}>
          {reserved ? (
            <button type="button" className="btn" disabled style={{ background: "var(--accent-soft)", color: "var(--accent-deep)" }}>
              Inquiry sent
            </button>
          ) : (
            <button type="button" className="btn btn-primary btn-block" onClick={onReserve}>Reserve dates</button>
          )}
          {waHref && (
            <a className="btn btn-ghost btn-block" href={waHref} target="_blank" rel="noreferrer" style={{ fontSize: 14 }}>
              <Icon.wa width={16} height={16} /> Chat on WhatsApp
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
