import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "nyuchi design portal — canonical design system for the bundu ecosystem"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/**
 * Dynamic OpenGraph image for the root route (issue #9). Rendered by
 * `next/og` (Satori) — no CSS custom properties, so hex values are
 * required here. The mineral strip on the left is the brand identity
 * element; the rest is the deep-night theme at 1200x630.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        backgroundColor: "#0A0A0A",
        color: "#F5F5F4",
        fontFamily: "Helvetica, Arial, sans-serif",
      }}
    >
      {/* Vertical mineral strip — 20px, 5 mineral bands */}
      <div style={{ width: 20, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, backgroundColor: "#0047AB" }} />
        <div style={{ flex: 1, backgroundColor: "#B388FF" }} />
        <div style={{ flex: 1, backgroundColor: "#64FFDA" }} />
        <div style={{ flex: 1, backgroundColor: "#FFD740" }} />
        <div style={{ flex: 1, backgroundColor: "#D4A574" }} />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 96px",
        }}
      >
        <div
          style={{
            fontSize: 20,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#9A9A95",
          }}
        >
          nyuchi design portal
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 72,
            lineHeight: 1.05,
            fontWeight: 700,
            letterSpacing: -1,
          }}
        >
          The canonical design system for the bundu ecosystem.
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 28,
            lineHeight: 1.4,
            color: "#9A9A95",
            maxWidth: 920,
          }}
        >
          Five African Minerals palette · shadcn-compatible registry · MCP server · AI-native docs.
        </div>
        <div
          style={{
            marginTop: "auto",
            paddingTop: 48,
            display: "flex",
            gap: 32,
            fontSize: 22,
            color: "#5C5B58",
          }}
        >
          <span>design.nyuchi.com</span>
          <span>·</span>
          <span>github.com/nyuchitech/design-portal</span>
        </div>
      </div>
    </div>,
    { ...size }
  )
}
