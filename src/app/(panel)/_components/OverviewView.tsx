"use client"

import { ApiOutlined, ArrowRightOutlined } from "@ant-design/icons"
import { Card, Col, Row, Space, Statistic, Tag, Typography } from "antd"

const { Text, Title } = Typography

type Stat = { label: string; value: number; hint: string }
type Endpoint = { method: string; path: string }

export default function OverviewView({
  stats,
  endpoints,
}: {
  stats: Stat[]
  endpoints: Endpoint[]
}) {
  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <div>
        <Title level={3} style={{ margin: 0, fontWeight: 600 }}>
          Welcome to DIT
        </Title>
        <Text type="secondary">
          Wellness-travel operating system for Southeast Asia · live Supabase backend
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        {stats.map((s) => (
          <Col xs={12} md={6} key={s.label}>
            <Card variant="borderless" style={{ background: "#ffffff" }}>
              <Statistic
                title={
                  <Text type="secondary" style={{ fontSize: 12, letterSpacing: 0.3 }}>
                    {s.label.toUpperCase()}
                  </Text>
                }
                value={s.value}
                valueStyle={{ color: "#10221c", fontWeight: 600 }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {s.hint}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        variant="borderless"
        title={
          <Space>
            <ApiOutlined style={{ color: "#1D9E75" }} />
            <Text strong>Live API endpoints</Text>
          </Space>
        }
        extra={<Tag color="green">online</Tag>}
      >
        <Space direction="vertical" size={10} style={{ width: "100%" }}>
          {endpoints.map((e) => (
            <Row key={e.path} align="middle" gutter={12}>
              <Col flex="60px">
                <Tag
                  color={e.method === "GET" ? "green" : "geekblue"}
                  style={{ width: 56, textAlign: "center", margin: 0 }}
                >
                  {e.method}
                </Tag>
              </Col>
              <Col flex="auto">
                <Text code style={{ fontSize: 13 }}>
                  {e.path}
                </Text>
              </Col>
              <Col>
                <ArrowRightOutlined style={{ color: "#9aa6a1" }} />
              </Col>
            </Row>
          ))}
        </Space>
      </Card>
    </Space>
  )
}
