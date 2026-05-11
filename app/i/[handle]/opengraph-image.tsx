/**
 * Dynamic OG image for an instructor's public profile.
 *
 * Shows the trainer's name, title, primary gym, and how many skill
 * signoffs they've issued (the credentialing-lineage proof point).
 */
import { ImageResponse } from "next/og"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const alt = "MUAYTHAIPAI instructor profile"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

interface Props {
  params: Promise<{ handle: string }>
}

export default async function InstructorOG({ params }: Props) {
  const { handle } = await params
  const slug = handle.toLowerCase()

  const { data: user } = await supabase
    .from("users")
    .select("id, full_name, is_verified_examiner")
    .eq("public_instructor_enabled", true)
    .eq("public_instructor_handle", slug)
    .maybeSingle()

  let displayName = user?.full_name || slug
  let title = "Muay Thai Trainer"
  let primaryGym = ""
  let signoffsGiven = 0
  const verified = !!user?.is_verified_examiner

  if (user?.id) {
    const [profileRes, signoffRes] = await Promise.all([
      supabase
        .from("trainer_profiles")
        .select("display_name, title, organizations:org_id (name)")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("skill_signoffs")
        .select("id", { count: "exact", head: true })
        .eq("signed_off_by", user.id),
    ])
    const profile = profileRes.data
    if (profile) {
      displayName = (profile.display_name as string) || displayName
      title = (profile.title as string) || title
      const org = profile.organizations as unknown as { name: string } | null
      primaryGym = org?.name || ""
    }
    signoffsGiven = signoffRes.count ?? 0
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#09090b",
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(249,115,22,0.18) 0%, transparent 60%)",
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
          <span>MUAYTHAIPAI · INSTRUCTOR LINEAGE</span>
          {verified && (
            <span style={{ color: "#60a5fa" }}>● FEDERATION-VERIFIED</span>
          )}
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: 9999,
              backgroundImage:
                "linear-gradient(135deg, #f97316 0%, #b91c1c 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 72,
              fontWeight: 700,
              color: "#fff",
              marginBottom: 12,
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div
            style={{
              fontSize: 80,
              fontWeight: 700,
              letterSpacing: -1,
              display: "flex",
            }}
          >
            {displayName}
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#fb923c",
              letterSpacing: 2,
              display: "flex",
            }}
          >
            {title.toUpperCase()}
          </div>
          {primaryGym && (
            <div
              style={{ fontSize: 22, color: "#a1a1aa", display: "flex" }}
            >
              {primaryGym}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 24,
            borderTop: "1px solid #27272a",
          }}
        >
          <div
            style={{ fontSize: 16, color: "#71717a", display: "flex" }}
          >
            muaythaipai.com/i/{slug}
          </div>
          <div
            style={{
              fontSize: 18,
              color: "#fafafa",
              letterSpacing: 1,
              display: "flex",
            }}
          >
            <span style={{ color: "#fb923c", marginRight: 8 }}>
              {signoffsGiven.toLocaleString()}
            </span>
            skills attested
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
