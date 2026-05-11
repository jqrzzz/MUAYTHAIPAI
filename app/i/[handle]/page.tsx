/**
 * Public instructor profile — /i/[handle]
 *
 * Renders when users.public_instructor_enabled = TRUE.
 * Aggregates across all trainer_profile rows (multi-gym instructors)
 * + skill_signoffs they've issued. Visible artifact of a grader's
 * lineage — the page that says "Khun Wisarut signed 47 Naga students"
 * and is verifiable.
 *
 * Privacy: counts aggregated only; no named student lists. Students
 * own that visibility via /p/[handle].
 */
import { createClient } from "@supabase/supabase-js"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { BadgeCheck, MapPin, Award, Trophy, Calendar } from "lucide-react"
import { CERTIFICATION_LEVELS } from "@/lib/certification-levels"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

interface Props {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const { data: user } = await supabase
    .from("users")
    .select("full_name, public_instructor_enabled")
    .eq("public_instructor_handle", handle.toLowerCase())
    .maybeSingle()
  if (!user?.public_instructor_enabled) {
    return { title: "Instructor not found | MUAYTHAIPAI", robots: "noindex" }
  }
  return {
    title: `${user.full_name ?? handle} — Muay Thai Instructor | MUAYTHAIPAI`,
    description: `Verified Muay Thai instructor in the MUAYTHAIPAI certification network.`,
  }
}

export default async function InstructorPage({ params }: Props) {
  const { handle } = await params
  const slug = handle.toLowerCase()

  const { data: user } = await supabase
    .from("users")
    .select(
      "id, full_name, email, public_instructor_enabled, public_instructor_handle, public_passport_enabled, public_passport_handle",
    )
    .eq("public_instructor_handle", slug)
    .maybeSingle()

  if (!user || !user.public_instructor_enabled) notFound()

  // Pull all trainer_profile rows + signoffs in parallel.
  const [profilesRes, signoffsRes, certsRes] = await Promise.all([
    supabase
      .from("trainer_profiles")
      .select(`
        id, org_id, display_name, title, bio, specialties, photo_url,
        fight_record_wins, fight_record_losses, fight_record_draws,
        years_experience,
        organizations:org_id (id, name, slug, city, province, verified)
      `)
      .eq("user_id", user.id)
      .eq("is_available", true),
    supabase
      .from("skill_signoffs")
      .select("level, signed_off_at, student_id, org_id")
      .eq("signed_off_by", user.id)
      .order("signed_off_at", { ascending: false })
      .limit(1000),
    supabase
      .from("certificates")
      .select("level, level_number, issued_at")
      .eq("issued_by", user.id)
      .eq("status", "active")
      .limit(1000),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profiles = ((profilesRes.data ?? []) as any[]).map((p) => {
    const org = Array.isArray(p.organizations) ? p.organizations[0] : p.organizations
    return {
      id: p.id,
      org_id: p.org_id,
      display_name: p.display_name as string,
      title: p.title as string | null,
      bio: p.bio as string | null,
      specialties: (p.specialties as string[] | null) ?? [],
      photo_url: p.photo_url as string | null,
      fight_record_wins: (p.fight_record_wins as number) ?? 0,
      fight_record_losses: (p.fight_record_losses as number) ?? 0,
      fight_record_draws: (p.fight_record_draws as number) ?? 0,
      years_experience: p.years_experience as number | null,
      org_name: org?.name as string,
      org_slug: org?.slug as string | null,
      org_city: org?.city as string | null,
      org_province: org?.province as string | null,
      org_verified: !!org?.verified,
    }
  })

  // Pick the canonical profile (most recent / first match) for display
  const primary = profiles[0]
  const displayName = primary?.display_name ?? user.full_name ?? handle

  // Compute lineage stats
  const signoffs = signoffsRes.data ?? []
  const signoffsByLevel: Record<string, number> = {}
  const studentsByLevel: Record<string, Set<string>> = {}
  for (const s of signoffs) {
    signoffsByLevel[s.level] = (signoffsByLevel[s.level] ?? 0) + 1
    if (!studentsByLevel[s.level]) studentsByLevel[s.level] = new Set()
    if (s.student_id) studentsByLevel[s.level].add(s.student_id)
  }
  const totalSignoffs = signoffs.length
  const uniqueStudents = new Set(signoffs.map((s) => s.student_id).filter(Boolean)).size

  // Levels they've graded — aligned to the Naga-Garuda ladder
  const gradedLevels = CERTIFICATION_LEVELS.map((l) => ({
    id: l.id,
    name: l.name,
    icon: l.icon,
    creature: l.creature,
    number: l.number,
    signoff_count: signoffsByLevel[l.id] ?? 0,
    student_count: studentsByLevel[l.id]?.size ?? 0,
  })).filter((l) => l.signoff_count > 0)

  // Certificates fully issued (where this trainer was issued_by)
  const certsByLevel: Record<string, number> = {}
  for (const c of certsRes.data ?? []) {
    certsByLevel[c.level] = (certsByLevel[c.level] ?? 0) + 1
  }
  const totalCertsIssued = (certsRes.data ?? []).length

  // First signoff = "active since" date
  const firstSignoff = signoffs[signoffs.length - 1]?.signed_off_at ?? null

  const fightTotal =
    (primary?.fight_record_wins ?? 0) +
    (primary?.fight_record_losses ?? 0) +
    (primary?.fight_record_draws ?? 0)

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Cover band */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.10),transparent_60%)]" />
        <div className="relative mx-auto max-w-4xl px-5 pt-20 pb-12 sm:pt-28 sm:pb-16 text-center">
          {primary?.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primary.photo_url}
              alt={displayName}
              className="w-28 h-28 rounded-full object-cover mx-auto mb-6 ring-2 ring-orange-400/40 shadow-lg shadow-orange-500/10"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-[44px] font-display mx-auto mb-6">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <p className="font-display text-[11px] uppercase tracking-[0.28em] text-neutral-500 mb-3 inline-flex items-center gap-1.5">
            <BadgeCheck className="h-3 w-3 text-emerald-400" />
            Verified Instructor
          </p>
          <h1 className="font-display text-[44px] sm:text-[56px] leading-[1.05] text-white">
            {displayName}
          </h1>
          {primary?.title && (
            <p className="font-serif italic text-[18px] text-neutral-400 mt-2">
              {primary.title}
            </p>
          )}
          {primary?.bio && (
            <p className="text-[15px] text-neutral-300 mt-5 max-w-2xl mx-auto leading-relaxed">
              {primary.bio}
            </p>
          )}
        </div>
      </section>

      {/* Quick stats */}
      <section className="border-y border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-950/40">
        <div className="mx-auto max-w-4xl px-5 py-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat
            icon={<Award className="h-4 w-4" />}
            value={uniqueStudents}
            label="Students graded"
          />
          <Stat
            icon={<BadgeCheck className="h-4 w-4" />}
            value={totalSignoffs}
            label="Skills attested"
          />
          <Stat
            icon={<Award className="h-4 w-4" />}
            value={totalCertsIssued}
            label="Certs issued"
          />
          {fightTotal > 0 ? (
            <Stat
              icon={<Trophy className="h-4 w-4" />}
              value={`${primary?.fight_record_wins ?? 0}–${primary?.fight_record_losses ?? 0}–${primary?.fight_record_draws ?? 0}`}
              label="Fight record"
            />
          ) : primary?.years_experience ? (
            <Stat
              icon={<Calendar className="h-4 w-4" />}
              value={`${primary.years_experience}+`}
              label="Years training"
            />
          ) : firstSignoff ? (
            <Stat
              icon={<Calendar className="h-4 w-4" />}
              value={new Date(firstSignoff).getFullYear().toString()}
              label="Grading since"
            />
          ) : (
            <Stat
              icon={<Calendar className="h-4 w-4" />}
              value="—"
              label="Active"
            />
          )}
        </div>
      </section>

      {/* Specialties */}
      {primary?.specialties && primary.specialties.length > 0 && (
        <section className="py-8">
          <div className="mx-auto max-w-4xl px-5">
            <p className="font-display text-[11px] uppercase tracking-[0.22em] text-neutral-500 mb-3">
              Specialties
            </p>
            <div className="flex flex-wrap gap-2">
              {primary.specialties.map((s, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full bg-white/[0.04] ring-1 ring-white/10 text-[13px] text-neutral-200"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Grading lineage — what levels they've signed off */}
      {gradedLevels.length > 0 && (
        <section className="py-8 sm:py-10">
          <div className="mx-auto max-w-4xl px-5">
            <p className="font-display text-[11px] uppercase tracking-[0.22em] text-neutral-500 mb-2">
              Lineage
            </p>
            <h2 className="font-display text-[28px] text-white mb-6">
              Grading record
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {gradedLevels.map((lvl) => (
                <div
                  key={lvl.id}
                  className="rounded-2xl ring-1 ring-white/10 bg-white/[0.02] p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/10 shrink-0 text-[20px]">
                      {lvl.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                        Level {lvl.number} · {lvl.creature}
                      </p>
                      <p className="font-display text-[20px] text-white mt-0.5">
                        {lvl.name}
                      </p>
                      <p className="text-[12px] text-neutral-500 mt-2 flex items-center gap-2">
                        <span>
                          <strong className="text-neutral-300">
                            {lvl.signoff_count}
                          </strong>{" "}
                          skill{lvl.signoff_count === 1 ? "" : "s"} signed
                        </span>
                        <span className="text-neutral-700">·</span>
                        <span>
                          <strong className="text-neutral-300">
                            {lvl.student_count}
                          </strong>{" "}
                          student{lvl.student_count === 1 ? "" : "s"}
                        </span>
                        {certsByLevel[lvl.id] ? (
                          <>
                            <span className="text-neutral-700">·</span>
                            <span>
                              <strong className="text-orange-300">
                                {certsByLevel[lvl.id]}
                              </strong>{" "}
                              cert{certsByLevel[lvl.id] === 1 ? "" : "s"} issued
                            </span>
                          </>
                        ) : null}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gym affiliations */}
      <section className="py-8">
        <div className="mx-auto max-w-4xl px-5">
          <p className="font-display text-[11px] uppercase tracking-[0.22em] text-neutral-500 mb-3">
            Teaches at
          </p>
          {profiles.length > 0 ? (
            <ul className="space-y-2">
              {profiles.map((p) => (
                <li
                  key={p.id}
                  className="rounded-xl ring-1 ring-white/10 bg-white/[0.02] px-4 py-3 flex items-center gap-3 text-[13px]"
                >
                  <MapPin className="h-3 w-3 text-zinc-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    {p.org_slug ? (
                      <Link
                        href={`/gyms/${p.org_slug}`}
                        className="text-white hover:text-orange-300 font-medium inline-flex items-center gap-1.5"
                      >
                        {p.org_name}
                        {p.org_verified && (
                          <BadgeCheck className="h-3 w-3 text-blue-400" />
                        )}
                      </Link>
                    ) : (
                      <span className="text-white font-medium">{p.org_name}</span>
                    )}
                    {(p.org_city || p.org_province) && (
                      <span className="text-neutral-500 ml-1.5">
                        · {[p.org_city, p.org_province].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-neutral-500">
              No gym affiliations on file.
            </p>
          )}
        </div>
      </section>

      {/* Student passport cross-link if applicable */}
      {user.public_passport_enabled && user.public_passport_handle && (
        <section className="pb-8">
          <div className="mx-auto max-w-4xl px-5 text-center">
            <a
              href={`/p/${user.public_passport_handle}`}
              className="inline-flex items-center gap-1.5 text-[13px] text-orange-300 hover:text-orange-200 transition-colors"
            >
              View {displayName.split(" ")[0]}&apos;s student passport →
            </a>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto max-w-4xl px-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-[11px] text-neutral-500">
              <span className="font-mono text-neutral-600">muaythaipai.com/i/{slug}</span>
            </p>
            <p className="text-[10px] text-neutral-700 mt-1">
              Public instructor profile · Naga-to-Garuda Certification Network
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string | number
  label: string
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center gap-1.5 text-neutral-500 mb-1">
        {icon}
      </div>
      <p className="font-display text-[24px] text-white tabular-nums leading-none">
        {value}
      </p>
      <p className="font-display text-[10px] uppercase tracking-[0.16em] text-neutral-500 mt-1.5">
        {label}
      </p>
    </div>
  )
}
