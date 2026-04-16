"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import StudentsTab from "@/components/admin/students-tab"
import ProfileTab from "@/components/admin/profile-tab"
import SettingsTab from "@/components/admin/settings-tab"
import ReportsTab from "@/components/admin/reports-tab"
import TrainOckockTab from "@/components/admin/train-ockock-tab"
import OckockChatTab from "@/components/admin/ockock-chat-tab"
import MarketingTab from "@/components/admin/marketing-tab"
import InboxTab from "@/components/admin/inbox-tab"
import NotificationBell from "@/components/admin/notification-bell"
import {
  Calendar,
  Users,
  LogOut,
  Clock,
  Dumbbell,
  UserCheck,
  UserX,
  RefreshCw,
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  BarChart3,
  Banknote,
  Trash2,
  Settings,
  Mail,
  GraduationCap,
  Send,
  User,
  X,
  BookOpen,
  Menu,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Megaphone,
  Inbox,
} from "lucide-react"
import Image from "next/image"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { getTodayInPaiTimezone } from "@/lib/timezone"
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

const TIME_SLOTS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
]

const SERVICE_CATEGORIES = [
  { value: "training", label: "Training" },
  { value: "certificate", label: "Certificate" },
  { value: "membership", label: "Membership" },
  { value: "accommodation", label: "Accommodation" },
]

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
}: AdminDashboardProps) {
  const router = useRouter()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<
    "today" | "recent" | "services" | "trainers" | "reports" | "settings" | "ockock" | "students" | "profile" | "train-ockock" | "marketing" | "inbox"
  >("today")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [todaysBookings, setTodaysBookings] = useState(initialTodaysBookings)
  const [recentBookings, setRecentBookings] = useState(initialRecentBookings)
  const [services, setServices] = useState(initialServices)
  const [trainers, setTrainers] = useState(initialTrainers)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
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

  // Recent bookings search
  const [recentSearch, setRecentSearch] = useState("")

  // New Booking state
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false)
  const [isCreatingBooking, setIsCreatingBooking] = useState(false)
  const [newBookingForm, setNewBookingForm] = useState({
    serviceId: "",
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    bookingDate: getTodayInPaiTimezone(),
    bookingTime: "",
    paymentMethod: "cash" as "cash" | "stripe",
    isPaid: false,
  })
  const [bookingError, setBookingError] = useState("")

  // Service management state
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [isSavingService, setIsSavingService] = useState(false)
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    category: "training",
    price_thb: 0,
    duration_minutes: 60,
    requires_time_slot: true,
    is_active: true,
    is_featured: false,
  })
  const [serviceError, setServiceError] = useState("")

  const [isTrainerDialogOpen, setIsTrainerDialogOpen] = useState(false)
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null)
  const [isSavingTrainer, setIsSavingTrainer] = useState(false)
  const [trainerForm, setTrainerForm] = useState({
    display_name: "",
    title: "",
    bio: "",
    specialties: "",
    is_available: true,
    is_featured: false,
    years_experience: 0,
    fight_record_wins: 0,
    fight_record_losses: 0,
    fight_record_draws: 0,
  })
  const [trainerError, setTrainerError] = useState("")

  // Invite trainer state
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteName, setInviteName] = useState("")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState("")
  const [inviteSuccess, setInviteSuccess] = useState("")

  // Pending invites state
  const [pendingInvites, setPendingInvites] = useState<{ id: string; email: string; role: string; created_at: string; expires_at: string }[]>([])
  const [resendingInvite, setResendingInvite] = useState<string | null>(null)

  // Student state
  const [students, setStudents] = useState<Student[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentTransactions, setStudentTransactions] = useState<CreditTransaction[]>([])

  useEffect(() => {
    if (activeTab === "trainers") {
      fetchPendingInvites()
    }
    if (activeTab === "students" && students.length === 0) {
      fetchStudents()
    }
  }, [activeTab])

  const fetchPendingInvites = async () => {
    try {
      const res = await fetch("/api/admin/invites")
      if (res.ok) {
        const data = await res.json()
        setPendingInvites(data.invites || [])
      }
    } catch {
      // Non-critical
    }
  }

  const handleResendInvite = async (inviteId: string) => {
    setResendingInvite(inviteId)
    try {
      const res = await fetch("/api/admin/invites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_id: inviteId }),
      })
      if (res.ok) {
        showFeedback("success", "Invite resent")
        fetchPendingInvites()
      } else {
        showFeedback("error", "Failed to resend invite")
      }
    } catch {
      showFeedback("error", "Network error — couldn't resend invite")
    } finally {
      setResendingInvite(null)
    }
  }

  const handleCancelInvite = async (inviteId: string) => {
    try {
      const res = await fetch(`/api/admin/invites?id=${inviteId}`, { method: "DELETE" })
      if (res.ok) {
        setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId))
        showFeedback("success", "Invite cancelled")
      } else {
        showFeedback("error", "Failed to cancel invite")
      }
    } catch {
      showFeedback("error", "Network error — couldn't cancel invite")
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

  const openAddTrainer = () => {
    setEditingTrainer(null)
    setTrainerForm({
      display_name: "",
      title: "",
      bio: "",
      specialties: "",
      is_available: true,
      is_featured: false,
      years_experience: 0,
      fight_record_wins: 0,
      fight_record_losses: 0,
      fight_record_draws: 0,
    })
    setTrainerError("")
    setIsTrainerDialogOpen(true)
  }

  const openEditTrainer = (trainer: Trainer) => {
    setEditingTrainer(trainer)
    setTrainerForm({
      display_name: trainer.display_name,
      title: trainer.title || "",
      bio: trainer.bio || "",
      specialties: trainer.specialties?.join(", ") || "",
      is_available: trainer.is_available,
      is_featured: trainer.is_featured,
      years_experience: trainer.years_experience || 0,
      fight_record_wins: trainer.fight_record_wins || 0,
      fight_record_losses: trainer.fight_record_losses || 0,
      fight_record_draws: trainer.fight_record_draws || 0,
    })
    setTrainerError("")
    setIsTrainerDialogOpen(true)
  }

  const handleSaveTrainer = async () => {
    setTrainerError("")

    if (!trainerForm.display_name.trim()) {
      setTrainerError("Trainer name is required")
      return
    }

    setIsSavingTrainer(true)
    try {
      const specialtiesArray = trainerForm.specialties
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)

      const payload = {
        display_name: trainerForm.display_name.trim(),
        title: trainerForm.title.trim() || null,
        bio: trainerForm.bio.trim() || null,
        specialties: specialtiesArray,
        is_available: trainerForm.is_available,
        is_featured: trainerForm.is_featured,
        years_experience: trainerForm.years_experience,
        fight_record_wins: trainerForm.fight_record_wins,
        fight_record_losses: trainerForm.fight_record_losses,
        fight_record_draws: trainerForm.fight_record_draws,
      }

      if (editingTrainer) {
        const response = await fetch(`/api/admin/trainers/${editingTrainer.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, org_id: membership.org_id }), // Add orgId
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to update trainer")
        }

        const { trainer } = await response.json()
        setTrainers((prev) => prev.map((t) => (t.id === trainer.id ? trainer : t)))
      } else {
        const response = await fetch("/api/admin/trainers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, org_id: membership.org_id }), // Add orgId
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to add trainer")
        }

        const { trainer } = await response.json()
        setTrainers((prev) => [...prev, trainer])
      }

      setIsTrainerDialogOpen(false)
      router.refresh()
    } catch (error) {
      setTrainerError(error instanceof Error ? error.message : "Failed to save trainer")
    } finally {
      setIsSavingTrainer(false)
    }
  }

  const toggleTrainerAvailable = async (trainer: Trainer) => {
    setIsUpdating(trainer.id)
    try {
      const response = await fetch(`/api/admin/trainers/${trainer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_available: !trainer.is_available, org_id: membership.org_id }), // Add orgId
      })

      if (response.ok) {
        setTrainers((prev) => prev.map((t) => (t.id === trainer.id ? { ...t, is_available: !t.is_available } : t)))
      } else {
        showFeedback("error", "Failed to update trainer availability")
      }
    } catch {
      showFeedback("error", "Network error — couldn't update trainer")
    } finally {
      setIsUpdating(null)
    }
  }

  const deleteTrainer = async (trainerId: string) => {
    if (!confirm("Are you sure you want to remove this trainer?")) return

    setIsUpdating(trainerId)
    try {
      const response = await fetch(`/api/admin/trainers/${trainerId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: membership.org_id }), // Add orgId
      })

      if (response.ok) {
        setTrainers((prev) => prev.filter((t) => t.id !== trainerId))
        showFeedback("success", "Trainer removed")
      } else {
        showFeedback("error", "Failed to remove trainer")
      }
    } catch {
      showFeedback("error", "Network error — couldn't remove trainer")
    } finally {
      setIsUpdating(null)
    }
  }

  const handleSendInvite = async () => {
    setInviteError("")
    setInviteSuccess("")

    if (!inviteEmail.trim()) {
      setInviteError("Email is required")
      return
    }

    setInviteLoading(true)
    try {
      const response = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: "trainer",
          trainerName: inviteName.trim() || undefined,
          org_id: membership.org_id, // Add orgId
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invite")
      }

      setInviteSuccess(`Invite sent to ${inviteEmail}`)
      setInviteEmail("")
      setInviteName("")
      fetchPendingInvites()
      setTimeout(() => {
        setIsInviteDialogOpen(false)
        setInviteSuccess("")
      }, 2000)
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : "Failed to send invite")
    } finally {
      setInviteLoading(false)
    }
  }

  const openAddService = () => {
    setEditingService(null)
    setServiceForm({
      name: "",
      description: "",
      category: "training",
      price_thb: 0,
      duration_minutes: 60,
      requires_time_slot: true,
      is_active: true,
      is_featured: false,
    })
    setServiceError("")
    setIsServiceDialogOpen(true)
  }

  const openEditService = (service: Service) => {
    setEditingService(service)
    setServiceForm({
      name: service.name,
      description: service.description || "",
      category: service.category,
      price_thb: service.price_thb,
      duration_minutes: service.duration_minutes || 60,
      requires_time_slot: service.requires_time_slot,
      is_active: service.is_active,
      is_featured: service.is_featured,
    })
    setServiceError("")
    setIsServiceDialogOpen(true)
  }

  const handleSaveService = async () => {
    setServiceError("")

    if (!serviceForm.name.trim()) {
      setServiceError("Service name is required")
      return
    }
    if (serviceForm.price_thb <= 0) {
      setServiceError("Valid price is required")
      return
    }

    setIsSavingService(true)
    try {
      const payload = {
        name: serviceForm.name.trim(),
        description: serviceForm.description.trim() || null,
        category: serviceForm.category,
        price_thb: serviceForm.price_thb,
        duration_minutes: serviceForm.duration_minutes,
        requires_time_slot: serviceForm.requires_time_slot,
        is_active: serviceForm.is_active,
        is_featured: serviceForm.is_featured,
      }

      if (editingService) {
        // Update existing
        const response = await fetch(`/api/admin/services/${editingService.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, org_id: membership.org_id }), // Add orgId
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to update service")
        }

        const { service } = await response.json()
        setServices((prev) => prev.map((s) => (s.id === service.id ? service : s)))
      } else {
        // Create new
        const response = await fetch("/api/admin/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, org_id: membership.org_id }), // Add orgId
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to create service")
        }

        const { service } = await response.json()
        setServices((prev) => [...prev, service])
      }

      setIsServiceDialogOpen(false)
      router.refresh()
    } catch (error) {
      setServiceError(error instanceof Error ? error.message : "Failed to save service")
    } finally {
      setIsSavingService(false)
    }
  }

  const toggleServiceActive = async (service: Service) => {
    setIsUpdating(service.id)
    try {
      const response = await fetch(`/api/admin/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !service.is_active, org_id: membership.org_id }), // Add orgId
      })

      if (response.ok) {
        setServices((prev) => prev.map((s) => (s.id === service.id ? { ...s, is_active: !s.is_active } : s)))
      } else {
        showFeedback("error", "Failed to update service")
      }
    } catch {
      showFeedback("error", "Network error — couldn't update service")
    } finally {
      setIsUpdating(null)
    }
  }

  // Update booking status (mark arrived, no-show, etc.)
  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setIsUpdating(bookingId)
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, org_id: membership.org_id }), // Add orgId
      })

      if (response.ok) {
        setTodaysBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)))
        setRecentBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)))
      } else {
        showFeedback("error", "Failed to update booking status")
      }
    } catch {
      showFeedback("error", "Network error — couldn't update booking")
    } finally {
      setIsUpdating(null)
    }
  }

  // Mark payment as received (for cash payments)
  const markAsPaid = async (bookingId: string) => {
    setIsUpdating(bookingId)
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: "paid", org_id: membership.org_id }), // Add orgId
      })

      if (response.ok) {
        setTodaysBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, payment_status: "paid" } : b)))
        setRecentBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, payment_status: "paid" } : b)))
        showFeedback("success", "Payment recorded")
      } else {
        showFeedback("error", "Failed to record payment")
      }
    } catch {
      showFeedback("error", "Network error — couldn't record payment")
    } finally {
      setIsUpdating(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Confirmed</Badge>
      case "completed":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>
      case "cancelled":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Cancelled</Badge>
      case "no_show":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">No Show</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">{status}</Badge>
    }
  }

  const getPaymentBadge = (status: string, method: string | null) => {
    if (status === "paid") {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          {method === "cash" ? "Cash Paid" : "Paid"}
        </Badge>
      )
    }
    return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Pending</Badge>
  }

  const formatTime = (time: string | null) => {
    if (!time) return "No time"
    return time.slice(0, 5)
  }

  const formatDate = (date: string) => {
    return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const formatDisplayDate = (date: string) => {
    return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Calculate stats
  const todayStats = {
    total: todaysBookings.length,
    completed: todaysBookings.filter((b) => b.status === "completed").length,
    paid: todaysBookings.filter((b) => b.payment_status === "paid").length,
    revenue: todaysBookings
      .filter((b) => b.payment_status === "paid")
      .reduce((sum, b) => sum + (b.payment_amount_thb || 0), 0),
  }

  const handleCreateBooking = async () => {
    setBookingError("")

    // Validate required fields
    if (!newBookingForm.serviceId) {
      setBookingError("Please select a service")
      return
    }
    if (!newBookingForm.guestName.trim()) {
      setBookingError("Please enter customer name")
      return
    }
    if (!newBookingForm.bookingDate) {
      setBookingError("Please select a date")
      return
    }

    const selectedService = services.find((s) => s.id === newBookingForm.serviceId)
    if (!selectedService) {
      setBookingError("Invalid service selected")
      return
    }

    setIsCreatingBooking(true)
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: membership.org_id, // Use orgId from props
          service_id: newBookingForm.serviceId,
          guest_name: newBookingForm.guestName.trim(),
          guest_email: newBookingForm.guestEmail.trim() || null,
          guest_phone: newBookingForm.guestPhone.trim() || null,
          booking_date: newBookingForm.bookingDate,
          booking_time: newBookingForm.bookingTime || null,
          payment_method: newBookingForm.paymentMethod,
          payment_status: newBookingForm.isPaid ? "paid" : "pending",
          payment_amount_thb: selectedService.price_thb,
          payment_currency: "THB",
          status: "confirmed",
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create booking")
      }

      // Reset form and close dialog
      setNewBookingForm({
        serviceId: "",
        guestName: "",
        guestEmail: "",
        guestPhone: "",
        bookingDate: getTodayInPaiTimezone(),
        bookingTime: "",
        paymentMethod: "cash",
        isPaid: false,
      })
      setIsNewBookingOpen(false)
      showFeedback("success", "Booking created successfully")

      // Refresh data
      router.refresh()
      handleRefresh()
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : "Failed to create booking")
    } finally {
      setIsCreatingBooking(false)
    }
  }

  // Navigation items grouped by category
  const navGroups = [
    {
      label: "Operations",
      labelTh: "การดำเนินงาน",
      items: [
        { id: "today" as const, label: "Today", labelTh: "วันนี้", icon: Calendar },
        { id: "recent" as const, label: "Recent", labelTh: "ล่าสุด", icon: Clock },
        { id: "inbox" as const, label: "Inbox", labelTh: "กล่องข้อความ", icon: Inbox },
        { id: "students" as const, label: "Students", labelTh: "นักเรียน", icon: GraduationCap },
      ],
    },
    {
      label: "Business",
      labelTh: "ธุรกิจ",
      items: [
        { id: "reports" as const, label: "Reports", labelTh: "รายงาน", icon: BarChart3 },
        { id: "services" as const, label: "Services", labelTh: "บริการ", icon: Dumbbell },
        { id: "trainers" as const, label: "Trainers", labelTh: "ครูมวย", icon: Users },
      ],
    },
    {
      label: "AI Assistant",
      labelTh: "ผู้ช่วย AI",
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
        { id: "settings" as const, label: "Settings", labelTh: "ตั้งค่า", icon: Settings },
      ],
    },
  ]

  const handleNavClick = (tabId: typeof activeTab) => {
    setActiveTab(tabId)
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white overflow-x-hidden">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 bg-neutral-900/95 backdrop-blur border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 hover:bg-neutral-800 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-orange-500">{organization.name}</h1>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-out Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-neutral-900 border-r border-neutral-800 overflow-y-auto">
            <div className="p-4 border-b border-neutral-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-orange-500">{organization.name}</h2>
                  <p className="text-xs text-neutral-400">Admin Dashboard</p>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-neutral-800 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <nav className="p-2">
              {navGroups.map((group) => (
                <div key={group.label} className="mb-4">
                  <p className="px-3 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {group.label}
                  </p>
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        activeTab === item.id
                          ? "bg-orange-600 text-white"
                          : "text-neutral-300 hover:bg-neutral-800"
                      }`}
                    >
                      {item.icon === null ? (
                        <OckOckAvatar size={20} />
                      ) : item.icon ? (
                        <item.icon className="w-5 h-5" />
                      ) : null}
                      <span>{item.label}</span>
                      <span className="text-xs opacity-60">({item.labelTh})</span>
                    </button>
                  ))}
                </div>
              ))}
            </nav>
            <div className="p-4 border-t border-neutral-800">
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start text-neutral-400">
                <LogOut className="w-4 h-4 mr-2" /> Sign Out (ออกจากระบบ)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40 bg-neutral-900 border-r border-neutral-800 transition-all duration-300 ${
        sidebarCollapsed ? "w-16" : "w-56"
      }`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-neutral-800">
          {!sidebarCollapsed && (
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-bold text-orange-500 truncate">{organization.name}</h2>
                <p className="text-xs text-neutral-400">Admin Dashboard</p>
              </div>
              <NotificationBell />
            </div>
          )}
          {sidebarCollapsed && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-sm">
                {organization.name.charAt(0)}
              </div>
              <NotificationBell />
            </div>
          )}
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4">
              {!sidebarCollapsed && (
                <p className="px-3 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={sidebarCollapsed ? `${item.label} (${item.labelTh})` : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors mb-1 ${
                    activeTab === item.id
                      ? "bg-orange-600 text-white"
                      : "text-neutral-300 hover:bg-neutral-800"
                  } ${sidebarCollapsed ? "justify-center" : ""}`}
                >
                  {item.icon === null ? (
                    <OckOckAvatar size={20} />
                  ) : item.icon ? (
                    <item.icon className="w-5 h-5 shrink-0" />
                  ) : null}
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-2 border-t border-neutral-800">
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-400 hover:bg-neutral-800 transition-colors ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-2 rounded-lg text-neutral-500 hover:bg-neutral-800 transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-900 border-t border-neutral-800 px-2 py-2 safe-area-inset-bottom">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setActiveTab("today")}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg ${
              activeTab === "today" ? "text-orange-500" : "text-neutral-400"
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-xs">Today</span>
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg ${
              activeTab === "students" ? "text-orange-500" : "text-neutral-400"
            }`}
          >
            <GraduationCap className="w-5 h-5" />
            <span className="text-xs">Students</span>
          </button>
          <button
            onClick={() => setActiveTab("ockock")}
            className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl -mt-4 bg-orange-600 shadow-lg shadow-orange-600/30 ${
              activeTab === "ockock" ? "ring-2 ring-orange-400" : ""
            }`}
          >
            <OckOckAvatar size={28} />
            <span className="text-xs text-white font-medium">OckOck</span>
          </button>
          <button
            onClick={() => setActiveTab("marketing")}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg ${
              activeTab === "marketing" ? "text-orange-500" : "text-neutral-400"
            }`}
          >
            <Megaphone className="w-5 h-5" />
            <span className="text-xs">Marketing</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-neutral-400"
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-xs">More</span>
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

          {/* Today's Bookings Tab */}
          {activeTab === "today" && (
          <Card className="bg-neutral-900/50 border-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Today's Bookings (การจองวันนี้)</CardTitle>
                <CardDescription>
                  {todayDate} • {todaysBookings.length} bookings
                </CardDescription>
              </div>
              <Dialog open={isNewBookingOpen} onOpenChange={setIsNewBookingOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="h-4 w-4 mr-1 md:mr-2" />
                    <span className="hidden md:inline">New Booking</span>
                    <span className="md:hidden">New</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-neutral-900 border-neutral-700 max-w-md mx-4">
                  <DialogHeader>
                    <DialogTitle className="text-white">New Booking</DialogTitle>
                    <DialogDescription>Add a walk-in or phone booking</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* Service Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="service" className="text-neutral-200">
                        Service *
                      </Label>
                      <Select
                        value={newBookingForm.serviceId}
                        onValueChange={(value) => setNewBookingForm((prev) => ({ ...prev, serviceId: value }))}
                      >
                        <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-800 border-neutral-700">
                          {services
                            .filter((s) => s.is_active)
                            .map((service) => (
                              <SelectItem key={service.id} value={service.id} className="text-white">
                                {service.name} - ฿{service.price_thb.toLocaleString()}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Customer Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-neutral-200">
                        Customer Name *
                      </Label>
                      <Input
                        id="name"
                        value={newBookingForm.guestName}
                        onChange={(e) => setNewBookingForm((prev) => ({ ...prev, guestName: e.target.value }))}
                        placeholder="Enter name"
                        className="bg-neutral-800 border-neutral-700 text-white"
                      />
                    </div>

                    {/* Email (optional) */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-neutral-200">
                        Email (optional)
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={newBookingForm.guestEmail}
                        onChange={(e) => setNewBookingForm((prev) => ({ ...prev, guestEmail: e.target.value }))}
                        placeholder="customer@email.com"
                        className="bg-neutral-800 border-neutral-700 text-white"
                      />
                    </div>

                    {/* Phone (optional) */}
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-neutral-200">
                        Phone (optional)
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={newBookingForm.guestPhone}
                        onChange={(e) => setNewBookingForm((prev) => ({ ...prev, guestPhone: e.target.value }))}
                        placeholder="+66..."
                        className="bg-neutral-800 border-neutral-700 text-white"
                      />
                    </div>

                    {/* Date and Time Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="date" className="text-neutral-200">
                          Date *
                        </Label>
                        <Input
                          id="date"
                          type="date"
                          value={newBookingForm.bookingDate}
                          min={getTodayInPaiTimezone()}
                          onChange={(e) => setNewBookingForm((prev) => ({ ...prev, bookingDate: e.target.value }))}
                          className="bg-neutral-800 border-neutral-700 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time" className="text-neutral-200">
                          Time
                        </Label>
                        <Select
                          value={newBookingForm.bookingTime}
                          onValueChange={(value) => setNewBookingForm((prev) => ({ ...prev, bookingTime: value }))}
                        >
                          <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent className="bg-neutral-800 border-neutral-700">
                            {TIME_SLOTS.map((slot) => (
                              <SelectItem key={slot} value={slot} className="text-white">
                                {slot}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Payment Method Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-neutral-200">Payment</Label>
                        <Select
                          value={newBookingForm.paymentMethod}
                          onValueChange={(value: "cash" | "stripe") =>
                            setNewBookingForm((prev) => ({ ...prev, paymentMethod: value }))
                          }
                        >
                          <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-neutral-800 border-neutral-700">
                            <SelectItem value="cash" className="text-white">
                              Cash
                            </SelectItem>
                            <SelectItem value="stripe" className="text-white">
                              Card
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-200">Status</Label>
                        <div className="flex items-center h-10 gap-2">
                          <input
                            type="checkbox"
                            id="isPaid"
                            checked={newBookingForm.isPaid}
                            onChange={(e) => setNewBookingForm((prev) => ({ ...prev, isPaid: e.target.checked }))}
                            className="w-4 h-4 rounded border-neutral-600 bg-neutral-800"
                          />
                          <Label htmlFor="isPaid" className="text-neutral-300 text-sm">
                            Already paid
                          </Label>
                        </div>
                      </div>
                    </div>

                    {bookingError && <p className="text-red-400 text-sm">{bookingError}</p>}

                    <Button
                      onClick={handleCreateBooking}
                      disabled={isCreatingBooking}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      {isCreatingBooking ? "Creating..." : "Create Booking"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {todaysBookings.length === 0 ? (
                <div className="text-center py-8 text-neutral-400">No bookings today (ไม่มีการจองวันนี้)</div>
              ) : (
                <div className="space-y-3">
                  {todaysBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-neutral-800/50 rounded-lg gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-neutral-400">{booking.booking_time || "Any time"}</span>
                          <span className="font-medium text-white uppercase">{booking.guest_name}</span>
                        </div>
                        <p className="text-sm text-neutral-400">{booking.services?.name || "Service"}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-orange-400 font-medium">
                          {booking.payment_currency === "USD" ? "$" : "฿"}
                          {booking.payment_currency === "USD"
                            ? booking.payment_amount_usd?.toLocaleString()
                            : booking.payment_amount_thb?.toLocaleString()}
                        </span>
                        <Badge
                          variant={booking.payment_status === "paid" ? "default" : "outline"}
                          className={
                            booking.payment_status === "paid" ? "bg-green-600" : "border-amber-500 text-amber-500"
                          }
                        >
                          {booking.payment_status === "paid" ? "Paid (ชำระแล้ว)" : "Pending (รอชำระ)"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            booking.status === "completed"
                              ? "border-green-500 text-green-500"
                              : booking.status === "no_show"
                                ? "border-red-500 text-red-500"
                                : "border-neutral-500"
                          }
                        >
                          {booking.status === "completed"
                            ? "Arrived (มาถึง)"
                            : booking.status === "no_show"
                              ? "No Show (ไม่มา)"
                              : "Confirmed (ยืนยัน)"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        {booking.status !== "completed" && booking.status !== "no_show" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateBookingStatus(booking.id, "completed")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <UserCheck className="w-4 h-4 mr-1" /> Arrived (มาถึง)
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateBookingStatus(booking.id, "no_show")}
                              className="border-red-600 text-red-500 hover:bg-red-600 hover:text-white"
                            >
                              <UserX className="w-4 h-4 mr-1" /> No Show (ไม่มา)
                            </Button>
                          </>
                        )}
                        {booking.payment_status !== "paid" && booking.payment_method === "cash" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsPaid(booking.id)}
                            className="border-amber-600 text-amber-500 hover:bg-amber-600 hover:text-white"
                          >
                            <Banknote className="w-4 h-4 mr-1" /> Mark Paid (ชำระแล้ว)
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

          {activeTab === "recent" && (
          <Card className="bg-neutral-900/50 border-neutral-800">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-white">Recent Bookings</CardTitle>
                  <CardDescription>Last 7 days</CardDescription>
                </div>
                <Input
                  placeholder="Search by name or service..."
                  value={recentSearch}
                  onChange={(e) => setRecentSearch(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white md:max-w-[260px]"
                />
              </div>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <div className="text-center py-12 text-neutral-400">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent bookings</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentBookings
                    .filter((booking) => {
                      if (!recentSearch.trim()) return true
                      const q = recentSearch.toLowerCase()
                      return (
                        (booking.guest_name || "").toLowerCase().includes(q) ||
                        (booking.services?.name || "").toLowerCase().includes(q)
                      )
                    })
                    .map((booking) => (
                    <div
                      key={booking.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg bg-neutral-800/50 border border-neutral-700 gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[80px]">
                          <p className="text-sm font-medium text-neutral-300">{formatDate(booking.booking_date)}</p>
                          <p className="text-xs text-neutral-500">{formatTime(booking.booking_time)}</p>
                        </div>
                        <div>
                          <p className="font-medium text-white">{booking.guest_name || "Guest"}</p>
                          <p className="text-sm text-neutral-400">{booking.services?.name || "Unknown Service"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* CHANGE: Show correct currency based on payment method */}
                        {(booking.payment_amount_thb || booking.payment_amount_usd) && (
                          <span className="text-sm text-amber-400 font-medium">
                            {booking.payment_currency === "USD" || booking.payment_method === "stripe"
                              ? `$${(booking.payment_amount_usd || booking.payment_amount_thb || 0).toLocaleString()}`
                              : `฿${(booking.payment_amount_thb || 0).toLocaleString()}`}
                          </span>
                        )}
                        {getPaymentBadge(booking.payment_status, booking.payment_method)}
                        {getStatusBadge(booking.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

          {activeTab === "reports" && (
            <ReportsTab analyticsBookings={analyticsBookings} todayDate={todayDate} />
          )}

          {/* OLD reports removed - keeping marker for reference */}

          {/* Services tab with add/edit/toggle functionality */}
          {activeTab === "services" && (
          <Card className="bg-neutral-900/50 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Services</CardTitle>
              <CardDescription>Manage services and pricing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border gap-4 ${
                      service.is_active
                        ? "bg-neutral-800/50 border-neutral-700"
                        : "bg-neutral-800/20 border-neutral-800 opacity-60"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{service.name}</p>
                        {service.is_featured && (
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                            Featured
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-neutral-400 capitalize">{service.category}</p>
                      {service.duration_minutes && (
                        <p className="text-xs text-neutral-500">{service.duration_minutes} minutes</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-amber-400">฿{service.price_thb.toLocaleString()}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditService(service)}
                        className="border-neutral-700 hover:bg-neutral-800"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleServiceActive(service)}
                        disabled={isUpdating === service.id}
                        className={
                          service.is_active
                            ? "border-green-700 text-green-400 hover:bg-green-900/30"
                            : "border-red-700 text-red-400 hover:bg-red-900/30"
                        }
                      >
                        {service.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

          {/* Service Add/Edit Dialog */}
        <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
          <DialogContent className="bg-neutral-900 border-neutral-700 max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="text-white">{editingService ? "Edit Service" : "Add Service"}</DialogTitle>
              <DialogDescription>
                {editingService ? "Update service details" : "Create a new service"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-neutral-200">Service Name *</Label>
                <Input
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Private Lesson"
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-200">Category</Label>
                <Select
                  value={serviceForm.category}
                  onValueChange={(value) => setServiceForm((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {SERVICE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className="text-white">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-neutral-200">Price (THB) *</Label>
                  <Input
                    type="number"
                    value={serviceForm.price_thb}
                    onChange={(e) =>
                      setServiceForm((prev) => ({ ...prev, price_thb: Number.parseInt(e.target.value) || 0 }))
                    }
                    placeholder="500"
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-200">Duration (min)</Label>
                  <Input
                    type="number"
                    value={serviceForm.duration_minutes}
                    onChange={(e) =>
                      setServiceForm((prev) => ({ ...prev, duration_minutes: Number.parseInt(e.target.value) || 0 }))
                    }
                    placeholder="60"
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-200">Description</Label>
                <Input
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="requiresTimeSlot"
                    checked={serviceForm.requires_time_slot}
                    onChange={(e) => setServiceForm((prev) => ({ ...prev, requires_time_slot: e.target.checked }))}
                    className="w-4 h-4 rounded border-neutral-600 bg-neutral-800"
                  />
                  <Label htmlFor="requiresTimeSlot" className="text-neutral-300 text-sm">
                    Requires time slot
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={serviceForm.is_featured}
                    onChange={(e) => setServiceForm((prev) => ({ ...prev, is_featured: e.target.checked }))}
                    className="w-4 h-4 rounded border-neutral-600 bg-neutral-800"
                  />
                  <Label htmlFor="isFeatured" className="text-neutral-300 text-sm">
                    Featured
                  </Label>
                </div>
              </div>

              {serviceError && <p className="text-red-400 text-sm">{serviceError}</p>}

              <Button
                onClick={handleSaveService}
                disabled={isSavingService}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {isSavingService ? "Saving..." : editingService ? "Update Service" : "Add Service"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

          {activeTab === "trainers" && (
          <Card className="bg-neutral-900/50 border-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Trainers</CardTitle>
                <CardDescription>Manage your gym's trainers</CardDescription>
              </div>
              <div className="flex gap-2">
                {/* Invite Trainer Dialog */}
                <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                      <Mail className="h-4 w-4" />
                      <span className="hidden sm:inline">Invite</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle>Invite Trainer</DialogTitle>
                      <DialogDescription>Send an email invite to a trainer to join your gym</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="invite-email">Email *</Label>
                        <Input
                          id="invite-email"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="trainer@email.com"
                          className="bg-background/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invite-name">Name (optional)</Label>
                        <Input
                          id="invite-name"
                          value={inviteName}
                          onChange={(e) => setInviteName(e.target.value)}
                          placeholder="e.g. Kru Somchai"
                          className="bg-background/50"
                        />
                      </div>

                      {inviteError && <p className="text-sm text-destructive">{inviteError}</p>}
                      {inviteSuccess && <p className="text-sm text-green-500">{inviteSuccess}</p>}

                      <Button
                        onClick={handleSendInvite}
                        disabled={inviteLoading || !inviteEmail.trim()}
                        className="w-full bg-primary hover:bg-primary/90"
                      >
                        {inviteLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Invite
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Add Trainer Dialog */}
                <Dialog open={isTrainerDialogOpen} onOpenChange={setIsTrainerDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={openAddTrainer}>
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Add Trainer</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-neutral-900 border-neutral-700 max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-white">
                        {editingTrainer ? "Edit Trainer" : "Add Trainer"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingTrainer ? "Update trainer profile" : "Create a new trainer profile"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label className="text-neutral-200">Display Name *</Label>
                        <Input
                          value={trainerForm.display_name}
                          onChange={(e) => setTrainerForm((prev) => ({ ...prev, display_name: e.target.value }))}
                          placeholder="e.g. Kru Wisarut"
                          className="bg-neutral-800 border-neutral-700 text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-neutral-200">Title</Label>
                        <Input
                          value={trainerForm.title}
                          onChange={(e) => setTrainerForm((prev) => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g. Head Trainer"
                          className="bg-neutral-800 border-neutral-700 text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-neutral-200">Bio</Label>
                        <Textarea
                          value={trainerForm.bio}
                          onChange={(e) => setTrainerForm((prev) => ({ ...prev, bio: e.target.value }))}
                          placeholder="Brief bio about the trainer..."
                          className="bg-neutral-800 border-neutral-700 text-white min-h-[80px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-neutral-200">Specialties</Label>
                        <Input
                          value={trainerForm.specialties}
                          onChange={(e) => setTrainerForm((prev) => ({ ...prev, specialties: e.target.value }))}
                          placeholder="e.g. Muay Femur, Clinch Work, Pad Holding"
                          className="bg-neutral-800 border-neutral-700 text-white"
                        />
                        <p className="text-xs text-neutral-500">Separate with commas</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-neutral-200">Years Experience</Label>
                        <Input
                          type="number"
                          value={trainerForm.years_experience}
                          onChange={(e) =>
                            setTrainerForm((prev) => ({
                              ...prev,
                              years_experience: Number.parseInt(e.target.value) || 0,
                            }))
                          }
                          placeholder="e.g. 15"
                          className="bg-neutral-800 border-neutral-700 text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-neutral-200">Fight Record</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs text-neutral-400">Wins</Label>
                            <Input
                              type="number"
                              value={trainerForm.fight_record_wins}
                              onChange={(e) =>
                                setTrainerForm((prev) => ({
                                  ...prev,
                                  fight_record_wins: Number.parseInt(e.target.value) || 0,
                                }))
                              }
                              placeholder="0"
                              className="bg-neutral-800 border-neutral-700 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-neutral-400">Losses</Label>
                            <Input
                              type="number"
                              value={trainerForm.fight_record_losses}
                              onChange={(e) =>
                                setTrainerForm((prev) => ({
                                  ...prev,
                                  fight_record_losses: Number.parseInt(e.target.value) || 0,
                                }))
                              }
                              placeholder="0"
                              className="bg-neutral-800 border-neutral-700 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-neutral-400">Draws</Label>
                            <Input
                              type="number"
                              value={trainerForm.fight_record_draws}
                              onChange={(e) =>
                                setTrainerForm((prev) => ({
                                  ...prev,
                                  fight_record_draws: Number.parseInt(e.target.value) || 0,
                                }))
                              }
                              placeholder="0"
                              className="bg-neutral-800 border-neutral-700 text-white"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="trainerAvailable"
                            checked={trainerForm.is_available}
                            onChange={(e) => setTrainerForm((prev) => ({ ...prev, is_available: e.target.checked }))}
                            className="w-4 h-4 rounded border-neutral-600 bg-neutral-800"
                          />
                          <Label htmlFor="trainerAvailable" className="text-neutral-300 text-sm">
                            Available
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="trainerFeatured"
                            checked={trainerForm.is_featured}
                            onChange={(e) => setTrainerForm((prev) => ({ ...prev, is_featured: e.target.checked }))}
                            className="w-4 h-4 rounded border-neutral-600 bg-neutral-800"
                          />
                          <Label htmlFor="trainerFeatured" className="text-neutral-300 text-sm">
                            Featured
                          </Label>
                        </div>
                      </div>

                      {trainerError && <p className="text-red-400 text-sm">{trainerError}</p>}

                      <Button
                        onClick={handleSaveTrainer}
                        disabled={isSavingTrainer}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                      >
                        {isSavingTrainer ? "Saving..." : editingTrainer ? "Update Trainer" : "Add Trainer"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {trainers.length === 0 ? (
                <div className="text-center py-12 text-neutral-400">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No trainers added yet</p>
                  <p className="text-sm mt-2">Click "Add Trainer" to create your first trainer profile</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {trainers.map((trainer) => (
                    <div
                      key={trainer.id}
                      className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border gap-4 ${
                        trainer.is_available
                          ? "bg-neutral-800/50 border-neutral-700"
                          : "bg-neutral-800/20 border-neutral-800 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-14 h-14 rounded-full bg-neutral-700 border-2 border-neutral-600 overflow-hidden flex-shrink-0">
                          {trainer.photo_url ? (
                            <Image
                              src={trainer.photo_url || "/placeholder.svg"}
                              alt={trainer.display_name}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-500">
                              <User className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white">{trainer.display_name}</p>
                            {trainer.is_featured && (
                              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                                Featured
                              </Badge>
                            )}
                          </div>
                          {trainer.title && <p className="text-sm text-neutral-400">{trainer.title}</p>}
                        {trainer.specialties && trainer.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {trainer.specialties.slice(0, 3).map((spec, i) => (
                              <Badge key={i} variant="outline" className="text-xs border-neutral-600 text-neutral-400">
                                {spec}
                              </Badge>
                            ))}
                            {trainer.specialties.length > 3 && (
                              <Badge variant="outline" className="text-xs border-neutral-600 text-neutral-400">
                                +{trainer.specialties.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                          {(trainer.fight_record_wins > 0 ||
                            trainer.fight_record_losses > 0 ||
                            trainer.fight_record_draws > 0) && (
                            <p className="text-xs text-neutral-500 mt-1">
                              Record: {trainer.fight_record_wins}W - {trainer.fight_record_losses}L -{" "}
                              {trainer.fight_record_draws}D
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            trainer.is_available
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-red-500/20 text-red-400 border-red-500/30"
                          }
                        >
                          {trainer.is_available ? "Available" : "Unavailable"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditTrainer(trainer)}
                          className="border-neutral-700 hover:bg-neutral-800"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleTrainerAvailable(trainer)}
                          disabled={isUpdating === trainer.id}
                          className={
                            trainer.is_available
                              ? "border-green-700 text-green-400 hover:bg-green-900/30"
                              : "border-red-700 text-red-400 hover:bg-red-900/30"
                          }
                        >
                          {trainer.is_available ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteTrainer(trainer.id)}
                          disabled={isUpdating === trainer.id}
                          className="border-red-700 text-red-400 hover:bg-red-900/30"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

          {activeTab === "trainers" && pendingInvites.length > 0 && (
            <Card className="bg-neutral-900/50 border-neutral-800 mt-4">
              <CardHeader>
                <CardTitle className="text-sm text-neutral-400">Pending Invites</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingInvites.map((inv) => {
                    const isExpired = new Date(inv.expires_at) < new Date()
                    return (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-800/30 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm text-white">{inv.email}</p>
                          <p className="text-xs text-neutral-500">
                            {isExpired ? (
                              <span className="text-red-400">Expired</span>
                            ) : (
                              <>Sent {new Date(inv.created_at).toLocaleDateString()}</>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResendInvite(inv.id)}
                            disabled={resendingInvite === inv.id}
                            className="border-neutral-700 hover:bg-neutral-800 text-xs"
                          >
                            {resendingInvite === inv.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <>{isExpired ? "Resend" : "Resend"}</>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelInvite(inv.id)}
                            className="border-red-700/50 text-red-400 hover:bg-red-900/30 text-xs"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
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

          {activeTab === "inbox" && <InboxTab role={membership.role} />}
        </div>
      </main>
    </div>
  )
}
