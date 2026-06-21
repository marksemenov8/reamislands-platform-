"use client"

import { Button, Card, Col, Row, Space, Statistic, Table, Tag, Typography } from "antd"
import { ArrowLeftOutlined } from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import { useRouter } from "next/navigation"

const { Text, Title } = Typography

export type SpecialistDetail = {
  id: string
  name: string
  role: string | null
  cohort_focus: number[] | null
  active: boolean
  property_id: string
  created_at: string
}

export type SpecialistGuestRow = {
  specialist_id: string
  specialist_role_on_booking: string | null
  user_id: string
  guest_name: string | null
  country: string | null
  booking_id: string
  pre_wbs: number | null
  post_wbs: number | null
  status: string | null
  arrival: string | null
  departure: string | null
}

const MONO: React.CSSProperties = { fontFamily: "ui-monospace, monospace", fontWeight: 600 }

function wbsColor(v: number | null): string {
  if (v == null) return "#9aa6a1"
  if (v >= 70) return "#1D9E75"
  if (v >= 50) return "#b3781b"
  return "#a8362b"
}

export default function SpecialistCardView({
  specialist,
  propertyName,
  guests,
}: {
  specialist: SpecialistDetail
  propertyName: string | null
  guests: SpecialistGuestRow[]
}) {
  const router = useRouter()
  const completedDeltas = guests
    .filter((g) => g.status === "completed" && g.pre_wbs != null && g.post_wbs != null)
    .map((g) => (g.post_wbs as number) - (g.pre_wbs as number))
  const avgDelta =
    completedDeltas.length > 0
      ? completedDeltas.reduce((a, b) => a + b, 0) / completedDeltas.length
      : null

  const columns: ColumnsType<SpecialistGuestRow> = [
    {
      title: "Guest",
      key: "guest",
      render: (_v, r) => (
        <div>
          <Text strong>{r.guest_name ?? "—"}</Text>
          {r.country && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {r.country}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Stay",
      key: "stay",
      width: 200,
      render: (_v, r) =>
        r.arrival && r.departure ? (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {r.arrival} → {r.departure}
          </Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (s: string | null) => (s ? <Tag>{s}</Tag> : <Text type="secondary">—</Text>),
    },
    {
      title: "Role on booking",
      dataIndex: "specialist_role_on_booking",
      key: "role",
      width: 160,
      render: (v: string | null) =>
        v ? <Tag color="geekblue">{v}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: "WBS Δ",
      key: "delta",
      width: 140,
      render: (_v, r) => {
        const pre = r.pre_wbs
        const post = r.post_wbs
        if (pre == null && post == null) return <Text type="secondary">—</Text>
        return (
          <span style={MONO}>
            <span style={{ color: wbsColor(pre) }}>{pre ?? "—"}</span>
            <span style={{ color: "#9aa6a1", margin: "0 4px" }}>→</span>
            <span style={{ color: wbsColor(post) }}>{post ?? "—"}</span>
          </span>
        )
      },
    },
  ]

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <div>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push("/partner/specialists")}
          style={{ marginBottom: 8, paddingLeft: 0 }}
        >
          Back to specialists
        </Button>
        <Title level={3} style={{ margin: 0, fontWeight: 600 }}>
          {specialist.name}
        </Title>
        <Space size={8} style={{ marginTop: 4 }}>
          {specialist.role && <Tag color="geekblue">{specialist.role}</Tag>}
          {(specialist.cohort_focus ?? []).map((c) => (
            <Tag key={c}>C{c}</Tag>
          ))}
          {specialist.active ? <Tag color="green">active</Tag> : <Tag>inactive</Tag>}
          {propertyName && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              · {propertyName}
            </Text>
          )}
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} md={8}>
          <Card variant="borderless">
            <Statistic title="Guests worked with" value={new Set(guests.map((g) => g.user_id)).size} />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card variant="borderless">
            <Statistic title="Completed stays" value={guests.filter((g) => g.status === "completed").length} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card variant="borderless">
            <Statistic
              title="Avg WBS Δ (completed)"
              value={avgDelta == null ? "—" : `+${avgDelta.toFixed(1)}`}
              valueStyle={{ color: "#1D9E75" }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              n = {completedDeltas.length}
            </Text>
          </Card>
        </Col>
      </Row>

      <Card variant="borderless" title={<Text strong>Guests worked with</Text>}>
        <Table<SpecialistGuestRow>
          rowKey="booking_id"
          columns={columns}
          dataSource={guests}
          pagination={false}
          size="middle"
          locale={{ emptyText: "No guests linked to this specialist yet" }}
        />
      </Card>
    </Space>
  )
}
