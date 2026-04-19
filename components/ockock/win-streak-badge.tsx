"use client"

import { getFighterRank } from "@/lib/fighter-ranks"

interface WinStreakBadgeProps {
  winStreak: number
  size?: "sm" | "md"
}

export function WinStreakBadge({ winStreak, size = "md" }: WinStreakBadgeProps) {
  const rank = getFighterRank(winStreak)
  if (!rank) return null

  const sizeClass = size === "sm" ? "h-7 w-7 text-[9px]" : "h-9 w-9 text-[10px]"
  const streakSize = size === "sm" ? "text-xs" : "text-sm"

  return (
    <div
      className={`${sizeClass} rounded-full flex flex-col items-center justify-center ${rank.bgColor} text-white font-bold shadow-lg border border-white/20`}
      style={{ boxShadow: `0 0 12px ${rank.glowColor}` }}
    >
      <span className={streakSize}>{winStreak}</span>
      <span className="text-[6px] font-medium leading-none opacity-80">
        {rank.name.slice(0, 3).toUpperCase()}
      </span>
    </div>
  )
}
