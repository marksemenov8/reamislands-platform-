"use client"

import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Layout,
  Modal,
  Progress,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd"
import { CheckCircleOutlined, EditOutlined } from "@ant-design/icons"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import SignOutButton from "../_components/SignOutButton"

const { Header, Content, Footer } = Layout
const { Title, Text, Paragraph } = Typography

export type MeProfile = {
  id: string
  name: string | null
  email: string | null
  whatsapp: string | null
  country: string | null
  wbs_score: number | null
  cohort: number | null
  source: string | null
  created_at: string
}

export type MeBooking = {
  id: string
  program_id: string | null
  program_name: string | null
  program_tier: string | null
  duration_days: number | null
  arrival: string | null
  departure: string | null
  pax: number | null
  status: string
  pre_wbs: number | null
  post_wbs: number | null
}

const COHORT_LABELS: Record<number, string> = {
  1: "Reset",
  2: "Performance",
  3: "Mind",
  4: "Immersion",
}
const STATUS_COLOR: Record<string, string> = {
  inquiry: "default",
  confirmed: "geekblue",
  active: "green",
  completed: "purple",
  cancelled: "volcano",
}

function scoreColor(s: number | null): string {
  if (s == null) return "#9aa6a1"
  if (s >= 70) return "#1D9E75"
  if (s >= 50) return "#b3781b"
  return "#a8362b"
}

export default function MeView({
  email,
  profile,
  bookings,
}: {
  email: string
  profile: MeProfile | null
  bookings: MeBooking[]
}) {
  const router = useRouter()
  const { notification } = App.useApp()
  const [editOpen, setEditOpen] = useState(false)
  const [wbsTarget, setWbsTarget] = useState<{ booking: MeBooking; kind: "pre" | "post" } | null>(null)
  const [saving, setSaving] = useState(false)
  const [profileForm] = Form.useForm()
  const [wbsForm] = Form.useForm()

  function openEdit() {
    if (!profile) return
    profileForm.setFieldsValue({
      name: profile.name ?? "",
      whatsapp: profile.whatsapp ?? "",
      country: profile.country ?? "",
    })
    setEditOpen(true)
  }

  async function onSaveProfile(values: { name?: string; whatsapp?: string; country?: string }) {
    if (!profile) return
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name?.trim() || null,
          whatsapp: values.whatsapp?.trim() || null,
          country: values.country?.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        notification.error({ message: "Save failed", description: json.error })
        return
      }
      setEditOpen(false)
      notification.success({ message: "Profile updated" })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function onSubmitWbs(values: { score: number }) {
    if (!wbsTarget) return
    setSaving(true)
    try {
      const res = await fetch("/api/me/wbs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: wbsTarget.booking.id,
          kind: wbsTarget.kind,
          score: values.score,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        notification.error({ message: "Save failed", description: json.error })
        return
      }
      setWbsTarget(null)
      wbsForm.resetFields()
      notification.success({ message: "WBS recorded" })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout style={{ minHeight: "100vh", background: "#f6f8f7" }}>
      <Header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #eef1ef",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
        }}
      >
        <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
          <Text strong>Dream Islands Travel</Text>
        </Link>
        <SignOutButton />
      </Header>

      <Content style={{ padding: "32px 16px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
            {profile?.name ? `Welcome back, ${profile.name}` : "Welcome"}
          </Title>
          <Text type="secondary">{email}</Text>

          {!profile && (
            <Alert
              type="info"
              showIcon
              style={{ marginTop: 24 }}
              message="No intake yet"
              description={
                <span>
                  Take the WBS to get matched to programs.{" "}
                  <Link href="/start">Start the assessment →</Link>
                </span>
              }
            />
          )}

          {profile && (
            <>
              <Row gutter={[16, 16]} style={{ margin: "24px 0" }}>
                <Col xs={24} md={8}>
                  <Card variant="borderless" style={{ textAlign: "center" }}>
                    <Text type="secondary" style={{ fontSize: 12, letterSpacing: 0.3 }}>
                      YOUR WBS
                    </Text>
                    <div
                      style={{
                        fontSize: 56,
                        fontWeight: 800,
                        color: scoreColor(profile.wbs_score),
                        lineHeight: 1.1,
                        margin: "8px 0 4px",
                      }}
                    >
                      {profile.wbs_score ?? "—"}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      out of 100
                    </Text>
                  </Card>
                </Col>
                <Col xs={24} md={16}>
                  <Card
                    variant="borderless"
                    title={<Text strong>Profile</Text>}
                    extra={
                      <Button size="small" icon={<EditOutlined />} onClick={openEdit}>
                        Edit
                      </Button>
                    }
                  >
                    <ProfileField label="Name" value={profile.name} />
                    <ProfileField label="WhatsApp" value={profile.whatsapp} mono />
                    <ProfileField label="Country" value={profile.country} />
                    {profile.cohort != null && COHORT_LABELS[profile.cohort] && (
                      <ProfileField
                        label="Cohort"
                        valueNode={
                          <Tag color="geekblue">
                            {profile.cohort} · {COHORT_LABELS[profile.cohort]}
                          </Tag>
                        }
                      />
                    )}
                  </Card>
                </Col>
              </Row>

              <Title level={4} style={{ margin: "16px 0" }}>
                Bookings
              </Title>

              {bookings.length === 0 ? (
                <Card variant="borderless">
                  <Text type="secondary">No bookings yet — your inquiries will land here.</Text>
                </Card>
              ) : (
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  {bookings.map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      onPreWbs={() => setWbsTarget({ booking: b, kind: "pre" })}
                      onPostWbs={() => setWbsTarget({ booking: b, kind: "post" })}
                    />
                  ))}
                </Space>
              )}
            </>
          )}
        </div>
      </Content>

      <Footer style={{ textAlign: "center", background: "transparent" }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Dream Islands Travel
        </Text>
      </Footer>

      <Modal
        title="Edit profile"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => profileForm.submit()}
        okText="Save"
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={profileForm} layout="vertical" onFinish={onSaveProfile}>
          <Form.Item name="name" label="Name">
            <Input autoComplete="name" />
          </Form.Item>
          <Form.Item name="whatsapp" label="WhatsApp">
            <Input autoComplete="tel" />
          </Form.Item>
          <Form.Item name="country" label="Country">
            <Input autoComplete="country-name" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          wbsTarget?.kind === "pre"
            ? "Pre-stay WBS score"
            : "Post-stay WBS score"
        }
        open={!!wbsTarget}
        onCancel={() => {
          setWbsTarget(null)
          wbsForm.resetFields()
        }}
        onOk={() => wbsForm.submit()}
        okText="Save"
        confirmLoading={saving}
        destroyOnHidden
      >
        {wbsTarget && (
          <Form form={wbsForm} layout="vertical" onFinish={onSubmitWbs}>
            <Paragraph type="secondary" style={{ marginTop: 0 }}>
              How would you score your overall wellness baseline today on a scale
              of 0–100? Honest answers help us measure your progress.
            </Paragraph>
            <Form.Item
              name="score"
              label="Score"
              rules={[{ required: true, message: "Enter 0–100" }]}
            >
              <InputNumber min={0} max={100} style={{ width: "100%" }} />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </Layout>
  )
}

function ProfileField({
  label,
  value,
  valueNode,
  mono,
}: {
  label: string
  value?: string | null
  valueNode?: React.ReactNode
  mono?: boolean
}) {
  return (
    <Row style={{ marginBottom: 8 }}>
      <Col xs={8} md={6}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {label}
        </Text>
      </Col>
      <Col xs={16} md={18}>
        {valueNode ?? (
          <Text style={mono ? { fontFamily: "ui-monospace, monospace" } : undefined}>
            {value ?? "—"}
          </Text>
        )}
      </Col>
    </Row>
  )
}

function BookingCard({
  booking: b,
  onPreWbs,
  onPostWbs,
}: {
  booking: MeBooking
  onPreWbs: () => void
  onPostWbs: () => void
}) {
  const showPre = b.status === "active" && b.pre_wbs == null
  const showPost = b.status === "completed" && b.post_wbs == null
  const delta = b.pre_wbs != null && b.post_wbs != null ? b.post_wbs - b.pre_wbs : null

  return (
    <Card variant="borderless">
      <Row align="middle" gutter={[16, 12]}>
        <Col xs={24} md={14}>
          <Text strong style={{ fontSize: 16 }}>
            {b.program_name ?? "Program"}
          </Text>
          <Space size={8} wrap style={{ marginLeft: 8 }}>
            <Tag color={STATUS_COLOR[b.status] ?? "default"}>{b.status}</Tag>
            {b.program_tier && <Tag>{b.program_tier}</Tag>}
          </Space>
          <div style={{ marginTop: 4 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {b.arrival ?? "?"} → {b.departure ?? "?"} · {b.pax ?? 1} pax
            </Text>
          </div>
        </Col>
        <Col xs={24} md={10}>
          <Space size={16} wrap style={{ float: "right" }}>
            <Statistic
              title="Pre WBS"
              value={b.pre_wbs ?? "—"}
              valueStyle={{ fontSize: 18, color: scoreColor(b.pre_wbs) }}
            />
            <Statistic
              title="Post WBS"
              value={b.post_wbs ?? "—"}
              valueStyle={{ fontSize: 18, color: scoreColor(b.post_wbs) }}
            />
            {delta != null && (
              <Statistic
                title="Δ"
                value={`${delta >= 0 ? "+" : ""}${delta}`}
                valueStyle={{ fontSize: 18, color: delta >= 0 ? "#1D9E75" : "#c0392b" }}
              />
            )}
          </Space>
        </Col>
      </Row>
      {(showPre || showPost) && (
        <div style={{ marginTop: 12, borderTop: "1px solid #eef1ef", paddingTop: 12 }}>
          {showPre && (
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={onPreWbs}>
              Take pre-stay WBS
            </Button>
          )}
          {showPost && (
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={onPostWbs}>
              Take post-stay WBS
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}
