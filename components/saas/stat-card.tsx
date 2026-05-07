/**
 * StatCard — a single-stat display block. Eyebrow label, big number,
 * optional sub. Tone tints the number color (used sparingly — most stats
 * stay white).
 */
import type { LucideIcon } from "lucide-react"
import { Surface } from "./surface"
import { toneStyles, type SaasTone } from "@/lib/saas-design"

interface StatCardProps {
  icon?: LucideIcon
  label: string
  value: string | number
  sub?: string | null
  tone?: SaasTone
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: StatCardProps) {
  const valueColor = tone ? toneStyles[tone].text : "text-white"
  const iconColor = tone ? toneStyles[tone].iconColor : "text-zinc-500"
  return (
    <Surface className="px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-zinc-500">
        {Icon && <Icon className={`h-3 w-3 ${iconColor}`} />}
        {label}
      </div>
      <p className={`text-[20px] font-semibold tracking-tight tabular-nums mt-1 ${valueColor}`}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-zinc-600 mt-0.5">{sub}</p>}
    </Surface>
  )
}
