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

export type PropertyOption = { id: string; name: string; slug: string; active: boolean }

export type AccommodationRow = {
  id: string
  property_id: string
  room_type: string
  capacity: number
  has_pool: boolean
  price_thb_per_night: number
  description: string | null
  active: boolean
  sort_order: number
  properties: { id: string; name: string; slug: string } | null
}

type FormValues = {
  property_id: string
  room_type: string
  capacity: number
  has_pool?: boolean
  price_thb_per_night: number
  description?: string
  active?: boolean
  sort_order?: number
}

export default function AccommodationsView({
  rows,
  propertyOptions,
  errorMessage,
}: {
  rows: AccommodationRow[]
  propertyOptions: PropertyOption[]
  errorMessage: string | null
}) {
  const router = useRouter()
  const { message } = App.useApp()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AccommodationRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [filterProp, setFilterProp] = useState<string | null>(null)
  const [form] = Form.useForm<FormValues>()

  function openCreate() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({
      active: true,
      has_pool: false,
      sort_order: 100,
      property_id: filterProp ?? undefined,
    })
    setOpen(true)
  }

  function openEdit(a: AccommodationRow) {
    setEditing(a)
    form.setFieldsValue({
      property_id: a.property_id,
      room_type: a.room_type,
      capacity: a.capacity,
      has_pool: a.has_pool,
      price_thb_per_night: a.price_thb_per_night,
      description: a.description ?? "",
      active: a.active,
      sort_order: a.sort_order,
    })
    setOpen(true)
  }

  async function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      const url = editing ? `/api/accommodations/${editing.id}` : "/api/accommodations"
      const body: Record<string, unknown> = { ...values }
      if (editing) delete body.property_id // property cannot be changed
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
      message.success(editing ? "Accommodation updated" : "Accommodation created")
      setOpen(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const filtered = filterProp ? rows.filter((r) => r.property_id === filterProp) : rows

  const columns: ColumnsType<AccommodationRow> = [
    {
      title: "Property",
      dataIndex: "properties",
      width: 180,
      render: (p: AccommodationRow["properties"]) => p?.name ?? <Text type="secondary">—</Text>,
    },
    { title: "Room", dataIndex: "room_type" },
    { title: "Cap.", dataIndex: "capacity", width: 70 },
    {
      title: "Pool",
      dataIndex: "has_pool",
      width: 80,
      render: (v: boolean) => (v ? <Tag color="blue">pool</Tag> : <Text type="secondary">—</Text>),
    },
    {
      title: "Price / night",
      dataIndex: "price_thb_per_night",
      width: 130,
      render: (v: number) => `฿${Number(v).toLocaleString()}`,
    },
    {
      title: "Per person",
      key: "per_person",
      width: 110,
      render: (_v, r) =>
        `฿${Math.round(Number(r.price_thb_per_night) / Math.max(r.capacity, 1)).toLocaleString()}`,
    },
    { title: "Sort", dataIndex: "sort_order", width: 70 },
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
      render: (_v, r) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>
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
            {filtered.length} accommodation {filtered.length === 1 ? "rate" : "rates"}
          </Title>
          <Text type="secondary">Room and villa pricing per property</Text>
        </div>
        <Space>
          <Select
            allowClear
            placeholder="All properties"
            style={{ width: 220 }}
            value={filterProp ?? undefined}
            onChange={(v) => setFilterProp(v ?? null)}
            options={propertyOptions.map((p) => ({ value: p.id, label: p.name }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add room rate
          </Button>
        </Space>
      </Row>

      {errorMessage && <Alert type="error" message={`DB error: ${errorMessage}`} showIcon />}

      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <Table<AccommodationRow>
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          pagination={false}
          locale={{ emptyText: <Empty description="No rates yet" /> }}
        />
      </Card>

      <Modal
        title={editing ? `Edit ${editing.room_type}` : "New accommodation rate"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        destroyOnHidden
        width={580}
      >
        <Form<FormValues> form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item
            name="property_id"
            label="Property"
            rules={[{ required: true }]}
            tooltip={editing ? "Property cannot be changed after creation" : undefined}
          >
            <Select
              showSearch
              optionFilterProp="label"
              disabled={!!editing}
              options={propertyOptions.map((p) => ({ value: p.id, label: p.name }))}
            />
          </Form.Item>
          <Row gutter={12}>
            <Col xs={24} md={14}>
              <Form.Item name="room_type" label="Room type" rules={[{ required: true }]}>
                <Input placeholder="Single Room, Classic Villa…" />
              </Form.Item>
            </Col>
            <Col xs={12} md={5}>
              <Form.Item name="capacity" label="Capacity" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={5}>
              <Form.Item name="has_pool" label="Pool" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="price_thb_per_night"
            label="Price (THB per night)"
            rules={[{ required: true }]}
          >
            <InputNumber min={0} step={500} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 5 }} />
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
