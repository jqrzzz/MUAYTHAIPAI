/**
 * Public registry of opted-in instructors.
 *
 * GET /instructors
 *
 * Sorted by verified status first, then by signoff count desc. Cards
 * link to /i/[handle]. Verified badges visible at a glance.
 */
import { createClient } from "@supabase/supabase-js"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, UserCheck, BadgeCheck, Search } from "lucide-react"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export const metadata: Metadata = {
  title: "Instructors — MUAYTHAIPAI Registry",
  description:
    "Public registry of certified Muay Thai instructors and examiners in the Naga-to-Garuda Certification Network.",
}

interface Props {
  searchParams: Promise<{ q?: string; verified?: string }>
}

export default async function InstructorsPage({ searchParams }: Props) {
  const { q, verified } = await searchParams
  const search = (q ?? "").trim().toLowerCase()
  const verifiedOnly = verified === "1"

  // Pull all opted-in instructors. Service-role bypasses RLS — read-only
  // fields only.
  let query = supabase
    .from("users")
    .select(`
      id, full_name, public_instructor_handle, is_verified_examiner,
      trainer_profiles!trainer_profiles_user_id_fkey (
        display_name, title, photo_url, specialties,
        organizations:org_id (name, city)
      )
    `)
    .eq("public_instructor_enabled", true)
    .not("public_instructor_handle", "is", null)
    .order("full_name")
    .limit(200)
  if (verifiedOnly) {
    query = query.eq("is_verified_examiner", true)
  }
  const { data: users } = await query

  // Pull signoff counts per instructor — single query
  const userIds = (users ?? []).map((u) => u.id)
  const { data: signoffsRaw } = userIds.length
    ? await supabase
        .from("skill_signoffs")
        .select("signed_off_by, student_id, level")
        .in("signed_off_by", userIds)
    : { data: [] }
  const statsByUser = new Map<
    string,
    { signoffs: number; students: Set<string>; levels: Set<string> }
  >()
  for (const s of signoffsRaw ?? []) {
    const slot = statsByUser.get(s.signed_off_by) ?? {
      signoffs: 0,
      students: new Set<string>(),
      levels: new Set<string>(),
    }
    slot.signoffs++
    if (s.student_id) slot.students.add(s.student_id)
    if (s.level) slot.levels.add(s.level)
    statsByUser.set(s.signed_off_by, slot)
  }

  // Shape rows
  const rows = (users ?? [])
    .map((u) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profiles = ((u.trainer_profiles as any[]) ?? [])
      const primary = profiles[0]
      const stats = statsByUser.get(u.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const org = primary?.organizations ? (Array.isArray(primary.organizations) ? primary.organizations[0] : primary.organizations) : null
      return {
        id: u.id,
        name: (primary?.display_name as string | null) ?? u.full_name ?? "Instructor",
        title: (primary?.title as string | null) ?? null,
        photo_url: (primary?.photo_url as string | null) ?? null,
        handle: u.public_instructor_handle as string,
        verified: !!u.is_verified_examiner,
        specialties: ((primary?.specialties as string[] | null) ?? []).slice(0, 2),
        gym_name: org?.name ?? null,
        gym_city: org?.city ?? null,
        signoff_count: stats?.signoffs ?? 0,
        student_count: stats?.students.size ?? 0,
        level_count: stats?.levels.size ?? 0,
      }
    })
    .filter((r) => {
      if (!search) return true
      return (
        r.name.toLowerCase().includes(search) ||
        r.handle.toLowerCase().includes(search) ||
        (r.gym_name?.toLowerCase().includes(search) ?? false)
      )
    })
    .sort((a, b) => {
      // Verified first, then by signoff count desc
      if (a.verified !== b.verified) return a.verified ? -1 : 1
      return b.signoff_count - a.signoff_count
    })

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
          <p className="font-display text-[11px] uppercase tracking-[0.24em] text-neutral-500 mb-2">
            The Registry
          </p>
          <h1 className="font-display text-[34px] sm:text-[44px] leading-tight text-white">
            Instructors
          </h1>
          <p className="font-serif italic text-[16px] sm:text-[18px] text-neutral-400 mt-2 max-w-2xl">
            Verified examiners across the Naga-to-Garuda network. Each name
            links to a grading record you can trace.
          </p>
        </div>
      </header>

      <section className="border-b border-white/10 bg-neutral-950/80 sticky top-0 z-30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <form className="flex-1 relative" action="/instructors" method="get">
            {verifiedOnly && <input type="hidden" name="verified" value="1" />}
            <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search by name, gym, or handle…"
              className="w-full bg-zinc-900 ring-1 ring-zinc-800 focus:ring-2 focus:ring-indigo-500/40 rounded-lg pl-9 pr-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-600 outline-none"
            />
          </form>
          <div className="flex gap-1.5">
            <Link
              href={`/instructors${q ? `?q=${encodeURIComponent(q)}` : ""}`}
              className={`px-2.5 py-1.5 rounded-md text-[11px] uppercase tracking-[0.12em] font-medium ring-1 ${
                !verifiedOnly
                  ? "bg-indigo-500/15 text-indigo-200 ring-indigo-500/30"
                  : "bg-zinc-900 text-zinc-400 ring-zinc-800 hover:text-zinc-200"
              }`}
            >
              All
            </Link>
            <Link
              href={`/instructors?verified=1${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`px-2.5 py-1.5 rounded-md text-[11px] uppercase tracking-[0.12em] font-medium ring-1 inline-flex items-center gap-1 ${
                verifiedOnly
                  ? "bg-blue-500/15 text-blue-200 ring-blue-500/30"
                  : "bg-zinc-900 text-zinc-400 ring-zinc-800 hover:text-zinc-200"
              }`}
            >
              <BadgeCheck className="h-3 w-3" />
              Verified
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-5 py-8">
        <p className="text-[11px] text-zinc-600 mb-4 tabular-nums">
          {rows.length} {rows.length === 1 ? "instructor" : "instructors"}
          {verifiedOnly && " · verified only"}
          {search && ` matching "${q}"`}
        </p>
        {rows.length === 0 ? (
          <div className="text-center py-16">
            <UserCheck className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-[14px] text-zinc-300 font-medium">
              No instructors match
            </p>
            <p className="text-[12px] text-zinc-500 mt-1">
              Try a different search or clear the filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <Link
                key={r.id}
                href={`/i/${r.handle}`}
                className="group rounded-2xl ring-1 ring-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:ring-white/20 p-5 transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-3">
                  {r.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.photo_url}
                      alt={r.name}
                      className="w-12 h-12 rounded-full object-cover ring-1 ring-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-[18px] font-display shrink-0">
                      {r.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[17px] text-white truncate flex items-center gap-1">
                      {r.name}
                      {r.verified && (
                        <BadgeCheck
                          className="h-3.5 w-3.5 text-blue-400 shrink-0"
                          aria-label="Verified examiner"
                        />
                      )}
                    </p>
                    {r.title && (
                      <p className="font-serif italic text-[12px] text-neutral-400 truncate mt-0.5">
                        {r.title}
                      </p>
                    )}
                    {r.gym_name && (
                      <p className="text-[11px] text-zinc-500 mt-1 truncate">
                        {r.gym_name}
                        {r.gym_city && ` · ${r.gym_city}`}
                      </p>
                    )}
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-zinc-700 group-hover:text-orange-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>

                {(r.signoff_count > 0 || r.specialties.length > 0) && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    {r.signoff_count > 0 && (
                      <p className="text-[11px] text-zinc-500">
                        <strong className="text-zinc-300 tabular-nums">{r.signoff_count}</strong>{" "}
                        skills signed ·{" "}
                        <strong className="text-zinc-300 tabular-nums">{r.student_count}</strong>{" "}
                        student{r.student_count === 1 ? "" : "s"}
                      </p>
                    )}
                    {r.specialties.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {r.specialties.map((s, i) => (
                          <span
                            key={i}
                            className="text-[10px] uppercase tracking-wider text-neutral-400 bg-white/[0.04] ring-1 ring-white/10 rounded-full px-2 py-0.5"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-5xl px-5 py-8 text-center border-t border-white/10 mt-8">
        <p className="font-display text-[10px] uppercase tracking-[0.18em] text-neutral-600">
          MUAYTHAIPAI · Naga-to-Garuda Certification Registry
        </p>
        <p className="text-[11px] text-neutral-600 mt-2">
          <Link
            href="/practitioners"
            className="text-orange-300 hover:text-orange-200 transition-colors"
          >
            Browse practitioners →
          </Link>
        </p>
      </footer>
    </div>
  )
}
