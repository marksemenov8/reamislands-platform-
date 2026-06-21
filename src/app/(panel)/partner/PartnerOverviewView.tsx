"use client"

import { Alert, Card, Col, Row, Space, Statistic, Table, Tag, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"

const { Title, Text } = Typography

export type ProgramOutcomeRow = {
  program_id: string
  program_name: string
  cohort: number
  tier: string | null
  is_composite: boolean
  completed_bookings: number
  avg_wbs_delta: number | null
  wbs_sample_count: number
}

export default function PartnerOverviewView({
  propertyLabel,
  rows,
}: {
  propertyLabel: string | null
  rows: ProgramOutcomeRow[]
}) {
  const totalCompleted = rows.reduce((s, r) => s + (r.completed_bookings ?? 0), 0)
  const samples = rows.reduce((s, r) => s + (r.wbs_sample_count ?? 0), 0)
  const weightedDelta =
    samples > 0
      ? rows.reduce(
          (s, r) => s + (Number(r.avg_wbs_delta ?? 0) * (r.wbs_sample_count ?? 0)),
          0,
        ) / samples
      : null

  const columns: ColumnsType<ProgramOutcomeRow> = [
    {
      title: "Program",
      dataIndex: "program_name",
      key: "program_name",
      render: (v: string, r) => (
        <Space size={6}>
          <Text strong>{v}</Text>
          {r.is_composite && <Tag color="geekblue">composite</Tag>}
        </Space>
      ),
    },
    {
      title: "Cohort",
      dataIndex: "cohort",
      key: "cohort",
      width: 90,
      render: (v: number) => <Tag>C{v}</Tag>,
    },
    {
      title: "Tier",
      dataIndex: "tier",
      key: "tier",
      width: 120,
      render: (v: string | null) => (v ? <Tag color="green">{v}</Tag> : "—"),
    },
    {
      title: "Completed",
      dataIndex: "completed_bookings",
      key: "completed_bookings",
      width: 110,
      align: "right",
    },
    {
      title: "Avg WBS Δ",
      dataIndex: "avg_wbs_delta",
      key: "avg_wbs_delta",
      width: 120,
      align: "right",
      render: (v: number | null) =>
        v == null ? <Text type="secondary">—</Text> : <Text strong>+{Number(v).toFixed(1)}</Text>,
    },
    {
      title: "Sample",
      dataIndex: "wbs_sample_count",
      key: "wbs_sample_count",
      width: 90,
      align: "right",
    },
  ]

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <div>
        <Title level={3} style={{ margin: 0, fontWeight: 600 }}>
          Programs at your property
        </Title>
        <Text type="secondary">
          {propertyLabel
            ? `Outcomes scoped to ${propertyLabel}`
            : "No property linked — ask an admin to set partner_property_id"}
        </Text>
      </div>

      {!propertyLabel && (
        <Alert
          type="warning"
          showIcon
          message="No property linked"
          description="Until partner_property_id is set on your profile, this view will be empty."
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={12} md={8}>
          <Card variant="borderless">
            <Statistic
              title={
                <Text type="secondary" style={{ fontSize: 12, letterSpacing: 0.3 }}>
                  PROGRAMS
                </Text>
              }
              value={rows.length}
              valueStyle={{ color: "#10221c", fontWeight: 600 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              linked to your property
            </Text>
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card variant="borderless">
            <Statistic
              title={
                <Text type="secondary" style={{ fontSize: 12, letterSpacing: 0.3 }}>
                  COMPLETED BOOKINGS
                </Text>
              }
              value={totalCompleted}
              valueStyle={{ color: "#10221c", fontWeight: 600 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              guests finished a program
            </Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card variant="borderless">
            <Statistic
              title={
                <Text type="secondary" style={{ fontSize: 12, letterSpacing: 0.3 }}>
                  WEIGHTED AVG WBS Δ
                </Text>
              }
              value={weightedDelta == null ? "—" : `+${weightedDelta.toFixed(1)}`}
              valueStyle={{ color: "#1D9E75", fontWeight: 600 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              n = {samples}
            </Text>
          </Card>
        </Col>
      </Row>

      <Card variant="borderless" title={<Text strong>Program outcomes</Text>}>
        <Table
          rowKey="program_id"
          columns={columns}
          dataSource={rows}
          pagination={false}
          size="middle"
          locale={{ emptyText: "No programs linked to your property yet" }}
        />
      </Card>
    </Space>
  )
}
