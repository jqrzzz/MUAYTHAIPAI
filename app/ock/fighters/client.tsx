"use client"

import { useState, useEffect } from "react"
import { Loader2, Search, Filter, MapPin, Trophy } from "lucide-react"

const WEIGHT_CLASSES = [
  "Mini Flyweight",
  "Flyweight",
  "Bantamweight",
  "Featherweight",
  "Lightweight",
  "Welterweight",
  "Middleweight",
  "Light Heavyweight",
  "Heavyweight",
]

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

export default function FightersClient() {
  const [fighters, setFighters] = useState<Fighter[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [weightFilter, setWeightFilter] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    async function fetchFighters() {
      try {
        const params = new URLSearchParams()
        if (weightFilter) params.set("weight_class", weightFilter)
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
  }, [weightFilter])

  const filtered = fighters.filter((f) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      f.name.toLowerCase().includes(q) ||
      f.nickname.toLowerCase().includes(q) ||
      f.country?.toLowerCase().includes(q) ||
      f.gym?.name.toLowerCase().includes(q)
    )
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-white">Fighters</h1>
        <p className="text-neutral-400">
          Browse Muay Thai fighters from gyms across Thailand
        </p>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by name, country, or gym..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-neutral-500 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
            showFilters || weightFilter
              ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
              : "border-white/10 bg-white/5 text-neutral-400 hover:text-white"
          }`}
        >
          <Filter className="h-4 w-4" />
          Filters
          {weightFilter && (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs">
              1
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-2 text-sm font-medium text-neutral-300">
            Weight Class
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setWeightFilter("")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                !weightFilter
                  ? "bg-amber-500 text-black"
                  : "bg-white/5 text-neutral-400 hover:text-white"
              }`}
            >
              All
            </button>
            {WEIGHT_CLASSES.map((wc) => (
              <button
                key={wc}
                onClick={() => setWeightFilter(wc === weightFilter ? "" : wc)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  weightFilter === wc
                    ? "bg-amber-500 text-black"
                    : "bg-white/5 text-neutral-400 hover:text-white"
                }`}
              >
                {wc}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fighter Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
          <span className="ml-3 text-neutral-400">Loading fighters...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-neutral-400">No fighters found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((fighter) => (
            <FighterCard key={fighter.id} fighter={fighter} />
          ))}
        </div>
      )}
    </div>
  )
}

function FighterCard({ fighter }: { fighter: Fighter }) {
  const totalFights = fighter.wins + fighter.losses + fighter.draws
  const winRate =
    totalFights > 0 ? Math.round((fighter.wins / totalFights) * 100) : 0

  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-amber-500/20 hover:bg-white/[0.05]">
      {/* Top: Photo + Name */}
      <div className="mb-4 flex items-start gap-4">
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-neutral-800">
          {fighter.image ? (
            <img
              src={fighter.image}
              alt={fighter.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl text-neutral-500">
              {fighter.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-white">
            {fighter.name}
          </h3>
          {fighter.nickname && (
            <p className="truncate text-sm text-amber-400">
              &ldquo;{fighter.nickname}&rdquo;
            </p>
          )}
          {fighter.gym && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-neutral-500">
              <MapPin className="h-3 w-3" />
              {fighter.gym.name}
              {fighter.gym.city && `, ${fighter.gym.city}`}
            </p>
          )}
        </div>
      </div>

      {/* Record */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-sm font-medium text-white">
            {fighter.record}
          </span>
        </div>
        {totalFights > 0 && (
          <span className="text-xs text-neutral-500">
            {winRate}% win rate
          </span>
        )}
      </div>

      {/* Stats Row */}
      <div className="mb-3 flex flex-wrap gap-2">
        {fighter.weight_class && (
          <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-neutral-300">
            {fighter.weight_class}
          </span>
        )}
        {fighter.country && (
          <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-neutral-300">
            {fighter.country}
          </span>
        )}
        {fighter.height_cm && (
          <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-neutral-300">
            {fighter.height_cm}cm
          </span>
        )}
        {fighter.weight_kg && (
          <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-neutral-300">
            {fighter.weight_kg}kg
          </span>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {fighter.open_to_fights && (
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
            Open to Fights
          </span>
        )}
        {fighter.open_to_events && (
          <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
            Open to Events
          </span>
        )}
      </div>
    </div>
  )
}
