"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Building2,
  Users,
  Calendar,
  CreditCard,
  Shield,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  LogOut,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  FileText,
  Check,
  Send,
  Loader2,
  BookOpen,
  Sparkles,
  Map,
  GraduationCap,
  UserCheck,
  Megaphone,
  TrendingUp,
  Receipt,
  LifeBuoy,
  Activity,
  Bell,
  Menu,
  Wallet,
  ExternalLink,
} from "lucide-react"
import CurriculumTab from "@/components/platform-admin/curriculum-tab"
import AdoptionTab from "@/components/platform-admin/adoption-tab"
import BookingsTab from "@/components/platform-admin/bookings-tab"
import SubscriptionsTab from "@/components/platform-admin/subscriptions-tab"
import SupportTab from "@/components/platform-admin/support-tab"
import AuditLogTab from "@/components/platform-admin/audit-log-tab"
import { GlobalSearchButton } from "@/components/platform-admin/global-search"
import PlatformCommandBar from "@/components/platform-admin/command-bar"
import NetworkTab from "@/components/platform-admin/network-tab"
import StudentsTab from "@/components/platform-admin/students-tab"
import TrainersTab from "@/components/platform-admin/trainers-tab"
import TodayPanel from "@/components/platform-admin/today-panel"
import CampaignsTab from "@/components/platform-admin/campaigns-tab"
import HealthCard from "@/components/platform-admin/health-card"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { PLAN } from "@/lib/ockock/product"

interface GymPayout {
  gym: {
    id: string
    name: string
    slug: string
    subscriptionStatus: string
  }
  bookings: Array<{
    id: string
    customerName: string
    service: string
    amountUsd: number
    commissionUsd: number
    date: string
  }>
  summary: {
    bookingCount: number
    totalCollectedUsd: number
    commissionUsd: number
    amountOwedUsd: number
  }
  payout: {
    id: string
    status: string
    paidAt: string
    exchangeRate: number
    amountThb: number
  } | null
}

interface PayoutData {
  period: {
    type: string
    start: string
    end: string
    label: string
  }
  gyms: GymPayout[]
  totals: {
    totalCollectedUsd: number
    totalCommissionUsd: number
    totalOwedUsd: number
    totalBookings: number
    gymCount: number
  }
}

interface Gym {
  id: string
  name: string
  slug: string
  city: string
  province: string
  email: string
  status: string
  created_at: string
  gym_subscriptions: {
    status: string
    trial_ends_at: string
    price_thb: number
    current_period_end: string
  } | null
  org_members: Array<{
    user_id: string
    role: string
    users: { full_name: string; email: string }
  }>
}

interface BlacklistEntry {
  id: string
  name: string
  photo_url: string | null
  nationality: string | null
  description: string
  created_at: string
  organizations: { name: string } | null
  blacklist_comments: Array<{
    id: string
    comment: string
    created_at: string
    organizations: { name: string }
  }>
}

interface Props {
  gyms: Gym[]
  blacklist: BlacklistEntry[]
  stats: {
    totalGyms: number
    totalCustomers: number
    totalBookings: number
    activeSubscriptions: number
  }
  /** "partner" hides the money/billing surfaces (payouts, subscriptions, bookings revenue, the OckOck assistant, the gym subscription toggle). */
  role?: "full" | "partner"
}

export default function PlatformAdminClient({ gyms, blacklist, stats, role = "full" }: Props) {
  const isPartner = role === "partner"
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "gyms"
    | "payouts"
    | "blacklist"
    | "ockock"
    | "courses"
    | "command"
    | "network"
    | "students"
    | "trainers"
    | "campaigns"
    | "adoption"
    | "bookings"
    | "subscriptions"
    | "support"
    | "audit"
  >("overview")
  const [showAddGym, setShowAddGym] = useState(false)
  const [showAddBlacklist, setShowAddBlacklist] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Add gym form
  const [gymForm, setGymForm] = useState({
    name: "",
    slug: "",
    city: "",
    province: "",
    ownerEmail: "",
    ownerName: "",
  })

  // Blacklist form
  const [blacklistForm, setBlacklistForm] = useState({
    name: "",
    nationality: "",
    description: "",
  })

  // OckOck chat state
  const [ockockMessages, setOckockMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])
  const [ockockInput, setOckockInput] = useState("")
  const [ockockLoading, setOckockLoading] = useState(false)
  const [copiedStatementGymId, setCopiedStatementGymId] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [payoutPeriod, setPayoutPeriod] = useState<"week" | "month">("month")
  const [payoutDate, setPayoutDate] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })
  const [payoutData, setPayoutData] = useState<PayoutData | null>(null)
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [selectedGymPayout, setSelectedGymPayout] = useState<GymPayout | null>(null)
  const [showMarkPaid, setShowMarkPaid] = useState(false)
  // Subscription cancellation — captured reason flows to the audit log
  // via /api/platform-admin/subscriptions/cancel, which also tells Stripe.
  const [cancelTarget, setCancelTarget] = useState<{ gymId: string; gymName: string } | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [exchangeRate, setExchangeRate] = useState("35.0")
  const [payoutNotes, setPayoutNotes] = useState("")

  const [subscriptionLoading, setSubscriptionLoading] = useState<string | null>(null)

  // Per-gym notification settings editor — lets an operator set a gym's
  // booking-alert email without the "View as gym admin" detour.
  const [settingsTarget, setSettingsTarget] = useState<{ gymId: string; gymName: string } | null>(null)
  const [settingsEmail, setSettingsEmail] = useState("")
  const [settingsNotify, setSettingsNotify] = useState(true)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null)

  useEffect(() => {
    if (activeTab === "payouts") {
      fetchPayouts()
    }
  }, [activeTab, payoutPeriod, payoutDate])

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [ockockMessages])

  const fetchPayouts = async () => {
    setPayoutLoading(true)
    try {
      const res = await fetch(`/api/platform-admin/payouts?period=${payoutPeriod}&date=${payoutDate}`)
      if (res.ok) {
        const data = await res.json()
        setPayoutData(data)
      }
    } catch (error) {
      console.error("Error fetching payouts:", error)
    }
    setPayoutLoading(false)
  }

  const openGymSettings = async (gymId: string, gymName: string) => {
    setSettingsTarget({ gymId, gymName })
    setSettingsMsg(null)
    setSettingsEmail("")
    setSettingsNotify(true)
    setSettingsLoading(true)
    try {
      const res = await fetch(`/api/platform-admin/gyms/${gymId}/settings`)
      if (res.ok) {
        const d = await res.json()
        setSettingsEmail(d.notification_email || "")
        setSettingsNotify(d.notify_on_booking_email !== false)
      }
    } catch {
      /* leave defaults; the save still works */
    } finally {
      setSettingsLoading(false)
    }
  }

  const saveGymSettings = async () => {
    if (!settingsTarget) return
    setSettingsSaving(true)
    setSettingsMsg(null)
    try {
      const res = await fetch(`/api/platform-admin/gyms/${settingsTarget.gymId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notification_email: settingsEmail.trim(),
          notify_on_booking_email: settingsNotify,
        }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Couldn't save")
      }
      setSettingsMsg("Saved")
      setTimeout(() => setSettingsTarget(null), 800)
    } catch (e) {
      setSettingsMsg(e instanceof Error ? e.message : "Couldn't save")
    } finally {
      setSettingsSaving(false)
    }
  }

  const handlePeriodNav = (direction: "prev" | "next") => {
    if (payoutPeriod === "month") {
      const [year, month] = payoutDate.split("-").map(Number)
      const date = new Date(year, month - 1 + (direction === "next" ? 1 : -1), 1)
      setPayoutDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`)
    } else {
      // Week navigation
      const match = payoutDate.match(/^(\d{4})-W(\d{2})$/)
      if (match) {
        let [, year, week] = match.map(Number)
        week += direction === "next" ? 1 : -1
        if (week < 1) {
          year--
          week = 52
        } else if (week > 52) {
          year++
          week = 1
        }
        setPayoutDate(`${year}-W${String(week).padStart(2, "0")}`)
      } else {
        // Initialize week format
        const now = new Date()
        const startOfYear = new Date(now.getFullYear(), 0, 1)
        const weekNum = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
        setPayoutDate(`${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`)
      }
    }
  }

  const handleMarkPaid = async () => {
    if (!selectedGymPayout || !payoutData) return
    setLoading(true)
    try {
      const rate = Number.parseFloat(exchangeRate)
      const amountThb = Math.round(selectedGymPayout.summary.amountOwedUsd * rate)

      const res = await fetch("/api/platform-admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: selectedGymPayout.gym.id,
          periodStart: payoutData.period.start,
          periodEnd: payoutData.period.end,
          amountUsd: selectedGymPayout.summary.amountOwedUsd,
          commissionUsd: selectedGymPayout.summary.commissionUsd,
          exchangeRate: rate,
          amountThb,
          notes: payoutNotes,
        }),
      })

      if (res.ok) {
        setShowMarkPaid(false)
        setSelectedGymPayout(null)
        setPayoutNotes("")
        fetchPayouts()
      }
    } catch (error) {
      console.error("Error marking paid:", error)
    }
    setLoading(false)
  }

  const generateStatement = (gymPayout: GymPayout) => {
    if (!payoutData) return ""
    const rate = Number.parseFloat(exchangeRate)
    const thbAmount = Math.round(gymPayout.summary.amountOwedUsd * rate)

    let statement = `${gymPayout.gym.name} - ${payoutData.period.label} Statement\n`
    statement += `${"=".repeat(50)}\n\n`
    statement += `Online Bookings: ${gymPayout.summary.bookingCount}\n`
    statement += `Total Collected: $${gymPayout.summary.totalCollectedUsd.toFixed(2)} USD\n`
    statement += `Platform Commission (15%): $${gymPayout.summary.commissionUsd.toFixed(2)} USD\n`
    statement += `Amount Due: $${gymPayout.summary.amountOwedUsd.toFixed(2)} USD\n`
    statement += `Exchange Rate: ${rate}\n`
    statement += `THB Amount: ฿${thbAmount.toLocaleString()}\n\n`
    statement += `Booking Details:\n`
    statement += `${"-".repeat(50)}\n`

    gymPayout.bookings.forEach((b) => {
      const date = new Date(b.date).toLocaleDateString()
      statement += `${date}: ${b.customerName} - ${b.service} - $${b.amountUsd?.toFixed(2) || "0.00"} (commission $${b.commissionUsd?.toFixed(2) || "0.00"})\n`
    })

    return statement
  }

  const copyStatement = async (gymPayout: GymPayout) => {
    const statement = generateStatement(gymPayout)
    try {
      await navigator.clipboard.writeText(statement)
      // Per-row "Copied" state with a short timeout so the button can
      // flip back to its normal label. No alert popup.
      setCopiedStatementGymId(gymPayout.gym.id)
      setTimeout(() => setCopiedStatementGymId(null), 2500)
    } catch {
      // Clipboard denied (rare on https) — silent; the user will retry.
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
  }

  const handleAddGym = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/platform-admin/gyms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gymForm),
      })

      if (res.ok) {
        setShowAddGym(false)
        setGymForm({ name: "", slug: "", city: "", province: "", ownerEmail: "", ownerName: "" })
        router.refresh()
      }
    } catch (error) {
      console.error("Error adding gym:", error)
    }
    setLoading(false)
  }

  const handleAddBlacklist = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/platform-admin/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(blacklistForm),
      })

      if (res.ok) {
        setShowAddBlacklist(false)
        setBlacklistForm({ name: "", nationality: "", description: "" })
        router.refresh()
      }
    } catch (error) {
      console.error("Error adding to blacklist:", error)
    }
    setLoading(false)
  }

  // OckOck chat function
  const sendOckockMessage = async () => {
    if (!ockockInput.trim() || ockockLoading) return

    const userMessage = ockockInput.trim()
    setOckockInput("")
    setOckockMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setOckockLoading(true)

    try {
      const res = await fetch("/api/platform-admin/ockock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      })

      if (res.ok) {
        const data = await res.json()
        setOckockMessages((prev) => [...prev, { role: "assistant", content: data.response }])
      } else {
        setOckockMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, I had trouble processing that. Try again?" },
        ])
      }
    } catch (error) {
      setOckockMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection issue. Check your internet and try again." },
      ])
    }

    setOckockLoading(false)
  }

  // Add function to toggle subscription
  const toggleSubscription = async (gymId: string, newStatus: "active" | "inactive") => {
    setSubscriptionLoading(gymId)
    try {
      const res = await fetch("/api/platform-admin/gyms/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gymId, status: newStatus }),
      })
      if (res.ok) {
        router.refresh() // Refresh to get updated gym data
      }
    } catch (error) {
      console.error("Error toggling subscription:", error)
    } finally {
      setSubscriptionLoading(null)
    }
  }

  const submitCancel = async () => {
    if (!cancelTarget) return
    const reason = cancelReason.trim()
    if (!reason) {
      setCancelError("Please enter a reason.")
      return
    }
    setCancelling(true)
    setCancelError(null)
    try {
      const res = await fetch("/api/platform-admin/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gymId: cancelTarget.gymId, reason }),
      })
      const json = await res.json().catch(() => ({} as { error?: string }))
      if (!res.ok) {
        setCancelError(json.error || "Couldn't cancel. Please try again.")
        setCancelling(false)
        return
      }
      setCancelTarget(null)
      setCancelReason("")
      router.refresh()
    } catch {
      setCancelError("Network error. Please try again.")
    } finally {
      setCancelling(false)
    }
  }

  const getSubscriptionBadge = (sub: Gym["gym_subscriptions"]) => {
    if (!sub) {
      return (
        <span className="flex items-center gap-1 text-xs text-zinc-400">
          <Clock className="h-3 w-3" />
          No subscription
        </span>
      )
    }

    switch (sub.status) {
      case "active":
        return (
          <span className="flex items-center gap-1 text-xs text-green-500">
            <CheckCircle className="h-3 w-3" />
            Active
          </span>
        )
      case "trial":
        const daysLeft = Math.ceil((new Date(sub.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        return (
          <span className="flex items-center gap-1 text-xs text-yellow-500">
            <Clock className="h-3 w-3" />
            Trial ({daysLeft} days left)
          </span>
        )
      case "past_due":
        return (
          <span className="flex items-center gap-1 text-xs text-red-500">
            <AlertTriangle className="h-3 w-3" />
            Past Due
          </span>
        )
      case "cancelled":
        return (
          <span className="flex items-center gap-1 text-xs text-zinc-500">
            <XCircle className="h-3 w-3" />
            Cancelled
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-inter antialiased">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-zinc-900/80 bg-zinc-950/80 backdrop-blur-xl px-4 h-14">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-zinc-400 hover:text-white hover:bg-zinc-900/60"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[13px] font-semibold text-white truncate">Operator console</span>
        </div>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center justify-center rounded-lg p-2 text-zinc-400 hover:text-white"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileNavOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Left sidebar — grouped nav (fixed on desktop, drawer on mobile) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-900/80 bg-zinc-950/95 backdrop-blur-xl transition-transform duration-200 md:w-56 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="flex h-14 items-center gap-2 border-b border-zinc-900/80 px-4 shrink-0">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] shrink-0" />
          <span className="text-[13px] font-semibold tracking-tight text-white truncate">Operator console</span>
          <span className="hidden md:inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] font-medium bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/25">
            Network
          </span>
          <button
            onClick={() => setMobileNavOpen(false)}
            className="ml-auto md:hidden inline-flex items-center justify-center rounded-lg p-1.5 text-zinc-500 hover:text-zinc-200"
            aria-label="Close menu"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-2 pt-2">
          <GlobalSearchButton />
        </div>

        {/* Grouped nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {([
            {
              label: "Overview",
              items: [
                { id: "overview", label: "Overview", icon: Building2 },
                { id: "command", label: "Command", icon: Sparkles },
              ],
            },
            {
              label: "Network",
              items: [
                { id: "gyms", label: "Gyms", icon: Building2 },
                { id: "customers", label: "Customers", icon: Users, href: "/platform-admin/customers" },
                { id: "trainers", label: "Trainers", icon: UserCheck },
                { id: "students", label: "Students", icon: GraduationCap },
                { id: "network", label: "Network", icon: Map },
                { id: "adoption", label: "Adoption", icon: TrendingUp },
              ],
            },
            {
              label: "Money",
              items: [
                { id: "bookings", label: "Bookings", icon: Receipt, billing: true },
                { id: "subscriptions", label: "Subscriptions", icon: CreditCard, billing: true },
                { id: "payouts", label: "Payouts", icon: DollarSign, billing: true },
                { id: "finance", label: "Finance", icon: Wallet, billing: true, href: "/platform-admin/finance" },
              ],
            },
            {
              label: "Growth",
              items: [
                { id: "campaigns", label: "Campaigns", icon: Megaphone },
                { id: "courses", label: "Curriculum", icon: BookOpen },
                { id: "ockock", label: "OckOck", icon: MessageSquare, billing: true, ockock: true },
              ],
            },
            {
              label: "Trust & ops",
              items: [
                { id: "support", label: "Support", icon: LifeBuoy },
                { id: "audit", label: "Audit", icon: Activity },
                { id: "blacklist", label: "Blacklist", icon: Shield },
              ],
            },
          ] as {
            label: string
            items: {
              id: string
              label: string
              icon: typeof Building2
              billing?: boolean
              href?: string
              ockock?: boolean
            }[]
          }[]).map((group) => {
            const items = group.items.filter(
              (it) => !(isPartner && (it as { billing?: boolean }).billing),
            )
            if (items.length === 0) return null
            return (
              <div key={group.label} className="mb-1.5">
                <p className="px-3 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {items.map((it) => {
                    const item = it as {
                      id: string
                      label: string
                      icon: typeof Building2
                      href?: string
                      ockock?: boolean
                    }
                    const active = !item.href && activeTab === item.id
                    const cls = `flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                      active
                        ? "bg-indigo-500/15 text-white ring-1 ring-indigo-500/25"
                        : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-100"
                    }`
                    const inner = (
                      <>
                        {item.ockock ? (
                          <Image
                            src="/images/ockock-avatar.png"
                            alt=""
                            width={16}
                            height={16}
                            className="rounded-full shrink-0"
                          />
                        ) : (
                          <item.icon className="h-4 w-4 shrink-0" />
                        )}
                        <span className="truncate">{item.label}</span>
                        {item.href && <ExternalLink className="ml-auto h-3 w-3 text-zinc-600" />}
                      </>
                    )
                    return item.href ? (
                      <a key={item.id} href={item.href} className={cls}>
                        {inner}
                      </a>
                    ) : (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as typeof activeTab)
                          setMobileNavOpen(false)
                        }}
                        className={cls}
                      >
                        {inner}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="shrink-0 space-y-0.5 border-t border-zinc-900/80 p-2">
          <a
            href="/platform-admin/today"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-zinc-400 transition-colors hover:bg-zinc-900/60 hover:text-zinc-100"
          >
            <Sparkles className="h-4 w-4 shrink-0 text-indigo-400" />
            <span>Today</span>
          </a>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-zinc-400 transition-colors hover:bg-zinc-900/60 hover:text-zinc-100"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Content — keyed wrapper so each tab change replays a quick fade */}
      <main key={activeTab} className="p-4 animate-in fade-in duration-200 md:pl-56">
        {/* Command Tab — AI command bar over the network */}
        {activeTab === "command" && <PlatformCommandBar />}

        {/* Network Tab — discovered gyms, crawl + invite pipeline */}
        {activeTab === "network" && <NetworkTab />}

        {/* Students Tab — network-wide student passport */}
        {activeTab === "students" && <StudentsTab />}

        {/* Trainers Tab — network-wide trainer passport */}
        {activeTab === "trainers" && <TrainersTab />}

        {/* Campaigns Tab — AI-personalized outreach to discovered gyms */}
        {activeTab === "campaigns" && <CampaignsTab />}

        {/* Courses Tab — author the platform-wide cert ladder */}
        {activeTab === "courses" && <CurriculumTab />}

        {activeTab === "adoption" && <AdoptionTab />}

        {activeTab === "bookings" && !isPartner && <BookingsTab />}

        {activeTab === "subscriptions" && !isPartner && <SubscriptionsTab />}

        {activeTab === "support" && <SupportTab />}

        {activeTab === "audit" && <AuditLogTab />}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Health — quietly green when all systems go */}
            <HealthCard />

            {/* Today panel — operator's first-screen */}
            <TodayPanel />

            {/* Network stats — uniform chrome, indigo accent only on revenue */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <NetworkStat icon={Building2} value={stats.totalGyms} label="Total gyms" />
              <NetworkStat icon={Users} value={stats.totalCustomers} label="Customers" />
              <NetworkStat icon={Calendar} value={stats.totalBookings} label="Total bookings" />
              {!isPartner && (
                <NetworkStat icon={CreditCard} value={stats.activeSubscriptions} label="Paying gyms" />
              )}
            </div>

            {/* Monthly recurring revenue — promoted, indigo gradient. Billing surface — hidden for partners. */}
            {!isPartner && (
              <div className="rounded-xl ring-1 ring-indigo-500/20 bg-gradient-to-b from-indigo-500/[0.06] to-zinc-900/40 backdrop-blur-sm p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-1">
                  Monthly recurring revenue
                </p>
                <p className="text-[32px] font-semibold tracking-tight text-white tabular-nums">
                  ฿{(stats.activeSubscriptions * PLAN.priceTHB).toLocaleString()}
                </p>
                <p className="text-[12px] text-zinc-500 mt-0.5">
                  {stats.activeSubscriptions} gyms × ฿{PLAN.priceTHB}/month
                  {/* NOTE: approximation while every active sub is on the
                      standard plan. Once we have custom-priced subs,
                      switch to summing gym_subscriptions.monthly_price_*
                      like the Subscriptions tab already does. */}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Gyms Tab */}
        {activeTab === "gyms" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">All Gyms</h2>
              <Button onClick={() => setShowAddGym(true)} className="bg-indigo-500 hover:bg-indigo-400">
                <Plus className="mr-2 h-4 w-4" />
                Add Gym
              </Button>
            </div>

            <div className="space-y-3">
              {gyms.map((gym) => (
                <Card key={gym.id} className="border-zinc-800 bg-zinc-900">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{gym.name}</h3>
                          {getSubscriptionBadge(gym.gym_subscriptions)}
                        </div>
                        <p className="text-sm text-zinc-400">
                          {gym.city}, {gym.province}
                        </p>
                        <p className="text-xs text-zinc-500">Slug: {gym.slug}</p>
                        {gym.org_members
                          .filter((m) => m.role === "owner")
                          .map((owner) => (
                            <p key={owner.user_id} className="text-xs text-zinc-400">
                              Owner: {owner.users?.full_name || owner.users?.email || "Unknown"}
                            </p>
                          ))}
                      </div>
                      <div className="flex items-center gap-2 text-right text-xs text-zinc-500">
                        <p>Added {new Date(gym.created_at).toLocaleDateString()}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openGymSettings(gym.id, gym.name)}
                          className="border-zinc-700 text-xs text-zinc-300 hover:text-white"
                        >
                          <Bell className="mr-1 h-3 w-3" />
                          Alerts
                        </Button>
                        {/* Subscribe/Cancel — a billing action, hidden for partner platform admins.
                            Cancel routes through the dedicated /subscriptions/cancel endpoint
                            (captures reason + audits + tells Stripe). The Subscribe path keeps
                            the simpler toggle for trial->active marking. */}
                        {!isPartner &&
                          (gym.gym_subscriptions ? (
                          gym.gym_subscriptions.status === "active" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCancelTarget({ gymId: gym.id, gymName: gym.name })
                                setCancelReason("")
                                setCancelError(null)
                              }}
                              className="border-zinc-700 text-xs text-red-500 hover:text-red-600"
                              disabled={subscriptionLoading === gym.id}
                            >
                              Cancel…
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleSubscription(gym.id, "active")}
                              className="border-zinc-700 text-xs text-green-500 hover:text-green-600"
                              disabled={subscriptionLoading === gym.id}
                            >
                              {subscriptionLoading === gym.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Subscribe"
                              )}
                            </Button>
                          )
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleSubscription(gym.id, "active")}
                            className="text-xs text-green-500 hover:text-green-600"
                            disabled={subscriptionLoading === gym.id}
                          >
                            {subscriptionLoading === gym.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Subscribe"
                            )}
                          </Button>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {gyms.length === 0 && (
                <Card className="border-zinc-800 bg-zinc-900">
                  <CardContent className="p-8 text-center">
                    <Building2 className="mx-auto mb-2 h-8 w-8 text-zinc-600" />
                    <p className="text-zinc-400">No gyms yet</p>
                    <p className="text-sm text-zinc-500">Add your first gym to get started</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === "payouts" && !isPartner && (
          <div className="space-y-4">
            {/* Period Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={payoutPeriod === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setPayoutPeriod("month")
                    const now = new Date()
                    setPayoutDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)
                  }}
                  className={payoutPeriod === "month" ? "bg-indigo-500 hover:bg-indigo-400" : "border-zinc-700"}
                >
                  Monthly
                </Button>
                <Button
                  variant={payoutPeriod === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setPayoutPeriod("week")
                    const now = new Date()
                    const startOfYear = new Date(now.getFullYear(), 0, 1)
                    const weekNum = Math.ceil(
                      ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7,
                    )
                    setPayoutDate(`${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`)
                  }}
                  className={payoutPeriod === "week" ? "bg-indigo-500 hover:bg-indigo-400" : "border-zinc-700"}
                >
                  Weekly
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePeriodNav("prev")}
                  className="border-zinc-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[150px] text-center text-sm font-medium">
                  {payoutData?.period.label || "Loading..."}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePeriodNav("next")}
                  className="border-zinc-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-sm text-zinc-400">Rate:</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  className="w-20 border-zinc-700 bg-zinc-800 text-center"
                />
                <span className="text-sm text-zinc-400">THB/$</span>
              </div>
            </div>

            {/* Totals Summary */}
            {payoutData && (
              <Card className="border-zinc-800 bg-zinc-900">
                <CardContent className="p-4">
                  <div className="grid gap-4 sm:grid-cols-5">
                    <div>
                      <p className="text-xs text-zinc-400">Gyms</p>
                      <p className="text-lg font-bold">{payoutData.totals.gymCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Bookings</p>
                      <p className="text-lg font-bold">{payoutData.totals.totalBookings}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Collected</p>
                      <p className="text-lg font-bold text-blue-400">
                        ${payoutData.totals.totalCollectedUsd.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Your Commission</p>
                      <p className="text-lg font-bold text-green-400">
                        ${payoutData.totals.totalCommissionUsd.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Owed to Gyms</p>
                      <p className="text-lg font-bold text-indigo-300">${payoutData.totals.totalOwedUsd.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gym Payouts List */}
            {payoutLoading ? (
              <Card className="border-zinc-800 bg-zinc-900">
                <CardContent className="p-8 text-center">
                  <p className="text-zinc-400">Loading payouts...</p>
                </CardContent>
              </Card>
            ) : payoutData?.gyms.length === 0 ? (
              <Card className="border-zinc-800 bg-zinc-900">
                <CardContent className="p-8 text-center">
                  <DollarSign className="mx-auto mb-2 h-8 w-8 text-zinc-600" />
                  <p className="text-zinc-400">No online bookings this period</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {payoutData?.gyms.map((gymPayout) => {
                  const thbAmount = Math.round(gymPayout.summary.amountOwedUsd * Number.parseFloat(exchangeRate))
                  const isPaid = gymPayout.payout?.status === "paid"

                  return (
                    <Card key={gymPayout.gym.id} className="border-zinc-800 bg-zinc-900">
                      <CardContent className="p-4">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{gymPayout.gym.name}</h3>
                              {isPaid ? (
                                <span className="flex items-center gap-1 rounded bg-green-500/10 px-2 py-0.5 text-xs text-green-500">
                                  <Check className="h-3 w-3" />
                                  Paid
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 rounded bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-500">
                                  <Clock className="h-3 w-3" />
                                  Pending
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-zinc-400">
                              {gymPayout.summary.bookingCount} bookings • $
                              {gymPayout.summary.totalCollectedUsd.toFixed(2)} collected
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-zinc-400">Owed</p>
                              <p className="font-bold text-indigo-300">${gymPayout.summary.amountOwedUsd.toFixed(2)}</p>
                              <p className="text-xs text-zinc-500">฿{thbAmount.toLocaleString()}</p>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyStatement(gymPayout)}
                                title={
                                  copiedStatementGymId === gymPayout.gym.id
                                    ? "Statement copied"
                                    : "Copy statement"
                                }
                                className={`border-zinc-700 ${
                                  copiedStatementGymId === gymPayout.gym.id
                                    ? "text-emerald-300 border-emerald-700"
                                    : ""
                                }`}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              {!isPaid && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedGymPayout(gymPayout)
                                    setShowMarkPaid(true)
                                  }}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Mark Paid
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Booking Details (collapsed by default, could add expand later) */}
                        {gymPayout.bookings.length > 0 && (
                          <div className="mt-4 border-t border-zinc-800 pt-4">
                            <p className="mb-2 text-xs text-zinc-500">Booking Details:</p>
                            <div className="space-y-1 text-sm">
                              {gymPayout.bookings.slice(0, 5).map((b) => (
                                <div key={b.id} className="flex justify-between text-zinc-400">
                                  <span>
                                    {new Date(b.date).toLocaleDateString()} - {b.customerName} - {b.service}
                                  </span>
                                  <span>${b.amountUsd?.toFixed(2) || "0.00"}</span>
                                </div>
                              ))}
                              {gymPayout.bookings.length > 5 && (
                                <p className="text-zinc-500">+ {gymPayout.bookings.length - 5} more</p>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Blacklist Tab */}
        {activeTab === "blacklist" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Blacklist</h2>
              <Button onClick={() => setShowAddBlacklist(true)} className="bg-red-500 hover:bg-red-600">
                <Plus className="mr-2 h-4 w-4" />
                Add Entry
              </Button>
            </div>

            <p className="text-sm text-zinc-400">
              Shared list of banned individuals. All gyms in the network can view this list.
            </p>

            <div className="space-y-3">
              {blacklist.map((entry) => (
                <Card key={entry.id} className="border-zinc-800 bg-zinc-900">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{entry.name}</h3>
                            {entry.nationality && <p className="text-sm text-zinc-400">{entry.nationality}</p>}
                          </div>
                          <div className="text-right text-xs text-zinc-500">
                            <p>Added by {entry.organizations?.name || "Unknown"}</p>
                            <p>{new Date(entry.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <p className="text-sm text-zinc-300">{entry.description}</p>

                        {entry.blacklist_comments.length > 0 && (
                          <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
                            <p className="flex items-center gap-1 text-xs text-zinc-500">
                              <MessageSquare className="h-3 w-3" />
                              Comments
                            </p>
                            {entry.blacklist_comments.map((comment) => (
                              <div key={comment.id} className="rounded bg-zinc-800/50 p-2 text-sm">
                                <p className="text-zinc-300">{comment.comment}</p>
                                <p className="mt-1 text-xs text-zinc-500">
                                  {comment.organizations?.name} • {new Date(comment.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {blacklist.length === 0 && (
                <Card className="border-zinc-800 bg-zinc-900">
                  <CardContent className="p-8 text-center">
                    <Shield className="mx-auto mb-2 h-8 w-8 text-zinc-600" />
                    <p className="text-zinc-400">Blacklist is empty</p>
                    <p className="text-sm text-zinc-500">No banned individuals yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* OckOck tab content */}
        {activeTab === "ockock" && !isPartner && (
          <div className="flex h-[calc(100vh-200px)] flex-col">
            {/* Chat Header */}
            <div className="mb-4 flex items-center gap-3">
              <Image src="/images/ockock-avatar.png" alt="OckOck" width={48} height={48} className="rounded-full" />
              <div>
                <h2 className="font-semibold">OckOck</h2>
                <p className="text-sm text-zinc-400">Platform Business Assistant</p>
              </div>
            </div>

            {/* Chat Messages */}
            <Card className="flex-1 overflow-hidden border-zinc-800 bg-zinc-900">
              <CardContent className="flex h-full flex-col p-0">
                <div className="flex-1 overflow-y-auto p-4">
                  {ockockMessages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <Image
                        src="/images/ockock-avatar.png"
                        alt="OckOck"
                        width={80}
                        height={80}
                        className="mb-4 rounded-full"
                      />
                      <h3 className="mb-2 font-semibold">Hey Boss! I'm OckOck 🦬</h3>
                      <p className="mb-4 max-w-md text-sm text-zinc-400">
                        I help you manage the Muay Thai Network. Ask me about payouts, gym subscriptions, revenue, or
                        anything platform-related!
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {[
                          "What do I owe gyms this month?",
                          "How's business this month?",
                          "Any gyms past due?",
                          "Monthly summary",
                        ].map((suggestion) => (
                          <Button
                            key={suggestion}
                            variant="outline"
                            size="sm"
                            className="border-zinc-700 text-xs bg-transparent"
                            onClick={() => {
                              setOckockInput(suggestion)
                              setTimeout(() => sendOckockMessage(), 100)
                            }}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {ockockMessages.map((msg, i) => (
                        <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                          {msg.role === "assistant" && (
                            <Image
                              src="/images/ockock-avatar.png"
                              alt="OckOck"
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded-full"
                            />
                          )}
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              msg.role === "user" ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-100"
                            }`}
                          >
                            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      {ockockLoading && (
                        <div className="flex gap-3">
                          <Image
                            src="/images/ockock-avatar.png"
                            alt="OckOck"
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-full"
                          />
                          <div className="rounded-lg bg-zinc-800 px-4 py-2">
                            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="border-t border-zinc-800 p-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      sendOckockMessage()
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={ockockInput}
                      onChange={(e) => setOckockInput(e.target.value)}
                      placeholder="Ask about payouts, revenue, gyms..."
                      className="flex-1 border-zinc-700 bg-zinc-800"
                      disabled={ockockLoading}
                    />
                    <Button
                      type="submit"
                      disabled={!ockockInput.trim() || ockockLoading}
                      className="bg-indigo-500 hover:bg-indigo-400"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Per-gym booking-alert settings — operator can set the gym's
          notification email without "View as gym admin". */}
      <Dialog open={!!settingsTarget} onOpenChange={(o) => !o && setSettingsTarget(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Booking alerts — {settingsTarget?.gymName}</DialogTitle>
          </DialogHeader>
          {settingsLoading ? (
            <div className="py-6 text-center text-sm text-zinc-500">
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-zinc-500">
                Where this gym&apos;s new-booking emails are sent. The gym&apos;s owner is always
                alerted at their login email too.
              </p>
              <div className="space-y-1.5">
                <Label className="text-zinc-200">Notification email</Label>
                <Input
                  type="email"
                  value={settingsEmail}
                  onChange={(e) => setSettingsEmail(e.target.value)}
                  placeholder="owner@gym.com"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={settingsNotify}
                  onChange={(e) => setSettingsNotify(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-800"
                />
                Email on every new booking
              </label>
              {settingsMsg && (
                <p className={`text-xs ${settingsMsg === "Saved" ? "text-emerald-400" : "text-red-400"}`}>
                  {settingsMsg}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSettingsTarget(null)}
                  className="border-zinc-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveGymSettings}
                  disabled={settingsSaving}
                  className="bg-indigo-500 hover:bg-indigo-400"
                >
                  {settingsSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showAddGym} onOpenChange={setShowAddGym}>
        <DialogContent className="border-zinc-800 bg-zinc-900 text-white">
          <DialogHeader>
            <DialogTitle>Add New Gym</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Gym Name</Label>
                <Input
                  value={gymForm.name}
                  onChange={(e) => setGymForm({ ...gymForm, name: e.target.value })}
                  placeholder="Tiger Muay Thai"
                  className="border-zinc-700 bg-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <Label>URL Slug</Label>
                <Input
                  value={gymForm.slug}
                  onChange={(e) => setGymForm({ ...gymForm, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  placeholder="tiger-muay-thai"
                  className="border-zinc-700 bg-zinc-800"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={gymForm.city}
                  onChange={(e) => setGymForm({ ...gymForm, city: e.target.value })}
                  placeholder="Phuket"
                  className="border-zinc-700 bg-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <Label>Province</Label>
                <Input
                  value={gymForm.province}
                  onChange={(e) => setGymForm({ ...gymForm, province: e.target.value })}
                  placeholder="Phuket"
                  className="border-zinc-700 bg-zinc-800"
                />
              </div>
            </div>
            <div className="border-t border-zinc-800 pt-4">
              <p className="mb-3 text-sm text-zinc-400">Gym Owner (will receive invite)</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Owner Email</Label>
                  <Input
                    type="email"
                    value={gymForm.ownerEmail}
                    onChange={(e) => setGymForm({ ...gymForm, ownerEmail: e.target.value })}
                    placeholder="owner@gym.com"
                    className="border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Owner Name</Label>
                  <Input
                    value={gymForm.ownerName}
                    onChange={(e) => setGymForm({ ...gymForm, ownerName: e.target.value })}
                    placeholder="John Smith"
                    className="border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>
            </div>
            <Button
              onClick={handleAddGym}
              disabled={loading || !gymForm.name || !gymForm.slug || !gymForm.ownerEmail}
              className="w-full bg-indigo-500 hover:bg-indigo-400"
            >
              {loading ? "Adding..." : "Add Gym & Send Invite"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Blacklist Dialog */}
      <Dialog open={showAddBlacklist} onOpenChange={setShowAddBlacklist}>
        <DialogContent className="border-zinc-800 bg-zinc-900 text-white">
          <DialogHeader>
            <DialogTitle>Add to Blacklist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={blacklistForm.name}
                  onChange={(e) => setBlacklistForm({ ...blacklistForm, name: e.target.value })}
                  placeholder="Full name"
                  className="border-zinc-700 bg-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <Label>Nationality</Label>
                <Input
                  value={blacklistForm.nationality}
                  onChange={(e) => setBlacklistForm({ ...blacklistForm, nationality: e.target.value })}
                  placeholder="Country"
                  className="border-zinc-700 bg-zinc-800"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={blacklistForm.description}
                onChange={(e) => setBlacklistForm({ ...blacklistForm, description: e.target.value })}
                placeholder="Describe the reason for blacklisting..."
                className="border-zinc-700 bg-zinc-800"
                rows={3}
              />
            </div>
            <Button
              onClick={handleAddBlacklist}
              disabled={loading || !blacklistForm.name || !blacklistForm.description}
              className="w-full bg-red-500 hover:bg-red-600"
            >
              {loading ? "Adding..." : "Add to Blacklist"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!cancelTarget}
        onOpenChange={(open) => {
          if (!open) {
            setCancelTarget(null)
            setCancelReason("")
            setCancelError(null)
          }
        }}
      >
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Cancel subscription</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-400">
            Cancel{" "}
            <span className="text-white font-semibold">{cancelTarget?.gymName}</span>
            &apos;s Stripe subscription immediately and mark the gym as
            cancelled. A reason is required for the audit log.
          </p>
          <div className="space-y-2 pt-2">
            <Label htmlFor="cancel-reason" className="text-zinc-300">
              Reason
            </Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Why are you cancelling? (e.g. requested by owner, payment failures, gym closing)"
              className="bg-zinc-950 border-zinc-700 text-white"
              rows={3}
            />
          </div>
          {cancelError && (
            <p className="text-sm text-red-400">{cancelError}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setCancelTarget(null)
                setCancelReason("")
                setCancelError(null)
              }}
              disabled={cancelling}
              className="border-zinc-700"
            >
              Back
            </Button>
            <Button
              variant="outline"
              onClick={submitCancel}
              disabled={cancelling || !cancelReason.trim()}
              className="border-red-700 text-red-400 hover:bg-red-600/10"
            >
              {cancelling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Cancel subscription"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMarkPaid} onOpenChange={setShowMarkPaid}>
        <DialogContent className="border-zinc-800 bg-zinc-900 text-white">
          <DialogHeader>
            <DialogTitle>Mark Payout as Paid</DialogTitle>
          </DialogHeader>
          {selectedGymPayout && (
            <div className="space-y-4">
              <div className="rounded-lg bg-zinc-800 p-4">
                <h3 className="font-semibold">{selectedGymPayout.gym.name}</h3>
                <div className="mt-2 space-y-1 text-sm text-zinc-400">
                  <p>Bookings: {selectedGymPayout.summary.bookingCount}</p>
                  <p>Total Collected: ${selectedGymPayout.summary.totalCollectedUsd.toFixed(2)}</p>
                  <p>Your Commission: ${selectedGymPayout.summary.commissionUsd.toFixed(2)}</p>
                  <p className="text-lg font-bold text-indigo-300">
                    Amount Owed: ${selectedGymPayout.summary.amountOwedUsd.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Exchange Rate (THB/$)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    className="border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label>THB Amount</Label>
                  <Input
                    readOnly
                    value={`฿${Math.round(selectedGymPayout.summary.amountOwedUsd * Number.parseFloat(exchangeRate)).toLocaleString()}`}
                    className="border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="Transfer reference, notes..."
                  className="border-zinc-700 bg-zinc-800"
                  rows={2}
                />
              </div>

              <Button onClick={handleMarkPaid} disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
                {loading ? "Saving..." : "Confirm Payment Sent"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NetworkStat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>
  value: string | number
  label: string
}) {
  return (
    <div className="rounded-xl ring-1 ring-zinc-900 bg-zinc-900/40 backdrop-blur-sm p-4">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-zinc-500">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="text-[24px] font-semibold tracking-tight text-white tabular-nums mt-1.5">
        {value}
      </p>
    </div>
  )
}
