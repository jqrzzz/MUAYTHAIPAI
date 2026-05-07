/**
 * SaasButton — three variants for the SaaS shell. Avoid using shadcn's
 * <Button> in SaaS pages; this one is tuned for our type scale + accents.
 */
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Variant = "primary" | "ghost" | "subtle"
type Size = "sm" | "md"

interface SaasButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  asChild?: boolean
}

export function SaasButton({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  disabled,
  ...rest
}: SaasButtonProps) {
  // h-10 (40px) on md keeps comfortable touch targets on mobile while
  // still reading SaaS-tight; h-7 (28px) on sm is for inline action chips.
  const sizeCls =
    size === "sm"
      ? "h-7 px-2.5 text-[11px]"
      : "h-10 px-4 text-[13px]"

  const variantCls =
    variant === "primary"
      ? "bg-indigo-500 hover:bg-indigo-400 text-white disabled:bg-zinc-800 disabled:text-zinc-600 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset]"
      : variant === "subtle"
        ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 disabled:opacity-50"
        : "bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60 disabled:opacity-50"

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        // Press state (active:scale) gives tactile feedback. focus-visible
        // ring provides keyboard a11y without being noisy on click.
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.97] active:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:active:scale-100 disabled:cursor-not-allowed",
        sizeCls,
        variantCls,
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 className="h-3 w-3 animate-spin" />}
      {children}
    </button>
  )
}
