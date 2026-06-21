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
import { useRouter } from "next/navigation"
import { useState } from "react"

const { Text, Title } = Typography

export type ServiceRow = {
  id: string
  name: string
  slug: string
  category: string | null
  description: string | null
  duration_min: number | null
  price_thb: number | null
  price_usd: number | null
  dit_commission_pct: number
  active: boolean
  sort_order: number
}

type FormValues = {
  name: string
  slug?: string
  category?: string
  description?: string
  duration_min?: number
  price_thb?: number
  price_usd?: number
  dit_commission_pct?: number
  active?: boolean
  sort_order?: number
}

const CATEGORY_OPTIONS = [
  { value: "massage", label: "Massage" },
  { value: "beauty", label: "Beauty" },
  { value: "iv", label: "IV / Vitamins" },
  { value: "mind", label: "Mind / Healing" },
  { value: "medical", label: "Medical" },
  { value: "other", label: "Other" },
]

const CATEGORY_COLOR: Record<string, string> = {
  massage: "purple",
  beauty: "magenta",
  iv: "blue",
  mind: "green",
  medical: "red",
  other: "default",
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
}

export default function ServicesView({
  rows,
  errorMessage,
}: {
  rows: ServiceRow[]
  errorMessage: string | null
}) {
  const router = useRouter()
  const { message } = App.useApp()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ServiceRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<FormValues>()

  function openCreate() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ active: true, dit_commission_pct: 15, sort_order: 100 })
    setOpen(true)
  }

  function openEdit(s: ServiceRow) {
    setEditing(s)
    form.setFieldsValue({
      name: s.name,
      slug: s.slug,
      category: s.category ?? undefined,
      description: s.description ?? "",
      duration_min: s.duration_min ?? undefined,
      price_thb: s.price_thb ?? undefined,
      price_usd: s.price_usd ?? undefined,
      dit_commission_pct: s.dit_commission_pct,
      active: s.active,
      sort_order: s.sort_order,
    })
    setOpen(true)
  }

  async function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      const body = {
        ...values,
        slug: values.slug?.trim() || slugify(values.name),
      }
      const url = editing ? `/api/services/${editing.id}` : "/api/services"
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        message.error(json.error ?? "Save failed")
        return
      }
      message.success(editing ? "Service updated" : "Service created")
      setOpen(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnsType<ServiceRow> = [
    {
      title: "Service",
      key: "name",
      render: (_v, s) => (
        <div>
          <Text strong>{s.name}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {s.slug} {s.duration_min ? `· ${s.duration_min}min` : ""}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      width: 130,
      render: (c: string | null) =>
        c ? <Tag color={CATEGORY_COLOR[c] ?? "default"}>{c}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: "Price (THB)",
      dataIndex: "price_thb",
      width: 120,
      render: (v: number | null) => (v == null ? "—" : `฿${Number(v).toLocaleString()}`),
    },
    {
      title: "Price (USD)",
      dataIndex: "price_usd",
      width: 120,
      render: (v: number | null) => (v == null ? "—" : `$${Number(v).toLocaleString()}`),
    },
    { title: "Commission", dataIndex: "dit_commission_pct", width: 110, render: (v: number) => `${v}%` },
    {
      title: "Status",
      dataIndex: "active",
      width: 100,
      render: (v: boolean) => (v ? <Tag color="green">active</Tag> : <Tag>inactive</Tag>),
    },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_v, s) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(s)}>
          Edit
        </Button>
      ),
    },
  ]

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <Row align="middle" justify="space-between" wrap>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {rows.length} services
          </Title>
          <Text type="secondary">
            À-la-carte catalog (massage, IV, beauty, mind). DIT commission 15% by default.
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Service
        </Button>
      </Row>

      {errorMessage && <Alert type="error" message={`DB error: ${errorMessage}`} showIcon />}

      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <Table<ServiceRow>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          pagination={false}
          locale={{ emptyText: <Empty description="No services yet" /> }}
        />
      </Card>

      <Modal
        title={editing ? `Edit ${editing.name}` : "New service"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        destroyOnHidden
        width={640}
      >
        <Form<FormValues> form={form} layout="vertical" onFinish={onSubmit}>
          <Row gutter={12}>
            <Col xs={24} md={16}>
              <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="slug" label="Slug" tooltip="Auto-derived from name if empty">
                <Input placeholder="thai-massage" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="category" label="Category">
                <Select allowClear options={CATEGORY_OPTIONS} placeholder="—" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="duration_min" label="Duration (min)">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="price_thb" label="Price (THB)">
                <InputNumber min={0} step={100} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="price_usd" label="Price (USD)">
                <InputNumber min={0} step={5} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dit_commission_pct" label="Commission %">
                <InputNumber min={0} max={100} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Description">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="sort_order" label="Sort order">
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="active" label="Active" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Space>
  )
}
