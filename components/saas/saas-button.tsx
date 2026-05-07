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
  const sizeCls =
    size === "sm"
      ? "h-7 px-2.5 text-[11px]"
      : "h-9 px-3.5 text-[12px]"

  const variantCls =
    variant === "primary"
      ? "bg-indigo-500 hover:bg-indigo-400 text-white disabled:bg-zinc-800 disabled:text-zinc-600"
      : variant === "subtle"
        ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 disabled:opacity-50"
        : "bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60 disabled:opacity-50"

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors",
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
