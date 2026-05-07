/**
 * SaasInput / SaasTextarea — form fields tuned for the SaaS shell.
 * No heavy borders, recessed bg, indigo focus ring.
 */
import { cn } from "@/lib/utils"

export const saasFieldClass =
  "w-full bg-zinc-950/50 ring-1 ring-zinc-800 hover:ring-zinc-700 focus:ring-2 focus:ring-indigo-500/50 rounded-lg px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-600 outline-none transition-[box-shadow,background-color] duration-150 disabled:opacity-50"

export function SaasInput({
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(saasFieldClass, className)} {...rest} />
}

export function SaasTextarea({
  className,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(saasFieldClass, "resize-none leading-relaxed", className)}
      {...rest}
    />
  )
}
