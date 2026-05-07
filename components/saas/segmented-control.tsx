/**
 * SegmentedControl — Apple-style picker tabs. Sits inside a recessed
 * track with the active option floating on a softly elevated chip.
 */
import type { LucideIcon } from "lucide-react"

interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: LucideIcon
}

interface SegmentedControlProps<T extends string> {
  value: T
  onValueChange: (next: T) => void
  options: ReadonlyArray<SegmentedOption<T>>
}

export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`grid gap-1 rounded-lg bg-zinc-950/40 p-1`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => {
        const Icon = opt.icon
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            onClick={() => onValueChange(opt.value)}
            className={`inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[12px] font-medium transition-[background-color,color,transform,box-shadow] duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ${
              active
                ? "bg-zinc-800 text-white shadow-[0_1px_2px_rgba(0,0,0,0.3)] ring-1 ring-zinc-700/60"
                : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/40"
            }`}
          >
            {Icon && <Icon className="h-3 w-3" />}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
