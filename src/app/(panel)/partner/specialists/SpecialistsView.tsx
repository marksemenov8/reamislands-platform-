"use client"

import {
  App,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import {
  EditOutlined,
  PlusOutlined,
  ProfileOutlined,
} from "@ant-design/icons"
import { useRouter } from "next/navigation"
import { useState } from "react"

const { Title, Text } = Typography

export type SpecialistRow = {
  specialist_id: string
  specialist_name: string
  specialist_role: string | null
  outcome_metric: string | null
  delta_avg: number | null
  sample_count: number | null
  last_recorded_at: string | null
}

export type SpecialistRecord = {
  id: string
  name: string
  role: string | null
  cohort_focus: number[] | null
  active: boolean
  property_id: string
  created_at: string
}

const COHORT_OPTIONS = [
  { value: 1, label: "1 · Reset" },
  { value: 2, label: "2 · Performance" },
  { value: 3, label: "3 · Mind" },
  { value: 4, label: "4 · Immersion" },
]

function formatDelta(metric: string | null, v: number | null) {
  if (v == null) return <Text type="secondary">—</Text>
  const sign = v >= 0 ? "+" : ""
  const isWbs = metric === "wbs_delta"
  return (
    <Text strong style={{ color: v >= 0 ? "#1D9E75" : "#c0392b" }}>
      {sign}
      {Number(v).toFixed(isWbs ? 1 : 2)}
    </Text>
  )
}

export default function SpecialistsView({
  rows,
  specialists,
}: {
  rows: SpecialistRow[]
  specialists: SpecialistRecord[]
}) {
  const router = useRouter()
  const { notification } = App.useApp()
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<SpecialistRecord | null>(null)
  const [saving, setSaving] = useState(false)

  async function onCreate(values: {
    name: string
    role?: string
    cohort_focus?: number[]
    active?: boolean
  }) {
    setSaving(true)
    try {
      const res = await fetch("/api/specialists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          role: values.role ?? null,
          cohort_focus: values.cohort_focus ?? [],
          active: values.active ?? true,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        notification.error({ message: "Create failed", description: json.error })
        return
      }
      setAddOpen(false)
      notification.success({ message: "Specialist added" })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function onEdit(values: {
    name: string
    role?: string
    cohort_focus?: number[]
    active?: boolean
  }) {
    if (!editTarget) return
    setSaving(true)
    try {
      const res = await fetch(`/api/specialists/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          role: values.role ?? null,
          cohort_focus: values.cohort_focus ?? [],
          active: values.active,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        notification.error({ message: "Update failed", description: json.error })
        return
      }
      setEditTarget(null)
      notification.success({ message: "Specialist updated" })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const manageColumns: ColumnsType<SpecialistRecord> = [
    {
      title: "Specialist",
      dataIndex: "name",
      key: "name",
      render: (name: string, r) => (
        <div>
          <Text strong>{name}</Text>
          {r.role && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {r.role}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Cohort focus",
      dataIndex: "cohort_focus",
      key: "cohort_focus",
      render: (v: number[] | null) => (
        <Space size={4} wrap>
          {(v ?? []).map((c) => (
            <Tag key={c} color="geekblue">
              C{c}
            </Tag>
          ))}
          {(!v || v.length === 0) && <Text type="secondary">—</Text>}
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "active",
      key: "active",
      width: 100,
      render: (v: boolean) =>
        v ? <Tag color="green">active</Tag> : <Tag>inactive</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 220,
      render: (_v, r) => (
        <Space>
          <Button
            size="small"
            icon={<ProfileOutlined />}
            onClick={() => router.push(`/partner/specialists/${r.id}`)}
          >
            Card
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => setEditTarget(r)}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ]

  const contribColumns: ColumnsType<SpecialistRow> = [
    {
      title: "Specialist",
      dataIndex: "specialist_name",
      key: "specialist_name",
      render: (v: string, r) => (
        <div>
          <Text strong>{v}</Text>
          {r.specialist_role && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {r.specialist_role}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Metric",
      dataIndex: "outcome_metric",
      key: "outcome_metric",
      width: 180,
      render: (v: string | null) =>
        v ? <Tag color="geekblue">{v}</Tag> : <Text type="secondary">no data</Text>,
    },
    {
      title: "Delta avg",
      dataIndex: "delta_avg",
      key: "delta_avg",
      width: 140,
      align: "right",
      render: (v: number | null, r) => formatDelta(r.outcome_metric, v),
    },
    {
      title: "Sample",
      dataIndex: "sample_count",
      key: "sample_count",
      width: 90,
      align: "right",
      render: (v: number | null) => v ?? <Text type="secondary">—</Text>,
    },
    {
      title: "Last recorded",
      dataIndex: "last_recorded_at",
      key: "last_recorded_at",
      render: (v: string | null) =>
        v ? new Date(v).toISOString().slice(0, 10) : <Text type="secondary">—</Text>,
    },
  ]

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <div>
        <Title level={3} style={{ margin: 0, fontWeight: 600 }}>
          Specialists
        </Title>
        <Text type="secondary">
          Manage practitioners working with guests at your property. Aggregated
          outcomes below are anonymous — no guest IDs leak through.
        </Text>
      </div>

      <Card
        variant="borderless"
        title={
          <Space align="center">
            <Text strong>Roster</Text>
            <Tag>{specialists.length}</Tag>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
            Add specialist
          </Button>
        }
      >
        <Table<SpecialistRecord>
          rowKey="id"
          columns={manageColumns}
          dataSource={specialists}
          pagination={false}
          size="middle"
          locale={{ emptyText: "No specialists yet — add the first one" }}
        />
      </Card>

      <Card variant="borderless" title={<Text strong>Contribution</Text>}>
        <Table<SpecialistRow>
          rowKey={(r) => `${r.specialist_id}-${r.outcome_metric ?? "none"}`}
          columns={contribColumns}
          dataSource={rows}
          pagination={false}
          size="middle"
          locale={{ emptyText: "No outcomes recorded yet" }}
        />
      </Card>

      <SpecialistFormModal
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        onSubmit={onCreate}
        loading={saving}
        title="Add specialist"
      />
      <SpecialistFormModal
        open={!!editTarget}
        onCancel={() => setEditTarget(null)}
        onSubmit={onEdit}
        loading={saving}
        title={editTarget ? `Edit ${editTarget.name}` : "Edit specialist"}
        initial={editTarget}
      />
    </Space>
  )
}

function SpecialistFormModal({
  open,
  onCancel,
  onSubmit,
  loading,
  title,
  initial,
}: {
  open: boolean
  onCancel: () => void
  onSubmit: (v: {
    name: string
    role?: string
    cohort_focus?: number[]
    active?: boolean
  }) => void
  loading: boolean
  title: string
  initial?: SpecialistRecord | null
}) {
  const [form] = Form.useForm()

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText="Save"
      confirmLoading={loading}
      afterClose={() => form.resetFields()}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={
          initial
            ? {
                name: initial.name,
                role: initial.role ?? undefined,
                cohort_focus: initial.cohort_focus ?? [],
                active: initial.active,
              }
            : { active: true }
        }
        onFinish={onSubmit}
      >
        <Form.Item name="name" label="Name" rules={[{ required: true, message: "Required" }]}>
          <Input autoComplete="off" placeholder="Dr. Nida Phongsri" />
        </Form.Item>
        <Form.Item name="role" label="Role / specialty">
          <Input autoComplete="off" placeholder="Medical Detox Lead" />
        </Form.Item>
        <Form.Item
          name="cohort_focus"
          label="Cohort focus"
          tooltip="Which cohorts this specialist primarily serves"
        >
          <Select mode="multiple" options={COHORT_OPTIONS} />
        </Form.Item>
        <Form.Item name="active" label="Active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}
