"use client"

import { DeleteOutlined, UploadOutlined } from "@ant-design/icons"
import { Button, message, Space, Typography, Upload } from "antd"
import type { UploadProps } from "antd"
import { useState } from "react"

type CustomRequestOption = Parameters<NonNullable<UploadProps["customRequest"]>>[0]

const { Text } = Typography

export default function HeroImageUpload({
  value,
  onChange,
  programId,
}: {
  value?: string | null
  onChange?: (url: string | null) => void
  programId: string
}) {
  const [uploading, setUploading] = useState(false)

  async function customRequest(options: CustomRequestOption) {
    const { file, onSuccess, onError } = options
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file as Blob)
      fd.append("program_id", programId)
      const res = await fetch("/api/upload/program-hero", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok || !json.success) {
        message.error(json.error ?? "Upload failed")
        onError?.(new Error(json.error ?? "Upload failed"))
        return
      }
      onChange?.(json.url)
      onSuccess?.(json)
      message.success("Image uploaded")
    } finally {
      setUploading(false)
    }
  }

  function clear() {
    onChange?.(null)
  }

  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      {value ? (
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 360,
            aspectRatio: "4 / 3",
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid #eef1ef",
            background: "#f6f8f7",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Hero preview"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            maxWidth: 360,
            aspectRatio: "4 / 3",
            border: "1px dashed #d4dad7",
            borderRadius: 12,
            display: "grid",
            placeItems: "center",
            background: "#fafbfa",
            color: "#9aa6a1",
            fontSize: 13,
          }}
        >
          No image yet
        </div>
      )}

      <Space wrap>
        <Upload
          accept="image/jpeg,image/png,image/webp,image/avif"
          showUploadList={false}
          customRequest={customRequest}
          disabled={uploading}
        >
          <Button icon={<UploadOutlined />} loading={uploading}>
            {value ? "Replace image" : "Upload image"}
          </Button>
        </Upload>
        {value && (
          <Button danger icon={<DeleteOutlined />} onClick={clear}>
            Remove
          </Button>
        )}
      </Space>
      <Text type="secondary" style={{ fontSize: 12 }}>
        JPG / PNG / WebP / AVIF · max 5 MB · stored in Supabase Storage and served from
        program-heroes bucket.
      </Text>
    </Space>
  )
}
