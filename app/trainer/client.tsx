"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
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
} from "@/components/ui/dialog"
import {
  LogOut,
  Calendar,
  Users,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Search,
  Send,
  Loader2,
  DollarSign,
  RefreshCw,
  Camera,
  ChevronLeft,
  ChevronRight,
  FileText,
  MessageSquare,
  List as LucideList,
  Award,
  ExternalLink,
} from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import NavButton from "@/components/ui/nav-button"
import { Switch } from "@/components/ui/switch"

const OCKOCK_AVATAR = "/images/ockock-avatar.png"

interface TrainerProfile {
  id: string
  user_id: string
  org_id: string
  display_name: string
  title: string | null
  bio: string | null
  specialties: string[] | null
  photo_url: string | null
  photos: string[] | null
  years_experience: number | null
  fight_record_wins: number | null
  fight_record_losses: number | null
  fight_record_draws: number | null
  is_available: boolean
  availability_note: string | null
  open_to_fights: boolean
  open_to_events: boolean
}

interface Organization {
  id: string
  name: string
  slug: string
  city: string | null
  timezone: string | null
  logo_url: string | null
}

interface Booking {
  id: string
  booking_date: string
  booking_time: string | null
  status: string
  payment_status: string
  payment_method: string | null
  guest_name: string | null
  guest_email: string | null
  guest_phone: string | null
  customer_notes: string | null
  services: {
    name: string
    category: string
    duration_minutes: number | null
  } | null
  users: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  } | null
}

interface Student {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  created_at: string
  credits_remaining: number
  credit_type: string | null
  expires_at: string | null
  last_visit?: string | null
  total_sessions?: number
}

interface StudentNote {
  id: string
  content: string
  note_type: string | null
  created_at: string
  trainer_id: string
  trainer_name?: string
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface TrainerDashboardProps {
  user: SupabaseUser
  trainerProfile: TrainerProfile
  organization: Organization | null
  todayBookings: Booking[]
  students: Student[]
}

export default function TrainerDashboardClient({
  user,
  trainerProfile,
  organization,
  todayBookings: initialBookings,
  students: initialStudents,
}: TrainerDashboardProps) {
  const router = useRouter()
  const [activeView, setActiveView] = useState<"today" | "students" | "profile" | "ockock">("today")
  const [scheduleView, setScheduleView] = useState<"list" | "calendar">("list")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [monthBookings, setMonthBookings] = useState<Record<string, Booking[]>>({})
  const [isLoadingMonth, setIsLoadingMonth] = useState(false)
  const [bookings, setBookings] = useState(initialBookings)
  const [students, setStudents] = useState(initialStudents)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentNotes, setStudentNotes] = useState<StudentNote[]>([])
  const [studentBookingHistory, setStudentBookingHistory] = useState<Booking[]>([])
  const [newNote, setNewNote] = useState("")
  const [isLoadingStudent, setIsLoadingStudent] = useState(false)
  
  // Profile state
  const { toast } = useToast()
  const [profile, setProfile] = useState(trainerProfile)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [newPhotoUrl, setNewPhotoUrl] = useState("")
  
  // OckOck chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `สวัสดีครับ ${trainerProfile.display_name}! I'm OckOck, your AI assistant. How can I help you today? (ผมช่วยอะไรได้บ้างครับ?)`,
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Add student form state
  const [newStudent, setNewStudent] = useState({ name: "", email: "" })
  const [isAddingStudent, setIsAddingStudent] = useState(false)

  // Certificate issuance state
  const [certLevel, setCertLevel] = useState("")
  const [isIssuingCert, setIsIssuingCert] = useState(false)
  const [certSuccess, setCertSuccess] = useState<string | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/trainer/login")
  }

  const handleMarkAttendance = async (bookingId: string, status: "completed" | "no_show") => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
        )
      }
    } catch (error) {
      console.error("Error updating booking:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkPaid = async (bookingId: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: "paid" }),
      })
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, payment_status: "paid" } : b))
        )
      }
    } catch (error) {
      console.error("Error updating payment:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch bookings for a specific date
  const fetchBookingsForDate = async (date: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/trainer/bookings?date=${date}&org_id=${organization?.id}`)
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings || [])
        setSelectedDate(date)
        setScheduleView("list")
      }
    } catch (error) {
      console.error("Error fetching bookings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch all bookings for a month (for calendar dots)
  const fetchMonthBookings = async (year: number, month: number) => {
    setIsLoadingMonth(true)
    try {
      const startDate = new Date(year, month, 1).toISOString().split("T")[0]
      const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0]
      const res = await fetch(`/api/trainer/bookings?start_date=${startDate}&end_date=${endDate}&org_id=${organization?.id}`)
      if (res.ok) {
        const data = await res.json()
        // Group bookings by date
        const grouped: Record<string, Booking[]> = {}
        for (const booking of data.bookings || []) {
          const date = booking.booking_date
          if (!grouped[date]) grouped[date] = []
          grouped[date].push(booking)
        }
        setMonthBookings(grouped)
      }
    } catch (error) {
      console.error("Error fetching month bookings:", error)
    } finally {
      setIsLoadingMonth(false)
    }
  }

  // Load month bookings when calendar view opens or month changes
  useEffect(() => {
    if (scheduleView === "calendar") {
      fetchMonthBookings(calendarMonth.getFullYear(), calendarMonth.getMonth())
    }
  }, [scheduleView, calendarMonth])

  // Fetch student detail with notes and history
  const openStudentDetail = async (student: Student) => {
    setSelectedStudent(student)
    setIsLoadingStudent(true)
    setStudentNotes([])
    setStudentBookingHistory([])
    setCertLevel("")
    setCertSuccess(null)
    try {
      const res = await fetch(`/api/trainer/student/${student.id}`)
      if (res.ok) {
        const data = await res.json()
        setStudentNotes(data.notes || [])
        setStudentBookingHistory(data.bookings || [])
        if (data.lastVisit || data.totalSessions) {
          setSelectedStudent(prev => prev ? { ...prev, last_visit: data.lastVisit, total_sessions: data.totalSessions } : null)
        }
      }
    } catch (error) {
      console.error("Error fetching student details:", error)
    } finally {
      setIsLoadingStudent(false)
    }
  }

  // Add note to student (append-only)
  const handleAddNote = async () => {
    if (!selectedStudent || !newNote.trim()) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/trainer/student/${selectedStudent.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setStudentNotes(prev => [data.note, ...prev])
        setNewNote("")
      }
    } catch (error) {
      console.error("Error adding note:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleIssueCertificate = async () => {
    if (!selectedStudent?.email || !certLevel) return
    setIsIssuingCert(true)
    setCertSuccess(null)
    try {
      const res = await fetch("/api/admin/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_email: selectedStudent.email,
          level: certLevel,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to issue certificate")
      setCertSuccess(data.certificate.certificate_number)
      setCertLevel("")
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to issue certificate",
        variant: "destructive",
      })
    } finally {
      setIsIssuingCert(false)
    }
  }

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay() // 0 = Sunday
    
    const days: (number | null)[] = []
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }
    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStudent.email) return

    setIsAddingStudent(true)
    try {
      const res = await fetch("/api/admin/students/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newStudent.email,
          full_name: newStudent.name,
          org_id: organization?.id,
          send_invite: true,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setStudents((prev) => [
          {
            id: data.user_id || Date.now().toString(),
            full_name: newStudent.name,
            email: newStudent.email,
            avatar_url: null,
            created_at: new Date().toISOString(),
            credits_remaining: 0,
            credit_type: null,
            expires_at: null,
          },
          ...prev,
        ])
        setNewStudent({ name: "", email: "" })
        setShowAddStudent(false)
      }
    } catch (error) {
      console.error("Error adding student:", error)
    } finally {
      setIsAddingStudent(false)
    }
  }

  const handleSaveProfile = async () => {
    setIsSavingProfile(true)
    try {
      const res = await fetch("/api/trainer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: profile.display_name,
          title: profile.title,
          bio: profile.bio,
          specialties: profile.specialties,
          photo_url: profile.photo_url,
          photos: profile.photos,
          years_experience: profile.years_experience,
          fight_record_wins: profile.fight_record_wins,
          fight_record_losses: profile.fight_record_losses,
          fight_record_draws: profile.fight_record_draws,
          is_available: profile.is_available,
          availability_note: profile.availability_note,
          open_to_fights: profile.open_to_fights,
          open_to_events: profile.open_to_events,
        }),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast({
        title: "Profile saved",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleAddPhoto = () => {
    if (!newPhotoUrl.trim()) return
    const currentPhotos = profile.photos || []
    if (currentPhotos.length >= 5) return
    setProfile((prev) => ({
      ...prev,
      photos: [...(prev.photos || []), newPhotoUrl.trim()],
      photo_url: prev.photo_url || newPhotoUrl.trim(),
    }))
    setNewPhotoUrl("")
  }

  // Upload profile picture (avatar)
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Upload failed")
      }
      
      const { url } = await res.json()
      
      setProfile((prev) => ({
        ...prev,
        photo_url: url,
      }))
      
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been changed.",
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload photo.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingAvatar(false)
      e.target.value = ""
    }
  }

  // Upload gallery photo
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const currentPhotos = profile.photos || []
    if (currentPhotos.length >= 5) {
      toast({
        title: "Maximum photos reached",
        description: "You can upload up to 5 photos.",
        variant: "destructive",
      })
      return
    }

    setIsUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Upload failed")
      }
      
      const { url } = await res.json()
      
      setProfile((prev) => ({
        ...prev,
        photos: [...(prev.photos || []), url],
      }))
      
      toast({
        title: "Photo uploaded",
        description: "Your photo has been added successfully.",
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload photo.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingPhoto(false)
      e.target.value = ""
    }
  }

  const handleRemovePhoto = (index: number) => {
    setProfile((prev) => {
      const newPhotos = [...(prev.photos || [])]
      newPhotos.splice(index, 1)
      return {
        ...prev,
        photos: newPhotos,
        photo_url: newPhotos[0] || null,
      }
    })
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return

    const userMessage = inputMessage.trim()
    setInputMessage("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsSending(true)

    try {
      const res = await fetch("/api/admin/ockock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          context: {
            trainerName: trainerProfile.display_name,
            gymName: organization?.name,
            todayBookingsCount: bookings.length,
            studentsCount: students.length,
          },
        }),
      })

      const data = await res.json()
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const filteredStudents = students.filter(
    (s) =>
      s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Sort bookings by priority: needs attention first, completed last
  const getBookingPriority = (b: Booking) => {
    const isFullyComplete = (b.status === "completed" && b.payment_status === "paid") || b.status === "no_show"
    const isPaidOnline = b.payment_method === "card" && b.payment_status === "paid"
    
    if (isFullyComplete) return 5 // Fully done - lowest priority
    if (b.status === "completed" && b.payment_status !== "paid") return 3 // Arrived but needs cash
    if (b.status === "confirmed" && isPaidOnline) return 2 // Paid online, just needs check-in
    return 1 // Needs attention: check-in AND/OR payment
  }
  
  const sortedBookings = [...bookings].sort((a, b) => getBookingPriority(a) - getBookingPriority(b))
  
  // Bookings needing attention (not fully complete)
  const needsAttentionBookings = sortedBookings.filter(b => {
    const isFullyComplete = (b.status === "completed" && b.payment_status === "paid") || b.status === "no_show"
    return !isFullyComplete
  })
  
  // Fully completed bookings (arrived + paid OR no show)
  const fullyCompletedBookings = sortedBookings.filter(b => {
    return (b.status === "completed" && b.payment_status === "paid") || b.status === "no_show"
  })
  
  const pendingBookings = bookings.filter((b) => b.status === "confirmed")
  const completedBookings = bookings.filter((b) => b.status === "completed" || b.status === "no_show")

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-20 overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-white">{organization?.name || "Trainer"}</h1>
              <p className="text-xs text-neutral-400">
                {activeView === "today" && "Today (วันนี้)"}
                {activeView === "students" && "Students (นักเรียน)"}
                {activeView === "profile" && "My Profile (โปรไฟล์)"}
                {activeView === "ockock" && "OckOck (ผู้ช่วย AI)"}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-neutral-400 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {/* Today View */}
        {activeView === "today" && (
          <div className="space-y-4">
            {/* Welcome Summary */}
            <div className="rounded-xl bg-gradient-to-r from-orange-600/20 to-orange-500/5 border border-orange-500/10 px-4 py-3">
              <p className="text-sm text-white">
                สวัสดี <span className="font-semibold">{trainerProfile.display_name}</span>
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">
                {bookings.length === 0
                  ? "No sessions today — enjoy the rest!"
                  : `${pendingBookings.length} upcoming${needsAttentionBookings.length > 0 ? ` · ${needsAttentionBookings.length} need attention` : ""}${completedBookings.length > 0 ? ` · ${completedBookings.length} done` : ""}`}
              </p>
            </div>

            {/* View Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex bg-neutral-800 rounded-lg p-1">
                <button
                  onClick={() => setScheduleView("list")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    scheduleView === "list"
                      ? "bg-orange-600 text-white"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <LucideList className="w-4 h-4" />
                  <span>List</span>
                </button>
                <button
                  onClick={() => setScheduleView("calendar")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    scheduleView === "calendar"
                      ? "bg-orange-600 text-white"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Calendar</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                {scheduleView === "list" && selectedDate !== new Date().toISOString().split("T")[0] && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchBookingsForDate(new Date().toISOString().split("T")[0])}
                    className="border-neutral-700 bg-transparent text-xs"
                  >
                    Back to Today
                  </Button>
                )}
                <button
                  onClick={() => fetchBookingsForDate(selectedDate)}
                  disabled={isLoading}
                  className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  aria-label="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Calendar View */}
            {scheduleView === "calendar" && (
              <Card className="bg-neutral-900/50 border-neutral-800">
                <CardContent className="p-4">
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                      className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="font-medium">
                      {calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </h3>
                    <button
                      onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                      className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="text-center text-xs text-neutral-500 py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1">
                    {getDaysInMonth(calendarMonth).map((day, index) => {
                      if (day === null) {
                        return <div key={`empty-${index}`} className="aspect-square" />
                      }
                      const dateKey = formatDateKey(calendarMonth.getFullYear(), calendarMonth.getMonth(), day)
                      const dayBookings = monthBookings[dateKey] || []
                      const hasGroup = dayBookings.some((b) => b.services?.category === "group")
                      const hasPrivate = dayBookings.some((b) => b.services?.category === "private")
                      const isToday = dateKey === new Date().toISOString().split("T")[0]
                      const isSelected = dateKey === selectedDate

                      return (
                        <button
                          key={day}
                          onClick={() => fetchBookingsForDate(dateKey)}
                          className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors relative ${
                            isSelected
                              ? "bg-orange-600 text-white"
                              : isToday
                              ? "bg-neutral-700 text-white"
                              : "hover:bg-neutral-800"
                          }`}
                        >
                          <span>{day}</span>
                          {dayBookings.length > 0 && (
                            <div className="flex gap-0.5 mt-0.5">
                              {hasGroup && (
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                              )}
                              {hasPrivate && (
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                              )}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-neutral-800">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                      <div className="w-2 h-2 rounded-full bg-orange-400" />
                      <span>Group</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span>Private</span>
                    </div>
                  </div>

                  {isLoadingMonth && (
                    <div className="absolute inset-0 bg-neutral-900/50 flex items-center justify-center rounded-lg">
                      <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* List View - Stats and Bookings */}
            {scheduleView === "list" && (
              <>
                {/* Date Header for non-today dates */}
                {selectedDate !== new Date().toISOString().split("T")[0] && (
                  <div className="text-center py-2">
                    <p className="text-sm text-neutral-400">
                      {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="bg-neutral-900/50 border-neutral-800">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-600/20 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{pendingBookings.length}</p>
                          <p className="text-xs text-neutral-400">Upcoming (รอ)</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-neutral-900/50 border-neutral-800">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{completedBookings.length}</p>
                          <p className="text-xs text-neutral-400">Done (เสร็จ)</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Bookings List */}
                <div className="space-y-4">
                  {bookings.length === 0 ? (
                    <Card className="bg-neutral-900/50 border-neutral-800">
                      <CardContent className="p-6 text-center">
                        <Calendar className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                        <p className="text-neutral-400">No bookings today</p>
                        <p className="text-xs text-neutral-500">ไม่มีการจองวันนี้</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Needs Attention Section */}
                      {needsAttentionBookings.length > 0 && (
                        <div className="space-y-3">
                          <h2 className="text-sm font-medium text-neutral-400">
                            Needs Attention ({needsAttentionBookings.length})
                          </h2>
                          {needsAttentionBookings.map((booking) => {
                            const isPaidOnline = booking.payment_method === "card" && booking.payment_status === "paid"
                            const needsCashCollection = booking.payment_status !== "paid" && booking.status === "completed"
                            
                            return (
                              <Card key={booking.id} className="bg-neutral-900/50 border-neutral-800">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {booking.users?.avatar_url ? (
                                          <Image
                                            src={booking.users.avatar_url || "/placeholder.svg"}
                                            alt=""
                                            width={40}
                                            height={40}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <User className="w-5 h-5 text-neutral-400" />
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-medium text-white truncate">
                                          {booking.users?.full_name || booking.guest_name || booking.users?.email || booking.guest_email || "Walk-in"}
                                        </p>
                                        <p className="text-xs text-neutral-400">
                                          {booking.booking_time || "Flexible"} • {booking.services?.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                          {isPaidOnline ? (
                                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                                              Paid Online
                                            </Badge>
                                          ) : (
                                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                                              Pay at Gym
                                            </Badge>
                                          )}
                                          {booking.status === "completed" && (
                                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                                              Arrived
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Check-in buttons for pending bookings */}
                                  {booking.status === "confirmed" && (
                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-800">
                                      <Button
                                        size="sm"
                                        onClick={() => handleMarkAttendance(booking.id, "completed")}
                                        disabled={isLoading}
                                        className="flex-1 bg-green-600 hover:bg-green-500"
                                      >
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                        Arrived (มาถึง)
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleMarkAttendance(booking.id, "no_show")}
                                        disabled={isLoading}
                                        className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                                      >
                                        <XCircle className="w-4 h-4 mr-1" />
                                        No Show (ไม่มา)
                                      </Button>
                                    </div>
                                  )}

                                  {/* Cash collection button - only show if not paid online */}
                                  {booking.payment_status !== "paid" && !isPaidOnline && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleMarkPaid(booking.id)}
                                      disabled={isLoading}
                                      className={`w-full mt-2 ${needsCashCollection ? "border-orange-500/50 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20" : "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"}`}
                                    >
                                      <DollarSign className="w-4 h-4 mr-1" />
                                      {needsCashCollection ? "Collect Cash (เก็บเงินสด)" : "Mark Paid (ชำระแล้ว)"}
                                    </Button>
                                  )}
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      )}

                      {/* Completed Section - Collapsed Cards */}
                      {fullyCompletedBookings.length > 0 && (
                        <div className="space-y-2">
                          <h2 className="text-sm font-medium text-neutral-400">
                            Completed ({fullyCompletedBookings.length})
                          </h2>
                          <Card className="bg-neutral-900/30 border-neutral-800">
                            <CardContent className="p-2 divide-y divide-neutral-800">
                              {fullyCompletedBookings.map((booking) => (
                                <div key={booking.id} className="flex items-center gap-3 py-2 px-2">
                                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                  <span className="text-sm text-neutral-300 truncate flex-1">
                                    {booking.users?.full_name || booking.guest_name || "Guest"}
                                  </span>
                                  <span className="text-xs text-neutral-500">
                                    {booking.booking_time || ""}
                                  </span>
                                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/20">
                                    {booking.status === "no_show" ? "No Show" : "Paid"}
                                  </Badge>
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Students View */}
        {activeView === "students" && (
          <div className="space-y-4">
            {/* Search and Add */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <Input
                  placeholder="Search students... (ค้นหา)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <Button
                onClick={() => setShowAddStudent(true)}
                className="bg-orange-600 hover:bg-orange-500"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Students List */}
            <div className="space-y-2">
              {filteredStudents.length === 0 ? (
                <Card className="bg-neutral-900/50 border-neutral-800">
                  <CardContent className="p-6 text-center">
                    <Users className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                    <p className="text-neutral-400">No students found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredStudents.map((student) => (
                  <Card 
                    key={student.id} 
                    className="bg-neutral-900/50 border-neutral-800 cursor-pointer hover:bg-neutral-800/50 transition-colors"
                    onClick={() => openStudentDetail(student)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {student.avatar_url ? (
                            <Image
                              src={student.avatar_url || "/placeholder.svg"}
                              alt=""
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-neutral-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">
                            {student.full_name || "Unknown"}
                          </p>
                          <p className="text-xs text-neutral-400 truncate">{student.email}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-500" />
                        {student.credits_remaining > 0 && (
                          <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                            {student.credits_remaining} credits
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Profile View */}
        {activeView === "profile" && (
          <div className="space-y-4">
            {/* Profile Photo */}
            <Card className="bg-neutral-900/50 border-neutral-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <label className="relative w-20 h-20 rounded-full bg-neutral-700 border-2 border-neutral-600 overflow-hidden flex-shrink-0 cursor-pointer group">
                    {profile.photo_url ? (
                      <Image
                        src={profile.photo_url || "/placeholder.svg"}
                        alt={profile.display_name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-8 h-8 text-neutral-500" />
                      </div>
                    )}
                    {/* Camera overlay */}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {isUploadingAvatar ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </div>
                    {/* Camera badge */}
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center border-2 border-neutral-900">
                      <Camera className="w-3 h-3 text-white" />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={isUploadingAvatar}
                    />
                  </label>
                  <div>
                    <h2 className="text-xl font-bold">{profile.display_name}</h2>
                    <p className="text-sm text-neutral-400">{profile.title || "Trainer"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Switch
                        checked={profile.is_available}
                        onCheckedChange={(checked) =>
                          setProfile((prev) => ({ ...prev, is_available: checked }))
                        }
                      />
                      <span className="text-xs text-neutral-400">
                        {profile.is_available ? "Available (พร้อมสอน)" : "Unavailable (ไม่ว่าง)"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Photos */}
            <Card className="bg-neutral-900/50 border-neutral-800">
              <CardContent className="p-4 space-y-3">
                <Label className="text-neutral-300">Photos (รูปภาพ) - Max 5</Label>
                <div className="flex gap-2 flex-wrap">
                  {(profile.photos || []).map((photo, idx) => (
                    <div
                      key={idx}
                      className="w-16 h-16 rounded-lg bg-neutral-700 overflow-hidden relative group"
                    >
                      <Image
                        src={photo || "/placeholder.svg"}
                        alt=""
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  {(profile.photos?.length || 0) < 5 && (
                    <label className="w-16 h-16 rounded-lg bg-neutral-800 border border-dashed border-neutral-600 flex items-center justify-center cursor-pointer hover:border-orange-500 transition-colors">
                      {isUploadingPhoto ? (
                        <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5 text-neutral-400" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={isUploadingPhoto}
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-neutral-500">Tap the camera icon to upload a photo</p>
              </CardContent>
            </Card>

            {/* Basic Info */}
            <Card className="bg-neutral-900/50 border-neutral-800">
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  <Label className="text-neutral-300">Display Name (ชื่อที่แสดง)</Label>
                  <Input
                    value={profile.display_name}
                    onChange={(e) => setProfile((prev) => ({ ...prev, display_name: e.target.value }))}
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-neutral-300">Title (ตำแหน่ง)</Label>
                    <Input
                      value={profile.title || ""}
                      onChange={(e) => setProfile((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Head Trainer"
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-300">Years Experience</Label>
                    <Input
                      type="number"
                      value={profile.years_experience || ""}
                      onChange={(e) => setProfile((prev) => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
                      placeholder="10"
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-300">Bio (ประวัติ)</Label>
                  <Textarea
                    value={profile.bio || ""}
                    onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell students about yourself... (เล่าเกี่ยวกับตัวคุณ...)"
                    className="bg-neutral-800 border-neutral-700 text-white min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-300">Specialties (ความเชี่ยวชาญ)</Label>
                  <Input
                    value={(profile.specialties || []).join(", ")}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        specialties: e.target.value.split(",").map((s) => s.trim()),
                      }))
                    }
                    placeholder="Clinch, Elbows, Pad Work (comma separated)"
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Fight Record */}
            <Card className="bg-neutral-900/50 border-neutral-800">
              <CardContent className="p-4 space-y-3">
                <Label className="text-neutral-300">Fight Record (สถิติการชก)</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs text-neutral-500">Wins (ชนะ)</Label>
                    <Input
                      type="number"
                      value={profile.fight_record_wins || 0}
                      onChange={(e) =>
                        setProfile((prev) => ({ ...prev, fight_record_wins: parseInt(e.target.value) || 0 }))
                      }
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-neutral-500">Losses (แพ้)</Label>
                    <Input
                      type="number"
                      value={profile.fight_record_losses || 0}
                      onChange={(e) =>
                        setProfile((prev) => ({ ...prev, fight_record_losses: parseInt(e.target.value) || 0 }))
                      }
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-neutral-500">Draws (เสมอ)</Label>
                    <Input
                      type="number"
                      value={profile.fight_record_draws || 0}
                      onChange={(e) =>
                        setProfile((prev) => ({ ...prev, fight_record_draws: parseInt(e.target.value) || 0 }))
                      }
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Availability */}
            <Card className="bg-neutral-900/50 border-neutral-800">
              <CardContent className="p-4 space-y-4">
                <Label className="text-neutral-300">Availability (ความพร้อม)</Label>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">Available for Training</p>
                    <p className="text-xs text-neutral-500">พร้อมรับสอน</p>
                  </div>
                  <Switch
                    checked={profile.is_available ?? true}
                    onCheckedChange={(checked) => setProfile((prev) => ({ ...prev, is_available: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">Open to Fights</p>
                    <p className="text-xs text-neutral-500">เปิดรับแมทช์ชก</p>
                  </div>
                  <Switch
                    checked={profile.open_to_fights ?? false}
                    onCheckedChange={(checked) => setProfile((prev) => ({ ...prev, open_to_fights: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">Open to Events</p>
                    <p className="text-xs text-neutral-500">เปิดรับงานอีเว้นท์</p>
                  </div>
                  <Switch
                    checked={profile.open_to_events ?? false}
                    onCheckedChange={(checked) => setProfile((prev) => ({ ...prev, open_to_events: checked }))}
                  />
                </div>

                {!profile.is_available && (
                  <div className="space-y-2 pt-2 border-t border-neutral-800">
                    <Label className="text-neutral-400 text-xs">Availability Note (optional)</Label>
                    <Input
                      value={profile.availability_note || ""}
                      onChange={(e) => setProfile((prev) => ({ ...prev, availability_note: e.target.value }))}
                      placeholder="e.g., On vacation until March 1st"
                      className="bg-neutral-800 border-neutral-700 text-white text-sm"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="w-full bg-orange-600 hover:bg-orange-500"
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Profile (บันทึกโปรไฟล์)"
              )}
            </Button>

            {/* View Public Profile */}
            {organization?.slug && (
              <a
                href={`/gyms/${organization.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-lg border border-neutral-700 py-2.5 text-sm text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Public Gym Page
              </a>
            )}
          </div>
        )}

        {/* OckOck Chat View */}
        {activeView === "ockock" && (
          <div className="flex flex-col h-[calc(100vh-180px)]">
            {/* Suggested Prompts - show only when just the greeting message */}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pb-3">
                {[
                  "How many students today?",
                  "Show me this week's schedule",
                  "Any students with low credits?",
                  "Help me write a training plan",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setInputMessage(prompt)
                      // Auto-send
                      setMessages((prev) => [...prev, { role: "user", content: prompt }])
                      setIsSending(true)
                      fetch("/api/admin/ockock", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ message: prompt, org_id: organization?.id }),
                      })
                        .then((res) => res.json())
                        .then((data) => {
                          setMessages((prev) => [...prev, { role: "assistant", content: data.reply || data.message || "I couldn't process that. Try again?" }])
                        })
                        .catch(() => {
                          setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }])
                        })
                        .finally(() => {
                          setIsSending(false)
                          setInputMessage("")
                        })
                    }}
                    className="rounded-full border border-neutral-700 bg-neutral-800/50 px-3 py-1.5 text-xs text-neutral-300 hover:border-orange-500/50 hover:text-white transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 pb-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <Image
                      src={OCKOCK_AVATAR || "/placeholder.svg"}
                      alt="OckOck"
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-orange-600 text-white"
                        : "bg-neutral-800 text-white"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex gap-3">
                  <Image
                    src={OCKOCK_AVATAR || "/placeholder.svg"}
                    alt="OckOck"
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                  <div className="bg-neutral-800 rounded-2xl px-4 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2 pt-3 border-t border-neutral-800">
              <Input
                placeholder="Ask OckOck... (ถาม OckOck)"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                className="bg-neutral-800 border-neutral-700 text-white"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isSending || !inputMessage.trim()}
                className="bg-orange-600 hover:bg-orange-500"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800/50 pb-safe">
        <div className="max-w-lg mx-auto px-4 py-2">
          <div className="flex items-center justify-around">
            <NavButton
              icon={<Calendar className="w-5 h-5" />}
              label="Today"
              labelTh="วันนี้"
              active={activeView === "today"}
              onClick={() => setActiveView("today")}
              badge={pendingBookings.length > 0 ? pendingBookings.length : undefined}
            />
            <NavButton
              icon={<Users className="w-5 h-5" />}
              label="Students"
              labelTh="นักเรียน"
              active={activeView === "students"}
              onClick={() => setActiveView("students")}
            />
            <button
              onClick={() => setActiveView("ockock")}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${
                activeView === "ockock" ? "text-orange-500" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Image
                src={OCKOCK_AVATAR || "/placeholder.svg"}
                alt="OckOck"
                width={20}
                height={20}
                className="w-5 h-5 rounded-full"
              />
              <span className="text-[10px] font-medium">OckOck</span>
            </button>
            <NavButton
              icon={<User className="w-5 h-5" />}
              label="Profile"
              labelTh="โปรไฟล์"
              active={activeView === "profile"}
              onClick={() => setActiveView("profile")}
            />
          </div>
        </div>
      </nav>

      {/* Student Detail Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-md mx-4 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-neutral-700 flex items-center justify-center overflow-hidden">
                {selectedStudent?.avatar_url ? (
                  <Image
                    src={selectedStudent.avatar_url || "/placeholder.svg"}
                    alt=""
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-neutral-400" />
                )}
              </div>
              <div>
                <DialogTitle>{selectedStudent?.full_name || "Unknown Student"}</DialogTitle>
                <DialogDescription className="text-neutral-400">
                  {selectedStudent?.email}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {isLoadingStudent ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="space-y-5 mt-2">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-white">{selectedStudent?.total_sessions || 0}</p>
                  <p className="text-[10px] text-neutral-500">Sessions</p>
                </div>
                <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-white">{selectedStudent?.credits_remaining || 0}</p>
                  <p className="text-[10px] text-neutral-500">Credits</p>
                </div>
                <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
                  <p className="text-sm font-medium text-white">
                    {selectedStudent?.last_visit
                      ? new Date(selectedStudent.last_visit).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "—"}
                  </p>
                  <p className="text-[10px] text-neutral-500">Last Visit</p>
                </div>
              </div>

              {/* Notes Section */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" />
                  Notes
                </p>
                <div className="flex gap-2">
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note about this student..."
                    rows={2}
                    className="bg-neutral-800 border-neutral-700 text-white text-sm resize-none"
                  />
                  <Button
                    onClick={handleAddNote}
                    disabled={isLoading || !newNote.trim()}
                    className="bg-orange-600 hover:bg-orange-500 self-end"
                    size="sm"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
                {studentNotes.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {studentNotes.map((note) => (
                      <div key={note.id} className="bg-neutral-800/30 rounded-lg px-3 py-2 text-sm">
                        <p className="text-neutral-200">{note.content}</p>
                        <p className="text-[10px] text-neutral-600 mt-1">
                          {note.trainer_name} · {new Date(note.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Sessions */}
              {studentBookingHistory.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    Recent Sessions
                  </p>
                  <div className="space-y-1">
                    {studentBookingHistory.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between text-sm py-1.5 border-b border-neutral-800/50 last:border-0">
                        <span className="text-neutral-300">
                          {new Date(booking.booking_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <span className="text-neutral-500 text-xs">{booking.services?.name || "Session"}</span>
                        <Badge className={`text-[10px] ${booking.status === "completed" ? "bg-green-500/10 text-green-400" : "bg-neutral-500/10 text-neutral-400"}`}>
                          {booking.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Issue Certificate */}
              {selectedStudent?.email && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-3 h-3" />
                    Certificate
                  </p>
                  {certSuccess ? (
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm">
                      <p className="text-emerald-400 font-medium">Certificate issued!</p>
                      <p className="text-neutral-400 text-xs mt-1">#{certSuccess}</p>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        value={certLevel}
                        onChange={(e) => setCertLevel(e.target.value)}
                        className="flex-1 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white"
                      >
                        <option value="">Select level...</option>
                        <option value="naga">Naga (Level 1)</option>
                        <option value="phayra-nak">Phayra Nak (Level 2)</option>
                        <option value="singha">Singha (Level 3)</option>
                        <option value="hanuman">Hanuman (Level 4)</option>
                        <option value="garuda">Garuda (Level 5)</option>
                      </select>
                      <Button
                        onClick={handleIssueCertificate}
                        disabled={isIssuingCert || !certLevel}
                        className="bg-orange-600 hover:bg-orange-500"
                        size="sm"
                      >
                        {isIssuingCert ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Add Student (เพิ่มนักเรียน)</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Add a walk-in student and send them an invite
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddStudent} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-neutral-300">Name (ชื่อ)</Label>
              <Input
                value={newStudent.name}
                onChange={(e) => setNewStudent((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Student name"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-300">Email (อีเมล) *</Label>
              <Input
                type="email"
                value={newStudent.email}
                onChange={(e) => setNewStudent((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="student@email.com"
                required
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            <Button
              type="submit"
              disabled={isAddingStudent || !newStudent.email}
              className="w-full bg-orange-600 hover:bg-orange-500"
            >
              {isAddingStudent ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add & Send Invite"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
