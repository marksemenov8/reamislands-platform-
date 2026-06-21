"use client"

import {
  PlusOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  TrophyOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons"
import {
  Alert,
  App,
  Button,
  Card,
  DatePicker,
  Empty,
  Form,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Typography,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import dayjs, { type Dayjs } from "dayjs"
import { useRouter } from "next/navigation"
import { useState } from "react"

const { Text, Title } = Typography

export type BookingRow = {
  id: string
  user_id: string | null
  program_id: string | null
  arrival: string | null
  departure: string | null
  pax: number | null
  amount_usd: number | null
  deposit_usd: number | null
  status: string
  pre_wbs: number | null
  post_wbs: number | null
  created_at: string
  user: { name: string | null; country: string | null } | null
  program: { name: string | null; tier: string | null } | null
}

export type GuestOption = { id: string; name: string | null; country: string | null }
export type ProgramOption = {
  id: string
  name: string
  cohort: number
  tier: string | null
  price_usd: number
}

type FormValues = {
  user_id: string
  program_id: string
  dates?: [Dayjs, Dayjs]
  pax?: number
  amount_usd?: number
  deposit_usd?: number
  status: BookingRow["status"]
  pre_wbs?: number
  post_wbs?: number
}

const statusColor: Record<string, string> = {
  inquiry: "default",
  confirmed: "geekblue",
  active: "green",
  completed: "purple",
  cancelled: "volcano",
}

const statusOptions = [
  { value: "inquiry", label: "Inquiry" },
  { value: "confirmed", label: "Confirmed" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

function guestLabel(g: GuestOption): string {
  const name = g.name ?? "(unnamed)"
  return g.country ? `${name} · ${g.country}` : name
}

function programLabel(p: ProgramOption): string {
  return `${p.name} · $${Number(p.price_usd).toLocaleString()}`
}

export default function BookingsView({
  rows,
  errorMessage,
  guests,
  programs,
}: {
  rows: BookingRow[]
  errorMessage: string | null
  guests: GuestOption[]
  programs: ProgramOption[]
}) {
  const router = useRouter()
  const { message, modal } = App.useApp()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const [form] = Form.useForm<FormValues>()
  const [localGuests, setLocalGuests] = useState<GuestOption[]>(guests)
  const [guestSearch, setGuestSearch] = useState("")
  const [creatingGuest, setCreatingGuest] = useState(false)

  const editingRow = editingId ? rows.find((r) => r.id === editingId) ?? null : null
  const currentStatus = (editingRow?.status ?? "inquiry") as
    | "inquiry"
    | "confirmed"
    | "active"
    | "completed"
    | "cancelled"
  const STATUS_ORDER = ["inquiry", "confirmed", "active", "completed"] as const
  const stepIndex =
    currentStatus === "cancelled"
      ? -1
      : STATUS_ORDER.indexOf(currentStatus as (typeof STATUS_ORDER)[number])

  async function doTransition(
    to: "confirmed" | "active" | "completed" | "cancelled",
    extra?: { pre_wbs?: number; post_wbs?: number },
  ) {
    if (!editingId) return
    setTransitioning(true)
    try {
      const res = await fetch(`/api/bookings/${editingId}/transition`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to, ...extra }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        message.error(json.error ?? "Transition failed")
        return
      }
      message.success(`Moved to ${to}`)
      closeModal()
      router.refresh()
    } finally {
      setTransitioning(false)
    }
  }

  function askWbsThenTransition(
    to: "active" | "completed",
    label: "pre" | "post",
  ) {
    let value: number | null = null
    modal.confirm({
      title: label === "pre" ? "Pre-stay WBS score" : "Post-stay WBS score",
      content: (
        <div>
          <p style={{ marginTop: 0 }}>
            Enter the guest&apos;s {label === "pre" ? "pre-stay" : "post-stay"} WBS
            score (0–100). Required to {to === "active" ? "start" : "complete"} the
            stay.
          </p>
          <InputNumber
            min={0}
            max={100}
            style={{ width: "100%" }}
            onChange={(v) => {
              value = typeof v === "number" ? v : null
            }}
          />
        </div>
      ),
      okText: to === "active" ? "Start stay" : "Complete stay",
      onOk: async () => {
        if (value == null) {
          message.error("Enter a score 0–100")
          return Promise.reject()
        }
        await doTransition(to, label === "pre" ? { pre_wbs: value } : { post_wbs: value })
      },
    })
  }

  function confirmCancel() {
    modal.confirm({
      title: "Cancel this booking?",
      content: "Notifies admin inbox. This action is reversible only by admin via SQL.",
      okText: "Cancel booking",
      okButtonProps: { danger: true },
      onOk: () => doTransition("cancelled"),
    })
  }

  const openCreate = () => {
    setEditingId(null)
    form.resetFields()
    setOpen(true)
  }

  const openEdit = (row: BookingRow) => {
    setEditingId(row.id)
    form.setFieldsValue({
      user_id: row.user_id ?? undefined,
      program_id: row.program_id ?? undefined,
      dates:
        row.arrival && row.departure
          ? [dayjs(row.arrival), dayjs(row.departure)]
          : undefined,
      pax: row.pax ?? undefined,
      amount_usd: row.amount_usd ?? undefined,
      deposit_usd: row.deposit_usd ?? undefined,
      status: row.status as BookingRow["status"],
      pre_wbs: row.pre_wbs ?? undefined,
      post_wbs: row.post_wbs ?? undefined,
    })
    setOpen(true)
  }

  const closeModal = () => {
    setOpen(false)
    setEditingId(null)
    setGuestSearch("")
  }

  const createGuest = async () => {
    const name = guestSearch.trim()
    if (!name) return
    setCreatingGuest(true)
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, source: "manual" }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        message.error(json.error ?? "Failed to create guest")
        return
      }
      const u: GuestOption = json.user
      setLocalGuests((prev) => [u, ...prev])
      form.setFieldValue("user_id", u.id)
      setGuestSearch("")
      message.success(`Added guest "${u.name}"`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Network error")
    } finally {
      setCreatingGuest(false)
    }
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    try {
      const body = {
        user_id: values.user_id,
        program_id: values.program_id,
        arrival: values.dates?.[0]?.format("YYYY-MM-DD") ?? null,
        departure: values.dates?.[1]?.format("YYYY-MM-DD") ?? null,
        pax: values.pax ?? null,
        amount_usd: values.amount_usd ?? null,
        deposit_usd: values.deposit_usd ?? null,
        status: values.status,
        pre_wbs: values.pre_wbs ?? null,
        post_wbs: values.post_wbs ?? null,
      }
      const url = editingId ? `/api/bookings/${editingId}` : "/api/bookings"
      const method = editingId ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        message.error(json.error ?? "Failed to save booking")
        return
      }
      message.success(editingId ? "Booking updated" : "Booking created")
      closeModal()
      router.refresh()
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Network error")
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnsType<BookingRow> = [
    {
      title: "Guest",
      key: "guest",
      render: (_: unknown, row) => (
        <Space orientation="vertical" size={0}>
          <Text strong>{row.user?.name ?? "—"}</Text>
          {row.user?.country && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {row.user.country}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Program",
      key: "program",
      render: (_: unknown, row) => (
        <Space orientation="vertical" size={0}>
          <Text>{row.program?.name ?? "—"}</Text>
          {row.program?.tier && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {row.program.tier}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Dates",
      key: "dates",
      render: (_: unknown, row) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {row.arrival ?? "—"} → {row.departure ?? "—"}
        </Text>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount_usd",
      key: "amount",
      width: 110,
      render: (a: number | null) =>
        a != null ? (
          <Text strong>${Number(a).toLocaleString()}</Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "WBS",
      key: "wbs",
      width: 150,
      render: (_: unknown, row) => {
        if (row.pre_wbs == null && row.post_wbs == null)
          return <Text type="secondary">—</Text>
        const wbsColor = (s: number | null): string => {
          if (s == null) return "#9aa6a1"
          if (s >= 70) return "#0F6E56"
          if (s >= 50) return "#b3781b"
          return "#a8362b"
        }
        const d =
          row.pre_wbs != null && row.post_wbs != null ? row.post_wbs - row.pre_wbs : null
        const dColor = d == null ? "#9aa6a1" : d > 0 ? "#0F6E56" : d < 0 ? "#a8362b" : "#9aa6a1"
        return (
          <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 600 }}>
            <span style={{ color: wbsColor(row.pre_wbs) }}>{row.pre_wbs ?? "—"}</span>
            <span style={{ color: "#9aa6a1", margin: "0 4px" }}>→</span>
            <span style={{ color: wbsColor(row.post_wbs) }}>{row.post_wbs ?? "—"}</span>
            {d != null && (
              <span style={{ marginLeft: 8, color: dColor, fontSize: 12 }}>
                {d > 0 ? "+" : ""}
                {d}
              </span>
            )}
          </span>
        )
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (s: string) => <Tag color={statusColor[s] ?? "default"}>{s}</Tag>,
    },
  ]

  return (
    <Space orientation="vertical" size={20} style={{ width: "100%" }}>
      <Row align="middle" justify="space-between" wrap>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {rows.length} {rows.length === 1 ? "booking" : "bookings"}
          </Title>
          <Text type="secondary">Click a row to edit · stays from inquiry to completion</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Booking
        </Button>
      </Row>

      {errorMessage && <Alert type="error" message={`DB error: ${errorMessage}`} showIcon />}

      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <Table<BookingRow>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          pagination={false}
          onRow={(row) => ({
            onClick: () => openEdit(row),
            style: { cursor: "pointer" },
          })}
          locale={{ emptyText: <Empty description="No bookings yet" /> }}
        />
      </Card>

      <Modal
        title={editingId ? "Edit booking" : "New booking"}
        open={open}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={editingId ? "Save" : "Create"}
        confirmLoading={submitting}
        destroyOnHidden
      >
        {editingId && editingRow && (
          <Card variant="borderless" style={{ background: "#f6f8f7", marginBottom: 16 }}>
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              {currentStatus === "cancelled" ? (
                <Alert type="error" showIcon message="Booking cancelled" />
              ) : (
                <Steps
                  size="small"
                  current={stepIndex < 0 ? 0 : stepIndex}
                  items={[
                    { title: "Inquiry" },
                    { title: "Confirmed" },
                    { title: "Active" },
                    { title: "Completed" },
                  ]}
                />
              )}
              <Space wrap>
                {currentStatus === "inquiry" && (
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    loading={transitioning}
                    onClick={() => doTransition("confirmed")}
                  >
                    Confirm
                  </Button>
                )}
                {currentStatus === "confirmed" && (
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    loading={transitioning}
                    onClick={() => {
                      if (editingRow.pre_wbs == null) askWbsThenTransition("active", "pre")
                      else doTransition("active")
                    }}
                  >
                    Start stay
                  </Button>
                )}
                {currentStatus === "active" && (
                  <Button
                    type="primary"
                    icon={<TrophyOutlined />}
                    loading={transitioning}
                    onClick={() => {
                      if (editingRow.post_wbs == null) askWbsThenTransition("completed", "post")
                      else doTransition("completed")
                    }}
                  >
                    Complete
                  </Button>
                )}
                {currentStatus !== "completed" && currentStatus !== "cancelled" && (
                  <Button
                    danger
                    icon={<CloseCircleOutlined />}
                    loading={transitioning}
                    onClick={confirmCancel}
                  >
                    Cancel
                  </Button>
                )}
              </Space>
            </Space>
          </Card>
        )}

        <Form<FormValues>
          form={form}
          layout="vertical"
          onFinish={onSubmit}
          initialValues={{ status: "inquiry", pax: 1, deposit_usd: 0 }}
        >
          <Form.Item
            name="user_id"
            label="Guest"
            rules={[{ required: true, message: "Select or create a guest" }]}
          >
            <Select
              showSearch
              placeholder="Type a name — pick existing or create new"
              optionFilterProp="label"
              searchValue={guestSearch}
              onSearch={setGuestSearch}
              options={localGuests.map((g) => ({ value: g.id, label: guestLabel(g) }))}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  {guestSearch.trim() && (
                    <div style={{ padding: 8, borderTop: "1px solid #eef1ef" }}>
                      <Button
                        block
                        type="text"
                        icon={<PlusOutlined />}
                        loading={creatingGuest}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={createGuest}
                        style={{ textAlign: "left", color: "#0F6E56" }}
                      >
                        Add new guest: &ldquo;{guestSearch.trim()}&rdquo;
                      </Button>
                    </div>
                  )}
                </>
              )}
            />
          </Form.Item>

          <Form.Item
            name="program_id"
            label="Program"
            rules={[{ required: true, message: "Select a program" }]}
          >
            <Select
              showSearch
              placeholder="Select program"
              optionFilterProp="label"
              options={programs.map((p) => ({ value: p.id, label: programLabel(p) }))}
            />
          </Form.Item>

          <Form.Item name="dates" label="Arrival → Departure">
            <DatePicker.RangePicker style={{ width: "100%" }} />
          </Form.Item>

          <Row gutter={12}>
            <Form.Item name="pax" label="Pax" style={{ flex: 1, marginRight: 12 }}>
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="amount_usd" label="Amount (USD)" style={{ flex: 1, marginRight: 12 }}>
              <InputNumber min={0} step={50} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="deposit_usd" label="Deposit (USD)" style={{ flex: 1 }}>
              <InputNumber min={0} step={50} style={{ width: "100%" }} />
            </Form.Item>
          </Row>

          <Row gutter={12}>
            <Form.Item name="pre_wbs" label="Pre-WBS" style={{ flex: 1, marginRight: 12 }}>
              <InputNumber min={0} max={100} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="post_wbs" label="Post-WBS" style={{ flex: 1, marginRight: 12 }}>
              <InputNumber min={0} max={100} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="status"
              label="Status"
              style={{ flex: 1 }}
              rules={[{ required: true }]}
            >
              <Select options={statusOptions} />
            </Form.Item>
          </Row>
        </Form>
      </Modal>
    </Space>
  )
}
