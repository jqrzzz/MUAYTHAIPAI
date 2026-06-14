/**
 * Public registry of all students who opted into a public passport.
 *
 * GET /practitioners
 *
 * Server-rendered list. Cards link to /p/[handle]. Optional ?q=
 * search by name. Optional ?level= to filter by highest earned cert.
 *
 * Why this exists: makes the network visible as a directory, not just
 * individual islands. Federations expect a registry — this is the
 * "all credentialed practitioners" book.
 */
import { createServiceClient } from "@/lib/supabase/service"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, Users, BadgeCheck, Search } from "lucide-react"
import { CERTIFICATION_LEVELS } from "@/lib/certification-levels"

const supabase = createServiceClient()

export const metadata: Metadata = {
  title: "Practitioners — MUAYTHAIPAI Registry",
  description:
    "Public registry of certified Muay Thai practitioners in the Naga-to-Garuda Certification Network.",
}

interface Props {
  searchParams: Promise<{ q?: string; level?: string }>
}

export default async function PractitionersPage({ searchParams }: Props) {
  const { q, level } = await searchParams
  const search = (q ?? "").trim().toLowerCase()

  // Pull opted-in users + their certs + first gym affiliation. We push
  // the name search into the DB query so we paginate against filtered
  // results (the level filter is computed from the certs join and stays
  // client-side; that's fine since it just narrows what's already in
  // the page result). Cap is sized so a typical registry view fits but
  // a hint surfaces when we hit it so the user knows to refine.
  const PAGE_CAP = 500
  let usersQuery = supabase
    .from("users")
    .select(`
      id, full_name, public_passport_handle, is_verified_examiner,
      certificates!certificates_user_id_fkey (
        level, level_number, status
      )
    `)
    .eq("public_passport_enabled", true)
    .not("public_passport_handle", "is", null)
    .order("full_name")
    .limit(PAGE_CAP)
  if (search) {
    usersQuery = usersQuery.or(
      `full_name.ilike.%${search}%,public_passport_handle.ilike.%${search}%`,
    )
  }
  const { data: users } = await usersQuery
  const hitCap = (users?.length ?? 0) >= PAGE_CAP

  // Pull gym affiliations for these users
  const userIds = (users ?? []).map((u) => u.id)
  const { data: members } = userIds.length
    ? await supabase
        .from("org_members")
        .select("user_id, organizations:org_id (name, city)")
        .in("user_id", userIds)
        .eq("role", "student")
        .eq("status", "active")
    : { data: [] }

  const gymsByUser = new Map<string, { name: string; city: string | null }>()
  for (const m of members ?? []) {
    if (gymsByUser.has(m.user_id)) continue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const org = Array.isArray((m as any).organizations) ? (m as any).organizations[0] : (m as any).organizations
    if (org?.name) {
      gymsByUser.set(m.user_id, { name: org.name, city: org.city ?? null })
    }
  }

  // Shape rows + compute highest level
  const rows = (users ?? [])
    .map((u) => {
      const activeCerts = ((u.certificates as Array<{ level: string; level_number: number; status: string }> | null) ?? [])
        .filter((c) => c.status === "active")
        .sort((a, b) => b.level_number - a.level_number)
      const highest = activeCerts[0]
      return {
        id: u.id,
        name: u.full_name ?? "Practitioner",
        handle: u.public_passport_handle as string,
        verified: !!u.is_verified_examiner,
        cert_count: activeCerts.length,
        highest_level: highest?.level ?? null,
        highest_level_number: highest?.level_number ?? 0,
        gym: gymsByUser.get(u.id) ?? null,
      }
    })
    .filter((r) => {
      if (search && !r.name.toLowerCase().includes(search) && !r.handle.toLowerCase().includes(search)) {
        return false
      }
      if (level && r.highest_level !== level) {
        return false
      }
      return true
    })
    .sort((a, b) => b.highest_level_number - a.highest_level_number)

  // Schema.org ItemList of Person — the canonical type for a
  // registry/directory. Each practitioner with their public passport
  // URL + highest cert as a nested EducationalOccupationalCredential.
  // Lets AI engines answer "show me certified Muay Thai practitioners
  // in Thailand" with the registry itself rather than scraping the
  // page for names.
  const siteUrl = "https://muaythaipai.com"
  const listJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${siteUrl}/practitioners`,
    name: "MUAYTHAIPAI Practitioners Registry",
    description:
      "Public registry of credentialed Muay Thai practitioners across the Naga-to-Garuda certification network in Thailand. Every entry is independently verifiable via /p/[handle].",
    numberOfItems: rows.length,
    itemListElement: rows.slice(0, 100).map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${siteUrl}/p/${r.handle}`,
      item: {
        "@type": "Person",
        name: r.name,
        url: `${siteUrl}/p/${r.handle}`,
        ...(r.gym?.name
          ? {
              affiliation: {
                "@type": "SportsOrganization",
                name: r.gym.name,
                ...(r.gym.city ? { address: { "@type": "PostalAddress", addressLocality: r.gym.city, addressCountry: "Thailand" } } : {}),
              },
            }
          : {}),
        ...(r.highest_level
          ? {
              hasCredential: {
                "@type": "EducationalOccupationalCredential",
                name: `${r.highest_level.replace(/-/g, " ")} (Level ${r.highest_level_number}) — MUAYTHAIPAI`,
                credentialCategory: "Certificate",
                recognizedBy: {
                  "@type": "Organization",
                  "@id": `${siteUrl}/#organization`,
                  name: "MUAYTHAIPAI",
                },
              },
            }
          : {}),
      },
    })),
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listJsonLd) }}
      />
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
          <p className="font-display text-[11px] uppercase tracking-[0.24em] text-neutral-500 mb-2">
            The Registry
          </p>
          <h1 className="font-display text-[34px] sm:text-[44px] leading-tight text-white">
            Practitioners
          </h1>
          <p className="font-serif italic text-[16px] sm:text-[18px] text-neutral-400 mt-2 max-w-2xl">
            Public profiles of certified Muay Thai practitioners across the
            Naga-to-Garuda network. Every name links to a verifiable journey.
          </p>
        </div>
      </header>

      {/* Filters */}
      <section className="border-b border-white/10 bg-neutral-950/80 sticky top-0 z-30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <form className="flex-1 relative" action="/practitioners" method="get">
            {level && <input type="hidden" name="level" value={level} />}
            <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search by name or handle…"
              className="w-full bg-zinc-900 ring-1 ring-zinc-800 focus:ring-2 focus:ring-indigo-500/40 rounded-lg pl-9 pr-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-600 outline-none"
            />
          </form>
          <div className="flex flex-wrap gap-1.5">
            <Link
              href={`/practitioners${q ? `?q=${encodeURIComponent(q)}` : ""}`}
              className={`px-2.5 py-1.5 rounded-md text-[11px] uppercase tracking-[0.12em] font-medium ring-1 ${
                !level
                  ? "bg-indigo-500/15 text-indigo-200 ring-indigo-500/30"
                  : "bg-zinc-900 text-zinc-400 ring-zinc-800 hover:text-zinc-200"
              }`}
            >
              All
            </Link>
            {CERTIFICATION_LEVELS.map((l) => {
              const isActive = level === l.id
              const params = new URLSearchParams()
              if (q) params.set("q", q)
              params.set("level", l.id)
              return (
                <Link
                  key={l.id}
                  href={`/practitioners?${params}`}
                  className={`px-2.5 py-1.5 rounded-md text-[11px] uppercase tracking-[0.12em] font-medium ring-1 inline-flex items-center gap-1 ${
                    isActive
                      ? "bg-orange-500/15 text-orange-200 ring-orange-500/30"
                      : "bg-zinc-900 text-zinc-400 ring-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  <span aria-hidden="true">{l.icon}</span>
                  {l.name}
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Grid */}
      <main className="mx-auto max-w-5xl px-5 py-8">
        <p className="text-[11px] text-zinc-600 mb-4 tabular-nums">
          {rows.length} {rows.length === 1 ? "practitioner" : "practitioners"}
          {search && ` matching "${q}"`}
          {level && ` at ${CERTIFICATION_LEVELS.find((l) => l.id === level)?.name}`}
        </p>
        {hitCap && (
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-[12px] text-amber-200">
            Showing the first {PAGE_CAP}. Use the search above to narrow the registry.
          </div>
        )}
        {rows.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-[14px] text-zinc-300 font-medium">
              No practitioners match
            </p>
            <p className="text-[12px] text-zinc-500 mt-1">
              Try a different search or clear the filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => {
              const levelConfig = r.highest_level
                ? CERTIFICATION_LEVELS.find((l) => l.id === r.highest_level)
                : null
              return (
                <Link
                  key={r.id}
                  href={`/p/${r.handle}`}
                  className="group rounded-2xl ring-1 ring-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:ring-white/20 p-5 transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 ring-1 ring-indigo-300/30 flex items-center justify-center text-white text-[18px] font-display shrink-0">
                      {r.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[17px] text-white truncate flex items-center gap-1">
                        {r.name}
                        {r.verified && (
                          <BadgeCheck className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                        )}
                      </p>
                      <p className="text-[11px] text-zinc-600 font-mono mt-0.5 truncate">
                        /p/{r.handle}
                      </p>
                      {r.gym && (
                        <p className="text-[11px] text-zinc-500 mt-1 truncate">
                          {r.gym.name}
                          {r.gym.city && ` · ${r.gym.city}`}
                        </p>
                      )}
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-zinc-700 group-hover:text-orange-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                  {levelConfig && (
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
                      <span className="text-[18px]" aria-hidden="true">
                        {levelConfig.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="font-display text-[10px] uppercase tracking-[0.18em] text-orange-300">
                          {levelConfig.name}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {r.cert_count} {r.cert_count === 1 ? "credential" : "credentials"} earned
                        </p>
                      </div>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-5xl px-5 py-8 text-center border-t border-white/10 mt-8">
        <p className="font-display text-[10px] uppercase tracking-[0.18em] text-neutral-600">
          MUAYTHAIPAI · Naga-to-Garuda Certification Registry
        </p>
        <p className="text-[11px] text-neutral-600 mt-2">
          <Link
            href="/instructors"
            className="text-orange-300 hover:text-orange-200 transition-colors"
          >
            Browse instructors →
          </Link>
        </p>
      </footer>
    </div>
  )
}
