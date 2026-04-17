"use client"

import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Award,
  Loader2,
  Search,
  XCircle,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react"
import { CERTIFICATION_LEVELS } from "@/lib/certification-levels"

interface Certificate {
  id: string
  level: string
  level_number: number
  certificate_number: string
  status: string
  issued_at: string
  users: { full_name: string | null; email: string } | null
  issued_by_trainer: { display_name: string } | null
}

interface Enrollment {
  id: string
  level: string
  status: string
  enrolled_at: string
  payment_status: string
  payment_amount_thb: number | null
  users: { full_name: string | null; email: string } | null
}

const LEVEL_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  naga: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  "phayra-nak": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  singha: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  hanuman: { bg: "bg-slate-500/10", text: "text-slate-300", border: "border-slate-500/30" },
  garuda: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30" },
}

export default function CertificatesTab({ role }: { role: string }) {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterLevel, setFilterLevel] = useState<string>("all")
  const [expandedCert, setExpandedCert] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [certsRes, enrollmentsRes] = await Promise.all([
        fetch("/api/admin/certificates"),
        fetch("/api/admin/certificates/enrollments"),
      ])
      if (certsRes.ok) {
        const data = await certsRes.json()
        setCertificates(data.certificates || [])
      }
      if (enrollmentsRes.ok) {
        const data = await enrollmentsRes.json()
        setEnrollments(data.enrollments || [])
      }
    } catch {
      // silent
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000)
      return () => clearTimeout(t)
    }
  }, [feedback])

  const handleRevoke = async (certId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "revoked" : "active"
    setRevoking(certId)
    try {
      const res = await fetch("/api/admin/certificates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificate_id: certId, status: newStatus }),
      })
      if (res.ok) {
        setCertificates((prev) =>
          prev.map((c) => (c.id === certId ? { ...c, status: newStatus } : c))
        )
        setFeedback({ type: "success", message: `Certificate ${newStatus === "revoked" ? "revoked" : "reinstated"}` })
      } else {
        const data = await res.json()
        setFeedback({ type: "error", message: data.error || "Failed" })
      }
    } catch {
      setFeedback({ type: "error", message: "Connection error" })
    }
    setRevoking(null)
  }

  const filtered = certificates.filter((c) => {
    const matchesSearch =
      !search ||
      c.users?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.users?.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.certificate_number.toLowerCase().includes(search.toLowerCase())
    const matchesLevel = filterLevel === "all" || c.level === filterLevel
    return matchesSearch && matchesLevel
  })

  const activeEnrollments = enrollments.filter((e) => e.status === "active")

  const stats = {
    total: certificates.filter((c) => c.status === "active").length,
    byLevel: CERTIFICATION_LEVELS.map((l) => ({
      ...l,
      count: certificates.filter((c) => c.level === l.id && c.status === "active").length,
    })),
    enrolledCount: activeEnrollments.length,
  }

  const isOwnerOrAdmin = ["owner", "admin"].includes(role)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <div className={`rounded-lg px-4 py-3 text-sm ${
          feedback.type === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
        }`}>
          {feedback.message}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-neutral-900/50 border-neutral-800">
          <CardContent className="p-4">
            <p className="text-xs text-neutral-500">Active Certificates</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900/50 border-neutral-800">
          <CardContent className="p-4">
            <p className="text-xs text-neutral-500">Enrolled Students</p>
            <p className="text-2xl font-bold text-orange-400">{stats.enrolledCount}</p>
          </CardContent>
        </Card>
        {stats.byLevel.filter((l) => l.count > 0).slice(0, 2).map((l) => (
          <Card key={l.id} className="bg-neutral-900/50 border-neutral-800">
            <CardContent className="p-4">
              <p className="text-xs text-neutral-500">{l.icon} {l.name}</p>
              <p className="text-2xl font-bold text-white">{l.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Level breakdown */}
      <div className="flex gap-2 flex-wrap">
        {stats.byLevel.map((l) => {
          const style = LEVEL_STYLES[l.id] || LEVEL_STYLES.naga
          return (
            <button
              key={l.id}
              onClick={() => setFilterLevel(filterLevel === l.id ? "all" : l.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filterLevel === l.id
                  ? `${style.bg} ${style.text} ${style.border}`
                  : "bg-neutral-800/50 text-neutral-400 border-neutral-700 hover:border-neutral-600"
              }`}
            >
              {l.icon} {l.name} ({l.count})
            </button>
          )
        })}
      </div>

      {/* Active Enrollments */}
      {activeEnrollments.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-neutral-400 mb-3">Currently Enrolled ({activeEnrollments.length})</h3>
          <div className="grid gap-2">
            {activeEnrollments.map((e) => {
              const level = CERTIFICATION_LEVELS.find((l) => l.id === e.level)
              const style = LEVEL_STYLES[e.level] || LEVEL_STYLES.naga
              return (
                <div key={e.id} className={`flex items-center gap-3 p-3 rounded-lg border ${style.border} ${style.bg}`}>
                  <span className="text-lg">{level?.icon || "🥊"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {e.users?.full_name || e.users?.email || "—"}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {level?.name} &middot; Enrolled {new Date(e.enrolled_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={`text-[10px] ${
                    e.payment_status === "paid"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                  }`}>
                    {e.payment_status}
                  </Badge>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Certificates List */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-sm font-medium text-neutral-400">Issued Certificates ({filtered.length})</h3>
          <div className="flex-1" />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search name, email, cert #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 w-48 md:w-64"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card className="bg-neutral-900/30 border-neutral-800 border-dashed">
            <CardContent className="p-8 text-center">
              <Award className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-400 text-sm">
                {search || filterLevel !== "all" ? "No certificates match your filters" : "No certificates issued yet"}
              </p>
              <p className="text-neutral-600 text-xs mt-1">Issue certificates from the Trainer Dashboard</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((cert) => {
              const level = CERTIFICATION_LEVELS.find((l) => l.id === cert.level)
              const style = LEVEL_STYLES[cert.level] || LEVEL_STYLES.naga
              const expanded = expandedCert === cert.id
              return (
                <div
                  key={cert.id}
                  className={`rounded-lg border transition-colors ${
                    cert.status === "revoked"
                      ? "border-red-500/20 bg-red-500/5"
                      : `${style.border} bg-neutral-900/50`
                  }`}
                >
                  <button
                    onClick={() => setExpandedCert(expanded ? null : cert.id)}
                    className="w-full flex items-center gap-3 p-3 text-left"
                  >
                    <span className="text-xl shrink-0">{level?.icon || "🥊"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">
                          {cert.users?.full_name || cert.users?.email || "—"}
                        </span>
                        {cert.status === "revoked" && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">Revoked</Badge>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500">
                        {level?.name} (Level {cert.level_number}) &middot; {new Date(cert.issued_at).toLocaleDateString()}
                      </p>
                    </div>
                    <code className="hidden md:block text-[10px] text-neutral-600 font-mono">{cert.certificate_number}</code>
                    {expanded ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
                  </button>

                  {expanded && (
                    <div className="px-3 pb-3 pt-0 border-t border-neutral-800/50 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-xs pt-3">
                        <div>
                          <span className="text-neutral-500">Student</span>
                          <p className="text-white">{cert.users?.full_name || "—"}</p>
                          <p className="text-neutral-500">{cert.users?.email}</p>
                        </div>
                        <div>
                          <span className="text-neutral-500">Issued by</span>
                          <p className="text-white">{cert.issued_by_trainer?.display_name || "Staff"}</p>
                        </div>
                        <div>
                          <span className="text-neutral-500">Certificate #</span>
                          <p className="text-white font-mono">{cert.certificate_number}</p>
                        </div>
                        <div>
                          <span className="text-neutral-500">Date</span>
                          <p className="text-white">
                            {new Date(cert.issued_at).toLocaleDateString("en-US", {
                              year: "numeric", month: "long", day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={`/verify/${cert.certificate_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Certificate
                        </a>
                        {isOwnerOrAdmin && (
                          <button
                            onClick={() => handleRevoke(cert.id, cert.status)}
                            disabled={revoking === cert.id}
                            className={`ml-auto flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                              cert.status === "active"
                                ? "text-red-400 hover:bg-red-500/10"
                                : "text-emerald-400 hover:bg-emerald-500/10"
                            }`}
                          >
                            {revoking === cert.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : cert.status === "active" ? (
                              <><AlertTriangle className="w-3 h-3" /> Revoke</>
                            ) : (
                              <><CheckCircle className="w-3 h-3" /> Reinstate</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
