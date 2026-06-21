"use client"

import { EditOutlined, PlusOutlined } from "@ant-design/icons"
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

const { Text, Title } = Typography

export type ProgramStatus = "draft" | "published" | "archived"

export type ProgramRow = {
  id: string
  name: string
  slug: string | null
  status: ProgramStatus
  cohort: number
  tier: string | null
  duration_days: number
  price_usd: number
  outcomes: string[] | null
  max_guests: number | null
  is_composite: boolean
  active: boolean
  summary: string | null
  properties: Array<{ id: string; name: string }>
}

export type PropertyOption = { id: string; name: string; slug: string }

type CreateFormValues = {
  name: string
  slug?: string
  cohort: number
  tier?: string
  duration_days: number
  price_usd: number
  outcomes?: string[]
  is_composite?: boolean
  property_ids?: string[]
}

const TIER_OPTIONS = [
  { value: "RESET", label: "RESET" },
  { value: "REBUILD", label: "REBUILD" },
  { value: "TRANSFORM", label: "TRANSFORM" },
]

const TIER_COLOR: Record<string, string> = {
  RESET: "green",
  REBUILD: "blue",
  TRANSFORM: "purple",
}

const STATUS_COLOR: Record<ProgramStatus, string> = {
  draft: "default",
  published: "green",
  archived: "red",
}

const COHORT_OPTIONS = [
  { value: 1, label: "1 · Reset" },
  { value: 2, label: "2 · Performance" },
  { value: 3, label: "3 · Mind" },
  { value: 4, label: "4 · Immersion" },
]

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
}

export default function ProgramsView({
  rows,
  propertyOptions,
  errorMessage,
}: {
  rows: ProgramRow[]
  propertyOptions: PropertyOption[]
  errorMessage: string | null
}) {
  const router = useRouter()
  const { message } = App.useApp()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<CreateFormValues>()

  function openCreate() {
    form.resetFields()
    form.setFieldsValue({ is_composite: false })
    setOpen(true)
  }

  async function onCreate(values: CreateFormValues) {
    setSaving(true)
    try {
      const body = {
        ...values,
        slug: values.slug?.trim() || slugify(values.name),
        outcomes: values.outcomes ?? [],
      }
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        message.error(json.error ?? "Save failed")
        return
      }
      message.success("Program created — continue editing")
      setOpen(false)
      router.push(`/admin/programs/${json.program.id}/edit`)
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnsType<ProgramRow> = [
    {
      title: "Program",
      key: "name",
      render: (_v, p) => (
        <div>
          <Link href={`/admin/programs/${p.id}/edit`}>
            <Text strong>{p.name}</Text>
          </Link>
          {p.is_composite && (
            <Tag color="magenta" style={{ marginLeft: 8 }}>
              Composite
            </Tag>
          )}
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {p.slug ?? <i>no slug</i>} · {p.duration_days} days · ${Number(p.price_usd).toLocaleString()}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Cohort",
      dataIndex: "cohort",
      key: "cohort",
      width: 100,
      render: (c: number) => <Tag>C{c}</Tag>,
    },
    {
      title: "Tier",
      dataIndex: "tier",
      key: "tier",
      width: 120,
      render: (t: string | null) =>
        t ? <Tag color={TIER_COLOR[t] ?? "default"}>{t}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: "Properties",
      key: "properties",
      render: (_v, p) =>
        p.properties.length > 0 ? (
          <Space size={4} wrap>
            {p.properties.map((pr) => (
              <Tag key={pr.id}>{pr.name}</Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">unlinked</Text>
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (s: ProgramStatus) => <Tag color={STATUS_COLOR[s]}>{s}</Tag>,
    },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_v, p) => (
        <Link href={`/admin/programs/${p.id}/edit`}>
          <Button size="small" icon={<EditOutlined />}>
            Edit
          </Button>
        </Link>
      ),
    },
  ]

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <Row align="middle" justify="space-between" wrap>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {rows.length} wellness {rows.length === 1 ? "program" : "programs"}
          </Title>
          <Text type="secondary">RESET, REBUILD and TRANSFORM tiers across four cohorts</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Program
        </Button>
      </Row>

      {errorMessage && <Alert type="error" message={`DB error: ${errorMessage}`} showIcon />}

      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <Table<ProgramRow>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          pagination={false}
          locale={{ emptyText: <Empty description="No programs yet" /> }}
        />
      </Card>

      <Modal
        title="New program"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText="Create & edit"
        confirmLoading={saving}
        destroyOnHidden
        width={640}
      >
        <Form<CreateFormValues> form={form} layout="vertical" onFinish={onCreate}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Required" }]}>
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="slug"
            label="Slug (URL)"
            tooltip="Auto-derived from name if empty. /programs/<slug>"
          >
            <Input placeholder="detox-reset" />
          </Form.Item>
          <Row gutter={12}>
            <Col xs={24} md={8}>
              <Form.Item name="cohort" label="Cohort" rules={[{ required: true, message: "Required" }]}>
                <Select options={COHORT_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="tier" label="Tier">
                <Select allowClear options={TIER_OPTIONS} placeholder="—" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="duration_days"
                label="Duration (days)"
                rules={[{ required: true, message: "Required" }]}
                tooltip="Default duration — variants override this"
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="price_usd"
            label="Price (USD)"
            rules={[{ required: true, message: "Required" }]}
            tooltip="Default price — variants override this"
          >
            <InputNumber min={0} step={50} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="outcomes"
            label="Outcomes (tags)"
            tooltip="Press Enter to add — e.g. detox, sleep, stress"
          >
            <Select mode="tags" tokenSeparators={[","]} placeholder="detox, sleep, stress" />
          </Form.Item>
          <Form.Item name="property_ids" label="Linked properties">
            <Select
              mode="multiple"
              showSearch
              optionFilterProp="label"
              options={propertyOptions.map((p) => ({ value: p.id, label: p.name }))}
              placeholder="Pick the venues that host this program"
            />
          </Form.Item>
          <Form.Item
            name="is_composite"
            label="Composite"
            valuePropName="checked"
            tooltip="Spans multiple properties (e.g. Core + Clinic + Wellbeing)"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}
