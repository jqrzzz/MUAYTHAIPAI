"use client"

/**
 * InlineConfirm — replaces browser-native confirm() for destructive
 * actions. First click flips the button into a Confirm · Cancel chip,
 * second click on Confirm fires the action. No focus theft, no modal,
 * works on mobile and keyboard-only.
 *
 * Usage:
 *   <InlineConfirm onConfirm={() => deleteRow(id)}>
 *     <Trash2 className="h-3.5 w-3.5" />
 *   </InlineConfirm>
 */
import { useState, useRef, useEffect } from "react"

export interface InlineConfirmProps {
  onConfirm: () => void | Promise<void>
  children: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Tooltip + aria-label for the initial trigger. */
  title?: string
  /** Tailwind classes applied to the trigger button. */
  className?: string
  /** Auto-reset the "pending" state after N ms if the user wanders off. */
  resetMs?: number
  disabled?: boolean
}

export function InlineConfirm({
  onConfirm,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  title = "Delete",
  className = "",
  resetMs = 4000,
  disabled = false,
}: InlineConfirmProps) {
  const [pending, setPending] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-revert so a forgotten "Confirm" doesn't sit there forever.
  useEffect(() => {
    if (!pending) return
    timerRef.current = setTimeout(() => setPending(false), resetMs)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [pending, resetMs])

  if (pending) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 ring-1 ring-red-500/30 px-1">
        <button
          type="button"
          onClick={async (e) => {
            e.stopPropagation()
            setPending(false)
            await onConfirm()
          }}
          className="rounded px-2 py-0.5 text-[11px] font-medium text-red-300 hover:bg-red-500/20"
        >
          {confirmLabel}
        </button>
        <span className="text-zinc-700">·</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setPending(false)
          }}
          className="rounded px-2 py-0.5 text-[11px] text-zinc-400 hover:bg-zinc-800"
        >
          {cancelLabel}
        </button>
      </span>
    )
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        setPending(true)
      }}
      title={title}
      aria-label={title}
      className={className}
    >
      {children}
    </button>
  )
}
