"use client"

/**
 * Banner shown across /admin, /trainer, /student when the actor is a
 * platform admin currently "viewing as" someone. Reads the
 * mtp_impersonate cookie client-side; the server-side gates have
 * already verified the cookie maps to a real platform-admin actor.
 */
import { useEffect, useState } from "react"
import { Eye, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface ImpersonationCookie {
  type: "gym_admin" | "trainer" | "student"
  orgId?: string | null
  userId?: string | null
  label: string
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const m = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/[.$?*|{}()[\]\\/+^]/g, "\\$&") + "=([^;]*)"),
  )
  return m ? decodeURIComponent(m[1]) : null
}

export default function ImpersonationBanner() {
  const router = useRouter()
  const [state, setState] = useState<ImpersonationCookie | null>(null)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const raw = readCookie("mtp_impersonate")
    if (!raw) {
      setState(null)
      return
    }
    try {
      setState(JSON.parse(raw))
    } catch {
      setState(null)
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
      // Even on failure, the cookie clear is best-effort; refresh
      // brings them back to /platform-admin via gate redirects.
    }
    router.push("/platform-admin")
    router.refresh()
  }

  return (
    <div className="sticky top-0 z-50 bg-indigo-600 text-white text-sm px-4 py-2 flex items-center gap-3 shadow-md">
      <Eye className="h-4 w-4 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="font-medium">Viewing as {labelByType}:</span>{" "}
        <span className="truncate">{state.label}</span>
      </div>
      <button
        onClick={exit}
        disabled={exiting}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 text-xs font-medium shrink-0 disabled:opacity-60"
      >
        <X className="h-3.5 w-3.5" />
        Exit impersonation
      </button>
    </div>
  )
}
