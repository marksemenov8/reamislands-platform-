"use client"

import { App, Button, DatePicker, InputNumber, Space, Tag, Typography } from "antd"
import dayjs, { type Dayjs } from "dayjs"
import { useEffect, useMemo, useRef, useState } from "react"

const { Text } = Typography

const MAX_DAYS = 30

type DailyRow = { day_no: number; score: number | null }

function fmtDate(d: Dayjs): string {
  return d.format("DD.MM.YYYY")
}

export default function WbsDailyRail({
  userId,
  editable,
}: {
  userId: string
  editable: boolean
}) {
  const { notification } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [startedAt, setStartedAt] = useState<Dayjs | null>(null)
  const [scores, setScores] = useState<Map<number, number | null>>(new Map())
  const [latestScore, setLatestScore] = useState<number | null>(null)
  const initialSnapshot = useRef<string>("")

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/users/${userId}/wbs-daily`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return
        if (!j.success) {
          notification.error({ message: "Couldn't load WBS", description: j.error })
          return
        }
        const map = new Map<number, number | null>()
        for (const d of j.days as DailyRow[]) map.set(d.day_no, d.score)
        setScores(map)
        setStartedAt(j.wbs_started_at ? dayjs(j.wbs_started_at) : null)
        setLatestScore(j.wbs_score ?? null)
        initialSnapshot.current = snapshotKey(j.wbs_started_at, map)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId, notification])

  const headerScore = useMemo(() => {
    let lastVal: number | null = null
    for (let d = MAX_DAYS; d >= 1; d--) {
      const v = scores.get(d)
      if (v != null) { lastVal = v; break }
    }
    return lastVal ?? latestScore
  }, [scores, latestScore])

  function snapshotKey(s: string | null, m: Map<number, number | null>): string {
    const parts: string[] = [s ?? ""]
    for (let i = 1; i <= MAX_DAYS; i++) parts.push(`${i}:${m.get(i) ?? ""}`)
    return parts.join("|")
  }
  const dirty = snapshotKey(startedAt?.format("YYYY-MM-DD") ?? null, scores) !== initialSnapshot.current

  function setDay(day: number, val: number | null) {
    const next = new Map(scores)
    if (val == null || Number.isNaN(val)) next.delete(day)
    else next.set(day, Math.max(0, Math.min(100, Math.round(val))))
    setScores(next)
  }

  async function save() {
    if (!editable) return
    setSaving(true)
    try {
      const days: Array<{ day_no: number; score: number | null }> = []
      for (let d = 1; d <= MAX_DAYS; d++) {
        const v = scores.get(d)
        if (v != null) days.push({ day_no: d, score: v })
      }
      const res = await fetch(`/api/users/${userId}/wbs-daily`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wbs_started_at: startedAt ? startedAt.format("YYYY-MM-DD") : null,
          days,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        notification.error({ message: "Save failed", description: json.error })
        return
      }
      notification.success({ message: "WBS updated" })
      initialSnapshot.current = snapshotKey(startedAt?.format("YYYY-MM-DD") ?? null, scores)
    } finally {
      setSaving(false)
    }
  }

  const days = Array.from({ length: MAX_DAYS }, (_, i) => i + 1)

  return (
    <div>
      <Space size={12} align="center" wrap style={{ marginBottom: 12 }}>
        <Text strong style={{ fontSize: 14 }}>WBS score</Text>
        <Tag color={headerScore != null ? "green" : "default"} style={{ fontSize: 16, padding: "2px 10px" }}>
          {headerScore ?? "—"}
        </Tag>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Day 1 starts:
        </Text>
        <DatePicker
          value={startedAt}
          onChange={(v) => editable && setStartedAt(v)}
          format="DD.MM.YYYY"
          allowClear
          disabled={!editable}
          size="small"
          placeholder="Pick start"
        />
        {editable && dirty && (
          <Button type="primary" size="small" loading={saving} onClick={save}>
            Save WBS days
          </Button>
        )}
      </Space>

      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 8,
          opacity: loading ? 0.5 : 1,
        }}
      >
        {days.map((d) => {
          const date = startedAt ? startedAt.add(d - 1, "day") : null
          const value = scores.get(d) ?? null
          return (
            <div key={d} style={{ flex: "0 0 auto", width: 64 }}>
              <div style={{ fontSize: 11, color: "#6b7975", marginBottom: 4, lineHeight: 1.2 }}>
                <div style={{ fontWeight: 600, color: "#10221c" }}>{d}</div>
                <div style={{ fontSize: 10 }}>{date ? fmtDate(date) : "—"}</div>
              </div>
              <InputNumber
                size="small"
                min={0}
                max={100}
                value={value}
                onChange={(v) => setDay(d, typeof v === "number" ? v : null)}
                disabled={!editable}
                style={{ width: "100%" }}
                controls={false}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
