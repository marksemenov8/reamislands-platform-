"use client"

import { EditOutlined, PlusOutlined, SafetyCertificateOutlined } from "@ant-design/icons"
import {
  Alert,
  App,
  Button,
  Card,
  Empty,
  Form,
  Input,
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
const { TextArea } = Input

export type PropertyRow = {
  id: string
  name: string
  slug: string
  parent_id: string | null
  parent_name?: string | null
  island: string | null
  country: string | null
  cohort_tags: number[] | null
  certified: boolean
  active: boolean
  contact_wa: string | null
  description: string | null
  created_at: string
}

type FormValues = {
  name: string
  slug: string
  parent_id?: string | null
  island?: string
  country?: string
  cohort_tags?: number[]
  certified?: boolean
  active?: boolean
  contact_wa?: string
  description?: string
}

const cohortOptions = [
  { value: 1, label: "1 · Reset" },
  { value: 2, label: "2 · Performance" },
  { value: 3, label: "3 · Mind" },
  { value: 4, label: "4 · Immersion" },
]

export default function PropertiesView({
  rows,
  parentOptions,
  errorMessage,
}: {
  rows: PropertyRow[]
  parentOptions: Array<{ id: string; name: string }>
  errorMessage: string | null
}) {
  const router = useRouter()
  const { message } = App.useApp()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PropertyRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<FormValues>()

  function openCreate() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ active: true, certified: false })
    setOpen(true)
  }

  function openEdit(p: PropertyRow) {
    setEditing(p)
    form.setFieldsValue({
      name: p.name,
      slug: p.slug,
      parent_id: p.parent_id ?? undefined,
      island: p.island ?? undefined,
      country: p.country ?? undefined,
      cohort_tags: p.cohort_tags ?? [],
      certified: p.certified,
      active: p.active,
      contact_wa: p.contact_wa ?? undefined,
      description: p.description ?? undefined,
    })
    setOpen(true)
  }

  async function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      const body = {
        ...values,
        parent_id: values.parent_id || null,
      }
      const url = editing ? `/api/properties/${editing.id}` : "/api/properties"
      const method = editing ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        message.error(json.error ?? "Save failed")
        return
      }
      message.success(editing ? "Property updated" : "Property created")
      setOpen(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnsType<PropertyRow> = [
    {
      title: "Property",
      key: "name",
      render: (_v, p) => (
        <div>
          <Text strong>{p.name}</Text>
          {p.parent_name && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ↳ inside {p.parent_name}
              </Text>
            </div>
          )}
          <div>
            <Text code style={{ fontSize: 11 }}>
              {p.slug}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Location",
      key: "loc",
      render: (_v, p) => (
        <Text type="secondary">
          {p.island ?? "—"}
          {p.country ? `, ${p.country}` : ""}
        </Text>
      ),
    },
    {
      title: "Cohorts",
      dataIndex: "cohort_tags",
      key: "cohort_tags",
      render: (tags: number[] | null) => (
        <Space size={4} wrap>
          {(tags ?? []).map((c) => (
            <Tag key={c} color="green" style={{ background: "#E1F5EE", color: "#0F6E56", border: "none" }}>
              C{c}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_v, p) => (
        <Space size={4}>
          {p.active ? <Tag color="green">active</Tag> : <Tag>inactive</Tag>}
          {p.certified && (
            <Tag color="blue" icon={<SafetyCertificateOutlined />}>
              certified
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_v, p) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(p)}>
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
            {rows.length} {rows.length === 1 ? "property" : "properties"}
          </Title>
          <Text type="secondary">Parent venues and clinical sub-units across SEA</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Property
        </Button>
      </Row>

      {errorMessage && <Alert type="error" message={`DB error: ${errorMessage}`} showIcon />}

      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <Table<PropertyRow>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          pagination={false}
          locale={{ emptyText: <Empty description="No properties yet" /> }}
        />
      </Card>

      <Modal
        title={editing ? `Edit ${editing.name}` : "New property"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText={editing ? "Save" : "Create"}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form<FormValues> form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name required" }]}>
            <Input autoComplete="off" placeholder="Tanya Samui — Core" />
          </Form.Item>
          <Form.Item
            name="slug"
            label="Slug"
            rules={[
              { required: true, message: "Slug required" },
              { pattern: /^[a-z0-9-]+$/, message: "Lowercase letters, digits, hyphens" },
            ]}
          >
            <Input autoComplete="off" placeholder="tanya-core" />
          </Form.Item>
          <Form.Item name="parent_id" label="Parent property (optional)">
            <Select
              allowClear
              placeholder="No parent (top-level)"
              options={parentOptions
                .filter((p) => p.id !== editing?.id)
                .map((p) => ({ value: p.id, label: p.name }))}
            />
          </Form.Item>
          <Row gutter={12}>
            <Form.Item name="island" label="Island" style={{ flex: 1, marginRight: 12 }}>
              <Input autoComplete="off" />
            </Form.Item>
            <Form.Item name="country" label="Country" style={{ flex: 1 }}>
              <Input autoComplete="off" />
            </Form.Item>
          </Row>
          <Form.Item name="cohort_tags" label="Cohort focus">
            <Select mode="multiple" options={cohortOptions} placeholder="Pick cohorts" />
          </Form.Item>
          <Row gutter={12}>
            <Form.Item name="certified" label="Certified" valuePropName="checked" style={{ marginRight: 24 }}>
              <Switch />
            </Form.Item>
            <Form.Item name="active" label="Active" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Row>
          <Form.Item name="contact_wa" label="WhatsApp number (with country code)">
            <Input autoComplete="off" placeholder="+66800000000" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}
