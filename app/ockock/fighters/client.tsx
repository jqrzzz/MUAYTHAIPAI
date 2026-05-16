"use client"

import { useEffect, useId, useState } from "react"
import Link from "next/link"
import { Loader2, Search, Filter, X, Users } from "lucide-react"
import { FighterCard } from "@/components/ockock/fighter-card"

interface Fighter {
  id: string
  name: string
  nickname: string
  bio: string
  image: string | null
  record: string
  wins: number
  losses: number
  draws: number
  weight_class: string | null
  weight_kg: number | null
  height_cm: number | null
  reach_cm: number | null
  country: string | null
  years_experience: number | null
  specialties: string[]
  open_to_fights: boolean
  open_to_events: boolean
  gym: {
    name: string
    slug: string
    city: string | null
    province: string | null
  } | null
}

const LOCATIONS = ["Bangkok", "Chiang Mai", "Phuket", "Pattaya", "Pai"]

export default function FightersClient() {
  const [fighters, setFighters] = useState<Fighter[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  // Filters — inspired by OckOck promoter/discover
  const [readyOnly, setReadyOnly] = useState(false)
  const [origin, setOrigin] = useState<"all" | "thai" | "international">("all")
  const [location, setLocation] = useState("all")
  const [weightRange, setWeightRange] = useState<[number, number]>([45, 120])
  const [heightRange, setHeightRange] = useState<[number, number]>([150, 200])

  useEffect(() => {
    async function fetchFighters() {
      // Reset both loading + error on every refetch so toggling
      // `readyOnly` shows the spinner and clears stale errors.
      setLoading(true)
      setLoadError(null)
      try {
        const params = new URLSearchParams()
        if (readyOnly) params.set("open_to_fights", "true")
        const response = await fetch(`/api/public/fighters?${params}`)
        if (!response.ok) throw new Error("Failed to fetch")
        const data = await response.json()
        setFighters(data.fighters || [])
      } catch (error) {
        console.error("Error fetching fighters:", error)
        setFighters([])
        setLoadError("Couldn't load the fighter directory. Check your connection and try again.")
      } finally {
        setLoading(false)
      }
    }
    fetchFighters()
  }, [readyOnly])

  // Client-side filtering for instant UX
  const filtered = fighters.filter((f) => {
    if (search) {
      const q = search.toLowerCase()
      const matches =
        f.name.toLowerCase().includes(q) ||
        f.nickname.toLowerCase().includes(q) ||
        f.country?.toLowerCase().includes(q) ||
        f.gym?.name.toLowerCase().includes(q)
      if (!matches) return false
    }
    if (origin === "thai" && f.country !== "Thailand") return false
    if (origin === "international" && f.country === "Thailand") return false
    if (location !== "all" && f.gym?.city !== location) return false
    if (f.weight_kg && (f.weight_kg < weightRange[0] || f.weight_kg > weightRange[1])) return false
    if (f.height_cm && (f.height_cm < heightRange[0] || f.height_cm > heightRange[1])) return false
    return true
  })

  const activeFilterCount = [
    readyOnly,
    origin !== "all",
    location !== "all",
    weightRange[0] !== 45 || weightRange[1] !== 120,
    heightRange[0] !== 150 || heightRange[1] !== 200,
  ].filter(Boolean).length

  const resetFilters = () => {
    setReadyOnly(false)
    setOrigin("all")
    setLocation("all")
    setWeightRange([45, 120])
    setHeightRange([150, 200])
  }

  return (
    <div className="relative">
      {/* Subtle amber hero glow — same treatment as /ockock/fights */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[280px] bg-[radial-gradient(circle_at_50%_-10%,rgba(245,158,11,0.12),transparent_60%)]"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-16">
      {/* Header */}
      <div className="mb-10">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-amber-300/80">
          OckOck · Network Roster
        </p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Fighters
        </h1>
        <p className="text-[15px] text-zinc-400">
          Discover Muay Thai fighters from gyms across Thailand
        </p>
      </div>

      {/* Search & Filter Toggle */}
      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by name, country, or gym..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-neutral-500 outline-none focus:border-amber-500/50"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          aria-pressed={showFilters || activeFilterCount > 0}
          aria-label={showFilters ? "Hide filters" : "Show filters"}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
            showFilters || activeFilterCount > 0
              ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
              : "border-white/10 bg-white/5 text-neutral-400 hover:text-white"
          }`}
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-xs">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel (OckOck-style) */}
      {showFilters && (
        <div className="mb-6 space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          {/* Ready to Fight toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-300">
              Ready to Fight Only
            </span>
            <button
              onClick={() => setReadyOnly(!readyOnly)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                readyOnly ? "bg-amber-500" : "bg-white/10"
              }`}
            >
              <div
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  readyOnly ? "translate-x-5.5 left-[1.375rem]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* Fighter Origin */}
          <div>
            <span className="mb-2 block text-sm font-medium text-neutral-300">
              Fighter Origin
            </span>
            <div className="flex gap-2">
              {(["all", "thai", "international"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setOrigin(opt)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    origin === opt
                      ? "bg-amber-500 text-black"
                      : "bg-white/5 text-neutral-400 hover:text-white"
                  }`}
                >
                  {opt === "all" ? "All" : opt === "thai" ? "Thai" : "International"}
                </button>
              ))}
            </div>
          </div>

          {/* Weight Range — two stacked sliders so each thumb is
              independently focusable and labeled. Auto-push semantics:
              moving "From" above "To" drags To along, and vice versa.
              Previous design overlapped the thumbs which made the
              extremes (min==max) unreachable in one direction. */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-300">
                Weight (kg)
              </span>
              <span className="text-xs text-neutral-500">
                {weightRange[0]}–{weightRange[1]} kg
              </span>
            </div>
            <div className="space-y-2">
              <RangeRow
                label="From"
                min={45}
                max={120}
                value={weightRange[0]}
                unit="kg"
                onChange={(v) =>
                  setWeightRange([v, Math.max(v, weightRange[1])])
                }
              />
              <RangeRow
                label="To"
                min={45}
                max={120}
                value={weightRange[1]}
                unit="kg"
                onChange={(v) =>
                  setWeightRange([Math.min(v, weightRange[0]), v])
                }
              />
            </div>
          </div>

          {/* Height Range — same pattern. */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-300">
                Height (cm)
              </span>
              <span className="text-xs text-neutral-500">
                {heightRange[0]}–{heightRange[1]} cm
              </span>
            </div>
            <div className="space-y-2">
              <RangeRow
                label="From"
                min={150}
                max={200}
                value={heightRange[0]}
                unit="cm"
                onChange={(v) =>
                  setHeightRange([v, Math.max(v, heightRange[1])])
                }
              />
              <RangeRow
                label="To"
                min={150}
                max={200}
                value={heightRange[1]}
                unit="cm"
                onChange={(v) =>
                  setHeightRange([Math.min(v, heightRange[0]), v])
                }
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <span className="mb-2 block text-sm font-medium text-neutral-300">
              Location
            </span>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
            >
              <option value="all">All Locations</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Fighter Grid (2-column like OckOck's mobile grid) */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
          <span className="ml-3 text-neutral-400">Loading fighters...</span>
        </div>
      ) : loadError ? (
        // Real fetch failure — distinguish from the "no fighters yet"
        // empty state below so visitors don't get a misleading
        // "become a fighter" CTA when the API is just down.
        <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/[0.05] px-6 py-16 text-center">
          <p className="mb-2 text-lg font-medium text-red-300">Couldn&apos;t load fighters</p>
          <p className="mb-6 text-sm text-neutral-400">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-white/10"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        fighters.length === 0 ? (
          // No fighters in the system at all — surface the path for a
          // trainer to opt in, so the page isn't a dead end.
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] py-16 px-6 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-neutral-600" />
            <p className="mb-1 text-lg font-medium text-neutral-300">
              No fighters in the directory yet
            </p>
            <p className="mx-auto mb-6 max-w-md text-sm text-neutral-500">
              Trainers and fighters can list themselves by setting
              &ldquo;Open to fights&rdquo; on their trainer profile.
            </p>
            <Link
              href="/trainer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400"
            >
              Open trainer dashboard
            </Link>
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="mb-2 text-neutral-400">No fighters match your filters</p>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-sm text-amber-400 hover:text-amber-300"
              >
                Reset Filters
              </button>
            )}
          </div>
        )
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((fighter) => (
            <Link href={`/fighters/${fighter.id}`} key={fighter.id}>
              <FighterCard fighter={fighter} />
            </Link>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}

// One labeled slider row. Used twice per range (From + To) so each
// thumb is independently keyboard-reachable. The aria-valuetext gives
// screen readers the unit ("65 kg" instead of just "65").
function RangeRow({
  label,
  min,
  max,
  value,
  unit,
  onChange,
}: {
  label: string
  min: number
  max: number
  value: number
  unit: string
  onChange: (v: number) => void
}) {
  const id = useId()
  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor={id}
        className="w-9 shrink-0 text-[11px] uppercase tracking-wider text-neutral-500"
      >
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value} ${unit}`}
        className="flex-1 accent-amber-500"
      />
      <span className="w-12 shrink-0 text-right text-xs tabular-nums text-neutral-300">
        {value}
        {unit}
      </span>
    </div>
  )
}
