"use client"

import { Layout, Menu, Space, Typography } from "antd"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import Logo from "@/components/Logo"
import SignOutButton from "./SignOutButton"

const { Sider, Header, Content } = Layout
const { Text } = Typography

export type NavItem = {
  key: string
  href: string
  icon: ReactNode
  label: string
}

export default function Shell({
  children,
  email,
  navItems,
  brand,
  titleMap,
}: {
  children: ReactNode
  email?: string | null
  navItems: NavItem[]
  brand?: string
  titleMap?: Record<string, string>
}) {
  const pathname = usePathname()
  const activeKey =
    navItems.find((i) => i.key === pathname)?.key ?? navItems[0]?.key ?? ""
  const pageTitle =
    (titleMap && titleMap[pathname]) ??
    navItems.find((i) => i.key === pathname)?.label ??
    brand ??
    "DIT Platform"

  const menuItems = navItems.map((i) => ({
    key: i.key,
    icon: i.icon,
    label: <Link href={i.href}>{i.label}</Link>,
  }))

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={240}
        style={{
          borderRight: "1px solid #eef1ef",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            borderBottom: "1px solid #eef1ef",
            gap: 10,
          }}
        >
          <Logo size={32} style={{ color: "#1D9E75" }} />
          <Text strong style={{ fontSize: 15, letterSpacing: -0.2 }}>
            {brand ?? "DIT Platform"}
          </Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          items={menuItems}
          style={{ borderInlineEnd: "none", paddingTop: 12 }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 24,
            right: 24,
            fontSize: 11,
            color: "#9aa6a1",
          }}
        >
          Dream Islands Travel
          <br />
          wellness OS · SEA
        </div>
      </Sider>

      <Layout>
        <Header
          style={{
            borderBottom: "1px solid #eef1ef",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: 600 }}>{pageTitle}</Text>
          <Space size="middle">
            {email && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {email}
              </Text>
            )}
            <SignOutButton />
          </Space>
        </Header>
        <Content style={{ padding: "28px 32px", maxWidth: 1200, width: "100%" }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

