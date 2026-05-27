"use client"

/**
 * Banner shown across /admin, /trainer, /student when the actor is a
 * platform admin currently "viewing as" someone. The impersonation
 * cookie is httpOnly (so an XSS in an embedded widget can't read who
 * you're impersonating), so this component fetches its state from
 * /api/platform-admin/impersonation/active — which server-side
 * re-verifies the caller is a real platform admin every request.
 *
 * Not sticky — sits above the page's own sticky header so it scrolls
 * away once the operator is engaged with the surface. The chrome shift
 * (indigo accent + impersonation context) is reminder enough.
 */
import { useEffect, useState } from "react"
import { Eye, X, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface ImpersonationState {
  type: "gym_admin" | "trainer" | "student"
  orgId?: string | null
  userId?: string | null
  label: string
}

export default function ImpersonationBanner() {
  const router = useRouter()
  const [state, setState] = useState<ImpersonationState | null>(null)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/platform-admin/impersonation/active", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { active: null }))
      .then((j: { active: ImpersonationState | null }) => {
        if (!cancelled) setState(j.active ?? null)
      })
      .catch(() => {
        if (!cancelled) setState(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!state) return null

  const labelByType = {
    gym_admin: "gym admin",
    trainer: "trainer",
    student: "student",
  }[state.type]

  async function exit() {
    setExiting(true)
    try {
      await fetch("/api/platform-admin/impersonate", { method: "DELETE" })
    } catch {
      // best-effort: the gate redirects handle the failure case.
    }
    router.push("/platform-admin")
    router.refresh()
  }

  return (
    <div className="relative bg-gradient-to-r from-indigo-500/[0.18] to-indigo-500/[0.06] border-b border-indigo-500/20 text-indigo-100">
      <div className="px-4 sm:px-5 py-2 flex items-center gap-2.5 max-w-7xl mx-auto">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-indigo-500/30 ring-1 ring-indigo-400/30 shrink-0">
          <Eye className="h-3 w-3 text-indigo-200" />
        </span>
        <div className="flex-1 min-w-0 text-[12px]">
          <span className="text-indigo-300/80">Viewing as {labelByType} ·</span>{" "}
          <span className="text-white font-medium truncate">{state.label}</span>
        </div>
        <button
          onClick={exit}
          disabled={exiting}
          className="inline-flex items-center gap-1 px-2 h-6 rounded-md bg-indigo-500/15 hover:bg-indigo-500/25 ring-1 ring-indigo-400/20 text-[11px] font-medium text-indigo-100 shrink-0 disabled:opacity-60 transition-colors"
        >
          {exiting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <X className="h-3 w-3" />
          )}
          <span className="hidden sm:inline">Exit impersonation</span>
          <span className="sm:hidden">Exit</span>
        </button>
      </div>
    </div>
  )
}
