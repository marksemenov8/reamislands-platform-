"use client"

import {
  ArrowLeftOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons"
import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  TimePicker,
  Typography,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import dayjs, { type Dayjs } from "dayjs"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useRef, useState, type MutableRefObject } from "react"
import HeroImageUpload from "./HeroImageUpload"

type TabSaveFn = (overrides?: { status?: Status }) => Promise<boolean>
type TabSaveRef = MutableRefObject<TabSaveFn | null>

const { Title, Text, Paragraph } = Typography

type Status = "draft" | "published" | "archived"

export type PropertyOption = { id: string; name: string; slug: string; active: boolean }
export type ServiceOption = {
  id: string
  name: string
  slug: string
  category: string | null
  price_usd: number | null
}

type Variant = {
  id: string
  label: string
  duration_days: number
  duration_nights: number
  price_basic_usd: number
  price_vip_usd: number | null
  active: boolean
  sort_order: number
}

type ScheduleItem = {
  id: string
  day_no: number
  start_time: string | null
  end_time: string | null
  title: string
  description: string | null
  kind: string | null
  sort_order: number
}

type ServiceLink = {
  service_id: string
  is_included: boolean
  sort_order: number
}

export type ProgramFull = {
  id: string
  name: string
  slug: string | null
  status: Status
  cohort: number
  tier: string | null
  duration_days: number
  price_usd: number
  summary: string | null
  goal: string | null
  target_guest: string | null
  how_we_achieve: string | null
  guest_feels: string | null
  included_services: string | null
  contraindications: string | null
  hero_image_url: string | null
  outcomes: string[] | null
  max_guests: number | null
  is_composite: boolean
  active: boolean
  sort_order: number | null
  published_at: string | null
  program_properties: Array<{ property_id: string }>
  program_variants: Variant[]
  program_schedule_items: ScheduleItem[]
  program_services: ServiceLink[]
}

const STATUS_COLOR: Record<Status, string> = {
  draft: "default",
  published: "green",
  archived: "red",
}

const KIND_OPTIONS = [
  { value: "meal", label: "meal" },
  { value: "session", label: "session" },
  { value: "protocol", label: "protocol" },
  { value: "free", label: "free" },
]

const COHORT_OPTIONS = [
  { value: 1, label: "1 · Reset" },
  { value: 2, label: "2 · Performance" },
  { value: 3, label: "3 · Mind" },
  { value: 4, label: "4 · Immersion" },
]

const TIER_OPTIONS = [
  { value: "RESET", label: "RESET" },
  { value: "REBUILD", label: "REBUILD" },
  { value: "TRANSFORM", label: "TRANSFORM" },
]

export default function EditView({
  program,
  propertyOptions,
  serviceOptions,
}: {
  program: ProgramFull
  propertyOptions: PropertyOption[]
  serviceOptions: ServiceOption[]
}) {
  const [tab, setTab] = useState("overview")
  const overviewSaveRef = useRef<TabSaveFn | null>(null)
  const contentSaveRef = useRef<TabSaveFn | null>(null)

  function activeTabSave(): TabSaveFn | null {
    if (tab === "overview") return overviewSaveRef.current
    if (tab === "content") return contentSaveRef.current
    return null
  }

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <Row align="middle" justify="space-between" wrap>
        <Space size={12} align="center">
          <Link href="/admin/programs">
            <Button icon={<ArrowLeftOutlined />} type="text" />
          </Link>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {program.name}
            </Title>
            <Text type="secondary">
              {program.slug ? `/programs/${program.slug}` : <i>no slug yet</i>} ·{" "}
              <Tag color={STATUS_COLOR[program.status]} style={{ marginInlineStart: 4 }}>
                {program.status}
              </Tag>
            </Text>
          </div>
        </Space>
      </Row>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: "overview",
            label: "Overview",
            children: (
              <OverviewTab
                program={program}
                propertyOptions={propertyOptions}
                saveRef={overviewSaveRef}
              />
            ),
          },
          {
            key: "content",
            label: "Content",
            children: <ContentTab program={program} saveRef={contentSaveRef} />,
          },
          {
            key: "variants",
            label: `Variants (${program.program_variants.length})`,
            children: <VariantsTab program={program} />,
          },
          {
            key: "schedule",
            label: `Schedule (${program.program_schedule_items.length})`,
            children: <ScheduleTab program={program} />,
          },
          {
            key: "services",
            label: `Services (${program.program_services.length})`,
            children: <ServicesTab program={program} serviceOptions={serviceOptions} />,
          },
        ]}
      />

      <PublishActions program={program} getActiveSave={activeTabSave} />
    </Space>
  )
}

// ─── PUBLISH ACTIONS FOOTER ─────────────────────────────────────
function PublishActions({
  program,
  getActiveSave,
}: {
  program: ProgramFull
  getActiveSave: () => TabSaveFn | null
}) {
  const { message, modal } = App.useApp()
  const router = useRouter()
  const [busy, setBusy] = useState<null | "draft" | "unpublish" | "publish">(null)

  const isPublished = program.status === "published"

  // Status-only PATCH (no form save). Used by Unpublish.
  async function patchStatusOnly(next: Status) {
    const res = await fetch(`/api/programs/${program.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
    const json = await res.json()
    if (!res.ok || !json.success) {
      message.error(json.error ?? "Save failed")
      return false
    }
    return true
  }

  // Submit the active tab's form (if any) with a status override, then refresh.
  // For tabs without a form (Variants/Schedule/Services), falls back to a
  // status-only PATCH so the user still gets the publish/unpublish action.
  async function saveAndSetStatus(next: Status) {
    const fn = getActiveSave()
    const ok = fn ? await fn({ status: next }) : await patchStatusOnly(next)
    if (ok) {
      message.success(
        next === "published"
          ? "Published"
          : next === "draft"
            ? "Saved as draft"
            : "Saved",
      )
      router.refresh()
    }
    return ok
  }

  async function onSaveAsDraft() {
    setBusy("draft")
    try {
      if (isPublished) {
        modal.confirm({
          title: "Clone as draft?",
          content:
            "This creates a new draft copy (with “-copy” in the name and slug) including all variants, schedule, services and linked properties. The current published program is not modified.",
          okText: "Create copy",
          onOk: async () => {
            const res = await fetch(`/api/programs/${program.id}/clone`, { method: "POST" })
            const json = await res.json()
            if (!res.ok || !json.success) {
              message.error(json.error ?? "Clone failed")
              return
            }
            message.success(`Copy created: ${json.program.name}`)
            router.push(`/admin/programs/${json.program.id}/edit`)
          },
        })
        return
      }
      await saveAndSetStatus("draft")
    } finally {
      setBusy(null)
    }
  }

  async function onUnpublish() {
    setBusy("unpublish")
    try {
      const ok = await patchStatusOnly("draft")
      if (ok) {
        message.success("Unpublished — back to draft")
        router.refresh()
      }
    } finally {
      setBusy(null)
    }
  }

  async function onPublish() {
    setBusy("publish")
    try {
      await saveAndSetStatus("published")
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card variant="borderless" styles={{ body: { padding: 16 } }}>
      <Row align="middle" justify="space-between" wrap gutter={[12, 12]}>
        <Button
          icon={isPublished ? <CopyOutlined /> : undefined}
          onClick={onSaveAsDraft}
          loading={busy === "draft"}
          disabled={busy !== null && busy !== "draft"}
        >
          {isPublished ? "Save as draft (copy)" : "Save as draft"}
        </Button>

        <Space size={8} wrap>
          <Button
            onClick={onUnpublish}
            loading={busy === "unpublish"}
            disabled={!isPublished || (busy !== null && busy !== "unpublish")}
          >
            Unpublish to drafts
          </Button>
          <Button
            type="primary"
            onClick={onPublish}
            loading={busy === "publish"}
            disabled={busy !== null && busy !== "publish"}
          >
            Publish
          </Button>
        </Space>
      </Row>
    </Card>
  )
}

// ─── OVERVIEW TAB ───────────────────────────────────────────────
type OverviewFormValues = {
  name: string
  slug: string
  status: Status
  cohort: number
  tier?: string
  duration_days: number
  price_usd: number
  max_guests?: number
  is_composite?: boolean
  active?: boolean
  sort_order?: number
  outcomes?: string[]
  hero_image_url?: string
  property_ids?: string[]
}

function OverviewTab({
  program,
  propertyOptions,
  saveRef,
}: {
  program: ProgramFull
  propertyOptions: PropertyOption[]
  saveRef: TabSaveRef
}) {
  const { message } = App.useApp()
  const [form] = Form.useForm<OverviewFormValues>()

  const initial: OverviewFormValues = {
    name: program.name,
    slug: program.slug ?? "",
    status: program.status,
    cohort: program.cohort,
    tier: program.tier ?? undefined,
    duration_days: program.duration_days,
    price_usd: program.price_usd,
    max_guests: program.max_guests ?? 10,
    is_composite: program.is_composite,
    active: program.active,
    sort_order: program.sort_order ?? 100,
    outcomes: program.outcomes ?? [],
    hero_image_url: program.hero_image_url ?? "",
    property_ids: program.program_properties.map((p) => p.property_id),
  }

  // Expose save fn so the global PublishActions can submit this tab with an
  // optional status override (e.g. "Publish" → save + status='published').
  saveRef.current = async (overrides) => {
    try {
      const values = await form.validateFields()
      const body = { ...values, ...(overrides ?? {}) }
      const res = await fetch(`/api/programs/${program.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        message.error(json.error ?? "Save failed")
        return false
      }
      return true
    } catch {
      // form validation error — antd already shows field errors
      return false
    }
  }

  return (
    <Card variant="borderless">
      <Form<OverviewFormValues>
        form={form}
        layout="vertical"
        initialValues={initial}
      >
        <Row gutter={16}>
          <Col xs={24} md={16}>
            <Form.Item name="name" label="Name" rules={[{ required: true, message: "Required" }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="slug" label="Slug" rules={[{ required: true, message: "Required" }]}>
              <Input addonBefore="/programs/" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: "draft", label: "Draft" },
                  { value: "published", label: "Published" },
                  { value: "archived", label: "Archived" },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="cohort" label="Cohort" rules={[{ required: true }]}>
              <Select options={COHORT_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="tier" label="Tier">
              <Select allowClear options={TIER_OPTIONS} placeholder="—" />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="sort_order" label="Sort order">
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Form.Item
              name="duration_days"
              label="Default duration (days)"
              tooltip="Variants override this — kept for legacy fields"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="price_usd"
              label="Default price (USD)"
              tooltip="Variants override this — kept for legacy fields"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} step={50} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="max_guests" label="Max guests">
              <InputNumber min={1} max={500} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Space size={24} style={{ marginTop: 30 }}>
              <Form.Item name="is_composite" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
              <Text>Composite</Text>
              <Form.Item name="active" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
              <Text>Active</Text>
            </Space>
          </Col>
        </Row>

        <Form.Item name="outcomes" label="Outcomes (tags)">
          <Select mode="tags" tokenSeparators={[","]} placeholder="detox, sleep, stress" />
        </Form.Item>

        <Form.Item name="hero_image_url" label="Hero image">
          <HeroImageUpload programId={program.id} />
        </Form.Item>

        <Form.Item name="property_ids" label="Linked properties">
          <Select
            mode="multiple"
            showSearch
            optionFilterProp="label"
            options={propertyOptions.map((p) => ({ value: p.id, label: p.name }))}
          />
        </Form.Item>
      </Form>
    </Card>
  )
}

// ─── CONTENT TAB ────────────────────────────────────────────────
type ContentFormValues = {
  summary?: string
  goal?: string
  target_guest?: string
  how_we_achieve?: string
  guest_feels?: string
  included_services?: string
  contraindications?: string
}

function ContentTab({
  program,
  saveRef,
}: {
  program: ProgramFull
  saveRef: TabSaveRef
}) {
  const { message } = App.useApp()
  const [form] = Form.useForm<ContentFormValues>()

  const initial: ContentFormValues = {
    summary: program.summary ?? "",
    goal: program.goal ?? "",
    target_guest: program.target_guest ?? "",
    how_we_achieve: program.how_we_achieve ?? "",
    guest_feels: program.guest_feels ?? "",
    included_services: program.included_services ?? "",
    contraindications: program.contraindications ?? "",
  }

  saveRef.current = async (overrides) => {
    try {
      const values = await form.validateFields()
      const body = { ...values, ...(overrides ?? {}) }
      const res = await fetch(`/api/programs/${program.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        message.error(json.error ?? "Save failed")
        return false
      }
      return true
    } catch {
      return false
    }
  }

  return (
    <Card variant="borderless">
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Markdown is supported in body fields (rendered on the public detail page)."
      />
      <Form<ContentFormValues>
        form={form}
        layout="vertical"
        initialValues={initial}
      >
        <Form.Item name="summary" label="Summary (1–2 lines, used on cards)">
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 3 }} maxLength={280} showCount />
        </Form.Item>

        <Form.Item name="goal" label="Goal — what we achieve">
          <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} />
        </Form.Item>

        <Form.Item name="target_guest" label="Target guest — who it's for">
          <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} />
        </Form.Item>

        <Form.Item name="how_we_achieve" label="How we achieve it (method)">
          <Input.TextArea autoSize={{ minRows: 4, maxRows: 12 }} />
        </Form.Item>

        <Form.Item name="guest_feels" label="What the guest will feel">
          <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} />
        </Form.Item>

        <Form.Item name="included_services" label="Included services (markdown list)">
          <Input.TextArea autoSize={{ minRows: 4, maxRows: 12 }} />
        </Form.Item>

        <Form.Item name="contraindications" label="Contraindications">
          <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} />
        </Form.Item>
      </Form>
    </Card>
  )
}

// ─── VARIANTS TAB ───────────────────────────────────────────────
type VariantFormValues = {
  label: string
  duration_days: number
  duration_nights: number
  price_basic_usd: number
  price_vip_usd?: number | null
  active?: boolean
  sort_order?: number
}

function VariantsTab({ program }: { program: ProgramFull }) {
  const { message } = App.useApp()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Variant | null>(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<VariantFormValues>()

  function openCreate() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ active: true, sort_order: (program.program_variants.length + 1) * 10 })
    setOpen(true)
  }

  function openEdit(v: Variant) {
    setEditing(v)
    form.setFieldsValue({
      label: v.label,
      duration_days: v.duration_days,
      duration_nights: v.duration_nights,
      price_basic_usd: v.price_basic_usd,
      price_vip_usd: v.price_vip_usd ?? undefined,
      active: v.active,
      sort_order: v.sort_order,
    })
    setOpen(true)
  }

  async function onSubmit(values: VariantFormValues) {
    setSaving(true)
    try {
      const url = editing
        ? `/api/programs/${program.id}/variants/${editing.id}`
        : `/api/programs/${program.id}/variants`
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        message.error(json.error ?? "Save failed")
        return
      }
      message.success(editing ? "Variant updated" : "Variant added")
      setOpen(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(v: Variant) {
    const res = await fetch(`/api/programs/${program.id}/variants/${v.id}`, { method: "DELETE" })
    const json = await res.json()
    if (!res.ok || !json.success) {
      message.error(json.error ?? "Delete failed")
      return
    }
    message.success("Deleted")
    router.refresh()
  }

  const columns: ColumnsType<Variant> = [
    { title: "Label", dataIndex: "label", width: 120 },
    { title: "Days", dataIndex: "duration_days", width: 70 },
    { title: "Nights", dataIndex: "duration_nights", width: 70 },
    {
      title: "Basic, $",
      dataIndex: "price_basic_usd",
      width: 100,
      render: (v: number) => `$${Number(v).toLocaleString()}`,
    },
    {
      title: "VIP, $",
      dataIndex: "price_vip_usd",
      width: 100,
      render: (v: number | null) => (v == null ? "—" : `$${Number(v).toLocaleString()}`),
    },
    {
      title: "Active",
      dataIndex: "active",
      width: 80,
      render: (v: boolean) => (v ? <Tag color="green">yes</Tag> : <Tag>no</Tag>),
    },
    { title: "Sort", dataIndex: "sort_order", width: 70 },
    {
      title: "",
      key: "actions",
      width: 100,
      render: (_v, row) => (
        <Space size={4}>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
          <Popconfirm title="Delete variant?" onConfirm={() => onDelete(row)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card variant="borderless">
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Text type="secondary">
          Each variant is one bookable duration (e.g. 6D/5N). Basic/VIP pricing per variant.
        </Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add variant
        </Button>
      </Row>

      <Table<Variant>
        rowKey="id"
        pagination={false}
        columns={columns}
        dataSource={[...program.program_variants].sort((a, b) => a.sort_order - b.sort_order)}
        size="small"
      />

      <Modal
        title={editing ? `Edit ${editing.label}` : "New variant"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form<VariantFormValues> form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item name="label" label="Label" rules={[{ required: true }]}>
            <Input placeholder="6D/5N" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="duration_days" label="Days" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="duration_nights" label="Nights" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="price_basic_usd" label="Basic price ($)" rules={[{ required: true }]}>
                <InputNumber min={0} step={50} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="price_vip_usd" label="VIP price ($)">
                <InputNumber min={0} step={50} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
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
    </Card>
  )
}

// ─── SCHEDULE TAB ───────────────────────────────────────────────
type ScheduleFormValues = {
  day_no: number
  start_time?: Dayjs | null
  end_time?: Dayjs | null
  title: string
  description?: string
  kind?: string
  sort_order?: number
}

function fmtTime(t: string | null): string {
  return t ? t.slice(0, 5) : "—"
}

function ScheduleTab({ program }: { program: ProgramFull }) {
  const { message } = App.useApp()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ScheduleItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<ScheduleFormValues>()

  function openCreate(day: number | null = null) {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({
      day_no: day ?? 1,
      sort_order: 100,
    })
    setOpen(true)
  }

  function openEdit(item: ScheduleItem) {
    setEditing(item)
    form.setFieldsValue({
      day_no: item.day_no,
      start_time: item.start_time ? dayjs(item.start_time, "HH:mm:ss") : null,
      end_time: item.end_time ? dayjs(item.end_time, "HH:mm:ss") : null,
      title: item.title,
      description: item.description ?? "",
      kind: item.kind ?? undefined,
      sort_order: item.sort_order,
    })
    setOpen(true)
  }

  async function onSubmit(values: ScheduleFormValues) {
    setSaving(true)
    try {
      const payload = {
        day_no: values.day_no,
        title: values.title,
        description: values.description ?? null,
        kind: values.kind ?? null,
        sort_order: values.sort_order ?? 100,
        start_time: values.start_time ? values.start_time.format("HH:mm:ss") : null,
        end_time: values.end_time ? values.end_time.format("HH:mm:ss") : null,
      }
      const url = editing
        ? `/api/programs/${program.id}/schedule/${editing.id}`
        : `/api/programs/${program.id}/schedule`
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        message.error(json.error ?? "Save failed")
        return
      }
      message.success(editing ? "Item updated" : "Item added")
      setOpen(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(item: ScheduleItem) {
    const res = await fetch(`/api/programs/${program.id}/schedule/${item.id}`, { method: "DELETE" })
    const json = await res.json()
    if (!res.ok || !json.success) {
      message.error(json.error ?? "Delete failed")
      return
    }
    message.success("Deleted")
    router.refresh()
  }

  const byDay = useMemo(() => {
    const map = new Map<number, ScheduleItem[]>()
    for (const item of program.program_schedule_items) {
      const arr = map.get(item.day_no) ?? []
      arr.push(item)
      map.set(item.day_no, arr)
    }
    for (const arr of map.values()) arr.sort((a, b) => a.sort_order - b.sort_order)
    return [...map.entries()].sort((a, b) => a[0] - b[0])
  }, [program.program_schedule_items])

  return (
    <Card variant="borderless">
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Text type="secondary">Daily timeline. Group items into days; reorder via sort_order.</Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate(null)}>
          Add item
        </Button>
      </Row>

      {byDay.length === 0 && (
        <Alert type="info" showIcon message="No schedule items yet. Click 'Add item' to start." />
      )}

      <Space direction="vertical" size={20} style={{ width: "100%" }}>
        {byDay.map(([day, items]) => (
          <Card
            key={day}
            size="small"
            title={`Day ${day}`}
            extra={
              <Button
                size="small"
                type="link"
                icon={<PlusOutlined />}
                onClick={() => openCreate(day)}
              >
                Add to day {day}
              </Button>
            }
          >
            <Table<ScheduleItem>
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: "Time",
                  key: "time",
                  width: 130,
                  render: (_v, r) => `${fmtTime(r.start_time)} – ${fmtTime(r.end_time)}`,
                },
                { title: "Title", dataIndex: "title" },
                {
                  title: "Kind",
                  dataIndex: "kind",
                  width: 90,
                  render: (k: string | null) => (k ? <Tag>{k}</Tag> : null),
                },
                { title: "Sort", dataIndex: "sort_order", width: 70 },
                {
                  title: "",
                  key: "actions",
                  width: 100,
                  render: (_v, row) => (
                    <Space size={4}>
                      <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
                      <Popconfirm title="Delete item?" onConfirm={() => onDelete(row)}>
                        <Button size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  ),
                },
              ]}
              dataSource={items}
            />
          </Card>
        ))}
      </Space>

      <Modal
        title={editing ? "Edit schedule item" : "New schedule item"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        destroyOnHidden
        width={600}
      >
        <Form<ScheduleFormValues> form={form} layout="vertical" onFinish={onSubmit}>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="day_no" label="Day #" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="start_time" label="Start">
                <TimePicker format="HH:mm" minuteStep={5} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="end_time" label="End">
                <TimePicker format="HH:mm" minuteStep={5} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="kind" label="Kind">
                <Select allowClear options={KIND_OPTIONS} placeholder="—" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sort_order" label="Sort order">
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  )
}

// ─── SERVICES TAB ───────────────────────────────────────────────
function ServicesTab({
  program,
  serviceOptions,
}: {
  program: ProgramFull
  serviceOptions: ServiceOption[]
}) {
  const { message } = App.useApp()
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const initialLinks = useMemo(
    () =>
      [...program.program_services]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((l) => ({
          service_id: l.service_id,
          is_included: l.is_included,
          sort_order: l.sort_order,
        })),
    [program.program_services],
  )

  const [links, setLinks] = useState(initialLinks)

  const serviceById = useMemo(
    () => new Map(serviceOptions.map((s) => [s.id, s])),
    [serviceOptions],
  )

  function addLink(serviceId: string) {
    if (links.find((l) => l.service_id === serviceId)) return
    setLinks([...links, { service_id: serviceId, is_included: false, sort_order: (links.length + 1) * 10 }])
  }

  function removeLink(serviceId: string) {
    setLinks(links.filter((l) => l.service_id !== serviceId))
  }

  function toggleIncluded(serviceId: string, included: boolean) {
    setLinks(
      links.map((l) => (l.service_id === serviceId ? { ...l, is_included: included } : l)),
    )
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/programs/${program.id}/services`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        message.error(json.error ?? "Save failed")
        return
      }
      message.success("Services updated")
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const available = serviceOptions.filter((s) => !links.find((l) => l.service_id === s.id))

  return (
    <Card variant="borderless">
      <Paragraph type="secondary">
        Mark services as <b>included</b> if their cost is bundled into the program price.
        Unmarked services appear as optional upgrades on the public page.
      </Paragraph>

      <Title level={5}>Add service</Title>
      <Select
        showSearch
        placeholder={available.length ? "Pick a service…" : "All catalog services already linked"}
        style={{ width: "100%", marginBottom: 24 }}
        disabled={available.length === 0}
        optionFilterProp="label"
        onSelect={(v) => addLink(String(v))}
        value={null}
        options={available.map((s) => ({
          value: s.id,
          label: `${s.name}${s.category ? ` · ${s.category}` : ""}${s.price_usd ? ` · $${s.price_usd}` : ""}`,
        }))}
      />

      <Title level={5}>Linked ({links.length})</Title>
      <Table
        rowKey="service_id"
        pagination={false}
        size="small"
        columns={[
          {
            title: "Service",
            dataIndex: "service_id",
            render: (id: string) => {
              const s = serviceById.get(id)
              return s ? (
                <div>
                  <Text strong>{s.name}</Text>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {s.category ?? "—"} {s.price_usd ? `· $${s.price_usd}` : ""}
                    </Text>
                  </div>
                </div>
              ) : (
                <Text type="secondary">{id}</Text>
              )
            },
          },
          {
            title: "Included",
            dataIndex: "is_included",
            width: 120,
            render: (v: boolean, row) => (
              <Checkbox
                checked={v}
                onChange={(e) => toggleIncluded(row.service_id, e.target.checked)}
              >
                in price
              </Checkbox>
            ),
          },
          {
            title: "",
            key: "actions",
            width: 80,
            render: (_v, row) => (
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeLink(row.service_id)}
              />
            ),
          },
        ]}
        dataSource={links}
      />

      <div style={{ marginTop: 16 }}>
        <Button type="primary" loading={saving} onClick={save}>
          Save services
        </Button>
      </div>
    </Card>
  )
}
