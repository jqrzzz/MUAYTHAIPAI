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
} from "lucide-react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { PlatformAnalytics } from "@/components/admin/platform-analytics"

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
    totalStudents: number
    totalBookings: number
    activeSubscriptions: number
  }
}

const COMMISSION_RATE = 0.15

export default function PlatformAdminClient({ gyms, blacklist, stats }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"overview" | "gyms" | "payouts" | "blacklist" | "ockock">("overview")
  const [showAddGym, setShowAddGym] = useState(false)
  const [showAddBlacklist, setShowAddBlacklist] = useState(false)
  const [loading, setLoading] = useState(false)

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
  const [exchangeRate, setExchangeRate] = useState("35.0")
  const [payoutNotes, setPayoutNotes] = useState("")

  const [subscriptionLoading, setSubscriptionLoading] = useState<string | null>(null)
  const [expandedGyms, setExpandedGyms] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

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
      } else {
        showToast("Failed to load payouts", "error")
      }
    } catch {
      showToast("Network error loading payouts", "error")
    }
    setPayoutLoading(false)
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
        showToast("Payout marked as paid")
        fetchPayouts()
      } else {
        showToast("Failed to mark payout as paid", "error")
      }
    } catch {
      showToast("Network error saving payout", "error")
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
    statement += `Platform Commission (${COMMISSION_RATE * 100}%): $${gymPayout.summary.commissionUsd.toFixed(2)} USD\n`
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

  const copyStatement = (gymPayout: GymPayout) => {
    const statement = generateStatement(gymPayout)
    navigator.clipboard.writeText(statement)
    showToast("Statement copied to clipboard")
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
        showToast("Gym added successfully")
        router.refresh()
      } else {
        const data = await res.json().catch(() => null)
        showToast(data?.error || "Failed to add gym", "error")
      }
    } catch {
      showToast("Network error adding gym", "error")
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
        showToast("Added to blacklist")
        router.refresh()
      } else {
        const data = await res.json().catch(() => null)
        showToast(data?.error || "Failed to add to blacklist", "error")
      }
    } catch {
      showToast("Network error adding to blacklist", "error")
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
        showToast(`Subscription ${newStatus === "active" ? "activated" : "deactivated"}`)
        router.refresh()
      } else {
        showToast("Failed to update subscription", "error")
      }
    } catch {
      showToast("Network error updating subscription", "error")
    } finally {
      setSubscriptionLoading(null)
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
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/images/ockock-avatar.png" alt="OckOck" width={40} height={40} className="rounded-full" />
            <div>
              <h1 className="text-lg font-bold">Platform Admin</h1>
              <p className="text-xs text-zinc-400">Muay Thai Network</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-6xl gap-1 px-4">
          {[
            { id: "overview", label: "Overview", icon: Building2 },
            { id: "gyms", label: "Gyms", icon: Users },
            { id: "payouts", label: "Payouts", icon: DollarSign },
            { id: "blacklist", label: "Blacklist", icon: Shield },
            { id: "ockock", label: "OckOck", icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-orange-500 text-orange-500"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              {tab.id === "ockock" ? (
                <Image src="/images/ockock-avatar.png" alt="OckOck" width={20} height={20} className="rounded-full" />
              ) : (
                <tab.icon className="h-4 w-4" />
              )}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-6xl p-4">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-zinc-800 bg-zinc-900">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-orange-500/10 p-2">
                      <Building2 className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalGyms}</p>
                      <p className="text-xs text-zinc-400">Total Gyms</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-zinc-800 bg-zinc-900">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-500/10 p-2">
                      <Users className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalStudents}</p>
                      <p className="text-xs text-zinc-400">Total Users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-zinc-800 bg-zinc-900">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-500/10 p-2">
                      <Calendar className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalBookings}</p>
                      <p className="text-xs text-zinc-400">Total Bookings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-zinc-800 bg-zinc-900">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-purple-500/10 p-2">
                      <CreditCard className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
                      <p className="text-xs text-zinc-400">Paying Gyms</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analytics */}
            <PlatformAnalytics />
          </div>
        )}

        {/* Gyms Tab */}
        {activeTab === "gyms" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">All Gyms</h2>
              <Button onClick={() => setShowAddGym(true)} className="bg-orange-500 hover:bg-orange-600">
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
                        {/* Add Subscribe/Unsubscribe button */}
                        {gym.gym_subscriptions ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const sub = gym.gym_subscriptions
                              if (!sub) return
                              toggleSubscription(gym.id, sub.status === "active" ? "inactive" : "active")
                            }}
                            className={`border-zinc-700 text-xs ${
                              gym.gym_subscriptions.status === "active"
                                ? "text-red-500 hover:text-red-600"
                                : "text-green-500 hover:text-green-600"
                            }`}
                            disabled={subscriptionLoading === gym.id}
                          >
                            {subscriptionLoading === gym.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : gym.gym_subscriptions.status === "active" ? (
                              "Unsubscribe"
                            ) : (
                              "Subscribe"
                            )}
                          </Button>
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
                        )}
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

        {activeTab === "payouts" && (
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
                  className={payoutPeriod === "month" ? "bg-orange-500 hover:bg-orange-600" : "border-zinc-700"}
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
                  className={payoutPeriod === "week" ? "bg-orange-500 hover:bg-orange-600" : "border-zinc-700"}
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
                      <p className="text-lg font-bold text-orange-400">${payoutData.totals.totalOwedUsd.toFixed(2)}</p>
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
                              <p className="font-bold text-orange-400">${gymPayout.summary.amountOwedUsd.toFixed(2)}</p>
                              <p className="text-xs text-zinc-500">฿{thbAmount.toLocaleString()}</p>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyStatement(gymPayout)}
                                className="border-zinc-700"
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

                        {gymPayout.bookings.length > 0 && (
                          <div className="mt-4 border-t border-zinc-800 pt-4">
                            <button
                              onClick={() => {
                                const next = new Set(expandedGyms)
                                if (next.has(gymPayout.gym.id)) {
                                  next.delete(gymPayout.gym.id)
                                } else {
                                  next.add(gymPayout.gym.id)
                                }
                                setExpandedGyms(next)
                              }}
                              className="mb-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                              {expandedGyms.has(gymPayout.gym.id)
                                ? "Hide details"
                                : `Show ${gymPayout.bookings.length} booking${gymPayout.bookings.length === 1 ? "" : "s"}`}
                            </button>
                            {expandedGyms.has(gymPayout.gym.id) && (
                              <div className="space-y-1 text-sm">
                                {gymPayout.bookings.map((b) => (
                                  <div key={b.id} className="flex justify-between text-zinc-400">
                                    <span>
                                      {new Date(b.date).toLocaleDateString()} - {b.customerName} - {b.service}
                                    </span>
                                    <span>${b.amountUsd?.toFixed(2) || "0.00"}</span>
                                  </div>
                                ))}
                              </div>
                            )}
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
        {activeTab === "ockock" && (
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
                      <h3 className="mb-2 font-semibold">Hey Boss! I&apos;m OckOck</h3>
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
                              msg.role === "user" ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-100"
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
                      className="bg-orange-500 hover:bg-orange-600"
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

      {/* Add Gym Dialog */}
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
              className="w-full bg-orange-500 hover:bg-orange-600"
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

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            toast.type === "success"
              ? "bg-green-500/90 text-white"
              : "bg-red-500/90 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          {toast.message}
        </div>
      )}

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
                  <p className="text-lg font-bold text-orange-400">
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
