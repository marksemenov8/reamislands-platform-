"use client"

import { LogoutOutlined } from "@ant-design/icons"
import { Button } from "antd"

export default function SignOutButton({
  size = "small",
}: {
  size?: "small" | "middle" | "large"
}) {
  async function onClick() {
    await fetch("/api/auth/signout", { method: "POST" })
    window.location.href = "/login"
  }
  return (
    <Button type="text" size={size} icon={<LogoutOutlined />} onClick={onClick}>
      Sign out
    </Button>
  )
}
