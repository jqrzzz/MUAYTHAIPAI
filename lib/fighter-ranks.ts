// Thai mythological rank system based on fighter win streaks
// Inspired by the OckOck prototype's ranking hierarchy

export type FighterRank = "garuda" | "hanuman" | "ratchasi" | "phaya-nak" | "naga" | null

export interface RankInfo {
  name: string
  rank: FighterRank
  minStreak: number
  color: string        // Tailwind text color
  bgColor: string      // Tailwind badge bg
  borderColor: string  // Tailwind ring color
  glowColor: string    // CSS glow for special effects
}

const RANKS: RankInfo[] = [
  {
    name: "Garuda",
    rank: "garuda",
    minStreak: 15,
    color: "text-amber-400",
    bgColor: "bg-gradient-to-br from-amber-400 to-amber-600",
    borderColor: "ring-amber-500/60",
    glowColor: "rgba(245, 158, 11, 0.5)",
  },
  {
    name: "Hanuman",
    rank: "hanuman",
    minStreak: 10,
    color: "text-slate-300",
    bgColor: "bg-gradient-to-br from-slate-200 to-slate-400",
    borderColor: "ring-slate-400/60",
    glowColor: "rgba(148, 163, 184, 0.5)",
  },
  {
    name: "Ratchasi",
    rank: "ratchasi",
    minStreak: 7,
    color: "text-red-400",
    bgColor: "bg-gradient-to-br from-red-500 to-red-700",
    borderColor: "ring-red-500/50",
    glowColor: "rgba(239, 68, 68, 0.4)",
  },
  {
    name: "Phaya Nak",
    rank: "phaya-nak",
    minStreak: 4,
    color: "text-emerald-400",
    bgColor: "bg-gradient-to-br from-emerald-500 to-emerald-700",
    borderColor: "ring-emerald-500/50",
    glowColor: "rgba(16, 185, 129, 0.4)",
  },
  {
    name: "Naga",
    rank: "naga",
    minStreak: 1,
    color: "text-blue-400",
    bgColor: "bg-gradient-to-br from-blue-500 to-blue-700",
    borderColor: "ring-blue-500/40",
    glowColor: "rgba(59, 130, 246, 0.3)",
  },
]

export function getFighterRank(winStreak: number): RankInfo | null {
  if (winStreak <= 0) return null
  for (const rank of RANKS) {
    if (winStreak >= rank.minStreak) return rank
  }
  return null
}

export function getRankBorderClass(winStreak: number): string {
  const rank = getFighterRank(winStreak)
  if (!rank) return ""
  const width = winStreak >= 10 ? "ring-4" : winStreak >= 4 ? "ring-2" : "ring-2"
  return `${width} ${rank.borderColor}`
}
