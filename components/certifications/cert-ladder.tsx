"use client"

/**
 * The Naga–Garuda ladder — the five ranks of the network, each named for a
 * guardian creature of Thai myth (Naga the serpent deity → Garuda the divine
 * eagle). NOT belts: a lineage you ascend.
 *
 *   <CertLadderStrip    progress={...} />              compact horizontal band
 *   <CertLadder         progress={...} renderDetail/> the full stacked ladder;
 *                                                     pass renderDetail to make
 *                                                     a rank expandable (e.g. its
 *                                                     skills + demo uploads)
 *   <CertLadderOverview activity={...} onSelect/>     a gym's per-rank tallies
 *
 * Static rank data (creature, icon, colour, skill count) comes from
 * lib/certification-levels.ts; the caller passes only the standing/activity.
 */
import { useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { CERTIFICATION_LEVELS, type CertificationLevel } from "@/lib/certification-levels"

/** A student's standing on one rank. Shape matches the certification-progress API. */
export interface RankProgress {
  id: string
  earned?: boolean
  earnedAt?: string | null
  certificateNumber?: string | null
  enrolled?: boolean
  enrolledGym?: string | null
  courseCompleted?: boolean
  eligible?: boolean
  daysUntilEligible?: number
  skillsSignedOff?: number
  skillsTotal?: number
}

type RankState = "earned" | "in_progress" | "ready" | "eligible" | "locked"

const norm = (s: string) => s.toLowerCase().replace(/[-_\s]/g, "")

function stateOf(p: RankProgress | undefined, isFirst: boolean): RankState {
  if (p?.earned) return "earned"
  if (p?.enrolled) {
    if (p.skillsTotal && (p.skillsSignedOff ?? 0) >= p.skillsTotal) return "ready"
    return "in_progress"
  }
  if (p?.courseCompleted) return "ready"
  if (p?.eligible || (p?.daysUntilEligible ?? -1) === 0) return "eligible"
  // Naga is open to anyone even without progress data; later ranks aren't.
  if (!p && isFirst) return "eligible"
  return "locked"
}

function mergeRanks(progress: RankProgress[]) {
  const byKey = new Map(progress.map((p) => [norm(p.id), p]))
  return CERTIFICATION_LEVELS.map((level, i) => {
    const p = byKey.get(norm(level.id))
    return { level, p, state: stateOf(p, i === 0), index: i }
  })
}

function stateAccent(state: RankState, level: CertificationLevel): string {
  if (state === "earned") return "text-emerald-300"
  if (state === "in_progress" || state === "ready") return level.color
  return "text-zinc-600"
}

// ─────────────── gym / network overview (issued + enrolled per rank) ───────────────

/** A gym's (or the whole network's) activity on one rank. */
export interface RankActivity {
  id: string
  issued?: number
  enrolled?: number
}

export function CertLadderOverview({
  activity,
  activeId,
  onSelect,
  className,
}: {
  activity: RankActivity[]
  /** Highlight a rank (e.g. the active filter). */
  activeId?: string | null
  /** Make tiles clickable (e.g. to filter a list). Omit for a read-only display. */
  onSelect?: (id: string) => void
  className?: string
}) {
  const byKey = new Map(activity.map((a) => [norm(a.id), a]))
  return (
    <div className={`grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 ${className ?? ""}`}>
      {CERTIFICATION_LEVELS.map((level) => {
        const a = byKey.get(norm(level.id))
        const issued = a?.issued ?? 0
        const enrolled = a?.enrolled ?? 0
        const active = !!activeId && norm(activeId) === norm(level.id)
        const hot = issued > 0 || enrolled > 0
        return (
          <button
            key={level.id}
            type="button"
            onClick={() => onSelect?.(level.id)}
            className={`rounded-2xl p-3.5 text-left transition-colors ${
              active
                ? `border ${level.borderColor} bg-zinc-900/60`
                : hot
                  ? "ring-1 ring-zinc-800 bg-zinc-900/40 hover:ring-zinc-700"
                  : "ring-1 ring-zinc-900 bg-zinc-900/30 opacity-70 hover:opacity-100"
            } ${onSelect ? "cursor-pointer" : "cursor-default"}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden>{level.icon}</span>
              <div className="min-w-0">
                <p className={`font-display text-[13px] leading-tight ${hot ? "text-white" : "text-zinc-400"}`}>
                  {level.name}
                </p>
                <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">Rank {level.number}</p>
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-x-2 gap-y-0.5 flex-wrap">
              <span className={`text-[15px] font-semibold tabular-nums ${hot ? level.color : "text-zinc-600"}`}>{issued}</span>
              <span className="text-[10px] text-zinc-500">issued</span>
              {enrolled > 0 && (
                <>
                  <span className="text-[13px] font-medium tabular-nums text-zinc-300">{enrolled}</span>
                  <span className="text-[10px] text-zinc-500">enrolled</span>
                </>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ───────────────────────────── compact strip ─────────────────────────────

export function CertLadderStrip({
  progress,
  className,
}: {
  progress: RankProgress[]
  className?: string
}) {
  const ranks = mergeRanks(progress)
  const earned = ranks.filter((r) => r.state === "earned").length
  return (
    <section className={className}>
      <div className="mb-3 flex items-baseline justify-between">
        <p className="font-display text-[10px] uppercase tracking-[0.22em] text-zinc-500">
          The Lineage · Naga → Garuda
        </p>
        <p className="text-[10px] tabular-nums text-zinc-600">
          {earned}/{ranks.length} ranks
        </p>
      </div>
      <div className="relative">
        <div className="absolute inset-x-5 top-[22px] h-px bg-zinc-800/80 sm:top-[24px]" />
        <div className="relative flex items-start justify-between">
          {ranks.map(({ level, state }) => {
            const active = state === "in_progress" || state === "ready"
            const ringCls =
              state === "earned"
                ? "bg-emerald-500/15 ring-emerald-400/60"
                : active
                  ? "bg-zinc-900 ring-zinc-600 scale-110 shadow-lg shadow-black/40"
                  : state === "eligible"
                    ? "bg-zinc-900 ring-zinc-700"
                    : "bg-zinc-900 ring-zinc-800 opacity-40"
            return (
              <div key={level.id} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <div
                  className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[18px] ring-2 transition-all sm:h-12 sm:w-12 sm:text-[20px] ${ringCls}`}
                >
                  <span aria-hidden>{level.icon}</span>
                  {state === "earned" && (
                    <Check className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-zinc-950 text-emerald-300" />
                  )}
                </div>
                <p
                  className={`w-full truncate text-center font-display text-[9px] uppercase tracking-[0.14em] sm:text-[10px] ${stateAccent(
                    state,
                    level,
                  )}`}
                >
                  {level.name}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ───────────────────────────── full ladder ──────────────────────────────

export function CertLadder({
  progress,
  /** Return content (or null) to make a rank expandable — e.g. its skill
   *  checklist + demo uploads. The active rank opens by default. */
  renderDetail,
  className,
}: {
  progress: RankProgress[]
  renderDetail?: (rankId: string) => React.ReactNode | null
  className?: string
}) {
  const ranks = mergeRanks(progress)
  return (
    <div className={`space-y-2.5 ${className ?? ""}`}>
      {ranks.map(({ level, p, state, index }) => {
        const detail = renderDetail ? renderDetail(level.id) : null
        const open = (state === "in_progress" || state === "ready") && detail != null
        return (
          <RankRow key={level.id} level={level} p={p} state={state} index={index} detail={detail} defaultOpen={open} />
        )
      })}
    </div>
  )
}

function RankRow({
  level,
  p,
  state,
  index,
  detail,
  defaultOpen = false,
}: {
  level: CertificationLevel
  p?: RankProgress
  state: RankState
  index: number
  detail?: React.ReactNode | null
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const active = state === "in_progress" || state === "ready"
  const hasDetail = detail != null
  const skillsTotal = p?.skillsTotal ?? level.skills.length
  const skillsDone = Math.min(skillsTotal, p?.skillsSignedOff ?? 0)
  const pct = skillsTotal > 0 ? Math.round((skillsDone / skillsTotal) * 100) : 0
  const prevName = index > 0 ? CERTIFICATION_LEVELS[index - 1].name : null

  const rowCls =
    state === "earned"
      ? "ring-1 ring-emerald-500/25 bg-emerald-500/[0.05]"
      : active
        ? `border ${level.borderColor} bg-zinc-900/50`
        : `ring-1 ring-zinc-900 bg-zinc-900/30${state === "locked" ? " opacity-55" : ""}`

  return (
    <div className={`relative overflow-hidden rounded-2xl ${rowCls}`}>
      <div className="flex items-start gap-4 p-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${
            state === "earned" ? "bg-emerald-500/15" : active ? "bg-zinc-800" : "bg-zinc-800/60"
          }`}
        >
          <span aria-hidden>{level.icon}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Rank {level.number}</span>
            <h3 className={`font-display text-[17px] leading-tight ${state === "locked" ? "text-zinc-400" : "text-white"}`}>
              {level.name}
            </h3>
            <span className="text-[12px] text-zinc-500">· {level.creature}</span>
          </div>

          <p className="mt-0.5 text-[12px] leading-relaxed">
            {state === "earned" && (
              <span className="text-emerald-300">
                Earned{p?.earnedAt ? ` ${new Date(p.earnedAt).toLocaleDateString()}` : ""}
                {p?.certificateNumber && (
                  <>
                    {" · "}
                    <a
                      href={`/verify/${p.certificateNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-emerald-400/80 transition-colors hover:text-emerald-300"
                    >
                      {p.certificateNumber} →
                    </a>
                    {" · "}
                    <a
                      href={`/verify/${p.certificateNumber}/print`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400/70 transition-colors hover:text-emerald-300"
                    >
                      print
                    </a>
                  </>
                )}
              </span>
            )}
            {state === "in_progress" && (
              <span className={level.color}>In progress{p?.enrolledGym ? ` at ${p.enrolledGym}` : ""}</span>
            )}
            {state === "ready" && <span className={level.color}>Ready — book the in-person assessment to certify</span>}
            {state === "eligible" && <span className="text-zinc-400">Open — enroll at a gym to begin this rank</span>}
            {state === "locked" && (
              <span className="text-zinc-600">
                {p?.daysUntilEligible && p.daysUntilEligible > 0
                  ? `${p.daysUntilEligible} day${p.daysUntilEligible === 1 ? "" : "s"} until eligible`
                  : prevName
                    ? `Earn ${prevName} first`
                    : "Not yet started"}
              </span>
            )}
          </p>

          {active && skillsTotal > 0 && (
            <div className="mt-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-black/30">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${level.bgGradient}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">
                {skillsDone} of {skillsTotal} skills mastered
              </p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 pt-0.5">
          {state === "earned" && <Check className="h-5 w-5 text-emerald-400" />}
          {active && skillsTotal > 0 && (
            <span className={`text-[12px] font-medium tabular-nums ${level.color}`}>
              {skillsDone}/{skillsTotal}
            </span>
          )}
          {hasDetail && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label={open ? "Hide skills" : "Show skills"}
              className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {hasDetail && open && <div className="border-t border-white/5 px-4 pb-4 pt-3">{detail}</div>}
    </div>
  )
}
