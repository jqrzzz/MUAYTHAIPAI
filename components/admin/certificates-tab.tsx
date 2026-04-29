"use client"

import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  UserPlus,
  MoreVertical,
  Eye,
  Sparkles,
} from "lucide-react"
import { CERTIFICATION_LEVELS } from "@/lib/certification-levels"
import BulkSignoffDialog from "./bulk-signoff-dialog"

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
  completed_at: string | null
  payment_status: string
  payment_amount_thb: number | null
  notes: string | null
  certificate_id: string | null
  users: { id: string; full_name: string | null; email: string } | null
}

interface SkillSignoff {
  skill_index: number
  signed_off_at: string
  trainer_name: string | null
  notes: string | null
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
  const [showEnrollDialog, setShowEnrollDialog] = useState(false)
  const [showBulkSignoff, setShowBulkSignoff] = useState(false)
  const [enrollForm, setEnrollForm] = useState({ student_email: "", level: "naga", notes: "" })
  const [enrolling, setEnrolling] = useState(false)
  const [showIssueCertDialog, setShowIssueCertDialog] = useState(false)
  const [issueCertForm, setIssueCertForm] = useState({ student_email: "", level: "naga", skip_skills_check: false })
  const [issuingCert, setIssuingCert] = useState(false)
  const [skillsDialog, setSkillsDialog] = useState<{ enrollment: Enrollment } | null>(null)
  const [skills, setSkills] = useState<SkillSignoff[]>([])
  const [loadingSkills, setLoadingSkills] = useState(false)
  const [enrollmentMenu, setEnrollmentMenu] = useState<string | null>(null)

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
        setCertificates((prev: Certificate[]) =>
          prev.map((c: Certificate) => (c.id === certId ? { ...c, status: newStatus } : c))
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

  const handleEnrollStudent = async () => {
    if (!enrollForm.student_email || !enrollForm.level) return
    setEnrolling(true)
    try {
      const res = await fetch("/api/admin/certificates/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enrollForm),
      })
      const data = await res.json()
      if (res.ok) {
        setFeedback({ type: "success", message: "Student enrolled successfully" })
        setShowEnrollDialog(false)
        setEnrollForm({ student_email: "", level: "naga", notes: "" })
        fetchData()
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to enroll" })
      }
    } catch {
      setFeedback({ type: "error", message: "Connection error" })
    }
    setEnrolling(false)
  }

  const handleIssueCert = async () => {
    if (!issueCertForm.student_email || !issueCertForm.level) return
    setIssuingCert(true)
    try {
      const res = await fetch("/api/admin/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(issueCertForm),
      })
      const data = await res.json()
      if (res.ok) {
        setFeedback({ type: "success", message: `Certificate issued: ${data.certificate?.certificate_number}` })
        setShowIssueCertDialog(false)
        setIssueCertForm({ student_email: "", level: "naga", skip_skills_check: false })
        fetchData()
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to issue certificate" })
      }
    } catch {
      setFeedback({ type: "error", message: "Connection error" })
    }
    setIssuingCert(false)
  }

  const handleUpdateEnrollment = async (enrollmentId: string, updates: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/admin/certificates/enrollments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollment_id: enrollmentId, ...updates }),
      })
      if (res.ok) {
        setFeedback({ type: "success", message: "Enrollment updated" })
        setEnrollmentMenu(null)
        fetchData()
      } else {
        const data = await res.json()
        setFeedback({ type: "error", message: data.error || "Failed" })
      }
    } catch {
      setFeedback({ type: "error", message: "Connection error" })
    }
  }

  const handleViewSkills = async (enrollment: Enrollment) => {
    setSkillsDialog({ enrollment })
    setLoadingSkills(true)
    setSkills([])
    try {
      const res = await fetch(
        `/api/admin/certificates/skills?student_id=${enrollment.users?.id}&level=${enrollment.level}`
      )
      if (res.ok) {
        const data = await res.json()
        const signoffs: SkillSignoff[] = (data.skills || [])
          .filter((s: { signedOff: boolean }) => s.signedOff)
          .map((s: { index: number; signedOffAt: string; notes: string | null }) => ({
            skill_index: s.index,
            signed_off_at: s.signedOffAt,
            trainer_name: null,
            notes: s.notes,
          }))
        setSkills(signoffs)
      }
    } catch {
      // silent
    }
    setLoadingSkills(false)
  }

  const filtered = certificates.filter((c: Certificate) => {
    const matchesSearch =
      !search ||
      c.users?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.users?.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.certificate_number.toLowerCase().includes(search.toLowerCase())
    const matchesLevel = filterLevel === "all" || c.level === filterLevel
    return matchesSearch && matchesLevel
  })

  const activeEnrollments = enrollments.filter((e: Enrollment) => e.status === "active")

  const stats = {
    total: certificates.filter((c: Certificate) => c.status === "active").length,
    byLevel: CERTIFICATION_LEVELS.map((l) => ({
      ...l,
      count: certificates.filter((c: Certificate) => c.level === l.id && c.status === "active").length,
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

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setShowEnrollDialog(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Enroll Student
        </button>
        <button
          onClick={() => setShowBulkSignoff(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium border border-orange-500/40 transition-colors"
          title="Sign off the same skill for many students at once"
        >
          <Sparkles className="w-4 h-4 text-orange-400" />
          Bulk signoff
        </button>
        {isOwnerOrAdmin && (
          <button
            onClick={() => setShowIssueCertDialog(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium border border-neutral-700 transition-colors"
          >
            <Award className="w-4 h-4" />
            Issue Certificate
          </button>
        )}
      </div>

      {/* Active Enrollments */}
      {activeEnrollments.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-neutral-400 mb-3">Currently Enrolled ({activeEnrollments.length})</h3>
          <div className="grid gap-2">
            {activeEnrollments.map((e: Enrollment) => {
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
                  <button
                    onClick={() => handleViewSkills(e)}
                    className="text-xs text-neutral-400 hover:text-orange-400 transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Skills
                  </button>
                  <Badge className={`text-[10px] ${
                    e.payment_status === "paid"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                  }`}>
                    {e.payment_status}
                  </Badge>
                  {isOwnerOrAdmin && (
                    <div className="relative">
                      <button
                        onClick={() => setEnrollmentMenu(enrollmentMenu === e.id ? null : e.id)}
                        className="p-1 text-neutral-500 hover:text-neutral-300 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {enrollmentMenu === e.id && (
                        <div className="absolute right-0 top-8 z-10 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg py-1 min-w-[140px]">
                          {e.payment_status !== "paid" && (
                            <button
                              onClick={() => handleUpdateEnrollment(e.id, { payment_status: "paid" })}
                              className="w-full text-left px-3 py-2 text-xs text-white hover:bg-neutral-700 transition-colors"
                            >
                              Mark Paid
                            </button>
                          )}
                          <button
                            onClick={() => handleUpdateEnrollment(e.id, { status: "cancelled" })}
                            className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-neutral-700 transition-colors"
                          >
                            Cancel Enrollment
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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
            {filtered.map((cert: Certificate) => {
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
      {/* Enroll Student Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent className="bg-neutral-900 border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-white">Enroll Student in Certification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-neutral-400 block mb-1">Student Email</label>
              <input
                type="email"
                value={enrollForm.student_email}
                onChange={(e) => setEnrollForm((f: typeof enrollForm) => ({ ...f, student_email: e.target.value }))}
                placeholder="student@example.com"
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1">Certification Level</label>
              <select
                value={enrollForm.level}
                onChange={(e) => setEnrollForm((f: typeof enrollForm) => ({ ...f, level: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-orange-500"
              >
                {CERTIFICATION_LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>{l.icon} {l.name} (Level {l.number})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1">Notes (optional)</label>
              <input
                type="text"
                value={enrollForm.notes}
                onChange={(e) => setEnrollForm((f: typeof enrollForm) => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Walk-in enrollment"
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500"
              />
            </div>
            <button
              onClick={handleEnrollStudent}
              disabled={enrolling || !enrollForm.student_email}
              className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Enroll Student
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Issue Certificate Dialog */}
      <Dialog open={showIssueCertDialog} onOpenChange={setShowIssueCertDialog}>
        <DialogContent className="bg-neutral-900 border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-white">Issue Certificate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-neutral-400 block mb-1">Student Email</label>
              <input
                type="email"
                value={issueCertForm.student_email}
                onChange={(e) => setIssueCertForm((f: typeof issueCertForm) => ({ ...f, student_email: e.target.value }))}
                placeholder="student@example.com"
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1">Certification Level</label>
              <select
                value={issueCertForm.level}
                onChange={(e) => setIssueCertForm((f: typeof issueCertForm) => ({ ...f, level: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-orange-500"
              >
                {CERTIFICATION_LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>{l.icon} {l.name} (Level {l.number})</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={issueCertForm.skip_skills_check}
                onChange={(e) => setIssueCertForm((f: typeof issueCertForm) => ({ ...f, skip_skills_check: e.target.checked }))}
                className="rounded border-neutral-600 bg-neutral-800 text-orange-500 focus:ring-orange-500"
              />
              Skip skill requirements check
            </label>
            <p className="text-[11px] text-neutral-500 -mt-2">
              The API enforces level progression and minimum wait times. Enable the checkbox to bypass skill signoff requirements.
            </p>
            <button
              onClick={handleIssueCert}
              disabled={issuingCert || !issueCertForm.student_email}
              className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {issuingCert ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
              Issue Certificate
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Skills Progress Dialog */}
      <Dialog open={!!skillsDialog} onOpenChange={() => setSkillsDialog(null)}>
        <DialogContent className="bg-neutral-900 border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              Skill Progress — {skillsDialog?.enrollment.users?.full_name || skillsDialog?.enrollment.users?.email}
            </DialogTitle>
          </DialogHeader>
          {loadingSkills ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="space-y-2 pt-2 max-h-80 overflow-y-auto">
              {(() => {
                const level = CERTIFICATION_LEVELS.find((l) => l.id === skillsDialog?.enrollment.level)
                if (!level) return <p className="text-sm text-neutral-500">Level not found</p>
                const signedSet = new Set(skills.map((s: SkillSignoff) => s.skill_index))
                return level.skills.map((skillName, idx) => {
                  const signoff = skills.find((s: SkillSignoff) => s.skill_index === idx)
                  return (
                    <div key={idx} className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                      signedSet.has(idx) ? "border-emerald-500/30 bg-emerald-500/5" : "border-neutral-800 bg-neutral-800/30"
                    }`}>
                      {signedSet.has(idx) ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-neutral-600 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">{skillName}</p>
                        {signoff && (
                          <p className="text-[11px] text-neutral-500">
                            Signed off {new Date(signoff.signed_off_at).toLocaleDateString()}
                            {signoff.notes && ` — ${signoff.notes}`}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })
              })()}
              <div className="pt-2 text-xs text-neutral-500 text-center">
                {skills.length} / {CERTIFICATION_LEVELS.find((l) => l.id === skillsDialog?.enrollment.level)?.skills.length || 0} skills signed off
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BulkSignoffDialog
        open={showBulkSignoff}
        onOpenChange={setShowBulkSignoff}
        enrollments={enrollments}
        onSuccess={fetchData}
      />
    </div>
  )
}
