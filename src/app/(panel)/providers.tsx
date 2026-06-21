"use client"

import { AntdRegistry } from "@ant-design/nextjs-registry"
import { App, ConfigProvider, theme } from "antd"

const ditTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: "#1D9E75",
    colorInfo: "#1D9E75",
    colorSuccess: "#1D9E75",
    colorLink: "#1D9E75",
    colorBgLayout: "#f6f8f7",
    colorBorderSecondary: "#eef1ef",
    borderRadius: 8,
    borderRadiusLG: 12,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    wireframe: false,
  },
  components: {
    Layout: {
      bodyBg: "#f6f8f7",
      headerBg: "#ffffff",
      siderBg: "#ffffff",
      headerHeight: 64,
      headerPadding: "0 28px",
    },
    Menu: {
      itemBg: "transparent",
      itemSelectedBg: "#E1F5EE",
      itemSelectedColor: "#0F6E56",
      itemHoverBg: "#F1F8F5",
      itemHoverColor: "#0F6E56",
      itemBorderRadius: 8,
      itemMarginInline: 8,
      iconSize: 16,
    },
    Card: {
      boxShadow: "none",
      boxShadowTertiary: "none",
      borderRadiusLG: 12,
    },
    Table: {
      headerBg: "#fafbfa",
      headerColor: "#5b6b65",
      headerSplitColor: "transparent",
      rowHoverBg: "#f5f9f7",
      borderColor: "#eef1ef",
    },
    Tag: {
      borderRadiusSM: 4,
    },
    Statistic: {
      titleFontSize: 13,
      contentFontSize: 28,
    },
  },
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider theme={ditTheme}>
        <App>{children}</App>
      </ConfigProvider>
    </AntdRegistry>
  )
}
