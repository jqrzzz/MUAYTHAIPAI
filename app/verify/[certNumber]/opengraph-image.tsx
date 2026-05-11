/**
 * Dynamic OG image for a verified certificate.
 *
 * Renders at request time via the Vercel OG runtime. Next.js wires this
 * up automatically as `<meta property="og:image">` for /verify/<n>
 * thanks to the opengraph-image filename convention.
 *
 * Designed to read at a glance in a social-card thumbnail: level name
 * + creature icon dominate; student + gym below; cert number footer.
 *
 * Custom fonts (Cinzel) are not loaded here — Vercel OG can't read
 * next/font Google fonts and shipping a woff binary in-repo is more
 * weight than this earns today. The default sans-serif at large sizes
 * still reads as a credential card.
 */
import { ImageResponse } from "next/og"
import { createClient } from "@supabase/supabase-js"
import { getLevelById } from "@/lib/certification-levels"

export const runtime = "nodejs"
export const alt = "MUAYTHAIPAI verified certificate"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Level → solid hex (Tailwind class names don't work in OG runtime).
// Keep in sync with LEVEL_STYLES in the verify page.
const LEVEL_HEX: Record<string, { accent: string; ring: string }> = {
  naga: { accent: "#60a5fa", ring: "#1d4ed8" },
  "phayra-nak": { accent: "#34d399", ring: "#047857" },
  singha: { accent: "#fbbf24", ring: "#b45309" },
  hanuman: { accent: "#cbd5e1", ring: "#475569" },
  garuda: { accent: "#fde047", ring: "#a16207" },
}

interface Props {
  params: Promise<{ certNumber: string }>
}

export default async function VerifyOG({ params }: Props) {
  const { certNumber } = await params

  const { data: cert } = await supabase
    .from("certificates")
    .select(
      "level, level_number, status, issued_at, certificate_number, users:user_id (full_name), organizations:org_id (name, city, province)",
    )
    .eq("certificate_number", certNumber)
    .single()

  const levelConfig = cert ? getLevelById(cert.level) : null
  const student = cert?.users as unknown as { full_name: string | null } | null
  const org = cert?.organizations as unknown as {
    name: string
    city: string | null
    province: string | null
  } | null

  const studentName = student?.full_name || "Practitioner"
  const levelName = (levelConfig?.name || "Muay Thai").toUpperCase()
  const levelNumber = cert?.level_number ?? null
  const icon = levelConfig?.icon || "🥊"
  const creature = levelConfig?.creature || ""
  const gymName = org?.name || "MUAYTHAIPAI"
  const locale = [org?.city, org?.province].filter(Boolean).join(", ")
  const colors = LEVEL_HEX[cert?.level ?? "naga"] ?? LEVEL_HEX.naga
  const isActive = cert?.status === "active"
  const issuedDate = cert?.issued_at
    ? new Date(cert.issued_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : ""

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#09090b",
          backgroundImage: `radial-gradient(circle at 50% 0%, ${colors.accent}26 0%, transparent 55%)`,
          padding: "60px 80px",
          fontFamily: "sans-serif",
          color: "#fafafa",
        }}
      >
        {/* Top band — network identifier */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 18,
            color: "#a1a1aa",
            letterSpacing: 4,
          }}
        >
          <span>MUAYTHAIPAI · NAGA–GARUDA CERTIFICATION</span>
          <span style={{ color: isActive ? "#34d399" : "#f87171" }}>
            {isActive ? "● VERIFIED" : "● REVOKED"}
          </span>
        </div>

        {/* Hero block — icon + level */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <div style={{ fontSize: 200, lineHeight: 1, display: "flex" }}>
            {icon}
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              letterSpacing: 8,
              color: colors.accent,
              display: "flex",
            }}
          >
            {levelName}
          </div>
          {levelNumber !== null && (
            <div
              style={{
                fontSize: 24,
                color: "#a1a1aa",
                letterSpacing: 2,
                display: "flex",
              }}
            >
              {creature ? `${creature} · ` : ""}LEVEL {levelNumber} OF 5
            </div>
          )}
        </div>

        {/* Footer — student + gym + cert number */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            paddingTop: 24,
            borderTop: `1px solid ${colors.accent}33`,
          }}
        >
          <div
            style={{ fontSize: 44, color: "#fafafa", display: "flex" }}
          >
            {studentName}
          </div>
          <div
            style={{ fontSize: 22, color: "#a1a1aa", display: "flex" }}
          >
            Issued by {gymName}
            {locale ? ` · ${locale}` : ""}
          </div>
          <div
            style={{
              fontSize: 16,
              color: "#71717a",
              letterSpacing: 3,
              marginTop: 8,
              display: "flex",
            }}
          >
            {certNumber}
            {issuedDate ? `  ·  ${issuedDate}` : ""}
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
