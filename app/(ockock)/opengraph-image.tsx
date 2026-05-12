import { ImageResponse } from "next/og"

// OG / social-share card for the OckOck product pages (/for-gyms, /pricing,
// /about, ...). Typographic on purpose — no fetched assets, renders fast.
// Note: the meta URL resolves via the app's metadataBase (muaythaipai.com)
// until the ockock.app canonical pass lands; the image still loads since the
// app serves both hosts.
export const runtime = "nodejs"
export const alt = "OckOck — run your Muay Thai gym"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#09090b",
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(99,102,241,0.28), transparent 55%)",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 30,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#a5b4fc",
            fontWeight: 600,
          }}
        >
          OckOck
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 88,
            fontWeight: 700,
            lineHeight: 1.05,
            maxWidth: 980,
          }}
        >
          Run your Muay Thai gym with OckOck
        </div>
        <div style={{ marginTop: 28, fontSize: 34, color: "#a1a1aa", maxWidth: 920 }}>
          Bookings, the Naga–Garuda cert ladder, and an AI that answers your
          customers in Thai or English.
        </div>
        <div style={{ marginTop: 48, display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: "#fff",
              background: "#6366f1",
              borderRadius: 12,
              padding: "12px 24px",
            }}
          >
            Free 30-day trial
          </div>
          <div style={{ fontSize: 26, color: "#71717a" }}>ockock.app</div>
        </div>
      </div>
    ),
    size,
  )
}
