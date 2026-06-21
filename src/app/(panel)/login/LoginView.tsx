"use client"

import { App, Alert, Button, Card, Form, Input, Segmented, Space, Typography } from "antd"
import { useState } from "react"
import { supabaseBrowser } from "@/lib/supabase"

const { Title, Text, Paragraph } = Typography

type Mode = "password" | "magic"

export default function LoginView({ nextPath }: { nextPath: string }) {
  const { notification } = App.useApp()
  const [mode, setMode] = useState<Mode>("password")
  const [loading, setLoading] = useState(false)
  const [magicSent, setMagicSent] = useState<string | null>(null)

  async function onPassword(values: { email: string; password: string }) {
    setLoading(true)
    const sb = supabaseBrowser()
    const { error } = await sb.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })
    setLoading(false)
    if (error) {
      notification.error({ message: "Sign-in failed", description: error.message })
      return
    }
    window.location.href = nextPath || "/"
  }

  async function onMagic(values: { email: string }) {
    setLoading(true)
    const sb = supabaseBrowser()
    const redirect = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath || "/")}`
    const { error } = await sb.auth.signInWithOtp({
      email: values.email,
      options: { emailRedirectTo: redirect, shouldCreateUser: true },
    })
    setLoading(false)
    if (error) {
      notification.error({ message: "Couldn't send link", description: error.message })
      return
    }
    setMagicSent(values.email)
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f6f8f7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <Card style={{ width: 380, borderRadius: 12 }}>
        <div style={{ marginBottom: 20, textAlign: "center" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#1D9E75",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 16,
              marginBottom: 12,
            }}
          >
            D
          </div>
          <Title level={4} style={{ margin: 0 }}>
            DIT Platform
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Sign in to continue
          </Text>
        </div>

        {magicSent ? (
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <Alert
              type="success"
              showIcon
              message="Magic link sent"
              description={`Check ${magicSent} for a sign-in link. Expires in one hour.`}
            />
            <Button block onClick={() => setMagicSent(null)}>
              Send another link
            </Button>
          </Space>
        ) : (
          <>
            <Segmented
              block
              value={mode}
              onChange={(v) => setMode(v as Mode)}
              options={[
                { label: "Password", value: "password" },
                { label: "Magic link", value: "magic" },
              ]}
              style={{ marginBottom: 16 }}
            />

            {mode === "password" ? (
              <Form layout="vertical" onFinish={onPassword} requiredMark={false}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[{ required: true, type: "email", message: "Valid email required" }]}
                >
                  <Input autoComplete="email" autoFocus />
                </Form.Item>
                <Form.Item
                  name="password"
                  label="Password"
                  rules={[{ required: true, message: "Password required" }]}
                >
                  <Input.Password autoComplete="current-password" />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>
                  Sign in
                </Button>
              </Form>
            ) : (
              <Form layout="vertical" onFinish={onMagic} requiredMark={false}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[{ required: true, type: "email", message: "Valid email required" }]}
                >
                  <Input autoComplete="email" autoFocus />
                </Form.Item>
                <Paragraph type="secondary" style={{ fontSize: 12, margin: "0 0 12px" }}>
                  We&apos;ll email you a one-time link. No password needed —
                  works for guests too.
                </Paragraph>
                <Button type="primary" htmlType="submit" loading={loading} block>
                  Send sign-in link
                </Button>
              </Form>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
