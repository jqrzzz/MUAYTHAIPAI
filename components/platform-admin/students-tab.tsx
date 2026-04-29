"use client"

import { useState, useEffect, useCallback } from "react"
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
  Award,
  CheckCircle2,
  Loader2,
  Users,
  MapPin,
  Calendar,
  Trophy,
  Lock,
} from "lucide-react"

interface StudentRow {
  id: string
  email: string
  full_name: string | null
  display_name: string | null
  avatar_url: string | null
  created_at: string
  total_signoffs: number
  gyms_visited: number
  levels_active: string[]
  total_certs: number
  cert_levels: string[]
  active_enrollments: number
  last_signoff_at: string | null
  last_cert_at: string | null
}

interface PassportLadderEntry {
  id: string
  name: string
  number: number
  icon: string
  total_skills: number
  signed_off: number
  gyms_with_signoffs: number
  earned: {
    id: string
    certificate_number: string | null
    issued_at: string
    org: { name?: string } | null
  } | null
  enrolled: boolean
  enrolled_at: string | null
  enrolled_at_org: string | null
}

interface PassportSignoff {
  id: string
  org_id: string
  org_name: string | null
  level: string
  skill_index: number
  notes: string | null
  signed_off_at: string
}

interface PassportCert {
  id: string
  org_id: string
  org_name: string | null
  level: string
  level_number: number | null
  certificate_number: string | null
  issued_at: string
  status: string
}

interface PassportGym {
  org_id: string
  name: string
  slug: string
  city: string | null
  signoffs: number
  role?: string
}

interface Passport {
  student: {
    id: string
    email: string
    full_name: string | null
    display_name: string | null
    avatar_url: string | null
    phone: string | null
    created_at: string
  }
  ladder: PassportLadderEntry[]
  gyms: PassportGym[]
  signoffs: PassportSignoff[]
  certs: PassportCert[]
}

const SORTS = [
  { value: "recent", label: "Most recent" },
  { value: "certs", label: "Certs earned" },
  { value: "signoffs", label: "Signoffs" },
  { value: "name", label: "Name" },
]

export default function StudentsTab() {
  const [students, setStudents] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("recent")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [passport, setPassport] = useState<Passport | null>(null)
  const [passportLoading, setPassportLoading] = useState(false)

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set("q", search.trim())
      if (sort) params.set("sort", sort)
      const res = await fetch(`/api/platform-admin/students?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setStudents(data.students || [])
      }
    } finally {
      setLoading(false)
    }
  }, [search, sort])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  useEffect(() => {
    if (!selectedId) {
      setPassport(null)
      return
    }
    let cancelled = false
    setPassportLoading(true)
    fetch(`/api/platform-admin/students/${selectedId}`)
      .then(async (res) => {
        const data = await res.json()
        if (!cancelled) {
          if (res.ok) setPassport(data)
          else setPassport(null)
        }
      })
      .finally(() => {
        if (!cancelled) setPassportLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedId])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-orange-500" />
        <div>
          <h2 className="text-lg font-semibold text-white">Students</h2>
          <p className="text-sm text-zinc-400">
            Network passport — every signoff and cert across every gym.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-4 w-4 absolute left-2.5 top-3 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="bg-zinc-900 border-zinc-700 text-white pl-8"
          />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-700 text-white">
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
            ) : students.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No students yet</p>
                <p className="text-sm mt-1">
                  Students appear here as soon as a gym admin starts signing off skills.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800 max-h-[70vh] overflow-y-auto">
                {students.map((s) => {
                  const isSelected = selectedId === s.id
                  const name = s.display_name || s.full_name || s.email
                  const last = s.last_signoff_at || s.last_cert_at
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedId(s.id)}
                      className={`w-full text-left p-3 hover:bg-zinc-800/50 transition ${
                        isSelected ? "bg-zinc-800/70" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm text-zinc-300 shrink-0">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-white truncate">{name}</p>
                            {s.total_certs > 0 && (
                              <Badge className="bg-orange-600 text-white text-xs gap-1">
                                <Trophy className="h-3 w-3" />
                                {s.total_certs}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 truncate">{s.email}</p>
                          <div className="flex flex-wrap gap-3 text-xs text-zinc-400 mt-1">
                            <span className="inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {s.total_signoffs} signoffs
                            </span>
                            {s.gyms_visited > 0 && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {s.gyms_visited} gym{s.gyms_visited === 1 ? "" : "s"}
                              </span>
                            )}
                            {last && (
                              <span className="inline-flex items-center gap-1 text-zinc-500">
                                <Calendar className="h-3 w-3" />
                                {timeAgo(last)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <PassportPanel passport={passport} loading={passportLoading} />
      </div>
    </div>
  )
}

function PassportPanel({
  passport,
  loading,
}: {
  passport: Passport | null
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
          Pick a student to see their passport.
        </CardContent>
      </Card>
    )
  }

  const s = passport.student
  const name = s.display_name || s.full_name || s.email

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardContent className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center text-lg text-zinc-200">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-white">{name}</h3>
            <p className="text-xs text-zinc-500 truncate">{s.email}</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Joined {new Date(s.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Cert ladder</p>
          <div className="space-y-1.5">
            {passport.ladder.map((lvl) => {
              const pct = lvl.total_skills
                ? Math.round((lvl.signed_off / lvl.total_skills) * 100)
                : 0
              const earned = !!lvl.earned
              return (
                <div
                  key={lvl.id}
                  className={`rounded border p-2.5 ${
                    earned
                      ? "border-orange-700/40 bg-orange-500/5"
                      : lvl.enrolled
                        ? "border-amber-700/40 bg-amber-500/5"
                        : "border-zinc-800 bg-zinc-950"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg shrink-0">{lvl.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-white">
                          {lvl.name}{" "}
                          <span className="text-zinc-500 font-mono text-xs">
                            (Lv.{lvl.number})
                          </span>
                        </p>
                        {earned ? (
                          <Badge className="bg-orange-600 text-white text-xs gap-1">
                            <Award className="h-3 w-3" />
                            Earned
                          </Badge>
                        ) : lvl.enrolled ? (
                          <Badge className="bg-amber-700 text-amber-100 text-xs">
                            Enrolled
                          </Badge>
                        ) : lvl.signed_off === 0 ? (
                          <Badge variant="outline" className="text-zinc-500 border-zinc-700 text-xs gap-1">
                            <Lock className="h-3 w-3" />
                            Locked
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1 flex-1 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className={`h-full ${earned ? "bg-orange-500" : "bg-amber-600"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-zinc-400 font-mono">
                          {lvl.signed_off}/{lvl.total_skills}
                        </span>
                      </div>
                      {earned ? (
                        <p className="text-xs text-zinc-500 mt-1">
                          {lvl.earned?.certificate_number} • issued{" "}
                          {new Date(lvl.earned!.issued_at).toLocaleDateString()}
                          {lvl.earned?.org?.name ? ` at ${lvl.earned.org.name}` : ""}
                        </p>
                      ) : lvl.enrolled && lvl.enrolled_at_org ? (
                        <p className="text-xs text-zinc-500 mt-1">
                          Enrolled at {lvl.enrolled_at_org}
                        </p>
                      ) : lvl.gyms_with_signoffs > 1 ? (
                        <p className="text-xs text-zinc-500 mt-1">
                          Signoffs across {lvl.gyms_with_signoffs} gyms
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {passport.gyms.length > 0 && (
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
              Gyms visited
            </p>
            <div className="flex flex-wrap gap-1.5">
              {passport.gyms.map((g) => (
                <span
                  key={g.org_id}
                  className="text-xs rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-zinc-300"
                  title={`${g.signoffs} signoffs${g.role ? ` · ${g.role}` : ""}`}
                >
                  {g.name}
                  {g.city ? <span className="text-zinc-600">, {g.city}</span> : null}
                  {g.signoffs > 0 && (
                    <span className="text-zinc-600 ml-1">·{g.signoffs}</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {passport.signoffs.length > 0 && (
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
              Recent signoffs
            </p>
            <div className="space-y-1">
              {passport.signoffs.slice(0, 10).map((so) => (
                <div
                  key={so.id}
                  className="flex items-start gap-2 text-xs border-l-2 border-zinc-800 pl-2 py-0.5"
                >
                  <span className="text-zinc-500 font-mono shrink-0">
                    {new Date(so.signed_off_at).toLocaleDateString()}
                  </span>
                  <span className="text-zinc-300">
                    <span className="capitalize">{so.level}</span>
                    {" • skill #"}
                    {so.skill_index + 1}
                    {so.org_name ? (
                      <span className="text-zinc-500"> at {so.org_name}</span>
                    ) : null}
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

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const days = Math.floor(ms / 86400_000)
  if (days < 1) return "today"
  if (days === 1) return "1d ago"
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}
