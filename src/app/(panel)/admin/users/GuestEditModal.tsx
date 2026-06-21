"use client"

import { Alert, App, Form, Input, InputNumber, Modal, Select, Space, Table, Tabs, Tag, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import { useEffect, useState } from "react"
import WbsDailyRail from "./WbsDailyRail"

const { Text } = Typography

export type RoleScope = "admin" | "partner" | "self"

type GuestApiResponse = {
  success: boolean
  user?: {
    id: string
    name: string | null
    email: string | null
    whatsapp: string | null
    country: string | null
    wbs_score: number | null
    cohort: number | null
    source: string | null
    created_at: string
    auth_user_id: string | null
  }
  revisions?: Array<{
    id: string
    edited_by: string | null
    edited_at: string
    changed: Record<string, { from: unknown; to: unknown }>
  }>
  error?: string
}

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  email: "Email",
  whatsapp: "WhatsApp",
  country: "Country",
  wbs_score: "WBS Score",
  cohort: "Cohort",
  source: "Source",
}

export default function GuestEditModal({
  userId,
  onClose,
  onSaved,
  role,
}: {
  userId: string | null
  onClose: () => void
  onSaved: () => void
  role: RoleScope
}) {
  const { notification } = App.useApp()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<GuestApiResponse | null>(null)
  const open = !!userId

  useEffect(() => {
    if (!userId) {
      setData(null)
      form.resetFields()
      return
    }
    let cancelled = false
    setLoading(true)
    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then((json: GuestApiResponse) => {
        if (cancelled) return
        if (!json.success || !json.user) {
          notification.error({ message: "Couldn't load guest", description: json.error })
          onClose()
          return
        }
        setData(json)
        form.setFieldsValue({
          name: json.user.name ?? "",
          email: json.user.email ?? "",
          whatsapp: json.user.whatsapp ?? "",
          country: json.user.country ?? "",
          wbs_score: json.user.wbs_score,
          cohort: json.user.cohort,
          source: json.user.source ?? "",
        })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId, form, notification, onClose])

  async function onSubmit(values: Record<string, unknown>) {
    if (!userId) return
    setSaving(true)
    try {
      const body = Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, v === "" ? null : v]),
      )
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        notification.error({ message: "Save failed", description: json.error ?? "unknown error" })
        return
      }
      notification.success({ message: "Guest updated" })
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const canEditFull = role === "admin"
  const canEditWbs = role === "admin" || role === "partner"
  const restrictedNote =
    role === "admin"
      ? null
      : role === "partner"
        ? "Partners can edit name, WhatsApp, country, and daily WBS scores. Other fields are read-only."
        : "You can update your own name, WhatsApp, and country."

  const revisionCols: ColumnsType<NonNullable<GuestApiResponse["revisions"]>[number]> = [
    {
      title: "When",
      dataIndex: "edited_at",
      key: "edited_at",
      width: 160,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: "By",
      dataIndex: "edited_by",
      key: "edited_by",
      width: 120,
      render: (v: string | null) =>
        v ? (
          <Text code style={{ fontSize: 11 }}>
            {v.slice(0, 8)}…
          </Text>
        ) : (
          <Text type="secondary">system</Text>
        ),
    },
    {
      title: "Changes",
      dataIndex: "changed",
      key: "changed",
      render: (changed: Record<string, { from: unknown; to: unknown }>) => (
        <Space direction="vertical" size={4}>
          {Object.entries(changed).map(([field, { from, to }]) => (
            <Space key={field} size={6}>
              <Tag color="default">{FIELD_LABELS[field] ?? field}</Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {String(from ?? "—")}
              </Text>
              <Text type="secondary">→</Text>
              <Text style={{ fontSize: 12 }}>{String(to ?? "—")}</Text>
            </Space>
          ))}
        </Space>
      ),
    },
  ]

  return (
    <Modal
      title={data?.user?.name ?? data?.user?.email ?? "Edit guest"}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Save"
      confirmLoading={saving}
      destroyOnHidden
      width={640}
    >
      <Tabs
        items={[
          {
            key: "edit",
            label: "Details",
            children: (
              <Form form={form} layout="vertical" onFinish={onSubmit} disabled={loading}>
                {restrictedNote && (
                  <Alert type="info" showIcon message={restrictedNote} style={{ marginBottom: 16 }} />
                )}
                <Form.Item name="name" label="Name">
                  <Input autoComplete="off" />
                </Form.Item>
                <Form.Item name="whatsapp" label="WhatsApp">
                  <Input autoComplete="off" />
                </Form.Item>
                <Form.Item name="country" label="Country">
                  <Input autoComplete="off" />
                </Form.Item>
                <Form.Item name="email" label="Email">
                  <Input autoComplete="off" disabled={!canEditFull} />
                </Form.Item>
                {userId && (
                  <Form.Item label={null} style={{ marginBottom: 24 }}>
                    <WbsDailyRail userId={userId} editable={canEditWbs} />
                  </Form.Item>
                )}
                <Form.Item name="cohort" label="Cohort">
                  <Select
                    disabled={!canEditFull}
                    allowClear
                    options={[
                      { value: 1, label: "1 · Reset" },
                      { value: 2, label: "2 · Performance" },
                      { value: 3, label: "3 · Mind" },
                      { value: 4, label: "4 · Immersion" },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="source" label="Source">
                  <Input disabled={!canEditFull} />
                </Form.Item>
              </Form>
            ),
          },
          {
            key: "revisions",
            label: `Revisions (${data?.revisions?.length ?? 0})`,
            children:
              data?.revisions && data.revisions.length > 0 ? (
                <Table
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={revisionCols}
                  dataSource={data.revisions}
                />
              ) : (
                <Text type="secondary">No edits yet — this guest's row is original.</Text>
              ),
          },
        ]}
      />
    </Modal>
  )
}
