"use client"

/**
 * Public passport — cinematic, shareable. Acts as the credential
 * artifact a student can put in their Instagram bio, send to a new
 * gym, or print as a profile sheet.
 *
 * Layout:
 *   Cover band — name in Cinzel, bio in italic Cormorant, gym affiliation
 *   The Naga–Garuda ladder — the five ranks with state (earned / in-progress
 *     / not yet reached) — these are rankings named for Thai guardian
 *     creatures, not belts
 *   Certifications grid — each cert links to /verify/[number]
 *   Skills tally + gym affiliations + footer with platform credit
 */
import Link from "next/link"
import { ArrowUpRight, BadgeCheck, MapPin, Calendar, Share2 } from "lucide-react"

interface RankLevel {
  id: string
  number: number
  name: string
  creature: string
  icon: string
  earned: boolean
  skillsTotal: number
  skillsSignedOff: number
}

interface Cert {
  id: string
  level: string
  level_number: number
  certificate_number: string
  issued_at: string
  gym_name: string | null
  gym_slug: string | null
  gym_city: string | null
}

interface Gym {
  org_id: string
  name: string
  slug: string | null
  city: string | null
  joined_at: string
}

export default function PassportClient({
  handle,
  student,
  levels,
  certs,
  gyms,
  totalSignoffs,
}: {
  handle: string
  student: { full_name: string; bio: string | null }
  levels: RankLevel[]
  certs: Cert[]
  gyms: Gym[]
  totalSignoffs: number
}) {
  const earned = levels.filter((l) => l.earned).length
  const enrolledLevel = levels.find((l) => !l.earned && l.skillsSignedOff > 0)
  const primaryGym = gyms[0]

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Cover band */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_60%)]" />
        <div className="relative mx-auto max-w-4xl px-5 pt-20 pb-12 sm:pt-28 sm:pb-16 text-center">
          <p className="font-display text-[11px] uppercase tracking-[0.28em] text-neutral-500 mb-4 inline-flex items-center gap-1.5">
            <BadgeCheck className="h-3 w-3 text-emerald-400" />
            Verified Practitioner
          </p>
          <h1 className="font-display text-[44px] sm:text-[64px] leading-[1.05] text-white">
            {student.full_name}
          </h1>
          {student.bio && (
            <p className="font-serif italic text-[17px] sm:text-[19px] text-neutral-400 mt-4 max-w-2xl mx-auto leading-relaxed">
              {student.bio}
            </p>
          )}
          {primaryGym && (
            <p className="text-[13px] text-neutral-500 mt-5 inline-flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              {primaryGym.slug ? (
                <Link
                  href={`/gyms/${primaryGym.slug}`}
                  className="text-orange-300 hover:text-orange-200 transition-colors"
                >
                  {primaryGym.name}
                </Link>
              ) : (
                primaryGym.name
              )}
              {primaryGym.city && <span className="text-neutral-600">· {primaryGym.city}</span>}
            </p>
          )}
        </div>
      </section>

      {/* The Naga–Garuda ladder */}
      <section className="border-y border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-950/40 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-5 py-6">
          <div className="flex items-baseline justify-between mb-4">
            <p className="font-display text-[11px] uppercase tracking-[0.22em] text-neutral-500">
              The Naga–Garuda Path
            </p>
            <p className="text-[11px] text-neutral-600 tabular-nums">
              {earned}/{levels.length} earned · {totalSignoffs} skills mastered
            </p>
          </div>
          <div className="relative">
            <div className="hidden sm:block absolute left-0 right-0 top-1/2 h-px bg-white/10" />
            <div className="relative flex items-center justify-between gap-2 sm:gap-4">
              {levels.map((lvl) => {
                const isEarned = lvl.earned
                const isEnrolled = !isEarned && lvl.skillsSignedOff > 0
                return (
                  <div
                    key={lvl.id}
                    className={`flex-1 flex flex-col items-center text-center ${
                      !isEarned && !isEnrolled ? "opacity-40" : ""
                    }`}
                  >
                    <div
                      className={`relative inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full text-[20px] sm:text-[22px] ring-2 transition-transform ${
                        isEarned
                          ? "bg-emerald-500/15 ring-emerald-400/60"
                          : isEnrolled
                            ? "bg-gradient-to-br from-orange-500/30 to-orange-600/20 ring-orange-400 scale-110 shadow-lg shadow-orange-500/20"
                            : "bg-neutral-900 ring-white/10"
                      }`}
                    >
                      <span aria-hidden="true">{lvl.icon}</span>
                      {isEarned && (
                        <BadgeCheck className="absolute -bottom-1 -right-1 h-3.5 w-3.5 text-emerald-300 bg-neutral-950 rounded-full" />
                      )}
                    </div>
                    <p
                      className={`font-display text-[10px] sm:text-[12px] uppercase tracking-[0.16em] mt-2 ${
                        isEarned
                          ? "text-emerald-300"
                          : isEnrolled
                            ? "text-orange-300"
                            : "text-neutral-500"
                      }`}
                    >
                      {lvl.name}
                    </p>
                    <p className="hidden sm:block font-serif italic text-[11px] text-neutral-500 mt-0.5">
                      {lvl.creature}
                    </p>
                    {!isEarned && lvl.skillsSignedOff > 0 && (
                      <p className="text-[10px] text-orange-400 mt-1 tabular-nums">
                        {lvl.skillsSignedOff}/{lvl.skillsTotal} skills
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          {enrolledLevel && (
            <p className="font-serif italic text-[13px] text-neutral-400 text-center mt-5">
              Currently training toward{" "}
              <strong className="text-orange-300 not-italic">
                {enrolledLevel.name}
              </strong>{" "}
              · {enrolledLevel.skillsSignedOff} of {enrolledLevel.skillsTotal} skills mastered
            </p>
          )}
        </div>
      </section>

      {/* Certifications */}
      {certs.length > 0 && (
        <section className="py-10 sm:py-12">
          <div className="mx-auto max-w-4xl px-5">
            <p className="font-display text-[11px] uppercase tracking-[0.22em] text-neutral-500 mb-2">
              Certifications Earned
            </p>
            <h2 className="font-display text-[28px] text-white mb-6">
              {certs.length} {certs.length === 1 ? "credential" : "credentials"}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {certs.map((c) => {
                const tone = ["blue", "emerald", "amber", "slate", "yellow"][
                  Math.max(0, c.level_number - 1) % 5
                ]
                return (
                  <Link
                    key={c.id}
                    href={`/verify/${c.certificate_number}`}
                    className="group rounded-2xl ring-1 ring-white/10 hover:ring-white/20 bg-white/[0.02] hover:bg-white/[0.04] p-5 transition-all hover:-translate-y-0.5"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-full ring-1 shrink-0 text-[18px] ${
                          tone === "emerald"
                            ? "bg-emerald-500/15 ring-emerald-500/30"
                            : tone === "amber"
                              ? "bg-amber-500/15 ring-amber-500/30"
                              : tone === "yellow"
                                ? "bg-yellow-500/15 ring-yellow-500/30"
                                : tone === "slate"
                                  ? "bg-slate-500/15 ring-slate-500/30"
                                  : "bg-blue-500/15 ring-blue-500/30"
                        }`}
                      >
                        {levels.find((l) => l.id === c.level)?.icon ?? "🥊"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                          Level {c.level_number}
                        </p>
                        <p className="font-display text-[20px] text-white leading-tight mt-0.5 capitalize">
                          {c.level.replace(/-/g, " ")}
                        </p>
                        <p className="text-[11px] text-neutral-500 mt-2 flex items-center gap-1.5">
                          <Calendar className="h-2.5 w-2.5" />
                          {new Date(c.issued_at).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        {c.gym_name && (
                          <p className="text-[11px] text-neutral-500 mt-1">
                            Issued by {c.gym_name}
                            {c.gym_city ? ` · ${c.gym_city}` : ""}
                          </p>
                        )}
                        <p className="text-[10px] text-zinc-700 mt-2 font-mono tabular-nums">
                          {c.certificate_number}
                        </p>
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-zinc-700 group-hover:text-indigo-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Gym affiliations (only if more than one) */}
      {gyms.length > 1 && (
        <section className="pb-10">
          <div className="mx-auto max-w-4xl px-5">
            <p className="font-display text-[11px] uppercase tracking-[0.22em] text-neutral-500 mb-3">
              Trained At
            </p>
            <ul className="space-y-2">
              {gyms.map((g) => (
                <li
                  key={g.org_id}
                  className="rounded-xl ring-1 ring-white/10 bg-white/[0.02] px-4 py-3 flex items-center gap-3 text-[13px]"
                >
                  <MapPin className="h-3 w-3 text-zinc-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    {g.slug ? (
                      <Link
                        href={`/gyms/${g.slug}`}
                        className="text-white hover:text-orange-300 truncate font-medium"
                      >
                        {g.name}
                      </Link>
                    ) : (
                      <span className="text-white font-medium truncate">
                        {g.name}
                      </span>
                    )}
                    {g.city && (
                      <span className="text-neutral-500 ml-1.5">· {g.city}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-600">
                    Since {new Date(g.joined_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Footer with share + platform credit */}
      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto max-w-4xl px-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-[11px] text-neutral-500">
              <span className="font-mono text-neutral-600">muaythaipai.com/p/{handle}</span>
            </p>
            <p className="text-[10px] text-neutral-700 mt-1">
              Public passport · Verifiable credentials issued via MUAYTHAIPAI
            </p>
          </div>
          <ShareButton handle={handle} name={student.full_name} />
        </div>
      </footer>
    </div>
  )
}

function ShareButton({ handle, name }: { handle: string; name: string }) {
  const handleClick = async () => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/p/${handle}`
    const text = `${name}'s Muay Thai certification passport`
    if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: (data: { title: string; url: string }) => Promise<void> }).share) {
      try {
        await (navigator as Navigator & { share: (data: { title: string; url: string }) => Promise<void> }).share({ title: text, url })
      } catch {
        // user cancelled
      }
    } else if (typeof navigator !== "undefined") {
      try {
        await navigator.clipboard.writeText(url)
        alert("Passport link copied")
      } catch {
        // ignore
      }
    }
  }
  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 px-3 py-1.5 text-[12px] text-neutral-300 transition-colors"
    >
      <Share2 className="h-3 w-3" />
      Share passport
    </button>
  )
}
