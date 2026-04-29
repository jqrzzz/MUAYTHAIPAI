"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Loader2,
  GraduationCap,
  Award,
  Calendar,
  Users,
  Building2,
  CheckCircle2,
} from "lucide-react"

interface TrainerRow {
  id: string
  email: string
  full_name: string | null
  display_name: string | null
  avatar_url: string | null
  total_signoffs: number
  students_touched: number
  gyms_taught_at: number
  levels: string[]
  last_signoff_at: string | null
}

interface TrainerPassport {
  trainer: {
    id: string
    email: string
    full_name: string | null
    display_name: string | null
    phone: string | null
    created_at: string
  }
  summary: {
    total_signoffs: number
    students_touched: number
    gyms_taught_at: number
    certs_issued: number
  }
  by_level: Array<{ level: string; signoffs: number; students: number; gyms: number }>
  gyms: Array<{
    org_id: string
    name: string
    city: string | null
    signoffs: number
    role?: string
  }>
  students: Array<{ id: string; name: string | null; email: string | null; signoffs: number }>
  certs: Array<{
    id: string
    org_name: string | null
    student_name: string | null
    level: string
    certificate_number: string | null
    issued_at: string
  }>
  recent_signoffs: Array<{
    id: string
    student_name: string | null
    org_name: string | null
    level: string
    skill_index: number
    signed_off_at: string
  }>
}

const SORTS = [
  { value: "recent", label: "Most recent" },
  { value: "signoffs", label: "Signoffs" },
  { value: "students", label: "Students touched" },
  { value: "gyms", label: "Gyms taught at" },
  { value: "name", label: "Name" },
]

export default function TrainersTab() {
  const [trainers, setTrainers] = useState<TrainerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("recent")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [passport, setPassport] = useState<TrainerPassport | null>(null)
  const [passportLoading, setPassportLoading] = useState(false)
  const detailRef = useRef<HTMLDivElement>(null)

  const fetchTrainers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set("q", search.trim())
      params.set("sort", sort)
      const res = await fetch(`/api/platform-admin/trainers?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setTrainers(data.trainers || [])
      }
    } finally {
      setLoading(false)
    }
  }, [search, sort])

  useEffect(() => {
    fetchTrainers()
  }, [fetchTrainers])

  useEffect(() => {
    if (!selectedId) {
      setPassport(null)
      return
    }
    let cancelled = false
    setPassportLoading(true)
    fetch(`/api/platform-admin/trainers/${selectedId}`)
      .then(async (r) => {
        const d = await r.json()
        if (!cancelled) setPassport(r.ok ? d : null)
      })
      .finally(() => {
        if (!cancelled) setPassportLoading(false)
      })
    // Auto-scroll detail into view on mobile
    if (window.innerWidth < 1024) {
      requestAnimationFrame(() => {
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    }
    return () => {
      cancelled = true
    }
  }, [selectedId])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-orange-500" />
        <div>
          <h2 className="text-lg font-semibold text-white">Trainers</h2>
          <p className="text-sm text-zinc-400">
            Anyone who&apos;s signed off a skill. Network footprint, gyms, students.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-4 w-4 absolute left-2.5 top-3 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search trainer name or email…"
            className="bg-zinc-900 border-zinc-700 text-white pl-8"
          />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[200px] bg-zinc-900 border-zinc-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_460px]">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-zinc-500" />
              </div>
            ) : trainers.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No trainers yet</p>
                <p className="text-sm mt-1">
                  Trainers appear here as soon as they sign off a skill.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800 max-h-[70vh] overflow-y-auto">
                {trainers.map((t) => {
                  const isSel = selectedId === t.id
                  const name = t.display_name || t.full_name || t.email
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedId(t.id)}
                      className={`w-full text-left p-3 hover:bg-zinc-800/50 transition ${
                        isSel ? "bg-zinc-800/70" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm text-zinc-300 shrink-0">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white truncate">{name}</p>
                          <p className="text-xs text-zinc-500 truncate">{t.email}</p>
                          <div className="flex flex-wrap gap-3 text-xs text-zinc-400 mt-1">
                            <span className="inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> {t.total_signoffs}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-3 w-3" /> {t.students_touched}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="h-3 w-3" /> {t.gyms_taught_at}
                            </span>
                            {t.last_signoff_at && (
                              <span className="inline-flex items-center gap-1 text-zinc-500">
                                <Calendar className="h-3 w-3" />
                                {timeAgo(t.last_signoff_at)}
                              </span>
                            )}
                          </div>
                          {t.levels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {t.levels.map((lv) => (
                                <span
                                  key={lv}
                                  className="text-[10px] uppercase tracking-wider rounded-full px-1.5 py-0.5 border border-zinc-700 text-zinc-400"
                                >
                                  {lv}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div ref={detailRef}>
          <TrainerPanel passport={passport} loading={passportLoading} />
        </div>
      </div>
    </div>
  )
}

function TrainerPanel({
  passport,
  loading,
}: {
  passport: TrainerPassport | null
  loading: boolean
}) {
  if (loading) {
    return (
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-zinc-500" />
        </CardContent>
      </Card>
    )
  }
  if (!passport) {
    return (
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="text-center py-12 text-zinc-500">
          Pick a trainer to see their passport.
        </CardContent>
      </Card>
    )
  }

  const t = passport.trainer
  const name = t.display_name || t.full_name || t.email

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardContent className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center text-lg text-zinc-200">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-white">{name}</h3>
            <p className="text-xs text-zinc-500 truncate">{t.email}</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Joined {new Date(t.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Stat
            icon={CheckCircle2}
            label="Signoffs"
            value={passport.summary.total_signoffs}
          />
          <Stat icon={Users} label="Students" value={passport.summary.students_touched} />
          <Stat icon={Building2} label="Gyms" value={passport.summary.gyms_taught_at} />
          <Stat icon={Award} label="Certs issued" value={passport.summary.certs_issued} />
        </div>

        {passport.by_level.length > 0 && (
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">By level</p>
            <div className="space-y-1.5">
              {passport.by_level.map((row) => (
                <div
                  key={row.level}
                  className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-950 px-2.5 py-1.5"
                >
                  <span className="text-sm text-white capitalize">{row.level}</span>
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {row.signoffs}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" /> {row.students}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> {row.gyms}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {passport.gyms.length > 0 && (
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Gyms</p>
            <div className="flex flex-wrap gap-1.5">
              {passport.gyms.map((g) => (
                <span
                  key={g.org_id}
                  className="text-xs rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-zinc-300"
                  title={
                    g.role ? `${g.role}${g.signoffs ? ` · ${g.signoffs} signoffs` : ""}` : undefined
                  }
                >
                  {g.name}
                  {g.city && <span className="text-zinc-600">, {g.city}</span>}
                  {g.signoffs > 0 && <span className="text-zinc-600 ml-1">·{g.signoffs}</span>}
                  {g.role && (
                    <Badge
                      variant="outline"
                      className="ml-1 text-[10px] border-zinc-700 text-zinc-400"
                    >
                      {g.role}
                    </Badge>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {passport.recent_signoffs.length > 0 && (
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
              Recent signoffs
            </p>
            <div className="space-y-1">
              {passport.recent_signoffs.slice(0, 12).map((s) => (
                <div
                  key={s.id}
                  className="flex items-start gap-2 text-xs border-l-2 border-zinc-800 pl-2 py-0.5"
                >
                  <span className="text-zinc-500 font-mono shrink-0">
                    {new Date(s.signed_off_at).toLocaleDateString()}
                  </span>
                  <span className="text-zinc-300 min-w-0">
                    {s.student_name || "Anonymous"}
                    <span className="text-zinc-500"> · </span>
                    <span className="capitalize">{s.level}</span>
                    <span className="text-zinc-500">#{s.skill_index + 1}</span>
                    {s.org_name && <span className="text-zinc-600"> · {s.org_name}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {passport.certs.length > 0 && (
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
              Certificates issued
            </p>
            <div className="space-y-1">
              {passport.certs.slice(0, 10).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 text-xs border-l-2 border-orange-700/50 pl-2 py-0.5"
                >
                  <span className="text-zinc-500 font-mono shrink-0">
                    {new Date(c.issued_at).toLocaleDateString()}
                  </span>
                  <span className="text-zinc-300">
                    {c.student_name || "—"}
                    <span className="text-zinc-500"> · </span>
                    <span className="capitalize text-orange-400">{c.level}</span>
                    {c.certificate_number && (
                      <span className="text-zinc-600 ml-1">#{c.certificate_number}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CheckCircle2
  label: string
  value: number
}) {
  return (
    <div className="rounded border border-zinc-800 bg-zinc-950 p-2.5">
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="text-lg font-semibold text-white mt-0.5">{value}</p>
    </div>
  )
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const days = Math.floor(ms / 86400_000)
  if (days < 1) return "today"
  if (days === 1) return "1d ago"
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}
