"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Share2,
  MessageSquare,
} from "lucide-react"
import { getFighterRank, getRankBorderClass } from "@/lib/fighter-ranks"
import { WinStreakBadge } from "@/components/ockock/win-streak-badge"

interface FighterDetail {
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

export default function FighterDetailClient() {
  const params = useParams()
  const [fighter, setFighter] = useState<FighterDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFighter() {
      try {
        const response = await fetch(`/api/public/fighters/${params.id}`)
        if (!response.ok) {
          setFighter(null)
          return
        }
        const data = await response.json()
        setFighter(data.fighter || null)
      } catch {
        setFighter(null)
      } finally {
        setLoading(false)
      }
    }
    if (params.id) fetchFighter()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
      </div>
    )
  }

  if (!fighter) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="mb-4 text-neutral-400">Fighter not found</p>
        <Link
          href="/ockock/fighters"
          className="text-amber-400 hover:text-amber-300"
        >
          Back to fighters
        </Link>
      </div>
    )
  }

  const totalFights = fighter.wins + fighter.losses + fighter.draws
  const winStreak =
    fighter.wins > 3
      ? Math.min(fighter.wins - fighter.losses, 20)
      : 0
  const rank = getFighterRank(winStreak)
  const rankBorder = getRankBorderClass(winStreak)

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      {/* Back */}
      <Link
        href="/ockock/fighters"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        All Fighters
      </Link>

      {/* Profile Card (OckOck-style) */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        {/* Hero banner */}
        <div className="relative h-36 bg-gradient-to-r from-red-600 to-red-800">
          {/* Profile photo - centered, overlapping */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
            <div className="relative">
              <div
                className={`relative h-24 w-24 overflow-hidden rounded-full border-4 border-[#0a0a0f] bg-neutral-800 ${rankBorder}`}
              >
                {fighter.image ? (
                  <Image
                    src={fighter.image}
                    alt={fighter.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl text-neutral-500">
                    {fighter.name.charAt(0)}
                  </div>
                )}
              </div>
              {winStreak > 0 && (
                <div className="absolute -right-2 -top-2">
                  <WinStreakBadge winStreak={winStreak} size="md" />
                </div>
              )}
            </div>
          </div>

          {/* Share button */}
          <button className="absolute right-3 top-3 rounded-full bg-black/30 p-2 text-white/70 backdrop-blur-sm hover:text-white">
            <Share2 className="h-4 w-4" />
          </button>
        </div>

        {/* Name & status */}
        <div className="px-5 pt-16 text-center">
          <h1 className="text-2xl font-bold text-white">{fighter.name}</h1>
          {fighter.nickname && (
            <p className="mt-0.5 text-sm text-amber-400">
              &ldquo;{fighter.nickname}&rdquo;
            </p>
          )}
          <div className="mt-1 flex items-center justify-center gap-2 text-sm text-neutral-400">
            {fighter.country && <span>{fighter.country}</span>}
            {fighter.gym && (
              <>
                <span className="h-1 w-1 rounded-full bg-neutral-600" />
                <span>{fighter.gym.name}</span>
              </>
            )}
          </div>

          {/* Status badge */}
          <div className="mt-2">
            {fighter.open_to_fights ? (
              <span className="inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400">
                Ready to Fight
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-400">
                Not Available
              </span>
            )}
          </div>
        </div>

        {/* Stats grid (OckOck-style 3-column) */}
        <div className="mx-5 mt-5 grid grid-cols-3 divide-x divide-white/10 rounded-lg border border-white/10">
          <div className="p-3 text-center">
            <p className="text-xs text-neutral-500">Weight</p>
            <p className="font-semibold text-white">
              {fighter.weight_kg ? `${fighter.weight_kg} kg` : "—"}
            </p>
          </div>
          <div className="p-3 text-center">
            <p className="text-xs text-neutral-500">Height</p>
            <p className="font-semibold text-white">
              {fighter.height_cm ? `${fighter.height_cm} cm` : "—"}
            </p>
          </div>
          <div className="p-3 text-center">
            <p className="text-xs text-neutral-500">Reach</p>
            <p className="font-semibold text-white">
              {fighter.reach_cm ? `${fighter.reach_cm} cm` : "—"}
            </p>
          </div>
        </div>

        {/* Fight Record (OckOck-style 4-column) */}
        <div className="px-5 pt-5">
          <h3 className="mb-2 text-sm font-semibold text-white">
            Fight Record
          </h3>
          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-lg bg-white/5 p-2.5 text-center">
              <p className="text-[10px] text-neutral-500">Fights</p>
              <p className="text-lg font-bold text-white">{totalFights}</p>
            </div>
            <div className="rounded-lg bg-emerald-500/10 p-2.5 text-center">
              <p className="text-[10px] text-neutral-500">Wins</p>
              <p className="text-lg font-bold text-emerald-400">
                {fighter.wins}
              </p>
            </div>
            <div className="rounded-lg bg-red-500/10 p-2.5 text-center">
              <p className="text-[10px] text-neutral-500">Losses</p>
              <p className="text-lg font-bold text-red-400">
                {fighter.losses}
              </p>
            </div>
            <div className="rounded-lg bg-white/5 p-2.5 text-center">
              <p className="text-[10px] text-neutral-500">Draws</p>
              <p className="text-lg font-bold text-neutral-300">
                {fighter.draws}
              </p>
            </div>
          </div>
        </div>

        {/* Rank display */}
        {rank && (
          <div className="mx-5 mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500">Current Rank</p>
                <p className={`text-lg font-bold ${rank.color}`}>
                  {rank.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500">Win Streak</p>
                <p className="text-lg font-bold text-white">{winStreak}</p>
              </div>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="space-y-3 px-5 pt-5">
          {fighter.gym?.city && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Location</span>
              <span className="flex items-center gap-1 text-sm text-white">
                <MapPin className="h-3.5 w-3.5 text-neutral-500" />
                {fighter.gym.city}
                {fighter.gym.province && `, ${fighter.gym.province}`}
              </span>
            </div>
          )}
          {fighter.weight_class && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Weight Class</span>
              <span className="text-sm text-white">{fighter.weight_class}</span>
            </div>
          )}
          {fighter.years_experience && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Experience</span>
              <span className="text-sm text-white">
                {fighter.years_experience} years
              </span>
            </div>
          )}
          {fighter.specialties.length > 0 && (
            <div>
              <span className="mb-1.5 block text-sm text-neutral-400">
                Specialties
              </span>
              <div className="flex flex-wrap gap-1.5">
                {fighter.specialties.map((s) => (
                  <span
                    key={s}
                    className="rounded-md bg-white/5 px-2 py-1 text-xs text-neutral-300"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bio */}
        {fighter.bio && (
          <div className="px-5 pt-5">
            <h3 className="mb-2 text-sm font-semibold text-white">About</h3>
            <p className="text-sm leading-relaxed text-neutral-400">
              {fighter.bio}
            </p>
          </div>
        )}

        {/* Contact / Action (OckOck-style) */}
        <div className="p-5 pt-6">
          <h3 className="mb-3 text-sm font-semibold text-white">
            Contact Gym
          </h3>
          {fighter.gym && (
            <Link
              href={`/gyms/${fighter.gym.slug}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-3 font-semibold text-black transition-colors hover:bg-amber-400"
            >
              <MessageSquare className="h-4 w-4" />
              Contact {fighter.gym.name}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
