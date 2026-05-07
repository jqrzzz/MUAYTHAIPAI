/**
 * Design tokens for the MUAYTHAIPAI SaaS shell.
 *
 * Exported as a single object so the system is documented in one place,
 * and any global retune (radius from 8 → 10px, indigo from 500 → 400)
 * happens here once. Most consumers should reach for the primitives in
 * `components/saas/*` rather than these tokens directly.
 */

export const saasDesign = {
  radii: {
    card: "rounded-xl",       // 12px — surfaces
    button: "rounded-lg",     // 8px  — buttons, inputs
    chip: "rounded-md",       // 6px  — small pills, status badges
    pill: "rounded-full",     // starter prompts, dots
  },
  text: {
    eyebrow: "text-[11px] uppercase tracking-[0.18em] text-zinc-500",
    eyebrowSm: "text-[11px] uppercase tracking-[0.14em] text-zinc-500",
    sectionTitle: "text-[18px] font-semibold tracking-tight text-white",
    pageTitle: "text-[28px] font-semibold tracking-tight text-white leading-tight",
    body: "text-[13px] text-zinc-200",
    sub: "text-[12px] text-zinc-500",
    meta: "text-[11px] text-zinc-600",
  },
  surface: {
    base: "bg-zinc-900/40 ring-1 ring-zinc-900",
    accentIndigo: "bg-gradient-to-b from-indigo-500/[0.04] to-zinc-900/40 ring-1 ring-indigo-500/20",
    backdrop: "backdrop-blur-sm",
  },
  // Single accent color used throughout the SaaS shell.
  // Used in primary CTAs, focus rings, sparkbar bars, impersonation banner.
  accent: {
    bg: "bg-indigo-500",
    bgHover: "hover:bg-indigo-400",
    text: "text-indigo-300",
    textHover: "hover:text-indigo-200",
    ring: "ring-indigo-500/25",
    ringFocus: "focus:ring-indigo-500/40",
  },
} as const

export type SaasTone = "indigo" | "emerald" | "amber" | "red" | "zinc"

/**
 * Map a tone token to its tailwind classes. Used by `<EmptyState>`,
 * `<StatCard>`, `<Surface accent>`, etc.
 */
export const toneStyles: Record<
  SaasTone,
  { iconBg: string; iconColor: string; ring: string; text: string }
> = {
  indigo: {
    iconBg: "bg-indigo-500/15",
    iconColor: "text-indigo-300",
    ring: "ring-indigo-500/25",
    text: "text-indigo-200",
  },
  emerald: {
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-300",
    ring: "ring-emerald-500/25",
    text: "text-emerald-200",
  },
  amber: {
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-300",
    ring: "ring-amber-500/25",
    text: "text-amber-200",
  },
  red: {
    iconBg: "bg-red-500/15",
    iconColor: "text-red-300",
    ring: "ring-red-500/25",
    text: "text-red-200",
  },
  zinc: {
    iconBg: "bg-zinc-800",
    iconColor: "text-zinc-400",
    ring: "ring-zinc-700/50",
    text: "text-zinc-300",
  },
}
