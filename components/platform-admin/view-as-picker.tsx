"use client"

/**
 * View-as picker for platform admins. Three modes:
 *  - "View as gym admin"  → pick a gym, land on /admin
 *  - "View as trainer"    → pick a trainer (from any gym), land on /trainer
 *  - "View as student"    → pick a recent student, land on /student
 *
 * Sets the mtp_impersonate cookie via /api/platform-admin/impersonate
 * then navigates. The banner on those pages offers an exit button.
 */
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, ChevronRight, Eye, GraduationCap, Loader2, Users } from "lucide-react"

type Mode = "gym_admin" | "trainer" | "student"

interface GymRow {
  id: string
  name: string
  slug: string | null
  city: string | null
}

interface TrainerRow {
  user_id: string
  org_id: string
  full_name: string | null
  email: string | null
  org_name: string | null
}

interface StudentRow {
  id: string
  full_name: string | null
  email: string
}

export default function ViewAsPicker() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("gym_admin")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [gyms, setGyms] = useState<GymRow[]>([])
  const [trainers, setTrainers] = useState<TrainerRow[]>([])
  const [students, setStudents] = useState<StudentRow[]>([])
  const [query, setQuery] = useState("")

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/platform-admin/view-as-options?mode=${mode}`, {
          cache: "no-store",
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Failed to load")
        if (cancelled) return
        if (mode === "gym_admin") setGyms(data.gyms ?? [])
        if (mode === "trainer") setTrainers(data.trainers ?? [])
        if (mode === "student") setStudents(data.students ?? [])
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [mode])

  async function pick(payload: {
    type: Mode
    orgId?: string
    userId?: string
    label: string
    key: string
  }) {
    setSubmitting(payload.key)
    setError(null)
    try {
      const res = await fetch("/api/platform-admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: payload.type,
          orgId: payload.orgId ?? null,
          userId: payload.userId ?? null,
          label: payload.label,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed")
      router.push(data.next)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(null)
    }
  }

  const filteredGyms = gyms.filter((g) =>
    !query
      ? true
      : g.name.toLowerCase().includes(query.toLowerCase()) ||
        (g.city ?? "").toLowerCase().includes(query.toLowerCase()),
  )
  const filteredTrainers = trainers.filter((t) =>
    !query
      ? true
      : (t.full_name ?? "").toLowerCase().includes(query.toLowerCase()) ||
        (t.email ?? "").toLowerCase().includes(query.toLowerCase()) ||
        (t.org_name ?? "").toLowerCase().includes(query.toLowerCase()),
  )
  const filteredStudents = students.filter((s) =>
    !query
      ? true
      : (s.full_name ?? "").toLowerCase().includes(query.toLowerCase()) ||
        s.email.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Eye className="h-4 w-4 text-indigo-400" />
        <p className="text-sm font-semibold text-white">View as…</p>
        <span className="text-[10px] text-zinc-500 ml-auto">
          QA the experience for any role
        </span>
      </div>

      <div className="flex gap-1 mb-3">
        <ModeButton
          active={mode === "gym_admin"}
          onClick={() => setMode("gym_admin")}
          icon={Building2}
          label="Gym admin"
        />
        <ModeButton
          active={mode === "trainer"}
          onClick={() => setMode("trainer")}
          icon={GraduationCap}
          label="Trainer"
        />
        <ModeButton
          active={mode === "student"}
          onClick={() => setMode("student")}
          icon={Users}
          label="Student"
        />
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter…"
        className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-2.5 py-1.5 text-sm text-white placeholder:text-zinc-500 mb-2"
      />

      {error && (
        <div className="rounded bg-red-500/10 text-red-400 text-xs px-2 py-1.5 mb-2">
          {error}
        </div>
      )}

      <div className="max-h-72 overflow-y-auto space-y-1">
        {loading ? (
          <div className="text-center text-xs text-zinc-500 py-6">
            <Loader2 className="h-4 w-4 animate-spin inline mr-1.5" />
            Loading…
          </div>
        ) : mode === "gym_admin" ? (
          filteredGyms.length === 0 ? (
            <Empty>No gyms.</Empty>
          ) : (
            filteredGyms.map((g) => (
              <PickerRow
                key={g.id}
                title={g.name}
                subtitle={g.city ?? g.slug ?? ""}
                loading={submitting === `gym-${g.id}`}
                onClick={() =>
                  pick({
                    type: "gym_admin",
                    orgId: g.id,
                    label: g.name,
                    key: `gym-${g.id}`,
                  })
                }
              />
            ))
          )
        ) : mode === "trainer" ? (
          filteredTrainers.length === 0 ? (
            <Empty>No trainers.</Empty>
          ) : (
            filteredTrainers.map((t) => (
              <PickerRow
                key={t.user_id}
                title={t.full_name ?? t.email ?? "—"}
                subtitle={t.org_name ?? ""}
                loading={submitting === `trainer-${t.user_id}`}
                onClick={() =>
                  pick({
                    type: "trainer",
                    orgId: t.org_id,
                    userId: t.user_id,
                    label: `${t.full_name ?? t.email} @ ${t.org_name ?? "—"}`,
                    key: `trainer-${t.user_id}`,
                  })
                }
              />
            ))
          )
        ) : filteredStudents.length === 0 ? (
          <Empty>No students.</Empty>
        ) : (
          filteredStudents.map((s) => (
            <PickerRow
              key={s.id}
              title={s.full_name ?? s.email}
              subtitle={s.full_name ? s.email : ""}
              loading={submitting === `student-${s.id}`}
              onClick={() =>
                pick({
                  type: "student",
                  userId: s.id,
                  label: s.full_name ?? s.email,
                  key: `student-${s.id}`,
                })
              }
            />
          ))
        )}
      </div>
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: typeof Eye
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
        active
          ? "bg-indigo-500/15 text-indigo-200 border border-indigo-500/40"
          : "bg-zinc-800/40 text-zinc-400 hover:text-zinc-200 border border-transparent"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

function PickerRow({
  title,
  subtitle,
  onClick,
  loading,
}: {
  title: string
  subtitle: string
  onClick: () => void
  loading: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800/60 text-left disabled:opacity-50"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white truncate">{title}</p>
        {subtitle && (
          <p className="text-[11px] text-zinc-500 truncate">{subtitle}</p>
        )}
      </div>
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400 shrink-0" />
      ) : (
        <ChevronRight className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
      )}
    </button>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-center text-xs text-zinc-500 py-4">{children}</p>
  )
}
