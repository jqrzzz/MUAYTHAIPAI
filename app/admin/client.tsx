"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import TodayTab from "@/components/admin/today-tab"
import TodaySignalPanel from "@/components/admin/today-signal-panel"
import TrialBanner from "@/components/admin/trial-banner"
import ImpersonationBanner from "@/components/impersonation-banner"
import PackagesTab from "@/components/admin/packages-tab"
import RecentTab from "@/components/admin/recent-tab"
import ServicesTab from "@/components/admin/services-tab"
import TrainersTab from "@/components/admin/trainers-tab"
import StudentsTab from "@/components/admin/students-tab"
import CertificatesTab from "@/components/admin/certificates-tab"
import TimeSlotsTab from "@/components/admin/time-slots-tab"
import ProfileTab from "@/components/admin/profile-tab"
import SettingsTab from "@/components/admin/settings-tab"
import ReportsTab from "@/components/admin/reports-tab"
import TrainOckockTab from "@/components/admin/train-ockock-tab"
import OckockChatTab from "@/components/admin/ockock-chat-tab"
import MarketingTab from "@/components/admin/marketing-tab"
import InboxTab from "@/components/admin/inbox-tab"
import ChannelsTab from "@/components/admin/channels-tab"
import CoursesTab from "@/components/admin/courses-tab"
import NotificationBell from "@/components/admin/notification-bell"
import {
  Award,
  Calendar,
  Users,
  LogOut,
  Clock,
  Dumbbell,
  Package as PackageIcon,
  RefreshCw,
  BarChart3,
  Settings,
  GraduationCap,
  User,
  X,
  BookOpen,
  Menu,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Megaphone,
  Inbox,
  Link2,
} from "lucide-react"
import Image from "next/image"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import type { CreditTransaction } from "@/components/admin/students-tab"

const OckOckAvatar = ({ size = 32 }: { size?: number }) => (
  <Image src="/images/ockock-avatar.png" alt="OckOck" width={size} height={size} className="rounded-full" />
)

interface Booking {
  id: string
  guest_name: string | null
  guest_email: string | null
  booking_date: string
  booking_time: string | null
  status: string
  payment_status: string
  payment_method: string | null
  payment_amount_thb: number | null
  payment_amount_usd: number | null
  payment_currency: string | null
  services: {
    name: string
    category: string
  } | null
}

interface AnalyticsBooking {
  id: string
  booking_date: string
  payment_method: string | null
  payment_status: string
  payment_amount_thb: number | null
  payment_amount_usd: number | null
  payment_currency: string | null
}

interface Service {
  id: string
  name: string
  description: string | null
  category: string
  price_thb: number
  duration_minutes: number | null
  requires_time_slot: boolean
  is_active: boolean
  is_featured: boolean
  display_order: number
}

interface Trainer {
  id: string
  display_name: string
  title: string | null
  bio: string | null
  photo_url: string | null
  specialties: string[]
  is_available: boolean
  is_featured: boolean
  availability_note: string | null
  years_experience: number | null
  fight_record_wins: number
  fight_record_losses: number
  fight_record_draws: number
}

interface Organization {
  id: string
  name: string
  slug: string
}

interface Membership {
  id: string
  role: string
  org_id: string
}

interface OrgSettings {
  id: string
  org_id: string
  booking_advance_days: number
  booking_max_days_ahead: number
  allow_guest_bookings: boolean
  require_payment_upfront: boolean
  notify_on_booking_email: boolean
  notification_email: string | null
  show_prices: boolean
  show_trainer_selection: boolean
  description?: string | null // Added from settingsForm
  email?: string | null // Added from settingsForm
  phone?: string | null // Added from settingsForm
  whatsapp?: string | null // Added from settingsForm
  address?: string | null // Added from settingsForm
  city?: string | null // Added from settingsForm
  province?: string | null // Added from settingsForm
  instagram?: string | null // Added from settingsForm
  facebook?: string | null // Added from settingsForm
  website?: string | null // Added from settingsForm
}

interface Subscription {
  status: string | null
  trial_ends_at: string | null
  current_period_end: string | null
  price_thb: number | null
}

interface AdminDashboardProps {
  user: SupabaseUser
  membership: Membership
  organization: Organization
  todaysBookings: Booking[]
  recentBookings: Booking[]
  services: Service[]
  trainers: Trainer[]
  analyticsBookings: AnalyticsBooking[]
  orgSettings: OrgSettings | null
  todayDate: string
  timezone: string
  subscription: Subscription | null
}

interface Student {
  id: string
  email: string
  full_name: string | null
  display_name: string | null
  phone: string | null // Added from newStudentForm
  credits?: {
    id: string
    credit_type: string
    credits_remaining: number
    expires_at: string | null
  }[]
  transactions?: CreditTransaction[] // Using the defined CreditTransaction type
}

// Changed AdminDashboardProps to use SupabaseUser
export default function AdminDashboardClient({
  user,
  membership,
  organization,
  todaysBookings: initialTodaysBookings,
  recentBookings: initialRecentBookings,
  services: initialServices,
  trainers: initialTrainers,
  analyticsBookings,
  orgSettings: initialOrgSettings,
  todayDate,
  timezone,
  subscription,
}: AdminDashboardProps) {
  const router = useRouter()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<
    "today" | "recent" | "services" | "trainers" | "reports" | "settings" | "ockock" | "students" | "certificates" | "time-slots" | "profile" | "train-ockock" | "marketing" | "inbox" | "channels" | "courses" | "packages"
  >("today")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [services, setServices] = useState(initialServices)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Global action feedback
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  function showFeedback(type: "success" | "error", message: string) {
    setActionFeedback({ type, message })
    if (type === "success") {
      setTimeout(() => setActionFeedback(null), 3000)
    } else {
      setTimeout(() => setActionFeedback(null), 5000)
    }
  }

  // Student state
  const [students, setStudents] = useState<Student[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentTransactions, setStudentTransactions] = useState<CreditTransaction[]>([])

  // Inbox badge counts — surfaced in the sidebar so Gym can see pending
  // drafts / awaiting conversations at a glance without opening the tab.
  const [inboxCounts, setInboxCounts] = useState({ awaiting: 0, pendingDrafts: 0, total: 0 })

  useEffect(() => {
    if (activeTab === "students" && students.length === 0) {
      fetchStudents()
    }
  }, [activeTab])

  // Keep the inbox badge fresh: fetch on mount, and any time the user
  // navigates to a non-inbox tab (their actions inside the inbox may
  // have changed the counts).
  useEffect(() => {
    fetchInboxCounts()
  }, [])

  useEffect(() => {
    if (activeTab !== "inbox") {
      fetchInboxCounts()
    }
  }, [activeTab])

  const fetchInboxCounts = async () => {
    try {
      const res = await fetch("/api/admin/inbox/counts", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setInboxCounts({
          awaiting: data.awaiting ?? 0,
          pendingDrafts: data.pendingDrafts ?? 0,
          total: data.total ?? 0,
        })
      }
    } catch {
      // Non-critical — badge just won't update this cycle.
    }
  }

  const fetchStudents = async () => {
    setStudentsLoading(true)
    try {
      const res = await fetch(`/api/admin/students?org_id=${membership.org_id}`)
      if (res.ok) {
        const data = await res.json()
        setStudents(data.students || [])
        setStudentTransactions(data.transactions || [])
      }
    } catch {
      showFeedback("error", "Couldn't load students")
    }
    setStudentsLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/admin/login")
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const todayStats = {
    total: initialTodaysBookings.length,
    completed: initialTodaysBookings.filter((b) => b.status === "completed").length,
    paid: initialTodaysBookings.filter((b) => b.payment_status === "paid").length,
    revenue: initialTodaysBookings
      .filter((b) => b.payment_status === "paid")
      .reduce((sum, b) => sum + (b.payment_amount_thb || 0), 0),
  }

  // Navigation items grouped by category
  const navGroups = [
    {
      label: "Operations",
      labelTh: "การดำเนินงาน",
      items: [
        { id: "today" as const, label: "Today", labelTh: "วันนี้", icon: Calendar },
        { id: "recent" as const, label: "Recent", labelTh: "ล่าสุด", icon: Clock },
        { id: "inbox" as const, label: "Inbox", labelTh: "กล่องข้อความ", icon: Inbox, badge: inboxCounts.total },
        { id: "students" as const, label: "Students", labelTh: "นักเรียน", icon: GraduationCap },
        { id: "certificates" as const, label: "Certificates", labelTh: "ใบรับรอง", icon: Award },
        { id: "courses" as const, label: "Gym courses", labelTh: "หลักสูตรของยิม", icon: BookOpen },
      ],
    },
    {
      label: "Business",
      labelTh: "ธุรกิจ",
      items: [
        { id: "reports" as const, label: "Reports", labelTh: "รายงาน", icon: BarChart3 },
        { id: "services" as const, label: "Services", labelTh: "บริการ", icon: Dumbbell },
        { id: "packages" as const, label: "Packages", labelTh: "แพ็คเกจ", icon: PackageIcon },
        { id: "time-slots" as const, label: "Time Slots", labelTh: "ช่วงเวลา", icon: Clock },
        { id: "trainers" as const, label: "Trainers", labelTh: "ครูมวย", icon: Users },
      ],
    },
    {
      label: "OckOck",
      labelTh: "อ๊อกอ๊อก",
      items: [
        { id: "marketing" as const, label: "Marketing", labelTh: "การตลาด", icon: Megaphone },
        { id: "train-ockock" as const, label: "Train OckOck", labelTh: "สอน OckOck", icon: BookOpen },
        { id: "ockock" as const, label: "OckOck", labelTh: "OckOck", icon: null, isOckOck: true },
      ],
    },
    {
      label: "Account",
      labelTh: "บัญชี",
      items: [
        { id: "profile" as const, label: "My Profile", labelTh: "โปรไฟล์", icon: User },
        { id: "channels" as const, label: "Channels", labelTh: "ช่องทาง", icon: Link2 },
        { id: "settings" as const, label: "Settings", labelTh: "ตั้งค่า", icon: Settings },
      ],
    },
  ]

  const handleNavClick = (tabId: typeof activeTab) => {
    setActiveTab(tabId)
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-inter antialiased overflow-x-hidden">
      <ImpersonationBanner />
      {/* Trial / subscription banner — only renders when trial or past_due */}
      <TrialBanner orgId={membership.org_id} subscription={subscription} />

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-50 bg-zinc-950/70 backdrop-blur-xl border-b border-zinc-900/80">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-center min-w-0">
            <h1 className="text-[14px] font-semibold text-white truncate leading-tight">
              {organization.name}
            </h1>
            <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500 leading-none mt-0.5">
              Gym admin
            </p>
          </div>
          <div className="flex items-center gap-0.5">
            <NotificationBell />
            <button
              onClick={handleRefresh}
              className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60 rounded-lg transition-colors"
              aria-label="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile slide-out menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-zinc-950 border-r border-zinc-900 overflow-y-auto">
            <div className="p-4 border-b border-zinc-900">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <h2 className="text-[14px] font-semibold text-white truncate">
                    {organization.name}
                  </h2>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500 mt-0.5">
                    Gym admin · {membership.role}
                  </p>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 -mr-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <nav className="p-2">
              {navGroups.map((group) => (
                <div key={group.label} className="mb-4">
                  <p className="px-3 py-2 text-[10px] font-medium text-zinc-500 uppercase tracking-[0.14em]">
                    {group.label}
                  </p>
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-[13px] transition-colors ${
                        activeTab === item.id
                          ? "bg-indigo-500/15 text-indigo-200 ring-1 ring-indigo-500/25"
                          : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
                      }`}
                    >
                      {item.icon === null ? (
                        <OckOckAvatar size={18} />
                      ) : item.icon ? (
                        <item.icon className="w-4 h-4 shrink-0" />
                      ) : null}
                      <span className="truncate">{item.label}</span>
                      <span className="text-[10px] text-zinc-600 shrink-0">({item.labelTh})</span>
                      {"badge" in item && typeof item.badge === "number" && item.badge > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-500 text-white text-[10px] font-semibold">
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
            <div className="p-3 border-t border-zinc-900">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-zinc-500 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Sign out · ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-r border-zinc-900 transition-all duration-300 ${
        sidebarCollapsed ? "w-16" : "w-56"
      }`}>
        {/* Sidebar header */}
        <div className="p-4 border-b border-zinc-900">
          {!sidebarCollapsed && (
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-[13px] font-semibold text-white truncate">
                  {organization.name}
                </h2>
                <span className="inline-flex items-center gap-1.5 mt-0.5 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                  Gym admin · {membership.role}
                </span>
              </div>
              <NotificationBell />
            </div>
          )}
          {sidebarCollapsed && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 ring-1 ring-indigo-300/30 flex items-center justify-center text-white font-semibold text-[13px] shadow-[0_4px_12px_-4px_rgba(99,102,241,0.5)]">
                {organization.name.charAt(0)}
              </div>
              <NotificationBell />
            </div>
          )}
        </div>

        {/* Sidebar navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4">
              {!sidebarCollapsed && (
                <p className="px-3 py-2 text-[10px] font-medium text-zinc-500 uppercase tracking-[0.14em]">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const hasBadge = "badge" in item && typeof item.badge === "number" && item.badge > 0
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    title={sidebarCollapsed ? `${item.label} (${item.labelTh})` : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-[13px] transition-colors mb-0.5 relative ${
                      activeTab === item.id
                        ? "bg-indigo-500/15 text-indigo-200 ring-1 ring-indigo-500/25"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
                    } ${sidebarCollapsed ? "justify-center" : ""}`}
                  >
                    {item.icon === null ? (
                      <OckOckAvatar size={18} />
                    ) : item.icon ? (
                      <item.icon className="w-4 h-4 shrink-0" />
                    ) : null}
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    {hasBadge && !sidebarCollapsed && (
                      <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-500 text-white text-[10px] font-semibold">
                        {(item as { badge: number }).badge > 99 ? "99+" : (item as { badge: number }).badge}
                      </span>
                    )}
                    {hasBadge && sidebarCollapsed && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-zinc-950" />
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="p-2 border-t border-zinc-900">
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-zinc-500 hover:text-zinc-100 hover:bg-zinc-900 transition-colors ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Sign out</span>}
          </button>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 mt-1 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900 transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-900/80 px-2 py-2 safe-area-inset-bottom">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setActiveTab("today")}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "today" ? "text-indigo-300" : "text-zinc-500 hover:text-zinc-200"
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-medium">Today</span>
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "students" ? "text-indigo-300" : "text-zinc-500 hover:text-zinc-200"
            }`}
          >
            <GraduationCap className="w-5 h-5" />
            <span className="text-[10px] font-medium">Students</span>
          </button>
          <button
            onClick={() => setActiveTab("ockock")}
            className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl -mt-4 bg-gradient-to-br from-indigo-400 to-indigo-600 ring-1 ring-indigo-300/30 shadow-[0_8px_24px_-6px_rgba(99,102,241,0.6)] ${
              activeTab === "ockock" ? "ring-2 ring-indigo-300/60" : ""
            }`}
          >
            <OckOckAvatar size={26} />
            <span className="text-[10px] text-white font-medium">OckOck</span>
          </button>
          <button
            onClick={() => setActiveTab("marketing")}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "marketing" ? "text-indigo-300" : "text-zinc-500 hover:text-zinc-200"
            }`}
          >
            <Megaphone className="w-5 h-5" />
            <span className="text-[10px] font-medium">Marketing</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
            {inboxCounts.total > 0 && (
              <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-zinc-950" />
            )}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className={`min-h-screen pb-20 md:pb-0 transition-all duration-300 ${
        sidebarCollapsed ? "md:ml-16" : "md:ml-56"
      }`}>
        <div className="p-4 md:p-6">
          {/* Stats Cards - Add Thai translations */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-neutral-900/50 border-neutral-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-400">Today (วันนี้)</p>
                    <p className="text-2xl font-bold text-white">{todayStats.total}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {activeTab === "profile" && <ProfileTab />}

          {/* Action Feedback Banner */}
          {actionFeedback && (
            <div className={`fixed top-4 right-4 z-[100] max-w-sm rounded-lg px-4 py-3 text-sm shadow-lg animate-in fade-in slide-in-from-top-2 ${
              actionFeedback.type === "success"
                ? "bg-emerald-500/90 text-white"
                : "bg-red-500/90 text-white"
            }`}>
              {actionFeedback.message}
            </div>
          )}

          {activeTab === "today" && (
            <div className="space-y-4">
              <TodaySignalPanel
                onNavigate={(tab) => handleNavClick(tab as typeof activeTab)}
              />
              <TodayTab
                initialBookings={initialTodaysBookings}
                services={services}
                orgId={membership.org_id}
                todayDate={todayDate}
                onFeedback={showFeedback}
                onRefresh={handleRefresh}
              />
            </div>
          )}

          {activeTab === "recent" && <RecentTab bookings={initialRecentBookings} />}

          {activeTab === "reports" && (
            <ReportsTab analyticsBookings={analyticsBookings} todayDate={todayDate} />
          )}

          {activeTab === "services" && (
            <ServicesTab
              initialServices={services}
              orgId={membership.org_id}
              onFeedback={showFeedback}
              onServicesChange={setServices}
            />
          )}

          {activeTab === "packages" && <PackagesTab />}

          {activeTab === "trainers" && (
            <TrainersTab
              initialTrainers={initialTrainers}
              orgId={membership.org_id}
              onFeedback={showFeedback}
            />
          )}

          {activeTab === "students" && (
          <StudentsTab
            students={students}
            studentsLoading={studentsLoading}
            studentTransactions={studentTransactions}
            onFetchStudents={fetchStudents}
            onAddStudent={async (form) => {
              try {
                const res = await fetch("/api/admin/students/add", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    org_id: membership.org_id,
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    creditType: form.creditType,
                    credits: form.credits,
                    paymentMethod: form.paymentMethod,
                    paymentAmount: form.paymentAmount,
                    notes: form.notes,
                  }),
                })
                const data = await res.json()
                if (res.ok) {
                  fetchStudents()
                  return { success: true }
                }
                return { success: false, error: data.error || "Failed to add student" }
              } catch {
                return { success: false, error: "Failed to add student" }
              }
            }}
            onAddCredits={async (studentId, form) => {
              try {
                const res = await fetch(`/api/admin/students/${studentId}/credits`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    org_id: membership.org_id,
                    credit_type: form.creditType,
                    credits: form.credits,
                    notes: form.notes,
                    payment_method: form.paymentMethod,
                    payment_amount_thb: form.paymentAmount,
                  }),
                })
                const data = await res.json()
                if (res.ok) {
                  fetchStudents()
                  return { success: true }
                }
                return { success: false, error: data.error || "Failed to add credits" }
              } catch {
                return { success: false, error: "Failed to add credits" }
              }
            }}
            onUseCredit={async (studentId, creditId) => {
              try {
                const res = await fetch(`/api/admin/students/${studentId}/credits`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    org_id: membership.org_id,
                    credit_id: creditId,
                    amount: -1,
                    description: "Session used",
                  }),
                })
                if (res.ok) {
                  showFeedback("success", "Credit used")
                  fetchStudents()
                } else {
                  const data = await res.json().catch(() => null)
                  showFeedback("error", data?.error || "Failed to use credit")
                }
              } catch {
                showFeedback("error", "Network error — couldn't deduct credit")
              }
            }}
          />
        )}


          {activeTab === "certificates" && <CertificatesTab role={membership.role} />}

          {activeTab === "time-slots" && (
            <TimeSlotsTab services={services.map(s => ({ id: s.id, name: s.name }))} />
          )}

          {activeTab === "settings" && (
            <SettingsTab
              organization={organization}
              orgSettings={initialOrgSettings}
              orgId={membership.org_id}
            />
          )}

          {activeTab === "marketing" && <MarketingTab orgId={membership.org_id} />}

          {activeTab === "train-ockock" && <TrainOckockTab />}

          {activeTab === "ockock" && <OckockChatTab orgId={membership.org_id} />}

          {activeTab === "inbox" && (
            <InboxTab
              role={membership.role}
              onGoToChannels={() => setActiveTab("channels")}
            />
          )}

          {activeTab === "channels" && <ChannelsTab role={membership.role} />}

          {activeTab === "courses" && <CoursesTab orgId={membership.org_id} />}
        </div>
      </main>
    </div>
  )
}
