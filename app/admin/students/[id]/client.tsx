"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle2,
  CreditCard,
  FileText,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Package as PackageIcon,
  Phone,
  Plus,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Student {
  id: string
  email: string
  full_name: string | null
  display_name: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string
}

interface Booking {
  id: string
  booking_date: string
  booking_time: string | null
  status: string
  payment_status: string
  payment_method: string | null
  payment_amount_thb: number | null
  payment_amount_usd: number | null
  service_name: string | null
  service_category: string | null
}

interface Credit {
  id: string
  credit_type: string
  credits_remaining: number
  expires_at: string | null
}

interface Transaction {
  id: string
  transaction_type: string
  credit_change: number | null
  amount_thb: number | null
  payment_method: string | null
  notes: string | null
  created_at: string
}

interface Note {
  id: string
  note: string
  created_at: string
  author: string | null
}

interface LadderLevel {
  id: string
  name: string
  number: number
  icon: string
  total_skills: number
  signed_off_here: number
  signed_off_anywhere: number
  earned_here: boolean
  certificate_number: string | null
  issued_at: string | null
  enrolled_here: boolean
  enrolled_at: string | null
  skills: Array<{
    index: number
    label: string
    signed_off_here: boolean
    signed_off_anywhere: boolean
  }>
}

interface RecentSignoff {
  id: string
  level: string
  skill_index: number
  skill_label: string
  notes: string | null
  signed_off_at: string
  signed_off_by: string | null
}

interface Stats {
  total_bookings: number
  completed_count: number
  no_show_count: number
  attendance_rate: number | null
  ltv_thb: number
  ltv_usd: number
  last_visit: string | null
  days_since_last_visit: number | null
  cross_network_signoffs: number
  gyms_visited: number
}

interface WaiverStatus {
  state: "no_waiver" | "signed_current" | "signed_outdated" | "unsigned"
  version: number | null
  signed_at: string | null
  signed_name: string | null
}

interface Props {
  orgRole: "owner" | "admin"
  student: Student
  bookings: Booking[]
  credits: Credit[]
  transactions: Transaction[]
  notes: Note[]
  ladder: LadderLevel[]
  recentSignoffs: RecentSignoff[]
  stats: Stats
  waiverStatus: WaiverStatus
}

function formatDateOnly(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatRelative(iso: string | null): string {
  if (!iso) return "—"
  const days = Math.floor(
    (Date.now() - new Date(iso).getTime()) / 86400_000,
  )
  if (days < 1) return "today"
  if (days === 1) return "1 day ago"
  if (days < 30) return `${days} days ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

function statusTone(status: string, paymentStatus: string): {
  label: string
  color: string
} {
  if (status === "no_show")
    return { label: "No-show", color: "bg-red-500/15 text-red-300 border-red-500/30" }
  if (status === "cancelled")
    return { label: "Cancelled", color: "bg-zinc-700 text-zinc-300 border-zinc-600" }
  if (status === "completed" && paymentStatus === "paid")
    return { label: "Completed · paid", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" }
  if (status === "completed")
    return { label: "Completed", color: "bg-amber-500/15 text-amber-300 border-amber-500/30" }
  if (paymentStatus === "paid")
    return { label: "Paid", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" }
  if (paymentStatus === "pending")
    return { label: "Pending payment", color: "bg-amber-500/15 text-amber-300 border-amber-500/30" }
  return { label: status, color: "bg-zinc-700 text-zinc-300 border-zinc-600" }
}

interface PackageRow {
  id: string
  name: string
  price_thb: number
  credit_count: number | null
  duration_days: number | null
  credit_type: string
}

export default function StudentProfileClient({
  orgRole: _orgRole,
  student,
  bookings,
  credits,
  transactions,
  notes,
  ladder,
  recentSignoffs,
  stats,
  waiverStatus,
}: Props) {
  const [newNote, setNewNote] = useState("")
  const [savingNote, setSavingNote] = useState(false)
  const [noteError, setNoteError] = useState<string | null>(null)
  const [localNotes, setLocalNotes] = useState<Note[]>(notes)

  // Package-sale state — load lazily when the operator opens the dropdown.
  const [packagesAvailable, setPackagesAvailable] = useState<PackageRow[]>([])
  const [packagesLoaded, setPackagesLoaded] = useState(false)
  const [selectedPackageId, setSelectedPackageId] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<string>("cash")
  const [selling, setSelling] = useState(false)
  const [saleError, setSaleError] = useState<string | null>(null)
  const [saleSuccess, setSaleSuccess] = useState<string | null>(null)

  async function loadPackages() {
    if (packagesLoaded) return
    try {
      const res = await fetch("/api/admin/packages", { cache: "no-store" })
      const data = await res.json()
      if (res.ok) {
        const active = ((data.packages as PackageRow[] & { is_active?: boolean }[]) ?? [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((p: any) => p.is_active !== false)
        setPackagesAvailable(active as PackageRow[])
      }
    } finally {
      setPackagesLoaded(true)
    }
  }

  async function sellPackage() {
    if (!selectedPackageId) return
    setSelling(true)
    setSaleError(null)
    setSaleSuccess(null)
    try {
      const res = await fetch(
        `/api/admin/students/${student.id}/buy-package`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            package_id: selectedPackageId,
            payment_method: paymentMethod,
          }),
        },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Sale failed")
      setSaleSuccess(`Sold "${data.package?.name ?? "package"}" — refresh to see new credits.`)
      setSelectedPackageId("")
    } catch (err) {
      setSaleError(err instanceof Error ? err.message : String(err))
    } finally {
      setSelling(false)
    }
  }

  const studentName = student.full_name || student.display_name || student.email
  const totalCredits = credits.reduce((s, c) => s + c.credits_remaining, 0)
  const currentJourney = ladder.find(
    (l) => l.enrolled_here && !l.earned_here,
  ) ??
    ladder.find((l) => !l.earned_here && l.signed_off_here > 0) ??
    ladder.filter((l) => l.earned_here).pop() ??
    null

  async function addNote() {
    if (!newNote.trim()) return
    setSavingNote(true)
    setNoteError(null)
    try {
      const res = await fetch(`/api/admin/students/${student.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to save note")
      const created = data.note ?? data
      setLocalNotes((prev) => [
        {
          id: created.id ?? `temp-${Date.now()}`,
          note: created.note ?? newNote.trim(),
          created_at: created.created_at ?? new Date().toISOString(),
          author: "you",
        },
        ...prev,
      ])
      setNewNote("")
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : "Failed")
    } finally {
      setSavingNote(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-inter antialiased">
      {/* Frosted header */}
      <header className="border-b border-zinc-900/80 bg-zinc-950/70 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-5 h-14 flex items-center gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-5 py-6 space-y-6">
        {/* Student summary */}
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 ring-1 ring-indigo-300/30 shadow-[0_4px_18px_-4px_rgba(99,102,241,0.5)] flex items-center justify-center text-[20px] font-semibold text-white shrink-0">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">{studentName}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-neutral-400">
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {student.email}
              </span>
              {student.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {student.phone}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                Member since {formatDateOnly(student.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick-stat grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard
            icon={CreditCard}
            label="LTV at this gym"
            value={`฿${stats.ltv_thb.toLocaleString()}`}
            sub={
              stats.ltv_usd > 0 ? `+ $${stats.ltv_usd.toLocaleString()}` : null
            }
            tone="emerald"
          />
          <StatCard
            icon={Calendar}
            label="Bookings"
            value={String(stats.total_bookings)}
            sub={`${stats.completed_count} completed`}
            tone="orange"
          />
          <StatCard
            icon={TrendingUp}
            label="Attendance"
            value={
              stats.attendance_rate != null
                ? `${stats.attendance_rate}%`
                : "—"
            }
            sub={
              stats.no_show_count > 0
                ? `${stats.no_show_count} no-show${stats.no_show_count === 1 ? "" : "s"}`
                : "no no-shows"
            }
            tone={
              stats.attendance_rate == null
                ? "neutral"
                : stats.attendance_rate >= 80
                  ? "emerald"
                  : stats.attendance_rate >= 50
                    ? "amber"
                    : "red"
            }
          />
          <StatCard
            icon={Calendar}
            label="Last visit"
            value={
              stats.last_visit ? formatRelative(stats.last_visit) : "Never"
            }
            sub={
              stats.days_since_last_visit != null &&
              stats.days_since_last_visit > 30
                ? "⚠️ over 30 days"
                : null
            }
            tone={
              stats.days_since_last_visit == null
                ? "neutral"
                : stats.days_since_last_visit > 30
                  ? "red"
                  : stats.days_since_last_visit > 14
                    ? "amber"
                    : "emerald"
            }
          />
          <StatCard
            icon={Award}
            label="Credits"
            value={String(totalCredits)}
            sub={
              credits.length > 1
                ? `${credits.length} types`
                : credits[0]?.credit_type ?? "no credits"
            }
            tone="amber"
          />
        </div>

        {/* Cross-network signal */}
        {stats.gyms_visited > 1 && (
          <Card className="border-blue-700/30 bg-blue-500/[0.04]">
            <CardContent className="p-3 flex items-center gap-3">
              <Globe className="h-5 w-5 text-blue-400 shrink-0" />
              <div className="text-sm text-blue-200">
                <strong>{studentName}</strong> trains across the network —{" "}
                {stats.gyms_visited} gyms, {stats.cross_network_signoffs}{" "}
                signoffs total.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liability waiver status — only renders if the gym has published one */}
        {waiverStatus.state !== "no_waiver" && (
          <WaiverStatusBanner status={waiverStatus} />
        )}

        {/* Cert journey */}
        <Card className="bg-neutral-900/50 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-300" />
              Cert journey
            </CardTitle>
            <CardDescription>
              Naga–Garuda progression. Green = signed off here · blue = signed
              off at another gym in the network · gold star = certificate
              issued here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentJourney && (
              <div className="rounded-lg ring-1 ring-indigo-500/25 bg-indigo-500/[0.06] p-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-2xl">{currentJourney.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-white">
                      Currently working on: {currentJourney.name}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {currentJourney.signed_off_here}/
                      {currentJourney.total_skills} skills signed off here
                      {currentJourney.signed_off_anywhere >
                        currentJourney.signed_off_here && (
                        <>
                          {" · "}
                          {currentJourney.signed_off_anywhere}/
                          {currentJourney.total_skills} including other gyms
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-400 transition-all"
                    style={{
                      width: `${Math.round(
                        (currentJourney.signed_off_here /
                          currentJourney.total_skills) *
                          100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {ladder.map((lvl) => {
                const pctHere = Math.round(
                  (lvl.signed_off_here / lvl.total_skills) * 100,
                )
                return (
                  <div
                    key={lvl.id}
                    className={`rounded-lg ring-1 p-2.5 text-center ${
                      lvl.earned_here
                        ? "ring-amber-500/30 bg-amber-500/[0.06]"
                        : lvl.enrolled_here
                          ? "ring-indigo-500/30 bg-indigo-500/[0.06]"
                          : lvl.signed_off_here > 0
                            ? "ring-zinc-800 bg-zinc-900/60"
                            : "ring-zinc-900 bg-zinc-900/30 opacity-60"
                    }`}
                  >
                    <div className="text-2xl mb-1">{lvl.icon}</div>
                    <p className="text-xs font-medium text-white">{lvl.name}</p>
                    {lvl.earned_here && (
                      <Badge className="mt-1 text-[9px] bg-amber-500/20 text-amber-300 border-amber-500/30">
                        ⭐ Earned
                      </Badge>
                    )}
                    {!lvl.earned_here && lvl.signed_off_here > 0 && (
                      <p className="text-[10px] text-neutral-400 mt-1">
                        {pctHere}% · {lvl.signed_off_here}/
                        {lvl.total_skills}
                      </p>
                    )}
                    {!lvl.earned_here &&
                      lvl.signed_off_here === 0 &&
                      lvl.signed_off_anywhere > 0 && (
                        <p className="text-[10px] text-blue-400 mt-1">
                          {lvl.signed_off_anywhere}/{lvl.total_skills}{" "}
                          elsewhere
                        </p>
                      )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Bookings + Notes side-by-side on desktop */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Booking history */}
          <Card className="bg-neutral-900/50 border-neutral-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">Booking history</CardTitle>
              <CardDescription>
                Last {Math.min(bookings.length, 30)} bookings at this gym.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {bookings.length === 0 ? (
                <p className="text-sm text-neutral-500 py-6 text-center">
                  No bookings at this gym yet.
                </p>
              ) : (
                bookings.map((b) => {
                  const tone = statusTone(b.status, b.payment_status)
                  return (
                    <div
                      key={b.id}
                      className="flex items-center justify-between gap-3 rounded-md px-3 py-2 bg-neutral-900 border border-neutral-800/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white truncate">
                          {b.service_name ?? "—"}
                          {b.booking_time && (
                            <span className="text-neutral-500 ml-1.5">
                              · {b.booking_time.slice(0, 5)}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {formatDateOnly(b.booking_date)}
                          {b.payment_amount_thb && b.payment_amount_thb > 0 && (
                            <>
                              {" · "}
                              ฿{b.payment_amount_thb.toLocaleString()}
                              {b.payment_method && ` · ${b.payment_method}`}
                            </>
                          )}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 ${tone.color}`}
                      >
                        {tone.label}
                      </Badge>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="bg-neutral-900/50 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Notes</CardTitle>
              <CardDescription>
                Internal notes — never shown to the student.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="e.g. Allergic to ice baths · prefers Pong as trainer · upcoming fight 12/Jan"
                  rows={3}
                  className="bg-neutral-800 border-neutral-700 text-white text-sm"
                />
                {noteError && (
                  <p className="text-xs text-red-400">{noteError}</p>
                )}
                <Button
                  size="sm"
                  onClick={addNote}
                  disabled={savingNote || !newNote.trim()}
                  className="bg-indigo-500 hover:bg-indigo-400 text-white w-full"
                >
                  {savingNote ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Add note
                </Button>
              </div>
              {localNotes.length === 0 ? (
                <p className="text-xs text-neutral-500 text-center py-3">
                  No notes yet.
                </p>
              ) : (
                <ul className="space-y-2 max-h-80 overflow-y-auto">
                  {localNotes.map((n) => (
                    <li
                      key={n.id}
                      className="rounded-md border border-neutral-800 bg-neutral-900 p-2.5"
                    >
                      <p className="text-sm text-white whitespace-pre-wrap">
                        {n.note}
                      </p>
                      <p className="text-[10px] text-neutral-500 mt-1">
                        {n.author ? `${n.author} · ` : ""}
                        {formatRelative(n.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent signoffs + Credits + Transactions */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-neutral-900/50 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Recent signoffs at this gym
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {recentSignoffs.length === 0 ? (
                <p className="text-sm text-neutral-500 py-3 text-center">
                  No signoffs yet.
                </p>
              ) : (
                recentSignoffs.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-start gap-2 text-sm py-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white truncate">
                        <span className="capitalize">{s.level}</span> #
                        {s.skill_index + 1} · {s.skill_label}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {s.signed_off_by ? `by ${s.signed_off_by} · ` : ""}
                        {formatRelative(s.signed_off_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-neutral-900/50 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-amber-400" />
                Credits & transactions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {credits.length === 0 ? (
                <p className="text-sm text-neutral-500 text-center py-2">
                  No credits.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {credits.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between text-sm border border-neutral-800 rounded-md px-3 py-2"
                    >
                      <span className="text-white capitalize">
                        {c.credit_type}
                      </span>
                      <span className="text-amber-400 font-mono">
                        {c.credits_remaining} left
                        {c.expires_at && (
                          <span className="text-[10px] text-neutral-500 ml-1.5">
                            · exp {formatDateOnly(c.expires_at)}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <hr className="border-neutral-800" />
              {/* Sell-package action — opens lazy. Operator picks a
                  package + payment method and ships the sale. */}
              <div className="space-y-2">
                <p className="text-xs text-neutral-500 uppercase tracking-wider inline-flex items-center gap-1.5">
                  <PackageIcon className="h-3 w-3" />
                  Sell a package
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={selectedPackageId}
                    onValueChange={setSelectedPackageId}
                    onOpenChange={(open) => open && loadPackages()}
                  >
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white text-xs h-9">
                      <SelectValue
                        placeholder={
                          packagesLoaded
                            ? packagesAvailable.length === 0
                              ? "No packages defined"
                              : "Pick a package"
                            : "Click to load packages"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-700 text-white">
                      {packagesAvailable.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-white">
                          {p.name} · ฿{p.price_thb.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-700 text-white">
                      <SelectItem value="cash" className="text-white">Cash</SelectItem>
                      <SelectItem value="card" className="text-white">Card</SelectItem>
                      <SelectItem value="stripe" className="text-white">Stripe</SelectItem>
                      <SelectItem value="bank_transfer" className="text-white">Bank transfer</SelectItem>
                      <SelectItem value="other" className="text-white">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  onClick={sellPackage}
                  disabled={selling || !selectedPackageId}
                  className="bg-orange-500 hover:bg-orange-400 text-white text-xs w-full"
                >
                  {selling ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <PackageIcon className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Sell + record payment
                </Button>
                {saleError && (
                  <p className="text-[11px] text-red-400">{saleError}</p>
                )}
                {saleSuccess && (
                  <p className="text-[11px] text-emerald-400">{saleSuccess}</p>
                )}
              </div>
              <hr className="border-neutral-800" />
              <p className="text-xs text-neutral-500 uppercase tracking-wider">
                Recent transactions
              </p>
              {transactions.length === 0 ? (
                <p className="text-sm text-neutral-500 text-center py-2">
                  No transactions.
                </p>
              ) : (
                <ul className="space-y-1 max-h-56 overflow-y-auto">
                  {transactions.map((t) => (
                    <li key={t.id} className="text-xs flex items-center justify-between gap-2 py-1">
                      <div className="min-w-0 flex-1">
                        <span className="text-white capitalize">
                          {t.transaction_type.replace(/_/g, " ")}
                        </span>
                        {t.notes && (
                          <span className="text-neutral-500 ml-1">· {t.notes}</span>
                        )}
                      </div>
                      <div className="text-right shrink-0 text-neutral-500">
                        {t.credit_change != null && (
                          <span
                            className={
                              t.credit_change > 0
                                ? "text-emerald-400"
                                : "text-red-400"
                            }
                          >
                            {t.credit_change > 0 ? "+" : ""}
                            {t.credit_change}
                          </span>
                        )}
                        {t.amount_thb != null && (
                          <span className="ml-2">฿{t.amount_thb.toLocaleString()}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

function WaiverStatusBanner({ status }: { status: WaiverStatus }) {
  if (status.state === "signed_current") {
    return (
      <Card className="border-emerald-700/30 bg-emerald-500/[0.04]">
        <CardContent className="p-3 flex items-center gap-3">
          <FileText className="h-5 w-5 text-emerald-400 shrink-0" />
          <div className="text-sm text-emerald-200 flex-1">
            <strong>Liability waiver signed</strong>
            {status.signed_name && (
              <span className="text-emerald-300/70">
                {" "}
                · &quot;{status.signed_name}&quot;
              </span>
            )}
            <span className="text-emerald-300/70">
              {" "}
              · v{status.version}
              {status.signed_at && ` · ${formatRelative(status.signed_at)}`}
            </span>
          </div>
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
        </CardContent>
      </Card>
    )
  }
  if (status.state === "signed_outdated") {
    return (
      <Card className="border-amber-700/30 bg-amber-500/[0.06]">
        <CardContent className="p-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
          <div className="text-sm text-amber-200 flex-1">
            <strong>Outdated waiver signature</strong>
            <span className="text-amber-300/70">
              {" "}
              · signed an older version
              {status.signed_at && ` ${formatRelative(status.signed_at)}`}
              {status.version != null &&
                ` · current is v${status.version}`}
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }
  // unsigned
  return (
    <Card className="border-red-700/30 bg-red-500/[0.06]">
      <CardContent className="p-3 flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
        <div className="text-sm text-red-200 flex-1">
          <strong>Liability waiver not signed</strong>
          <span className="text-red-300/70">
            {" "}
            · ask the student to sign before their first session
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof CheckCircle2
  label: string
  value: string
  sub: string | null
  tone: "emerald" | "orange" | "amber" | "red" | "neutral"
}) {
  const colors = {
    emerald: "text-emerald-400",
    orange: "text-indigo-300",
    amber: "text-amber-400",
    red: "text-red-400",
    neutral: "text-zinc-400",
  }
  const valueColor =
    tone === "neutral" ? "text-white" : colors[tone]
  return (
    <div className="rounded-xl ring-1 ring-zinc-900 bg-zinc-900/40 backdrop-blur-sm p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
        <Icon className={`h-3 w-3 ${colors[tone]}`} />
        {label}
      </div>
      <p className={`text-[20px] font-semibold tracking-tight tabular-nums ${valueColor} mt-1`}>
        {value}
      </p>
      {sub && (
        <p className="text-[10px] text-zinc-600 mt-0.5">{sub}</p>
      )}
    </div>
  )
}
