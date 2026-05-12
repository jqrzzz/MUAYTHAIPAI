/**
 * Dynamic OG image for a student's public passport.
 *
 * Shows the student's name, highest level earned (with creature +
 * color), and a compact ladder of all 5 levels with the earned ones
 * lit up. The credential journey told in a 1200×630 glance.
 */
import { ImageResponse } from "next/og"
import { createClient } from "@supabase/supabase-js"
import { CERTIFICATION_LEVELS, getLevelById } from "@/lib/certification-levels"

export const runtime = "nodejs"
export const alt = "MUAYTHAIPAI student passport"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const LEVEL_HEX: Record<string, string> = {
  naga: "#60a5fa",
  "phayra-nak": "#34d399",
  singha: "#fbbf24",
  hanuman: "#cbd5e1",
  garuda: "#fde047",
}

interface Props {
  params: Promise<{ handle: string }>
}

export default async function PassportOG({ params }: Props) {
  const { handle } = await params
  const slug = handle.toLowerCase()

  const { data: user } = await supabase
    .from("users")
    .select("id, full_name")
    .eq("public_passport_enabled", true)
    .eq("public_passport_handle", slug)
    .maybeSingle()

  const studentName = user?.full_name || slug

  const { data: certs } = user?.id
    ? await supabase
        .from("certificates")
        .select("level, level_number")
        .eq("user_id", user.id)
        .eq("status", "active")
    : { data: null }

  const earned = new Set((certs ?? []).map((c) => c.level))
  const highestNumber = (certs ?? []).reduce(
    (max, c) => Math.max(max, c.level_number ?? 0),
    0,
  )
  const highest = CERTIFICATION_LEVELS.find((l) => l.number === highestNumber)
  const highestConfig = highest ? getLevelById(highest.id) : null
  const accentHex = highest ? LEVEL_HEX[highest.id] : "#a1a1aa"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#09090b",
          backgroundImage: `radial-gradient(circle at 50% 0%, ${accentHex}26 0%, transparent 55%)`,
          padding: "60px 80px",
          fontFamily: "sans-serif",
          color: "#fafafa",
        }}
      >
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
          <span>MUAYTHAIPAI · STUDENT PASSPORT</span>
          <span>muaythaipai.com/p/{slug}</span>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 700,
              letterSpacing: -1,
              display: "flex",
            }}
          >
            {studentName}
          </div>
          {highest && highestConfig ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginTop: 4,
              }}
            >
              <span style={{ fontSize: 56, display: "flex" }}>
                {highestConfig.icon}
              </span>
              <span
                style={{
                  fontSize: 36,
                  fontWeight: 600,
                  letterSpacing: 4,
                  color: accentHex,
                  display: "flex",
                }}
              >
                {highest.name.toUpperCase()}
              </span>
              <span
                style={{
                  fontSize: 22,
                  color: "#a1a1aa",
                  letterSpacing: 2,
                  display: "flex",
                }}
              >
                · LEVEL {highest.number} OF 5
              </span>
            </div>
          ) : (
            <div
              style={{
                fontSize: 22,
                color: "#71717a",
                display: "flex",
              }}
            >
              In training
            </div>
          )}
        </div>

        {/* Ladder strip — five pills, earned levels solid */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            paddingTop: 24,
            borderTop: "1px solid #27272a",
          }}
        >
          {CERTIFICATION_LEVELS.map((lvl) => {
            const hit = earned.has(lvl.id)
            const tint = LEVEL_HEX[lvl.id] ?? "#a1a1aa"
            return (
              <div
                key={lvl.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 16px",
                  borderRadius: 999,
                  border: `1px solid ${hit ? tint : "#3f3f46"}`,
                  backgroundColor: hit ? `${tint}1f` : "transparent",
                  color: hit ? tint : "#52525b",
                  fontSize: 18,
                  letterSpacing: 2,
                }}
              >
                <span style={{ fontSize: 24, display: "flex" }}>{lvl.icon}</span>
                <span style={{ display: "flex" }}>{lvl.name.toUpperCase()}</span>
              </div>
            )
          })}
        </div>
      </div>
    ),
    { ...size },
  )
}
