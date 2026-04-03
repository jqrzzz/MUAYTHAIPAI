"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, Loader2, Trophy, Swords, MapPin, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { FighterWithGym } from "@/lib/supabase/types"

type StatusFilter = "all" | "active" | "retired"

export default function FightersPageClient() {
  const [fighters, setFighters] = useState<FighterWithGym[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  useEffect(() => {
    fetchFighters()
  }, [statusFilter])

  async function fetchFighters() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      const response = await fetch(`/api/public/fighters?${params}`)
      const data = await response.json()
      setFighters(data.fighters || [])
    } catch {
      setFighters([])
    } finally {
      setLoading(false)
    }
  }

  const filteredFighters = search
    ? fighters.filter(
        (f) =>
          f.display_name?.toLowerCase().includes(search.toLowerCase()) ||
          f.ring_name?.toLowerCase().includes(search.toLowerCase())
      )
    : fighters

  const activeFighters = filteredFighters.filter((f) => f.status === "active")
  const otherFighters = filteredFighters.filter((f) => f.status !== "active")

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/20 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-600/20 rounded-full flex items-center justify-center">
              <Swords className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-orange-400 font-medium tracking-wide uppercase text-sm">OckOck Fighter Registry</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Fighters
          </h1>
          <p className="text-neutral-400 text-lg max-w-2xl">
            Browse Muay Thai fighters from gyms across Thailand. Active competitors, retired champions, and rising stars.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 pb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              placeholder="Search fighters..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "active", "retired"] as StatusFilter[]).map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(s)}
                className={
                  statusFilter === s
                    ? "bg-orange-600 hover:bg-orange-500 text-white"
                    : "border-neutral-700 text-neutral-400 bg-transparent hover:bg-neutral-800"
                }
              >
                {s === "all" ? "All" : s === "active" ? "Active" : "Retired"}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : filteredFighters.length === 0 ? (
          <div className="text-center py-20">
            <Swords className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
            <p className="text-neutral-400 text-lg">No fighters found</p>
            <p className="text-neutral-500 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            {/* Active Fighters */}
            {activeFighters.length > 0 && (
              <section className="mb-10">
                {statusFilter === "all" && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
                      Active ({activeFighters.length})
                    </h2>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeFighters.map((fighter) => (
                    <FighterCard key={fighter.id} fighter={fighter} />
                  ))}
                </div>
              </section>
            )}

            {/* Other Fighters */}
            {otherFighters.length > 0 && (
              <section>
                {statusFilter === "all" && activeFighters.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-neutral-500" />
                    <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
                      Retired ({otherFighters.length})
                    </h2>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {otherFighters.map((fighter) => (
                    <FighterCard key={fighter.id} fighter={fighter} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function FighterCard({ fighter }: { fighter: FighterWithGym }) {
  const totalFights = fighter.wins + fighter.losses + fighter.draws
  const winRate = totalFights > 0 ? Math.round((fighter.wins / totalFights) * 100) : 0
  const record = `${fighter.wins}-${fighter.losses}-${fighter.draws}`
  const displayName = fighter.display_name || fighter.ring_name || "Unknown"

  return (
    <Link href={`/fighters/${fighter.id}`}>
      <div className="group relative bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden hover:border-orange-500/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(234,88,12,0.1)]">
        {/* Photo / Avatar */}
        <div className="relative h-48 bg-neutral-800 overflow-hidden">
          {fighter.photo_url ? (
            <img
              src={fighter.photo_url}
              alt={displayName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl font-bold text-neutral-700">
                {displayName.charAt(0)}
              </span>
            </div>
          )}
          {/* Status badge */}
          <div className="absolute top-3 right-3">
            {fighter.status === "active" ? (
              <Badge className="bg-green-500/90 text-white border-0 text-xs">Active</Badge>
            ) : (
              <Badge className="bg-neutral-600/90 text-neutral-200 border-0 text-xs">Retired</Badge>
            )}
          </div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">
                {displayName}
              </h3>
              {fighter.ring_name && fighter.display_name && fighter.ring_name !== fighter.display_name && (
                <p className="text-sm text-orange-400/80">&quot;{fighter.ring_name}&quot;</p>
              )}
            </div>
          </div>

          {/* Record */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-mono text-white font-semibold">{record}</span>
            </div>
            {totalFights > 0 && (
              <span className="text-xs text-neutral-500">{winRate}% win rate</span>
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            {fighter.gym_name && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {fighter.gym_name}
              </span>
            )}
            {fighter.nationality && (
              <span>{fighter.nationality}</span>
            )}
            {fighter.weight_class && (
              <span>{fighter.weight_class}</span>
            )}
          </div>

          {/* Availability */}
          {fighter.status === "active" && fighter.open_to_fights && (
            <div className="mt-3 pt-3 border-t border-neutral-800">
              <span className="text-xs text-green-400 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Open to fights
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
