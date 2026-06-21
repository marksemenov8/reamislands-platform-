"use client"

import { Alert, Card, Col, Empty, Row, Select, Space, Table, Tag, Tooltip, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import GuestEditModal from "./GuestEditModal"

const { Text, Title } = Typography

export type UserRow = {
  id: string
  name: string | null
  email: string | null
  whatsapp: string | null
  country: string | null
  wbs_score: number | null
  latest_pre_wbs: number | null
  latest_post_wbs: number | null
  latest_status: string | null
  cohort: number | null
  source: string | null
  created_at: string
  program_ids: string[]
  property_ids: string[]
  program_names: string[]
  property_names: string[]
}

export type ProgramOption = {
  id: string
  name: string
  cohort: number | null
  tier: string | null
}

export type PropertyOption = {
  id: string
  name: string
  slug: string
}

const cohortMap: Record<number, { label: string; color: string }> = {
  1: { label: "Reset", color: "volcano" },
  2: { label: "Performance", color: "geekblue" },
  3: { label: "Mind", color: "purple" },
  4: { label: "Immersion", color: "green" },
}

function wbsColor(score: number | null): string {
  if (score == null) return "#9aa6a1"
  if (score >= 70) return "#0F6E56"
  if (score >= 50) return "#b3781b"
  return "#a8362b"
}

function deltaColor(d: number): string {
  return d > 0 ? "#0F6E56" : d < 0 ? "#a8362b" : "#9aa6a1"
}

const MONO: React.CSSProperties = { fontFamily: "ui-monospace, monospace", fontWeight: 600 }
const DASH = <Text type="secondary">—</Text>

export default function UsersView({
  rows,
  programOptions,
  propertyOptions,
  activeFilters,
  errorMessage,
  basePath = "/admin/users",
  role = "admin",
  title,
}: {
  rows: UserRow[]
  programOptions: ProgramOption[]
  propertyOptions: PropertyOption[]
  activeFilters: { program: string | null; property: string | null }
  errorMessage: string | null
  basePath?: string
  role?: "admin" | "partner"
  title?: string
}) {
  const router = useRouter()
  const search = useSearchParams()
  const [editId, setEditId] = useState<string | null>(null)

  function setFilter(key: "program" | "property", value: string | null) {
    const params = new URLSearchParams(search.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${basePath}${params.toString() ? `?${params.toString()}` : ""}`)
  }

  const columns: ColumnsType<UserRow> = useMemo(
    () => [
      {
        title: "Guest",
        dataIndex: "name",
        key: "name",
        render: (name: string | null, r) => (
          <div>
            <Text strong>{name ?? "—"}</Text>
            {r.email && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {r.email}
                </Text>
              </div>
            )}
          </div>
        ),
      },
      {
        title: "Country",
        dataIndex: "country",
        key: "country",
        width: 110,
        render: (c: string | null) => <Text type="secondary">{c ?? "—"}</Text>,
      },
      {
        title: "Program",
        key: "program",
        render: (_v, r) =>
          r.program_names.length > 0 ? (
            <Text style={{ fontSize: 13 }}>{r.program_names.join(", ")}</Text>
          ) : (
            DASH
          ),
      },
      {
        title: "Property",
        key: "property",
        render: (_v, r) =>
          r.property_names.length > 0 ? (
            <Text type="secondary" style={{ fontSize: 13 }}>
              {r.property_names.join(", ")}
            </Text>
          ) : (
            DASH
          ),
      },
      {
        title: <Tooltip title="Baseline from intake">Baseline</Tooltip>,
        dataIndex: "wbs_score",
        key: "baseline",
        width: 90,
        render: (s: number | null) =>
          s != null ? <span style={{ ...MONO, color: wbsColor(s) }}>{s}</span> : DASH,
      },
      {
        title: "Latest stay Δ",
        key: "latest_stay",
        width: 140,
        render: (_v, r) => {
          if (r.latest_pre_wbs == null && r.latest_post_wbs == null) return DASH
          const pre = r.latest_pre_wbs
          const post = r.latest_post_wbs
          if (pre == null || post == null) {
            return (
              <span style={MONO}>
                <span style={{ color: wbsColor(pre) }}>{pre ?? "—"}</span>
                <span style={{ color: "#9aa6a1", margin: "0 4px" }}>→</span>
                <span style={{ color: wbsColor(post) }}>{post ?? "—"}</span>
              </span>
            )
          }
          const d = post - pre
          return (
            <span style={MONO}>
              <span style={{ color: wbsColor(pre) }}>{pre}</span>
              <span style={{ color: "#9aa6a1", margin: "0 4px" }}>→</span>
              <span style={{ color: wbsColor(post) }}>{post}</span>
              <span style={{ color: deltaColor(d), marginLeft: 8 }}>
                ({d > 0 ? "+" : ""}
                {d})
              </span>
            </span>
          )
        },
      },
      {
        title: "Cohort",
        dataIndex: "cohort",
        key: "cohort",
        width: 130,
        render: (c: number | null) => {
          const info = c != null ? cohortMap[c] : null
          return info ? <Tag color={info.color}>{info.label}</Tag> : DASH
        },
      },
      {
        title: "Source",
        dataIndex: "source",
        key: "source",
        width: 100,
        render: (s: string | null) => (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {s ?? "—"}
          </Text>
        ),
      },
    ],
    [],
  )

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <div>
        <Title level={4} style={{ margin: 0 }}>
          {title ?? `${rows.length} ${rows.length === 1 ? "guest" : "guests"}`}
        </Title>
        <Text type="secondary">
          {role === "partner"
            ? "Guests with bookings on your property"
            : "Intake leads from Cura (WhatsApp/LINE AI), WBS form and direct entries"}
        </Text>
      </div>

      {errorMessage && <Alert type="error" message={`DB error: ${errorMessage}`} showIcon />}

      <Card variant="borderless">
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={role === "partner" ? 24 : 10}>
            <Text type="secondary" style={{ fontSize: 12, letterSpacing: 0.3 }}>
              FILTER · PROGRAM
            </Text>
            <Select
              allowClear
              placeholder="Any program"
              value={activeFilters.program ?? undefined}
              onChange={(v) => setFilter("program", v ?? null)}
              showSearch
              optionFilterProp="label"
              style={{ width: "100%" }}
              options={programOptions.map((p) => ({
                value: p.id,
                label: p.name,
              }))}
            />
          </Col>
          {role !== "partner" && (
            <Col xs={24} md={10}>
              <Text type="secondary" style={{ fontSize: 12, letterSpacing: 0.3 }}>
                FILTER · PROPERTY
              </Text>
              <Select
                allowClear
                placeholder="Any property"
                value={activeFilters.property ?? undefined}
                onChange={(v) => setFilter("property", v ?? null)}
                showSearch
                optionFilterProp="label"
                style={{ width: "100%" }}
                options={propertyOptions.map((p) => ({
                  value: p.id,
                  label: p.name,
                }))}
              />
            </Col>
          )}
        </Row>
      </Card>

      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <Table<UserRow>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          pagination={false}
          onRow={(r) => ({ onClick: () => setEditId(r.id), style: { cursor: "pointer" } })}
          locale={{
            emptyText: (
              <Empty description="No guests match the filters" />
            ),
          }}
        />
      </Card>

      <GuestEditModal
        userId={editId}
        onClose={() => setEditId(null)}
        onSaved={() => router.refresh()}
        role={role}
      />
    </Space>
  )
}
