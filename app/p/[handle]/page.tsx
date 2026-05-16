/**
 * Public student passport — /p/[handle]
 *
 * Anyone with the link can view. Shows the student's certs + belt
 * journey + skills + lineage in a cinematic, shareable layout.
 * Acts as the "LinkedIn profile" for a Muay Thai practitioner.
 *
 * Opt-in: only renders when users.public_passport_enabled = TRUE.
 * Otherwise 404.
 */
import { createClient } from "@supabase/supabase-js"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { CERTIFICATION_LEVELS } from "@/lib/certification-levels"
import PassportClient from "./client"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

interface Props {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const slug = handle.toLowerCase()

  // Defensive try/catch — if Supabase is briefly down, we don't want
  // the whole page render to fail with a metadata-generation crash.
  // Fall back to a safe noindex'd "not found" stub.
  let user: { full_name: string | null; public_passport_enabled: boolean } | null = null
  try {
    const { data } = await supabase
      .from("users")
      .select("full_name, public_passport_enabled")
      .eq("public_passport_handle", slug)
      .maybeSingle()
    user = data
  } catch {
    return { title: "Passport | MUAYTHAIPAI", robots: "noindex" }
  }

  if (!user?.public_passport_enabled) {
    return { title: "Passport not found | MUAYTHAIPAI", robots: "noindex" }
  }

  const name = user.full_name ?? handle
  const title = `${name} — Muay Thai Passport | MUAYTHAIPAI`
  const description = `Public Muay Thai certification passport for ${name}. Verifiable credentials, training journey, and gym lineage.`
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://muaythaipai.com"
  const pageUrl = `${siteUrl}/p/${slug}`

  // Next 14 auto-attaches the dynamic opengraph-image.tsx output to og:image.
  // Explicit blocks ensure consistent titles/descriptions across Twitter,
  // Facebook, LinkedIn, iMessage etc. and let us pin the canonical URL.
  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "profile",
      url: pageUrl,
      title,
      description,
      siteName: "MUAYTHAIPAI",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export default async function PassportPage({ params }: Props) {
  const { handle } = await params
  const slug = handle.toLowerCase()

  const { data: user } = await supabase
    .from("users")
    .select("id, full_name, email, public_passport_enabled, public_passport_handle, public_passport_bio")
    .eq("public_passport_handle", slug)
    .maybeSingle()

  if (!user || !user.public_passport_enabled) notFound()

  // Pull everything we need in parallel.
  const [certsRes, signoffsRes, membersRes] = await Promise.all([
    supabase
      .from("certificates")
      .select(`
        id, level, level_number, certificate_number, issued_at,
        organizations:org_id (id, name, slug, city)
      `)
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("level_number", { ascending: true }),
    supabase
      .from("skill_signoffs")
      .select("level, skill_index, signed_off_at, org_id")
      .eq("student_id", user.id),
    supabase
      .from("org_members")
      .select(`
        org_id, joined_at,
        organizations:org_id (id, name, slug, city)
      `)
      .eq("user_id", user.id)
      .eq("role", "student")
      .eq("status", "active")
      .order("joined_at", { ascending: false }),
  ])

  // Compute per-level state for the belt strip
  const earnedByLevel = new Set(
    (certsRes.data ?? []).map((c) => c.level),
  )
  const signoffsByLevel: Record<string, number> = {}
  for (const s of signoffsRes.data ?? []) {
    signoffsByLevel[s.level] = (signoffsByLevel[s.level] ?? 0) + 1
  }
  const levels = CERTIFICATION_LEVELS.map((l) => ({
    id: l.id,
    number: l.number,
    name: l.name,
    creature: l.creature,
    icon: l.icon,
    earned: earnedByLevel.has(l.id),
    skillsTotal: l.skills.length,
    skillsSignedOff: signoffsByLevel[l.id] ?? 0,
  }))

  // Gym affiliations (most recent first)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gyms = ((membersRes.data ?? []) as any[]).map((m) => {
    const org = Array.isArray(m.organizations) ? m.organizations[0] : m.organizations
    return {
      org_id: m.org_id,
      name: org?.name ?? "—",
      slug: org?.slug ?? null,
      city: org?.city ?? null,
      joined_at: m.joined_at,
    }
  })

  // Recent certs (already sorted ascending by level — flip for display top→bottom)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const certs = ((certsRes.data ?? []) as any[]).map((c) => {
    const org = Array.isArray(c.organizations) ? c.organizations[0] : c.organizations
    return {
      id: c.id,
      level: c.level,
      level_number: c.level_number,
      certificate_number: c.certificate_number,
      issued_at: c.issued_at,
      gym_name: org?.name ?? null,
      gym_slug: org?.slug ?? null,
      gym_city: org?.city ?? null,
    }
  })

  // Total skill mastery across all levels
  const totalSignoffs = (signoffsRes.data ?? []).length

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://muaythaipai.com"
  const studentName = user.full_name ?? "Practitioner"

  // One EducationalOccupationalCredential per earned cert. Each links
  // back to the verify URL so search engines can crawl the credential
  // graph from the practitioner's profile.
  const credentialEntries = certs.map((c) => ({
    "@type": "EducationalOccupationalCredential" as const,
    name: `${c.level} Level ${c.level_number}`,
    identifier: c.certificate_number,
    url: c.certificate_number ? `${siteUrl}/verify/${c.certificate_number}` : undefined,
    dateCreated: c.issued_at,
    credentialCategory: "certification",
    ...(c.gym_name
      ? {
          recognizedBy: {
            "@type": "EducationalOrganization" as const,
            name: c.gym_name,
            ...(c.gym_slug ? { url: `${siteUrl}/gyms/${c.gym_slug}` } : {}),
          },
        }
      : {}),
  }))

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: studentName,
    url: `${siteUrl}/p/${slug}`,
    ...(user.public_passport_bio ? { description: user.public_passport_bio } : {}),
    knowsAbout: ["Muay Thai", "Combat Sports"],
    ...(credentialEntries.length > 0 ? { hasCredential: credentialEntries } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PassportClient
        handle={slug}
        student={{
          full_name: user.full_name ?? "Practitioner",
          bio: user.public_passport_bio ?? null,
        }}
        levels={levels}
        certs={certs}
        gyms={gyms}
        totalSignoffs={totalSignoffs}
      />
    </>
  )
}
