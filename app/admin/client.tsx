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
import {
  Calendar,
  Users,
  CreditCard,
  LogOut,
  CheckCircle,
  Clock,
  TrendingUp,
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
  Wallet,
  Trash2,
  Settings,
  Save,
  Mail,
  GraduationCap,
  Minus,
  History,
  Send,
  User,
  Camera,
  X,
  BookOpen,
  MessageSquare,
  Copy,
  Sparkles,
  Menu,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react"
import Image from "next/image"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { getTodayInPaiTimezone } from "@/lib/timezone"

// Define CreditTransaction type if it's not imported from anywhere else
interface CreditTransaction {
  id: string
  user_id: string | null // or the actual user ID type
  amount: number
  transaction_type: string
  description: string | null
  created_at: string
  org_id: string
  payment_method: string | null
  payment_amount_thb: number | null
  payment_amount_usd: number | null
  payment_currency: string | null
  users?: {
    // Assuming 'users' is a joined table or relation
    id: string
    full_name: string | null
    display_name: string | null
    email: string | null
    phone: string | null
  }
}

const OckOckAvatar = ({ size = 32 }: { size?: number }) => (
  <Image src="/images/ockock-avatar.png" alt="OckOck" width={size} height={size} className="rounded-full" />
)

interface TrainerProfile {
  id: string
  user_id: string
  display_name: string
  title: string | null
  bio: string | null
  photo_url: string | null
  photos: string[]
  is_available: boolean
  availability_note: string | null
  years_experience: number | null
  fight_record_wins: number
  fight_record_losses: number
  fight_record_draws: number
  open_to_fights: boolean
  open_to_events: boolean
}

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  is_active: boolean
  usage_count: number
  created_at: string
}

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
    "today" | "recent" | "services" | "trainers" | "reports" | "settings" | "ockock" | "students" | "profile" | "train-ockock"
  >("today")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [todaysBookings, setTodaysBookings] = useState(initialTodaysBookings)
  const [recentBookings, setRecentBookings] = useState(initialRecentBookings)
  const [services, setServices] = useState(initialServices)
  const [trainers, setTrainers] = useState(initialTrainers)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

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

  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [settingsSuccess, setSettingsSuccess] = useState(false)
  const [orgSettings, setOrgSettings] = useState(initialOrgSettings)
  const [settingsForm, setSettingsForm] = useState({
    // Org details
    name: organization.name || "",
    description: initialOrgSettings?.description || "",
    email: initialOrgSettings?.email || "",
    phone: initialOrgSettings?.phone || "",
    whatsapp: initialOrgSettings?.whatsapp || "",
    address: initialOrgSettings?.address || "",
    city: initialOrgSettings?.city || "",
    province: initialOrgSettings?.province || "",
    instagram: initialOrgSettings?.instagram || "",
    facebook: initialOrgSettings?.facebook || "",
    website: initialOrgSettings?.website || "",
    // Booking settings
    booking_advance_days: initialOrgSettings?.booking_advance_days ?? 1,
    booking_max_days_ahead: initialOrgSettings?.booking_max_days_ahead ?? 60,
    allow_guest_bookings: initialOrgSettings?.allow_guest_bookings ?? true,
    require_payment_upfront: initialOrgSettings?.require_payment_upfront ?? false,
    notify_on_booking_email: initialOrgSettings?.notify_on_booking_email ?? true,
    notification_email: initialOrgSettings?.notification_email || "",
    show_prices: initialOrgSettings?.show_prices ?? true,
    show_trainer_selection: initialOrgSettings?.show_trainer_selection ?? true,
  })

  // Train OckOck / FAQ state
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [faqsLoading, setFaqsLoading] = useState(false)
  const [newFaqForm, setNewFaqForm] = useState({ question: "", answer: "", category: "general" })
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null)
  const [isSavingFaq, setIsSavingFaq] = useState(false)
  const [quickReplyInput, setQuickReplyInput] = useState("")
  const [quickReplyResponse, setQuickReplyResponse] = useState("")
  const [isGeneratingReply, setIsGeneratingReply] = useState(false)
  const faqCategories = [
    { value: "pricing", label: "Pricing (ราคา)" },
    { value: "schedule", label: "Schedule (ตารางเวลา)" },
    { value: "location", label: "Location (สถานที่)" },
    { value: "training", label: "Training (การฝึก)" },
    { value: "booking", label: "Booking (จอง)" },
    { value: "general", label: "General (ทั่วไป)" },
  ]

  // Student state
  const [students, setStudents] = useState<Student[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
  const [isAddCreditsOpen, setIsAddCreditsOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentError, setStudentError] = useState("")
  const [isSavingStudent, setIsSavingStudent] = useState(false)
  const [studentTransactions, setStudentTransactions] = useState<CreditTransaction[]>([]) // Keep this for now, might be refactored later

  const [newStudentForm, setNewStudentForm] = useState({
    email: "",
    name: "",
    phone: "", // Added phone to newStudentForm
    creditType: "private_session",
    credits: 1,
    notes: "",
    paymentMethod: "cash",
    paymentAmount: 0,
  })

  const [addCreditsForm, setAddCreditsForm] = useState({
    creditType: "private_session",
    credits: 1,
    notes: "",
    paymentMethod: "cash",
    paymentAmount: 0,
  })

  // OckOck chat state
  const [ockockMessages, setOckockMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([])
  const [ockockInput, setOckockInput] = useState("")
  const [ockockLoading, setOckockLoading] = useState(false)

  const [myProfile, setMyProfile] = useState<TrainerProfile | null>(null)
  const [myProfileLoading, setMyProfileLoading] = useState(false)
  const [myProfileSaving, setMyProfileSaving] = useState(false)
  const [myProfileForm, setMyProfileForm] = useState({
    display_name: "",
    title: "",
    bio: "",
    specialties: "",
    photo_url: "",
    photos: [] as string[],
    is_available: true,
    availability_note: "",
    years_experience: 0,
    fight_record_wins: 0,
    fight_record_losses: 0,
    fight_record_draws: 0,
    open_to_fights: false,
    open_to_events: false,
  })
  const [newPhotoUrl, setNewPhotoUrl] = useState("")

  useEffect(() => {
    if (activeTab === "profile") {
      fetchMyProfile()
    }
  }, [activeTab])

  const fetchMyProfile = async () => {
    setMyProfileLoading(true)
    try {
      const response = await fetch("/api/trainer/profile")
      const data = await response.json()
      if (data.profile) {
        setMyProfile(data.profile)
        setMyProfileForm({
          display_name: data.profile.display_name || "",
          title: data.profile.title || "",
          bio: data.profile.bio || "",
          specialties: data.profile.specialties?.join(", ") || "",
          photo_url: data.profile.photo_url || "",
          photos: data.profile.photos || [],
          is_available: data.profile.is_available ?? true,
          availability_note: data.profile.availability_note || "",
          years_experience: data.profile.years_experience || 0,
          fight_record_wins: data.profile.fight_record_wins || 0,
          fight_record_losses: data.profile.fight_record_losses || 0,
          fight_record_draws: data.profile.fight_record_draws || 0,
          open_to_fights: data.profile.open_to_fights ?? false,
          open_to_events: data.profile.open_to_events ?? false,
        })
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setMyProfileLoading(false)
    }
  }

  const saveMyProfile = async () => {
    setMyProfileSaving(true)
    try {
      const response = await fetch("/api/trainer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: myProfileForm.display_name,
          title: myProfileForm.title,
          bio: myProfileForm.bio,
          specialties: myProfileForm.specialties
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          photo_url: myProfileForm.photos[0] || myProfileForm.photo_url,
          photos: myProfileForm.photos,
          is_available: myProfileForm.is_available,
          availability_note: myProfileForm.availability_note,
          years_experience: myProfileForm.years_experience,
          fight_record_wins: myProfileForm.fight_record_wins,
          fight_record_losses: myProfileForm.fight_record_losses,
          fight_record_draws: myProfileForm.fight_record_draws,
          open_to_fights: myProfileForm.open_to_fights,
          open_to_events: myProfileForm.open_to_events,
        }),
      })
      if (response.ok) {
        await fetchMyProfile()
      }
    } catch (error) {
      console.error("Error saving profile:", error)
    } finally {
      setMyProfileSaving(false)
    }
  }

  const addPhoto = () => {
    if (newPhotoUrl && myProfileForm.photos.length < 5) {
      setMyProfileForm({
        ...myProfileForm,
        photos: [...myProfileForm.photos, newPhotoUrl],
      })
      setNewPhotoUrl("")
    }
  }

  const removePhoto = (index: number) => {
    setMyProfileForm({
      ...myProfileForm,
      photos: myProfileForm.photos.filter((_, i) => i !== index),
    })
  }

  useEffect(() => {
    if (activeTab === "students" && students.length === 0) {
      fetchStudents()
    }
  }, [activeTab])

  // Load FAQs when Train OckOck tab is active
  useEffect(() => {
    if (activeTab === "train-ockock" && faqs.length === 0) {
      fetchFaqs()
    }
  }, [activeTab])

  const fetchFaqs = async () => {
    setFaqsLoading(true)
    try {
      const res = await fetch("/api/admin/faqs")
      if (res.ok) {
        const data = await res.json()
        setFaqs(data.faqs || [])
      }
    } catch (error) {
      console.error("Failed to fetch FAQs:", error)
    }
    setFaqsLoading(false)
  }

  const handleSaveFaq = async () => {
    if (!newFaqForm.question || !newFaqForm.answer) return
    setIsSavingFaq(true)
    try {
      const res = await fetch("/api/admin/faqs", {
        method: editingFaq ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingFaq ? { ...newFaqForm, id: editingFaq.id } : newFaqForm),
      })
      if (res.ok) {
        setNewFaqForm({ question: "", answer: "", category: "general" })
        setEditingFaq(null)
        fetchFaqs()
      }
    } catch (error) {
      console.error("Failed to save FAQ:", error)
    }
    setIsSavingFaq(false)
  }

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return
    try {
      const res = await fetch(`/api/admin/faqs?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        fetchFaqs()
      }
    } catch (error) {
      console.error("Failed to delete FAQ:", error)
    }
  }

  const handleToggleFaq = async (faq: FAQ) => {
    try {
      const res = await fetch("/api/admin/faqs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: faq.id, is_active: !faq.is_active }),
      })
      if (res.ok) {
        fetchFaqs()
      }
    } catch (error) {
      console.error("Failed to toggle FAQ:", error)
    }
  }

  const handleQuickReply = async () => {
    if (!quickReplyInput.trim()) return
    setIsGeneratingReply(true)
    setQuickReplyResponse("")
    try {
      const res = await fetch("/api/admin/quick-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerMessage: quickReplyInput }),
      })
      if (res.ok) {
        const data = await res.json()
        setQuickReplyResponse(data.response)
      }
    } catch (error) {
      console.error("Failed to generate reply:", error)
      setQuickReplyResponse("Sorry, could not generate a response. Please try again.")
    }
    setIsGeneratingReply(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
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
    } catch (error) {
      console.error("Failed to fetch students:", error)
    }
    setStudentsLoading(false)
  }

  const handleAddStudent = async () => {
    setStudentError("")

    if (!newStudentForm.name.trim() || !newStudentForm.email.trim()) {
      setStudentError("Name and email are required")
      return
    }

    setIsSavingStudent(true)
    try {
      const res = await fetch("/api/admin/students/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: membership.org_id, // Use orgId from props
          name: newStudentForm.name,
          email: newStudentForm.email,
          phone: newStudentForm.phone,
          creditType: newStudentForm.creditType,
          credits: Number.parseInt(newStudentForm.credits.toString()) || 0,
          paymentMethod: newStudentForm.paymentMethod,
          paymentAmount: Number.parseInt(newStudentForm.paymentAmount.toString()) || 0,
          notes: newStudentForm.notes,
        }),
      })

      if (res.ok) {
        setIsAddStudentOpen(false)
        setNewStudentForm({
          email: "",
          name: "",
          phone: "", // Reset phone
          creditType: "private_session",
          credits: 1,
          notes: "",
          paymentMethod: "cash",
          paymentAmount: 0,
        })
        fetchStudents()
      } else {
        const data = await res.json()
        setStudentError(data.error || "Failed to add student")
      }
    } catch (error) {
      setStudentError("Failed to add student")
    }
    setIsSavingStudent(false)
  }

  const handleAddCredits = async () => {
    if (!selectedStudent) return
    setStudentError("")

    if (!addCreditsForm.credits || Number.parseInt(addCreditsForm.credits.toString()) <= 0) {
      setStudentError("Enter a valid number of credits")
      return
    }

    setIsSavingStudent(true)
    try {
      const res = await fetch(`/api/admin/students/${selectedStudent.id}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: membership.org_id, // Use orgId from props
          creditType: addCreditsForm.creditType,
          credits: Number.parseInt(addCreditsForm.credits.toString()),
          paymentMethod: addCreditsForm.paymentMethod,
          paymentAmount: Number.parseInt(addCreditsForm.paymentAmount.toString()) || 0,
          notes: addCreditsForm.notes,
        }),
      })

      if (res.ok) {
        setIsAddCreditsOpen(false)
        setSelectedStudent(null)
        setAddCreditsForm({
          creditType: "private_session",
          credits: 1,
          notes: "",
          paymentMethod: "cash",
          paymentAmount: 0,
        })
        fetchStudents()
      } else {
        const data = await res.json()
        setStudentError(data.error || "Failed to add credits")
      }
    } catch (error) {
      setStudentError("Failed to add credits")
    }
    setIsSavingStudent(false)
  }

  const handleUseCredit = async (studentId: string, creditId: string) => {
    try {
      const response = await fetch(`/api/admin/students/${studentId}/credits`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credit_id: creditId,
          amount: -1,
          description: "Session used",
          org_id: membership.org_id,
        }),
      })
      if (response.ok) {
        fetchStudents()
      }
    } catch (error) {
      console.error("Failed to use credit:", error)
    }
  }

  const handleDeductSession = async (student: Student) => {
    if (!student.credits || student.credits.length === 0) return

    // Find the first available credit type (e.g., sessions, private_session)
    let creditToUse = student.credits.find((c) => c.credit_type === "sessions" || c.credit_type === "private_session")
    if (!creditToUse && student.credits.length > 0) {
      creditToUse = student.credits[0] // Fallback to the first credit type if none match
    }

    if (!creditToUse || creditToUse.credits_remaining <= 0) {
      alert("No available credits to deduct.")
      return
    }

    try {
      const response = await fetch(`/api/admin/students/${student.id}/credits`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: membership.org_id, // Use orgId from props
          credit_id: creditToUse.id,
          amount: -1,
          description: "Session attended",
        }),
      })

      if (response.ok) {
        fetchStudents()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to deduct session.")
      }
    } catch (error) {
      console.error("Failed to deduct session:", error)
      alert("Failed to deduct session. Please try again.")
    }
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
      }
    } catch (error) {
      console.error("Failed to toggle trainer availability:", error)
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
      }
    } catch (error) {
      console.error("Failed to delete trainer:", error)
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
      }
    } catch (error) {
      console.error("Failed to toggle service:", error)
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
        // Update local state
        setTodaysBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)))
        setRecentBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)))
      }
    } catch (error) {
      console.error("Failed to update booking:", error)
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
      }
    } catch (error) {
      console.error("Failed to mark as paid:", error)
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

  // Analytics calculations
  const calculatePeriodStats = (bookings: AnalyticsBooking[], days: number) => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const cutoffStr = cutoff.toISOString().split("T")[0]

    const periodBookings = bookings.filter((b) => b.booking_date >= cutoffStr)
    const paidBookings = periodBookings.filter((b) => b.payment_status === "paid")

    const cashBookings = paidBookings.filter((b) => b.payment_method === "cash")
    const cardBookings = paidBookings.filter(
      (b) => b.payment_method === "stripe" || b.payment_method === "card" || b.payment_currency === "USD",
    )

    const sum = (arr: AnalyticsBooking[]) => arr.reduce((s, b) => s + (b.payment_amount_thb || 0), 0)
    const sumUsd = (arr: AnalyticsBooking[]) => arr.reduce((s, b) => s + (b.payment_amount_usd || 0), 0)

    return {
      total: periodBookings.length,
      paid: paidBookings.length,
      cashCount: cashBookings.length,
      cardCount: cardBookings.length,
      cashRevenue: sum(cashBookings),
      cardRevenue: sumUsd(cardBookings), // Assuming card payments might be in USD
    }
  }

  const weekStats = calculatePeriodStats(analyticsBookings, 7)
  const monthStats = calculatePeriodStats(analyticsBookings, 30)

  const calculateAnalytics = () => {
    const today = todayDate // Use todayDate from props
    const todayDateObj = new Date(today + "T00:00:00")

    // Get start of week (Monday)
    const startOfWeek = new Date(todayDateObj)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Adjust to start on Monday
    startOfWeek.setDate(diff)
    const startOfWeekStr = startOfWeek.toISOString().split("T")[0]

    // Get start of month
    const startOfMonth = new Date(todayDateObj.getFullYear(), todayDateObj.getMonth(), 1)
    const startOfMonthStr = startOfMonth.toISOString().split("T")[0]

    // Filter paid bookings
    const paidBookings = analyticsBookings.filter((b) => b.payment_status === "paid") // Use analyticsBookings prop

    // Today's stats
    const todayPaid = paidBookings.filter((b) => b.booking_date === today)
    const todayCash = todayPaid.filter((b) => b.payment_method === "cash")
    const todayCard = todayPaid.filter((b) => b.payment_method === "stripe" || b.payment_method === "card")

    // This week's stats
    const weekPaid = paidBookings.filter((b) => b.booking_date >= startOfWeekStr)
    const weekCash = weekPaid.filter((b) => b.payment_method === "cash")
    const weekCard = weekPaid.filter((b) => b.payment_method === "stripe" || b.payment_method === "card")

    // This month's stats
    const monthPaid = paidBookings.filter((b) => b.booking_date >= startOfMonthStr)
    const monthCash = monthPaid.filter((b) => b.payment_method === "cash")
    const monthCard = monthPaid.filter((b) => b.payment_method === "stripe" || b.payment_method === "card")

    // Calculate totals
    const sum = (arr: AnalyticsBooking[]) => arr.reduce((s, b) => s + (b.payment_amount_thb || 0), 0)
    const sumUsd = (arr: AnalyticsBooking[]) => arr.reduce((s, b) => s + (b.payment_amount_usd || 0), 0)

    return {
      today: {
        total: sum(todayPaid),
        cash: sum(todayCash),
        card: sumUsd(todayCard), // Assuming card payments might be in USD
        count: todayPaid.length,
        cashCount: todayCash.length,
        cardCount: todayCard.length,
      },
      week: {
        total: sum(weekPaid),
        cash: sum(weekCash),
        card: sumUsd(weekCard), // Assuming card payments might be in USD
        count: weekPaid.length,
        cashCount: weekCash.length,
        cardCount: weekCard.length,
      },
      month: {
        total: sum(monthPaid),
        cash: sum(monthCash),
        card: sumUsd(monthCard), // Assuming card payments might be in USD
        count: monthPaid.length,
        cashCount: monthCash.length,
        cardCount: monthCard.length,
      },
    }
  }

  const analytics = calculateAnalytics()

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
          payment_amount_usd: 0, // Defaulting to 0 for now
          payment_currency: "THB", // Defaulting to THB for now
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

      // Refresh data
      router.refresh()
      handleRefresh()
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : "Failed to create booking")
    } finally {
      setIsCreatingBooking(false)
    }
  }

  const handleSaveSettings = async () => {
    setIsSavingSettings(true)
    setSettingsSuccess(false)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: membership.org_id, // Add orgId
          organization: {
            name: settingsForm.name,
            description: settingsForm.description,
            email: settingsForm.email,
            phone: settingsForm.phone,
            whatsapp: settingsForm.whatsapp,
            address: settingsForm.address,
            city: settingsForm.city,
            province: settingsForm.province,
            instagram: settingsForm.instagram,
            facebook: settingsForm.facebook,
            website: settingsForm.website,
          },
          settings: {
            booking_advance_days: settingsForm.booking_advance_days,
            booking_max_days_ahead: settingsForm.booking_max_days_ahead,
            allow_guest_bookings: settingsForm.allow_guest_bookings,
            require_payment_upfront: settingsForm.require_payment_upfront,
            notify_on_booking_email: settingsForm.notify_on_booking_email,
            notification_email: settingsForm.notification_email || null,
            show_prices: settingsForm.show_prices,
            show_trainer_selection: settingsForm.show_trainer_selection,
          },
        }),
      })

      if (response.ok) {
        setSettingsSuccess(true)
        setTimeout(() => setSettingsSuccess(false), 3000)
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to save settings:", error)
    } finally {
      setIsSavingSettings(false)
    }
  }

  async function handleOckockSend() {
    if (!ockockInput.trim() || ockockLoading) return

    const userMessage = ockockInput.trim()
    setOckockMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setOckockInput("")
    setOckockLoading(true)

    try {
      const res = await fetch("/api/admin/ockock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, org_id: membership.org_id }), // Add orgId
      })

      const data = await res.json()
      setOckockMessages((prev) => [...prev, { role: "assistant", content: data.response || data.error }])
    } catch {
      setOckockMessages((prev) => [...prev, { role: "assistant", content: "Oops! Something went wrong. Try again!" }])
    } finally {
      setOckockLoading(false)
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
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
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
                      {item.isOckOck ? (
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
            <div>
              <h2 className="font-bold text-orange-500 truncate">{organization.name}</h2>
              <p className="text-xs text-neutral-400">Admin Dashboard</p>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-sm">
                {organization.name.charAt(0)}
              </div>
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
                  {item.isOckOck ? (
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
            onClick={() => setActiveTab("reports")}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg ${
              activeTab === "reports" ? "text-orange-500" : "text-neutral-400"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs">Reports</span>
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

          {activeTab === "profile" && (
          <Card className="bg-neutral-900/50 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5" /> My Profile (โปรไฟล์ของฉัน)
              </CardTitle>
              <CardDescription>Update your trainer profile (อัพเดทโปรไฟล์ครูมวย)</CardDescription>
            </CardHeader>
            <CardContent>
              {myProfileLoading ? (
                <div className="text-center py-8 text-neutral-400">Loading... (กำลังโหลด...)</div>
              ) : !myProfile ? (
                <div className="text-center py-8 text-neutral-400">
                  No trainer profile found. Contact admin to set up your profile.
                  <br />
                  (ไม่พบโปรไฟล์ครูมวย กรุณาติดต่อผู้ดูแล)
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Photos Section */}
                  <div>
                    <Label className="text-white mb-2 block">Photos (รูปภาพ) - Max 5</Label>
                    <div className="flex flex-wrap gap-3 mb-3">
                      {myProfileForm.photos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={photo || "/placeholder.svg"}
                            alt={`Photo ${index + 1}`}
                            className="w-24 h-24 object-cover rounded-lg border border-neutral-700"
                          />
                          <button
                            onClick={() => removePhoto(index)}
                            className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {myProfileForm.photos.length < 5 && (
                        <div className="w-24 h-24 border-2 border-dashed border-neutral-700 rounded-lg flex items-center justify-center">
                          <Camera className="w-8 h-8 text-neutral-600" />
                        </div>
                      )}
                    </div>
                    {myProfileForm.photos.length < 5 && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Paste image URL (วาง URL รูปภาพ)"
                          value={newPhotoUrl}
                          onChange={(e) => setNewPhotoUrl(e.target.value)}
                          className="bg-neutral-800 border-neutral-700 text-white"
                        />
                        <Button onClick={addPhoto} variant="outline" className="border-neutral-700 bg-transparent">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Display Name (ชื่อที่แสดง)</Label>
                      <Input
                        value={myProfileForm.display_name}
                        onChange={(e) => setMyProfileForm({ ...myProfileForm, display_name: e.target.value })}
                        className="bg-neutral-800 border-neutral-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Title (ตำแหน่ง)</Label>
                      <Input
                        value={myProfileForm.title}
                        onChange={(e) => setMyProfileForm({ ...myProfileForm, title: e.target.value })}
                        placeholder="e.g. Head Trainer, Boxing Coach"
                        className="bg-neutral-800 border-neutral-700 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-white">Bio (ประวัติ)</Label>
                    <Textarea
                      value={myProfileForm.bio}
                      onChange={(e) => setMyProfileForm({ ...myProfileForm, bio: e.target.value })}
                      placeholder="Tell students about yourself... (เล่าเกี่ยวกับตัวคุณ...)"
                      className="bg-neutral-800 border-neutral-700 text-white"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label className="text-white">Specialties (ความเชี่ยวชาญ)</Label>
                    <Input
                      value={myProfileForm.specialties}
                      onChange={(e) => setMyProfileForm({ ...myProfileForm, specialties: e.target.value })}
                      placeholder="Clinch, Elbows, Pad Work (comma separated)"
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>

                  {/* Experience & Record */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-white">Years Exp. (ปีประสบการณ์)</Label>
                      <Input
                        type="number"
                        value={myProfileForm.years_experience}
                        onChange={(e) =>
                          setMyProfileForm({ ...myProfileForm, years_experience: Number.parseInt(e.target.value) || 0 })
                        }
                        className="bg-neutral-800 border-neutral-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Wins (ชนะ)</Label>
                      <Input
                        type="number"
                        value={myProfileForm.fight_record_wins}
                        onChange={(e) =>
                          setMyProfileForm({
                            ...myProfileForm,
                            fight_record_wins: Number.parseInt(e.target.value) || 0,
                          })
                        }
                        className="bg-neutral-800 border-neutral-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Losses (แพ้)</Label>
                      <Input
                        type="number"
                        value={myProfileForm.fight_record_losses}
                        onChange={(e) =>
                          setMyProfileForm({
                            ...myProfileForm,
                            fight_record_losses: Number.parseInt(e.target.value) || 0,
                          })
                        }
                        className="bg-neutral-800 border-neutral-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Draws (เสมอ)</Label>
                      <Input
                        type="number"
                        value={myProfileForm.fight_record_draws}
                        onChange={(e) =>
                          setMyProfileForm({
                            ...myProfileForm,
                            fight_record_draws: Number.parseInt(e.target.value) || 0,
                          })
                        }
                        className="bg-neutral-800 border-neutral-700 text-white"
                      />
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          setMyProfileForm({ ...myProfileForm, is_available: !myProfileForm.is_available })
                        }
                        className={`p-2 rounded ${myProfileForm.is_available ? "bg-green-600" : "bg-neutral-700"}`}
                      >
                        {myProfileForm.is_available ? (
                          <ToggleRight className="w-5 h-5" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>
                      <span className="text-white">
                        {myProfileForm.is_available ? "Available (พร้อมสอน)" : "Not Available (ไม่ว่าง)"}
                      </span>
                    </div>
                    <Input
                      value={myProfileForm.availability_note}
                      onChange={(e) => setMyProfileForm({ ...myProfileForm, availability_note: e.target.value })}
                      placeholder="Availability note (e.g. Back next week)"
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>

                  {/* Ock Ock Options */}
                  <div className="space-y-3">
                    <Label className="text-white">Ock Ock Options (ตัวเลือก Ock Ock)</Label>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 text-white">
                        <input
                          type="checkbox"
                          checked={myProfileForm.open_to_fights}
                          onChange={(e) => setMyProfileForm({ ...myProfileForm, open_to_fights: e.target.checked })}
                          className="rounded"
                        />
                        Open to Fights (รับชก)
                      </label>
                      <label className="flex items-center gap-2 text-white">
                        <input
                          type="checkbox"
                          checked={myProfileForm.open_to_events}
                          onChange={(e) => setMyProfileForm({ ...myProfileForm, open_to_events: e.target.checked })}
                          className="rounded"
                        />
                        Open to Events (รับงาน)
                      </label>
                    </div>
                  </div>

                  {/* Save Button */}
                  <Button
                    onClick={saveMyProfile}
                    disabled={myProfileSaving}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {myProfileSaving ? "Saving... (กำลังบันทึก...)" : "Save Profile (บันทึกโปรไฟล์)"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

          {/* Today's Bookings Tab - Add Thai translations to buttons */}
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
              <CardTitle className="text-white">Recent Bookings</CardTitle>
              <CardDescription>Last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <div className="text-center py-12 text-neutral-400">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent bookings</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentBookings.map((booking) => (
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
          <div className="space-y-6">
            {/* Revenue Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Today */}
              <Card className="bg-neutral-900/50 border-neutral-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-white">Today</CardTitle>
                  <CardDescription>{weekStats.total} bookings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold text-amber-400">฿{weekStats.cashRevenue.toLocaleString()}</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4 text-green-400" />
                        <span className="text-sm text-neutral-400">Cash</span>
                      </div>
                      <div className="text-right">
                        <span className="text-green-400 font-medium">฿{weekStats.cashRevenue.toLocaleString()}</span>
                        <span className="text-xs text-neutral-500 ml-2">({weekStats.cashCount})</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-neutral-400">Card</span>
                      </div>
                      <div className="text-right">
                        <span className="text-blue-400 font-medium">$ {weekStats.cardRevenue.toLocaleString()}</span>
                        <span className="text-xs text-neutral-500 ml-2">({weekStats.cardCount})</span>
                      </div>
                    </div>
                  </div>
                  {weekStats.paid > 0 && (
                    <div className="pt-2 border-t border-neutral-800">
                      <div className="flex h-2 rounded-full overflow-hidden bg-neutral-800">
                        <div
                          className="bg-green-500"
                          style={{
                            width: `${(weekStats.cashRevenue / (weekStats.cashRevenue + weekStats.cardRevenue)) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-blue-500"
                          style={{
                            width: `${(weekStats.cardRevenue / (weekStats.cashRevenue + weekStats.cardRevenue)) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-neutral-500 mt-1">
                        <span>
                          {weekStats.paid > 0
                            ? Math.round(
                                (weekStats.cashRevenue / (weekStats.cashRevenue + weekStats.cardRevenue)) * 100,
                              )
                            : 0}
                          % cash
                        </span>
                        <span>
                          {weekStats.paid > 0
                            ? Math.round(
                                (weekStats.cardRevenue / (weekStats.cashRevenue + weekStats.cardRevenue)) * 100,
                              )
                            : 0}
                          % card
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* This Week */}
              <Card className="bg-neutral-900/50 border-neutral-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-white">This Week</CardTitle>
                  <CardDescription>{weekStats.total} bookings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold text-amber-400">฿{weekStats.cashRevenue.toLocaleString()}</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4 text-green-400" />
                        <span className="text-sm text-neutral-400">Cash</span>
                      </div>
                      <div className="text-right">
                        <span className="text-green-400 font-medium">฿{weekStats.cashRevenue.toLocaleString()}</span>
                        <span className="text-xs text-neutral-500 ml-2">({weekStats.cashCount})</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-neutral-400">Card</span>
                      </div>
                      <div className="text-right">
                        <span className="text-blue-400 font-medium">$ {weekStats.cardRevenue.toLocaleString()}</span>
                        <span className="text-xs text-neutral-500 ml-2">({weekStats.cardCount})</span>
                      </div>
                    </div>
                  </div>
                  {weekStats.paid > 0 && (
                    <div className="pt-2 border-t border-neutral-800">
                      <div className="flex h-2 rounded-full overflow-hidden bg-neutral-800">
                        <div
                          className="bg-green-500"
                          style={{
                            width: `${(weekStats.cashRevenue / (weekStats.cashRevenue + weekStats.cardRevenue)) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-blue-500"
                          style={{
                            width: `${(weekStats.cardRevenue / (weekStats.cashRevenue + weekStats.cardRevenue)) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-neutral-500 mt-1">
                        <span>
                          {weekStats.paid > 0
                            ? Math.round(
                                (weekStats.cashRevenue / (weekStats.cashRevenue + weekStats.cardRevenue)) * 100,
                              )
                            : 0}
                          % cash
                        </span>
                        <span>
                          {weekStats.paid > 0
                            ? Math.round(
                                (weekStats.cardRevenue / (weekStats.cashRevenue + weekStats.cardRevenue)) * 100,
                              )
                            : 0}
                          % card
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* This Month */}
              <Card className="bg-neutral-900/50 border-neutral-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-white">This Month</CardTitle>
                  <CardDescription>{monthStats.total} bookings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold text-amber-400">฿{monthStats.cashRevenue.toLocaleString()}</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4 text-green-400" />
                        <span className="text-sm text-neutral-400">Cash</span>
                      </div>
                      <div className="text-right">
                        <span className="text-green-400 font-medium">฿{monthStats.cashRevenue.toLocaleString()}</span>
                        <span className="text-xs text-neutral-500 ml-2">({monthStats.cashCount})</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-neutral-400">Card</span>
                      </div>
                      <div className="text-right">
                        <span className="text-blue-400 font-medium">$ {monthStats.cardRevenue.toLocaleString()}</span>
                        <span className="text-xs text-neutral-500 ml-2">({monthStats.cardCount})</span>
                      </div>
                    </div>
                  </div>
                  {monthStats.paid > 0 && (
                    <div className="pt-2 border-t border-neutral-800">
                      <div className="flex h-2 rounded-full overflow-hidden bg-neutral-800">
                        <div
                          className="bg-green-500"
                          style={{
                            width: `${(monthStats.cashRevenue / (monthStats.cashRevenue + monthStats.cardRevenue)) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-blue-500"
                          style={{
                            width: `${(monthStats.cardRevenue / (monthStats.cashRevenue + monthStats.cardRevenue)) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-neutral-500 mt-1">
                        <span>
                          {monthStats.paid > 0
                            ? Math.round(
                                (monthStats.cashRevenue / (monthStats.cashRevenue + monthStats.cardRevenue)) * 100,
                              )
                            : 0}
                          % cash
                        </span>
                        <span>
                          {monthStats.paid > 0
                            ? Math.round(
                                (monthStats.cardRevenue / (monthStats.cashRevenue + monthStats.cardRevenue)) * 100,
                              )
                            : 0}
                          % card
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <Card className="bg-neutral-900/50 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-amber-400" />
                  Payment Summary
                </CardTitle>
                <CardDescription>Last 30 days overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700">
                    <p className="text-sm text-neutral-400">Total Revenue</p>
                    <p className="text-2xl font-bold text-amber-400">฿{monthStats.cashRevenue.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700">
                    <p className="text-sm text-neutral-400">Total Bookings</p>
                    <p className="text-2xl font-bold text-white">{monthStats.total}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700">
                    <p className="text-sm text-neutral-400">Cash Payments</p>
                    <p className="text-2xl font-bold text-green-400">{monthStats.cashCount}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700">
                    <p className="text-sm text-neutral-400">Card Payments</p>
                    <p className="text-2xl font-bold text-blue-400">{monthStats.cardCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
                        <div className="w-14 h-14 rounded-full bg-neutral-700 border-2 border-neutral-600 overflow-hidden flex-shrink-0">
                          {trainer.photo_url ? (
                            <img
                              src={trainer.photo_url || "/placeholder.svg"}
                              alt={trainer.display_name}
                              className="w-full h-full object-cover"
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

          {/* Trainer Add/Edit Dialog */}
          {/* The dialog for adding/editing trainers is already present in the original code, no changes needed here */}

          {activeTab === "students" && (
          <div className="space-y-6">
            {/* Header with Add Student button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Students</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchStudents}
                  className="border-neutral-700 bg-transparent"
                  disabled={studentsLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${studentsLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                      <Plus className="w-4 h-4 mr-2" /> Add Student
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Student</DialogTitle>
                    <DialogDescription className="text-neutral-400">
                      Add a student and optionally record their initial payment
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Name *</Label>
                      <Input
                        value={newStudentForm.name}
                        onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                        className="bg-neutral-800 border-neutral-700"
                        placeholder="John Smith"
                      />
                    </div>
                    <div>
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={newStudentForm.email}
                        onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                        className="bg-neutral-800 border-neutral-700"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={newStudentForm.phone}
                        onChange={(e) => setNewStudentForm({ ...newStudentForm, phone: e.target.value })}
                        className="bg-neutral-800 border-neutral-700"
                        placeholder="+66..."
                      />
                    </div>
                    <hr className="border-neutral-700" />
                    <p className="text-sm text-neutral-400">Initial Package (optional)</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={newStudentForm.creditType}
                          onValueChange={(v) => setNewStudentForm({ ...newStudentForm, creditType: v })}
                        >
                          <SelectTrigger className="bg-neutral-800 border-neutral-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-neutral-800 border-neutral-700">
                            <SelectItem value="sessions">Sessions</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="private">Private Sessions</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Credits</Label>
                        <Input
                          type="number"
                          value={newStudentForm.credits}
                          onChange={(e) =>
                            setNewStudentForm({ ...newStudentForm, credits: Number.parseInt(e.target.value) || 0 })
                          }
                          className="bg-neutral-800 border-neutral-700"
                          placeholder="10"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Payment Method</Label>
                        <Select
                          value={newStudentForm.paymentMethod}
                          onValueChange={(v) => setNewStudentForm({ ...newStudentForm, paymentMethod: v })}
                        >
                          <SelectTrigger className="bg-neutral-800 border-neutral-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-neutral-800 border-neutral-700">
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="transfer">Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Amount (฿)</Label>
                        <Input
                          type="number"
                          value={newStudentForm.paymentAmount}
                          onChange={(e) =>
                            setNewStudentForm({
                              ...newStudentForm,
                              paymentAmount: Number.parseInt(e.target.value) || 0,
                            })
                          }
                          className="bg-neutral-800 border-neutral-700"
                          placeholder="5000"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        value={newStudentForm.notes}
                        onChange={(e) => setNewStudentForm({ ...newStudentForm, notes: e.target.value })}
                        className="bg-neutral-800 border-neutral-700"
                        placeholder="Any notes about this student..."
                        rows={2}
                      />
                    </div>
                    {studentError && <p className="text-red-400 text-sm">{studentError}</p>}
                    <Button
                      onClick={handleAddStudent}
                      disabled={isSavingStudent}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      {isSavingStudent ? "Saving..." : "Add Student"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Students List */}
          {studentsLoading ? (
            <div className="text-center py-12 text-neutral-400">Loading students...</div>
          ) : students.length === 0 ? (
            <Card className="bg-neutral-900 border-neutral-800">
              <CardContent className="py-12 text-center">
                <GraduationCap className="w-12 h-12 mx-auto mb-4 text-neutral-600" />
                <p className="text-neutral-400 mb-2">No students yet</p>
                <p className="text-neutral-500 text-sm">Add your first student to start tracking their sessions</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {students.map((student) => (
                <Card key={student.id} className="bg-neutral-900 border-neutral-800">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-white">
                          {student.full_name || student.display_name || "Unknown"}
                        </h3>
                        <p className="text-sm text-neutral-400">{student.email}</p>
                        {student.phone && <p className="text-xs text-neutral-500">{student.phone}</p>}
                      </div>
                      {student.credits && student.credits.length > 0 && (
                        <Badge
                          className={
                            student.credits.some((c) => c.credits_remaining > 3)
                              ? "bg-green-600"
                              : student.credits.some((c) => c.credits_remaining > 0)
                                ? "bg-yellow-600"
                                : "bg-red-600"
                          }
                        >
                          {student.credits.reduce((sum, c) => sum + c.credits_remaining, 0)} Credits
                        </Badge>
                      )}
                    </div>

                    {student.credits && student.credits.length > 0 && (
                      <>
                        {student.credits.map((credit) => (
                          <div key={credit.id} className="text-xs text-neutral-500 mb-1">
                            {credit.credit_type}: {credit.credits_remaining} remaining
                          </div>
                        ))}
                      </>
                    )}

                    <div className="flex gap-2">
                      {student.credits && student.credits.some((c) => c.credits_remaining > 0) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Try to find a credit type to deduct from, e.g., 'sessions' or 'private_session'
                            const creditToDeduct = student.credits?.find(
                              (c) => c.credit_type === "sessions" || c.credit_type === "private_session",
                            )
                            if (creditToDeduct) {
                              handleUseCredit(student.id, creditToDeduct.id)
                            } else if (student.credits && student.credits.length > 0) {
                              // Fallback to the first credit type if specific ones aren't found
                              handleUseCredit(student.id, student.credits[0].id)
                            } else {
                              alert("No credits available to use.")
                            }
                          }}
                          className="border-neutral-700 flex-1"
                        >
                          <Minus className="w-3 h-3 mr-1" /> Use 1 Credit
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedStudent(student)
                          setAddCreditsForm({
                            creditType: student.credits?.[0]?.credit_type || "private_session",
                            credits: 1,
                            notes: "",
                            paymentMethod: "cash",
                            paymentAmount: 0,
                          })
                          setStudentError("")
                          setIsAddCreditsOpen(true)
                        }}
                        className="border-neutral-700 flex-1"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Credits
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Recent Transactions */}
          {studentTransactions.length > 0 && (
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-5 h-5" /> Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {studentTransactions.slice(0, 10).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex justify-between items-center py-2 border-b border-neutral-800 last:border-0"
                    >
                      <div>
                        <p className="text-sm">
                          <span className="text-white">
                            {tx.users?.full_name || tx.users?.display_name || "Unknown"}
                          </span>
                          <span className="text-neutral-400"> - {tx.description}</span>
                        </p>
                        <p className="text-xs text-neutral-500">
                          {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className={tx.amount > 0 ? "border-green-600 text-green-400" : "border-red-600 text-red-400"}
                        >
                          {tx.amount > 0 ? "+" : ""}
                          {tx.amount}
                        </Badge>
                        {tx.payment_amount_thb && (
                          <p className="text-xs text-neutral-500">฿{tx.payment_amount_thb.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Credits Dialog */}
          <Dialog open={isAddCreditsOpen} onOpenChange={setIsAddCreditsOpen}>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-md">
              <DialogHeader>
                <DialogTitle>Add Credits</DialogTitle>
                <DialogDescription className="text-neutral-400">
                  Add credits for {selectedStudent?.full_name || selectedStudent?.email}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={addCreditsForm.creditType}
                      onValueChange={(v) => setAddCreditsForm({ ...addCreditsForm, creditType: v })}
                    >
                      <SelectTrigger className="bg-neutral-800 border-neutral-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-neutral-700">
                        <SelectItem value="sessions">Sessions</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="private">Private Sessions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Credits to Add</Label>
                    <Input
                      type="number"
                      value={addCreditsForm.credits}
                      onChange={(e) =>
                        setAddCreditsForm({ ...addCreditsForm, credits: Number.parseInt(e.target.value) || 0 })
                      }
                      className="bg-neutral-800 border-neutral-700"
                      placeholder="10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Payment Method</Label>
                    <Select
                      value={addCreditsForm.paymentMethod}
                      onValueChange={(v) => setAddCreditsForm({ ...addCreditsForm, paymentMethod: v })}
                    >
                      <SelectTrigger className="bg-neutral-800 border-neutral-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-neutral-700">
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount Paid (฿)</Label>
                    <Input
                      type="number"
                      value={addCreditsForm.paymentAmount}
                      onChange={(e) =>
                        setAddCreditsForm({ ...addCreditsForm, paymentAmount: Number.parseInt(e.target.value) || 0 })
                      }
                      className="bg-neutral-800 border-neutral-700"
                      placeholder="5000"
                    />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={addCreditsForm.notes}
                    onChange={(e) => setAddCreditsForm({ ...addCreditsForm, notes: e.target.value })}
                    className="bg-neutral-800 border-neutral-700"
                    placeholder="Any notes..."
                    rows={2}
                  />
                </div>
                {studentError && <p className="text-red-400 text-sm">{studentError}</p>}
                <Button
                  onClick={handleAddCredits}
                  disabled={isSavingStudent}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  {isSavingStudent ? "Saving..." : "Add Credits"}
                </Button>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        )}

          {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Gym Information */}
            <Card className="bg-neutral-900/50 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white">Gym Information</CardTitle>
                <CardDescription>Basic details about your gym</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-neutral-200">Gym Name</Label>
                    <Input
                      value={settingsForm.name}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-200">Email</Label>
                    <Input
                      type="email"
                      value={settingsForm.email}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="gym@example.com"
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-200">Phone</Label>
                    <Input
                      value={settingsForm.phone}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="+66..."
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-200">WhatsApp</Label>
                    <Input
                      value={settingsForm.whatsapp}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, whatsapp: e.target.value }))}
                      placeholder="+66..."
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-neutral-200">Description</Label>
                  <Textarea
                    value={settingsForm.description}
                    onChange={(e) => setSettingsForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="A brief description of your gym..."
                    className="bg-neutral-800 border-neutral-700 text-white min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-neutral-200">Address</Label>
                    <Input
                      value={settingsForm.address}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, address: e.target.value }))}
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-200">City</Label>
                    <Input
                      value={settingsForm.city}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, city: e.target.value }))}
                      placeholder="Pai"
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-200">Province</Label>
                    <Input
                      value={settingsForm.province}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, province: e.target.value }))}
                      placeholder="Mae Hong Son"
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card className="bg-neutral-900/50 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white">Social Links</CardTitle>
                <CardDescription>Your gym's social media profiles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-neutral-200">Instagram</Label>
                    <Input
                      value={settingsForm.instagram}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, instagram: e.target.value }))}
                      placeholder="https://instagram.com/..."
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-200">Facebook</Label>
                    <Input
                      value={settingsForm.facebook}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, facebook: e.target.value }))}
                      placeholder="https://facebook.com/..."
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-200">Website</Label>
                    <Input
                      value={settingsForm.website}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, website: e.target.value }))}
                      placeholder="https://..."
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Settings */}
            <Card className="bg-neutral-900/50 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white">Booking Settings</CardTitle>
                <CardDescription>Configure how customers can book with you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-neutral-200">Advance booking required (days)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={settingsForm.booking_advance_days}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          booking_advance_days: Number.parseInt(e.target.value) || 0,
                        }))
                      }
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                    <p className="text-xs text-neutral-500">0 = same day booking allowed</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-200">Max days ahead to book</Label>
                    <Input
                      type="number"
                      min="1"
                      value={settingsForm.booking_max_days_ahead}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          booking_max_days_ahead: Number.parseInt(e.target.value) || 60,
                        }))
                      }
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="allowGuestBookings"
                      checked={settingsForm.allow_guest_bookings}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, allow_guest_bookings: e.target.checked }))}
                      className="w-4 h-4 rounded border-neutral-600 bg-neutral-800"
                    />
                    <Label htmlFor="allowGuestBookings" className="text-neutral-200">
                      Allow guest bookings (no account required)
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="requirePayment"
                      checked={settingsForm.require_payment_upfront}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({ ...prev, require_payment_upfront: e.target.checked }))
                      }
                      className="w-4 h-4 rounded border-neutral-600 bg-neutral-800"
                    />
                    <Label htmlFor="requirePayment" className="text-neutral-200">
                      Require payment upfront
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="showPrices"
                      checked={settingsForm.show_prices}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, show_prices: e.target.checked }))}
                      className="w-4 h-4 rounded border-neutral-600 bg-neutral-800"
                    />
                    <Label htmlFor="showPrices" className="text-neutral-200">
                      Show prices on public site
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="showTrainers"
                      checked={settingsForm.show_trainer_selection}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({ ...prev, show_trainer_selection: e.target.checked }))
                      }
                      className="w-4 h-4 rounded border-neutral-600 bg-neutral-800"
                    />
                    <Label htmlFor="showTrainers" className="text-neutral-200">
                      Allow trainer selection when booking
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="bg-neutral-900/50 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white">Notifications</CardTitle>
                <CardDescription>How you want to be notified about bookings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    checked={settingsForm.notify_on_booking_email}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, notify_on_booking_email: e.target.checked }))
                    }
                    className="w-4 h-4 rounded border-neutral-600 bg-neutral-800"
                  />
                  <Label htmlFor="emailNotifications" className="text-neutral-200">
                    Email notifications for new bookings
                  </Label>
                </div>

                {settingsForm.notify_on_booking_email && (
                  <div className="space-y-2 pl-7">
                    <Label className="text-neutral-200">Notification email address</Label>
                    <Input
                      type="email"
                      value={settingsForm.notification_email}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, notification_email: e.target.value }))}
                      placeholder="staff@yourgym.com"
                      className="bg-neutral-800 border-neutral-700 text-white max-w-md"
                    />
                    <p className="text-xs text-neutral-500">Leave empty to use the gym email above</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex items-center gap-4">
              <Button
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSavingSettings ? "Saving..." : "Save Settings"}
              </Button>
              {settingsSuccess && <span className="text-green-400 text-sm">Settings saved successfully!</span>}
            </div>
          </div>
        )}

          {/* Train OckOck tab content */}
          {activeTab === "train-ockock" && (
          <div className="space-y-6">
            {/* Header with OckOck branding */}
            <Card className="bg-neutral-900/50 border-neutral-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <OckOckAvatar size={64} />
                  <div>
                    <h2 className="text-2xl font-bold text-white">Train Your Water Buffalo</h2>
                    <p className="text-neutral-400">Teach OckOck how to answer customer questions</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="h-2 bg-neutral-700 rounded-full w-48">
                        <div 
                          className="h-2 bg-orange-500 rounded-full transition-all" 
                          style={{ width: `${Math.min((faqs.length / 20) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-neutral-400">
                        {faqs.length} answers learned
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Reply Box */}
            <Card className="bg-neutral-900/50 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" /> Quick Reply (ตอบด่วน)
                </CardTitle>
                <CardDescription>Paste a customer message and OckOck will generate a response</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-neutral-200">Customer Message</Label>
                  <Textarea
                    value={quickReplyInput}
                    onChange={(e) => setQuickReplyInput(e.target.value)}
                    placeholder="Paste the customer's message here... (e.g., 'How much for private session?')"
                    className="bg-neutral-800 border-neutral-700 text-white min-h-[80px]"
                  />
                </div>
                <Button 
                  onClick={handleQuickReply} 
                  disabled={isGeneratingReply || !quickReplyInput.trim()}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isGeneratingReply ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" /> Generate Reply
                    </>
                  )}
                </Button>
                
                {quickReplyResponse && (
                  <div className="mt-4 p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <OckOckAvatar size={32} />
                        <div>
                          <p className="text-sm text-neutral-400 mb-1">OckOck suggests:</p>
                          <p className="text-white whitespace-pre-wrap">{quickReplyResponse}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(quickReplyResponse)}
                        className="border-neutral-600 bg-transparent shrink-0"
                      >
                        <Copy className="w-4 h-4 mr-1" /> Copy
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add New FAQ */}
            <Card className="bg-neutral-900/50 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Plus className="w-5 h-5" /> {editingFaq ? "Edit Answer" : "Teach OckOck Something New"}
                </CardTitle>
                <CardDescription>
                  {editingFaq ? "Update this Q&A pair" : "Add a question and answer for OckOck to learn"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3 space-y-2">
                    <Label className="text-neutral-200">When someone asks:</Label>
                    <Input
                      value={newFaqForm.question}
                      onChange={(e) => setNewFaqForm(prev => ({ ...prev, question: e.target.value }))}
                      placeholder="e.g., How much for a private session?"
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-200">Category</Label>
                    <Select 
                      value={newFaqForm.category} 
                      onValueChange={(v) => setNewFaqForm(prev => ({ ...prev, category: v }))}
                    >
                      <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {faqCategories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-200">OckOck should say:</Label>
                  <Textarea
                    value={newFaqForm.answer}
                    onChange={(e) => setNewFaqForm(prev => ({ ...prev, answer: e.target.value }))}
                    placeholder="e.g., Private sessions are 800 baht for 1 hour with a trainer. Morning slots available 8-11am!"
                    className="bg-neutral-800 border-neutral-700 text-white min-h-[80px]"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveFaq} 
                    disabled={isSavingFaq || !newFaqForm.question || !newFaqForm.answer}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {isSavingFaq ? "Saving..." : editingFaq ? "Update" : "Teach OckOck"}
                  </Button>
                  {editingFaq && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingFaq(null)
                        setNewFaqForm({ question: "", answer: "", category: "general" })
                      }}
                      className="border-neutral-700 bg-transparent"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Add Common Questions */}
            <Card className="bg-neutral-900/50 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white text-lg">Quick Add Common Questions</CardTitle>
                <CardDescription>Click to add pre-made questions (customize the answers)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[
                    { q: "How much for a private session?", cat: "pricing" },
                    { q: "What time are morning classes?", cat: "schedule" },
                    { q: "Is it good for beginners?", cat: "training" },
                    { q: "Where are you located?", cat: "location" },
                    { q: "How do I book?", cat: "booking" },
                    { q: "Do you have group classes?", cat: "training" },
                    { q: "What should I bring?", cat: "general" },
                    { q: "Do you offer accommodation?", cat: "general" },
                  ].map((item, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => setNewFaqForm(prev => ({ ...prev, question: item.q, category: item.cat }))}
                      className="border-neutral-700 bg-transparent text-neutral-300 hover:text-white"
                    >
                      <Plus className="w-3 h-3 mr-1" /> {item.q}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Existing FAQs */}
            <Card className="bg-neutral-900/50 border-neutral-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5" /> What OckOck Knows ({faqs.length})
                    </CardTitle>
                    <CardDescription>All the Q&A pairs OckOck has learned</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchFaqs}
                    disabled={faqsLoading}
                    className="border-neutral-700 bg-transparent"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${faqsLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {faqsLoading ? (
                  <div className="text-center py-8 text-neutral-400">Loading...</div>
                ) : faqs.length === 0 ? (
                  <div className="text-center py-8 text-neutral-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>OckOck hasn't learned anything yet.</p>
                    <p className="text-sm">Add your first Q&A above!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {faqCategories.map(cat => {
                      const categoryFaqs = faqs.filter(f => f.category === cat.value)
                      if (categoryFaqs.length === 0) return null
                      return (
                        <div key={cat.value} className="space-y-2">
                          <h4 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
                            {cat.label} ({categoryFaqs.length})
                          </h4>
                          {categoryFaqs.map(faq => (
                            <div 
                              key={faq.id} 
                              className={`p-3 rounded-lg border ${faq.is_active ? "bg-neutral-800/50 border-neutral-700" : "bg-neutral-900 border-neutral-800 opacity-60"}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-white">Q: {faq.question}</p>
                                  <p className="text-neutral-400 mt-1">A: {faq.answer}</p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleFaq(faq)}
                                    className="h-8 w-8 p-0"
                                    title={faq.is_active ? "Disable" : "Enable"}
                                  >
                                    {faq.is_active ? (
                                      <ToggleRight className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <ToggleLeft className="w-4 h-4 text-neutral-500" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingFaq(faq)
                                      setNewFaqForm({ question: faq.question, answer: faq.answer, category: faq.category })
                                    }}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteFaq(faq.id)}
                                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

          {/* OckOck tab content */}
          {activeTab === "ockock" && (
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <OckOckAvatar size={48} />
                <div>
                  <CardTitle className="text-white">OckOck</CardTitle>
                  <CardDescription>Your gym business assistant</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Chat messages */}
              <div className="h-[400px] overflow-y-auto mb-4 space-y-4 p-4 bg-neutral-800 rounded-lg">
                {ockockMessages.length === 0 ? (
                  <div className="text-center text-neutral-400 py-8">
                    <OckOckAvatar size={64} />
                    <p className="mt-4 font-medium">Hey boss! OckOck here! 🦬</p>
                    <p className="text-sm mt-2">
                      Ask me about today's bookings, revenue, students, or anything about the gym!
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-neutral-600 text-xs bg-transparent"
                        onClick={() => {
                          setOckockInput("How's business today?")
                          setTimeout(() => handleOckockSend(), 100)
                        }}
                      >
                        How's business today?
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-neutral-600 text-xs bg-transparent"
                        onClick={() => {
                          setOckockInput("Who paid cash this week?")
                          setTimeout(() => handleOckockSend(), 100)
                        }}
                      >
                        Cash this week?
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-neutral-600 text-xs bg-transparent"
                        onClick={() => {
                          setOckockInput("Any students with low credits?")
                          setTimeout(() => handleOckockSend(), 100)
                        }}
                      >
                        Low credit students?
                      </Button>
                    </div>
                  </div>
                ) : (
                  ockockMessages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "assistant" && <OckOckAvatar size={32} />}
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.role === "user" ? "bg-orange-600 text-white" : "bg-neutral-700 text-white"
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {ockockLoading && (
                  <div className="flex gap-3">
                    <OckOckAvatar size={32} />
                    <div className="bg-neutral-700 p-3 rounded-lg">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                        <span
                          className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <span
                          className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  value={ockockInput}
                  onChange={(e) => setOckockInput(e.target.value)}
                  placeholder="Ask OckOck anything about your gym..."
                  className="bg-neutral-800 border-neutral-700 text-white"
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleOckockSend()}
                />
                <Button
                  onClick={handleOckockSend}
                  disabled={ockockLoading || !ockockInput.trim()}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </main>
    </div>
  )
}
