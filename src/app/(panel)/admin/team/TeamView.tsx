"use client"

import {
  KeyOutlined,
  PlusOutlined,
  EditOutlined,
  CopyOutlined,
  UserOutlined,
  CrownOutlined,
  TeamOutlined,
} from "@ant-design/icons"
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

const { Text, Title } = Typography

export type TeamMember = {
  id: string
  email: string
  role: "admin" | "partner" | "user"
  partner_property_id: string | null
  partner_property_name: string | null
  partner_property_slug: string | null
  full_name: string | null
  password_set_by_admin: boolean
  created_at: string
}

export type PropertyOption = {
  id: string
  name: string
  slug: string
  active: boolean
}

const roleTag: Record<TeamMember["role"], { color: string; icon: React.ReactNode }> = {
  admin: { color: "gold", icon: <CrownOutlined /> },
  partner: { color: "geekblue", icon: <TeamOutlined /> },
  user: { color: "default", icon: <UserOutlined /> },
}

export default function TeamView({
  currentUserId,
  members,
  properties,
}: {
  currentUserId: string | null
  members: TeamMember[]
  properties: PropertyOption[]
}) {
  const router = useRouter()
  const { notification, modal } = App.useApp()

  const [filter, setFilter] = useState<TeamMember["role"] | "all">("all")
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<TeamMember | null>(null)
  const [credModal, setCredModal] = useState<{ email: string; password: string; mode: "invite" | "reset" } | null>(null)
  const [busy, setBusy] = useState(false)

  const counts = useMemo(() => {
    const c = { admin: 0, partner: 0, user: 0 }
    for (const m of members) c[m.role]++
    return c
  }, [members])

  const propertyOptions = useMemo(
    () =>
      properties.map((p) => ({
        value: p.id,
        label: p.active ? p.name : `${p.name} (inactive)`,
      })),
    [properties],
  )

  const filteredMembers = useMemo(
    () => (filter === "all" ? members : members.filter((m) => m.role === filter)),
    [filter, members],
  )

  async function onInvite(values: {
    email: string
    role: TeamMember["role"]
    partner_property_id?: string
    full_name?: string
  }) {
    setBusy(true)
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          role: values.role,
          partner_property_id: values.partner_property_id ?? null,
          full_name: values.full_name ?? null,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        notification.error({ message: "Invite failed", description: json.error ?? "unknown error" })
        return
      }
      setInviteOpen(false)
      setCredModal({ email: json.user.email, password: json.password, mode: "invite" })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function onEdit(values: {
    role: TeamMember["role"]
    partner_property_id?: string
    full_name?: string
  }) {
    if (!editTarget) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/team/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: values.role,
          partner_property_id:
            values.role === "partner" ? values.partner_property_id ?? null : null,
          full_name: values.full_name ?? null,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        notification.error({ message: "Update failed", description: json.error ?? "unknown error" })
        return
      }
      setEditTarget(null)
      notification.success({ message: "Profile updated" })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function onReset(member: TeamMember) {
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/team/${member.id}/reset-password`, {
        method: "POST",
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        notification.error({ message: "Reset failed", description: json.error ?? "unknown error" })
        return
      }
      setCredModal({ email: member.email, password: json.password, mode: "reset" })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  function confirmReset(member: TeamMember) {
    const isSelf = member.id === currentUserId
    modal.confirm({
      title: isSelf ? "Reset your own password?" : `Reset password for ${member.email}?`,
      icon: <KeyOutlined style={{ color: "#a8362b" }} />,
      content: isSelf
        ? "Your current session keeps working until the JWT expires, but the old password will stop working immediately. The new password will be shown once."
        : "The current password stops working immediately. The new password is shown once and must be delivered out-of-band (WhatsApp / in person).",
      okText: "Reset password",
      okButtonProps: { danger: true },
      onOk: () => onReset(member),
    })
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(
      () => notification.success({ message: "Copied", duration: 1.5 }),
      () => notification.error({ message: "Copy failed" }),
    )
  }

  const columns: ColumnsType<TeamMember> = [
    {
      title: "Member",
      key: "member",
      render: (_v, r) => (
        <div>
          <Text strong>{r.full_name ?? r.email}</Text>
          {r.full_name && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {r.email}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 130,
      render: (v: TeamMember["role"]) => (
        <Tag color={roleTag[v].color} icon={roleTag[v].icon}>
          {v}
        </Tag>
      ),
    },
    {
      title: "Linked property",
      key: "property",
      render: (_v, r) =>
        r.role === "partner" ? (
          r.partner_property_name ? (
            <Space size={4}>
              <Text>{r.partner_property_name}</Text>
              {r.partner_property_slug && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  ({r.partner_property_slug})
                </Text>
              )}
            </Space>
          ) : (
            <Tag color="red">missing</Tag>
          )
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Status",
      key: "status",
      width: 200,
      render: (_v, r) => (
        <Space size={6}>
          {r.password_set_by_admin && (
            <Tooltip title="Password was generated by admin (invite or reset). User should change it.">
              <Tag color="orange">admin pw</Tag>
            </Tooltip>
          )}
          {r.id === currentUserId && <Tag color="green">you</Tag>}
        </Space>
      ),
    },
    {
      title: "Joined",
      dataIndex: "created_at",
      key: "created_at",
      width: 110,
      render: (v: string) => new Date(v).toISOString().slice(0, 10),
    },
    {
      title: "Actions",
      key: "actions",
      width: 220,
      render: (_v, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => setEditTarget(r)}>
            Edit
          </Button>
          <Button
            size="small"
            danger
            icon={<KeyOutlined />}
            onClick={() => confirmReset(r)}
          >
            Reset pw
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={3} style={{ margin: 0, fontWeight: 600 }}>
            Team
          </Title>
          <Text type="secondary">
            Admins, partners, and authenticated users. Passwords are bcrypt-hashed
            in Supabase — admins can reset them but never view existing ones.
          </Text>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setInviteOpen(true)}
          >
            Invite team member
          </Button>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={8}>
          <Card variant="borderless">
            <Statistic title="Admins" value={counts.admin} prefix={<CrownOutlined />} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card variant="borderless">
            <Statistic title="Partners" value={counts.partner} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card variant="borderless">
            <Statistic title="Users" value={counts.user} prefix={<UserOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <div style={{ padding: 16 }}>
          <Segmented
            value={filter}
            onChange={(v) => setFilter(v as typeof filter)}
            options={[
              { label: `All (${members.length})`, value: "all" },
              { label: `Admins (${counts.admin})`, value: "admin" },
              { label: `Partners (${counts.partner})`, value: "partner" },
              { label: `Users (${counts.user})`, value: "user" },
            ]}
          />
        </div>
        <Table<TeamMember>
          rowKey="id"
          columns={columns}
          dataSource={filteredMembers}
          pagination={false}
          locale={{ emptyText: <Empty description="No team members in this filter" /> }}
        />
      </Card>

      <InviteModal
        open={inviteOpen}
        propertyOptions={propertyOptions}
        loading={busy}
        onCancel={() => setInviteOpen(false)}
        onSubmit={onInvite}
      />

      <EditModal
        target={editTarget}
        propertyOptions={propertyOptions}
        loading={busy}
        currentUserId={currentUserId}
        onCancel={() => setEditTarget(null)}
        onSubmit={onEdit}
      />

      <CredentialsModal
        cred={credModal}
        onClose={() => setCredModal(null)}
        onCopy={copy}
      />
    </Space>
  )
}

function InviteModal({
  open,
  propertyOptions,
  loading,
  onCancel,
  onSubmit,
}: {
  open: boolean
  propertyOptions: { value: string; label: string }[]
  loading: boolean
  onCancel: () => void
  onSubmit: (v: {
    email: string
    role: TeamMember["role"]
    partner_property_id?: string
    full_name?: string
  }) => void
}) {
  const [form] = Form.useForm()
  const role = Form.useWatch("role", form) ?? "partner"

  return (
    <Modal
      title="Invite team member"
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText="Generate password & invite"
      confirmLoading={loading}
      afterClose={() => form.resetFields()}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ role: "partner" }}
        onFinish={onSubmit}
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, type: "email", message: "Valid email required" },
          ]}
        >
          <Input autoFocus autoComplete="off" placeholder="partner@example.com" />
        </Form.Item>
        <Form.Item name="full_name" label="Full name (optional)">
          <Input autoComplete="off" placeholder="Anand Krishnan" />
        </Form.Item>
        <Form.Item name="role" label="Role" rules={[{ required: true }]}>
          <Select
            options={[
              { value: "partner", label: "Partner" },
              { value: "user", label: "User" },
              { value: "admin", label: "Admin" },
            ]}
          />
        </Form.Item>
        {role === "partner" && (
          <Form.Item
            name="partner_property_id"
            label="Linked property"
            rules={[{ required: true, message: "Pick a property for the partner" }]}
          >
            <Select
              options={propertyOptions}
              placeholder="Select property"
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        )}
        <Alert
          type="info"
          showIcon
          message="A 16-character password will be generated. You'll see it once after invite — copy it and deliver to the user via WhatsApp / in person."
        />
      </Form>
    </Modal>
  )
}

function EditModal({
  target,
  propertyOptions,
  loading,
  currentUserId,
  onCancel,
  onSubmit,
}: {
  target: TeamMember | null
  propertyOptions: { value: string; label: string }[]
  loading: boolean
  currentUserId: string | null
  onCancel: () => void
  onSubmit: (v: {
    role: TeamMember["role"]
    partner_property_id?: string
    full_name?: string
  }) => void
}) {
  const [form] = Form.useForm()
  const role = Form.useWatch("role", form) ?? target?.role
  const isSelf = target?.id === currentUserId

  return (
    <Modal
      title={target ? `Edit ${target.email}` : "Edit member"}
      open={!!target}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText="Save"
      confirmLoading={loading}
      afterClose={() => form.resetFields()}
      destroyOnHidden
    >
      {target && (
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            role: target.role,
            partner_property_id: target.partner_property_id ?? undefined,
            full_name: target.full_name ?? undefined,
          }}
          onFinish={onSubmit}
        >
          <Form.Item name="full_name" label="Full name">
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select
              disabled={isSelf}
              options={[
                { value: "admin", label: "Admin" },
                { value: "partner", label: "Partner" },
                { value: "user", label: "User" },
              ]}
            />
          </Form.Item>
          {isSelf && (
            <Alert
              type="warning"
              showIcon
              message="You can't change your own role. Ask another admin."
              style={{ marginBottom: 16 }}
            />
          )}
          {role === "partner" && (
            <Form.Item
              name="partner_property_id"
              label="Linked property"
              rules={[{ required: true, message: "Partner must have a property" }]}
            >
              <Select
                options={propertyOptions}
                placeholder="Select property"
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
          )}
        </Form>
      )}
    </Modal>
  )
}

function CredentialsModal({
  cred,
  onClose,
  onCopy,
}: {
  cred: { email: string; password: string; mode: "invite" | "reset" } | null
  onClose: () => void
  onCopy: (text: string) => void
}) {
  return (
    <Modal
      title={
        cred?.mode === "invite"
          ? "Invite created — copy credentials"
          : "Password reset — copy new password"
      }
      open={!!cred}
      onCancel={onClose}
      onOk={onClose}
      okText="Close — I copied it"
      cancelButtonProps={{ style: { display: "none" } }}
      destroyOnHidden
    >
      {cred && (
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Alert
            type="warning"
            showIcon
            message="This password is shown only once."
            description="If you close this dialog without copying, you'll need to reset again to issue a new one."
          />
          <CopyableField label="Email" value={cred.email} onCopy={onCopy} mono={false} />
          <CopyableField label="Password" value={cred.password} onCopy={onCopy} mono />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Deliver via WhatsApp / in person. The user should change their
            password on first login.
          </Text>
        </Space>
      )}
    </Modal>
  )
}

function CopyableField({
  label,
  value,
  onCopy,
  mono,
}: {
  label: string
  value: string
  onCopy: (text: string) => void
  mono: boolean
}) {
  return (
    <div>
      <Text type="secondary" style={{ fontSize: 12, letterSpacing: 0.3 }}>
        {label.toUpperCase()}
      </Text>
      <Row gutter={8} align="middle">
        <Col flex="auto">
          <Input
            readOnly
            value={value}
            style={
              mono
                ? { fontFamily: "ui-monospace, monospace", fontWeight: 600 }
                : undefined
            }
          />
        </Col>
        <Col>
          <Button icon={<CopyOutlined />} onClick={() => onCopy(value)}>
            Copy
          </Button>
        </Col>
      </Row>
    </div>
  )
}

