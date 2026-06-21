"use client"

import { useMemo, useState } from "react"
import { TRACKS, type LandingProgram } from "../_lib/programMapping"
import ProgramCard from "../_components/ProgramCard"
import { Icon } from "../_components/Icon"

type Filter = "All" | "Reset" | "Performance" | "Mind" | "Immersion"
const FILTERS: Filter[] = ["All", "Reset", "Performance", "Mind", "Immersion"]

function isFilter(s: string): s is Filter {
  return (FILTERS as string[]).includes(s)
}

export default function ProgramsListView({
  programs,
  initialFilter,
}: {
  programs: LandingProgram[]
  initialFilter: string
}) {
  const [filter, setFilter] = useState<Filter>(isFilter(initialFilter) ? initialFilter : "All")

  const grouped = useMemo(
    () =>
      TRACKS.map((t) => ({ ...t, items: programs.filter((p) => p.track === t.id) })).filter(
        (g) => g.items.length,
      ),
    [programs],
  )

  const shown = filter === "All" ? programs : programs.filter((p) => p.track === filter)

  return (
    <div className="page" style={{ paddingBottom: 120 }}>
      <section className="shell" style={{ paddingTop: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>All programs</div>
        <h1
          className="display"
          style={{ fontSize: "clamp(40px, 10vw, 72px)", margin: "0 0 24px", color: "var(--ink)" }}
        >
          Best <span className="display-italic">trips</span> for you.
        </h1>

        <div
          style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 12 }}
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="tag"
              style={{
                flex: "0 0 auto",
                padding: "10px 16px",
                fontSize: 13,
                background: filter === f ? "var(--accent)" : "var(--surface-2)",
                color: filter === f ? "var(--accent-ink)" : "var(--ink-2)",
                border: `1px solid ${filter === f ? "var(--accent)" : "var(--line)"}`,
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {filter === "All" ? (
          grouped.length === 0 ? (
            <EmptyState />
          ) : (
            grouped.map((g) => (
              <div key={g.id} style={{ marginTop: 32 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-display)",
                      fontSize: 28,
                      fontWeight: 400,
                      color: "var(--ink)",
                    }}
                  >
                    {g.label}{" "}
                    <span
                      className="display-italic"
                      style={{ color: "var(--ink-3)" }}
                    >
                      ·
                    </span>{" "}
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--ink-3)",
                      }}
                    >
                      {g.desc}
                    </span>
                  </h2>
                  <Icon.chevron width={16} height={16} stroke="var(--ink-3)" />
                </div>
                <div className="rail">
                  {g.items.map((p) => (
                    <ProgramCard key={p.id} program={p} variant="rail" />
                  ))}
                </div>
              </div>
            ))
          )
        ) : shown.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div
            style={{ display: "grid", gap: 16, marginTop: 16 }}
            className="programs-grid"
          >
            {shown.map((p) => (
              <ProgramCard key={p.id} program={p} variant="wide" />
            ))}
          </div>
        )}

        <style>{`
          @media (min-width: 700px) {
            .programs-grid { grid-template-columns: repeat(2, 1fr); }
          }
          @media (min-width: 1100px) {
            .programs-grid { grid-template-columns: repeat(3, 1fr); }
          }
        `}</style>
      </section>
    </div>
  )
}

function EmptyState({ filter }: { filter?: Filter }) {
  return (
    <div className="card" style={{ padding: 32, marginTop: 24, textAlign: "center" }}>
      <div className="body">
        {filter
          ? `No ${filter} programs published yet.`
          : "No programs published yet. Check back soon."}
      </div>
    </div>
  )
}
