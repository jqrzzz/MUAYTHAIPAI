"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Trophy,
  Swords,
  MapPin,
  Loader2,
  User,
  Flame,
  Shield,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface FighterProfile {
  id: string
  display_name: string | null
  ring_name: string | null
  bio: string | null
  photo_url: string | null
  photos: string[]
  status: string
  wins: number
  losses: number
  draws: number
  no_contests: number
  ko_wins: number
  weight_class: string | null
  stance: string | null
  nationality: string | null
  height_cm: number | null
  weight_kg: number | null
  open_to_fights: boolean
  open_to_events: boolean
  gym_name: string | null
  gym_slug: string | null
  gym_city: string | null
  gym_province: string | null
  recent_bouts: unknown[]
}

export default function FighterProfileClient() {
  const params = useParams()
  const [fighter, setFighter] = useState<FighterProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchFighter() {
      try {
        const response = await fetch(`/api/public/fighters/${params.id}`)
        if (!response.ok) throw new Error("Not found")
        const data = await response.json()
        setFighter(data.fighter)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    if (params.id) fetchFighter()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (error || !fighter) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <Swords className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-400 text-lg mb-4">Fighter not found</p>
          <Link href="/fighters" className="text-orange-400 hover:text-orange-300 text-sm">
            Back to fighters
          </Link>
        </div>
      </div>
    )
  }

  const displayName = fighter.display_name || fighter.ring_name || "Unknown"
  const totalFights = fighter.wins + fighter.losses + fighter.draws
  const winRate = totalFights > 0 ? Math.round((fighter.wins / totalFights) * 100) : 0
  const record = `${fighter.wins}-${fighter.losses}-${fighter.draws}`

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-sm border-b border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href="/fighters"
            className="inline-flex items-center text-sm text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            All Fighters
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Photo */}
          <div className="w-full md:w-64 h-72 md:h-80 bg-neutral-800 rounded-2xl overflow-hidden flex-shrink-0">
            {fighter.photo_url ? (
              <img
                src={fighter.photo_url}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-16 h-16 text-neutral-700" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-white">{displayName}</h1>
              {fighter.status === "active" ? (
                <Badge className="bg-green-500/90 text-white border-0 mt-1">Active</Badge>
              ) : (
                <Badge className="bg-neutral-600/90 text-neutral-200 border-0 mt-1">Retired</Badge>
              )}
            </div>

            {fighter.ring_name && fighter.display_name && fighter.ring_name !== fighter.display_name && (
              <p className="text-orange-400 text-lg mb-4">&quot;{fighter.ring_name}&quot;</p>
            )}

            {/* Record Banner */}
            <div className="bg-neutral-800/50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-orange-500" />
                <span className="text-2xl font-mono font-bold text-white">{record}</span>
                {fighter.no_contests > 0 && (
                  <span className="text-sm text-neutral-500">({fighter.no_contests} NC)</span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-3">
                <StatBox label="Wins" value={fighter.wins} color="text-green-400" />
                <StatBox label="Losses" value={fighter.losses} color="text-red-400" />
                <StatBox label="Draws" value={fighter.draws} color="text-neutral-400" />
                <StatBox label="KO Wins" value={fighter.ko_wins} color="text-orange-400" />
              </div>
              {totalFights > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-neutral-500 mb-1">
                    <span>Win Rate</span>
                    <span>{winRate}%</span>
                  </div>
                  <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                      style={{ width: `${winRate}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-wrap gap-3 text-sm">
              {fighter.gym_name && (
                <Link
                  href={fighter.gym_slug ? `/gyms/${fighter.gym_slug}` : "#"}
                  className="flex items-center gap-1.5 text-neutral-400 hover:text-orange-400 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  {fighter.gym_name}
                  {fighter.gym_city && `, ${fighter.gym_city}`}
                </Link>
              )}
              {fighter.nationality && (
                <span className="flex items-center gap-1.5 text-neutral-400">
                  <Shield className="w-4 h-4" />
                  {fighter.nationality}
                </span>
              )}
              {fighter.weight_class && (
                <span className="flex items-center gap-1.5 text-neutral-400">
                  <Flame className="w-4 h-4" />
                  {fighter.weight_class}
                </span>
              )}
              {fighter.stance && (
                <span className="text-neutral-400 capitalize">{fighter.stance}</span>
              )}
            </div>

            {/* Physical stats */}
            {(fighter.height_cm || fighter.weight_kg) && (
              <div className="flex gap-4 mt-3 text-sm text-neutral-500">
                {fighter.height_cm && <span>{fighter.height_cm} cm</span>}
                {fighter.weight_kg && <span>{fighter.weight_kg} kg</span>}
              </div>
            )}

            {/* Availability */}
            {fighter.status === "active" && (fighter.open_to_fights || fighter.open_to_events) && (
              <div className="flex gap-2 mt-4">
                {fighter.open_to_fights && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    Open to Fights
                  </Badge>
                )}
                {fighter.open_to_events && (
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    Open to Events
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {fighter.bio && (
          <Card className="bg-neutral-900/50 border-neutral-800 mb-6">
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">About</h2>
              <p className="text-neutral-300 leading-relaxed">{fighter.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Fight History (placeholder for when bouts exist) */}
        <Card className="bg-neutral-900/50 border-neutral-800">
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">Fight History</h2>
            {fighter.recent_bouts && fighter.recent_bouts.length > 0 ? (
              <div className="space-y-3">
                {/* Future: render bout cards here */}
                <p className="text-neutral-500 text-sm">Fight history coming soon.</p>
              </div>
            ) : (
              <p className="text-neutral-500 text-sm">No recorded bouts yet.</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  )
}
