"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Loader2, Search, Filter, X } from "lucide-react"
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
      try {
        const params = new URLSearchParams()
        if (readyOnly) params.set("open_to_fights", "true")
        const response = await fetch(`/api/public/fighters?${params}`)
        const data = await response.json()
        setFighters(data.fighters || [])
      } catch (error) {
        console.error("Error fetching fighters:", error)
        setFighters([])
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-1 text-3xl font-bold text-white">Fighters</h1>
        <p className="text-neutral-400">
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

          {/* Weight Range */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-300">
                Weight (kg)
              </span>
              <span className="text-xs text-neutral-500">
                {weightRange[0]}–{weightRange[1]} kg
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={45}
                max={120}
                value={weightRange[0]}
                onChange={(e) =>
                  setWeightRange([
                    Math.min(+e.target.value, weightRange[1]),
                    weightRange[1],
                  ])
                }
                className="flex-1 accent-amber-500"
              />
              <input
                type="range"
                min={45}
                max={120}
                value={weightRange[1]}
                onChange={(e) =>
                  setWeightRange([
                    weightRange[0],
                    Math.max(+e.target.value, weightRange[0]),
                  ])
                }
                className="flex-1 accent-amber-500"
              />
            </div>
          </div>

          {/* Height Range */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-300">
                Height (cm)
              </span>
              <span className="text-xs text-neutral-500">
                {heightRange[0]}–{heightRange[1]} cm
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={150}
                max={200}
                value={heightRange[0]}
                onChange={(e) =>
                  setHeightRange([
                    Math.min(+e.target.value, heightRange[1]),
                    heightRange[1],
                  ])
                }
                className="flex-1 accent-amber-500"
              />
              <input
                type="range"
                min={150}
                max={200}
                value={heightRange[1]}
                onChange={(e) =>
                  setHeightRange([
                    heightRange[0],
                    Math.max(+e.target.value, heightRange[0]),
                  ])
                }
                className="flex-1 accent-amber-500"
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
      ) : filtered.length === 0 ? (
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
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((fighter) => (
            <Link href={`/ockock/fighters/${fighter.id}`} key={fighter.id}>
              <FighterCard fighter={fighter} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
