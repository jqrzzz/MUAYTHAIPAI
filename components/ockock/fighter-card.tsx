"use client"

import { getFighterRank, getRankBorderClass } from "@/lib/fighter-ranks"
import { WinStreakBadge } from "./win-streak-badge"
import { MapPin } from "lucide-react"
import Image from "next/image"

interface Fighter {
  id: string
  name: string
  nickname: string
  image: string | null
  record: string
  wins: number
  losses: number
  draws: number
  weight_class: string | null
  weight_kg: number | null
  height_cm: number | null
  country: string | null
  open_to_fights: boolean
  open_to_events: boolean
  gym: {
    name: string
    slug: string
    city: string | null
    province: string | null
  } | null
}

export function FighterCard({ fighter }: { fighter: Fighter }) {
  const totalFights = fighter.wins + fighter.losses + fighter.draws
  // Calculate win streak approximation from consecutive wins
  // In production this would come from the database
  const winStreak = fighter.wins > 3 ? Math.min(fighter.wins - fighter.losses, 20) : 0
  const rank = getFighterRank(winStreak)
  const rankBorder = getRankBorderClass(winStreak)

  return (
    <div className="group h-full">
      <div className={`relative overflow-hidden rounded-xl ${rankBorder}`}>
        {/* Photo area with initials fallback */}
        <div className="relative aspect-square bg-gradient-to-br from-slate-800 to-slate-700">
          {fighter.image ? (
            <Image
              src={fighter.image}
              alt={fighter.name}
              fill
              sizes="(max-width: 640px) 50vw, 300px"
              className="object-cover"
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center ${
                fighter.country === "Thailand"
                  ? "bg-red-500/10"
                  : "bg-blue-500/10"
              }`}
            >
              <span className="text-4xl font-bold text-slate-500">
                {fighter.name.charAt(0)}
              </span>
            </div>
          )}

          {/* Win streak badge - top right */}
          {winStreak > 0 && (
            <div className="absolute -right-1 -top-1 z-20">
              <WinStreakBadge winStreak={winStreak} />
            </div>
          )}

          {/* Rank label - top left */}
          {rank && (
            <div
              className={`absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${rank.bgColor}`}
            >
              {rank.name}
            </div>
          )}

          {/* Ready to fight banner - bottom */}
          {fighter.open_to_fights && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-emerald-500 to-green-500 py-1 text-center text-xs font-medium text-white backdrop-blur-sm">
              Ready to Fight
            </div>
          )}
        </div>

        {/* Info section */}
        <div className="bg-white/[0.05] p-3">
          <h3 className="truncate text-sm font-semibold text-white">
            {fighter.name}
          </h3>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-neutral-400">
              {fighter.weight_kg ? `${fighter.weight_kg} kg` : fighter.weight_class || "—"}
            </span>
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-medium text-neutral-300">
              {fighter.wins}-{fighter.losses}
              {fighter.draws > 0 ? `-${fighter.draws}` : ""}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs text-neutral-500">
              <MapPin className="h-3 w-3" />
              {fighter.gym?.city || fighter.country || "—"}
            </span>
            {fighter.country && (
              <span className="text-xs text-neutral-500">
                {fighter.country}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
