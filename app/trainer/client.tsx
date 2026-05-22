"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
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
import ImpersonationBanner from "@/components/impersonation-banner"
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
import FightInvitationsCard from "@/components/trainer/fight-invitations-card"
import UpcomingFightsCard from "@/components/trainer/upcoming-fights-card"

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

interface ServiceOption {
  id: string
  name: string
  price_thb: number
  is_active: boolean
  duration_minutes: number | null
}

interface TrainerDashboardProps {
  user: SupabaseUser
  trainerProfile: TrainerProfile
  organization: Organization | null
  todayBookings: Booking[]
  students: Student[]
  services: ServiceOption[]
}

// Curated half-hour slots the trainer can pick when registering a
// walk-in. Same set the admin's New Booking dialog uses; mirrors
// typical Muay Thai gym session start times in Thailand.
const WALKIN_TIME_SLOTS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00",
]

export default function TrainerDashboardClient({
  user,
  trainerProfile,
  organization,
  todayBookings: initialBookings,
  students: initialStudents,
  services,
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
  // Walk-in booking dialog — invoked from the Today view's "+" button.
  // Creates an event_bookings row server-side so the trainer can then
  // mark the walk-in present + collect cash through the existing
  // attendance/payment buttons. Previously the trainer had no way
  // to register a walk-in (Add Student created a user with no booking,
  // and cash collection requires a booking_id).
  const [showWalkInBooking, setShowWalkInBooking] = useState(false)
  const [walkInForm, setWalkInForm] = useState({
    serviceId: "",
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    bookingTime: "",
    paymentMethod: "cash" as "cash" | "stripe",
    isPaid: true,
  })
  const [walkInError, setWalkInError] = useState("")
  const [isCreatingWalkIn, setIsCreatingWalkIn] = useState(false)
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
      content: `สวัสดีครับ ${trainerProfile.display_name}! I'm OckOck — here to help. (ผมช่วยอะไรได้บ้างครับ?)`,
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
  const [skillSignoffs, setSkillSignoffs] = useState<{
    skills: Array<{ index: number; name: string; signedOff: boolean }>
    completedCount: number
    totalCount: number
    allComplete: boolean
  } | null>(null)
  const [loadingSkills, setLoadingSkills] = useState(false)

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
      } else {
        const data = await res.json().catch(() => ({}))
        toast({ title: "Error", description: data.error || "Failed to update attendance", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Connection error — please try again", variant: "destructive" })
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
      } else {
        const data = await res.json().catch(() => ({}))
        toast({ title: "Error", description: data.error || "Failed to update payment", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Connection error — please try again", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBookingsForDate = async (date: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/trainer/bookings?date=${date}&org_id=${organization?.id}`)
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings || [])
        setSelectedDate(date)
        setScheduleView("list")
      } else {
        toast({ title: "Error", description: "Failed to load bookings", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Connection error", variant: "destructive" })
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
    } catch {
      toast({ title: "Error", description: "Failed to load calendar", variant: "destructive" })
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
    } catch {
      toast({ title: "Error", description: "Failed to load student details", variant: "destructive" })
    } finally {
      setIsLoadingStudent(false)
    }
  }

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
      } else {
        toast({ title: "Error", description: "Failed to save note", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Connection error", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleIssueCertificate = async () => {
    if (!selectedStudent?.email || !certLevel) return
    setIsIssuingCert(true)
    setCertSuccess(null)
    try {
      // Trainers can't override the skill requirement (only owner/admin
      // can — that's enforced server-side). We never send skip:true from
      // the trainer dashboard so the API can return a clean "complete
      // the skills first" error instead of a 403 about role.
      const res = await fetch("/api/admin/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_email: selectedStudent.email,
          level: certLevel,
          skip_skills_check: false,
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

  const fetchSkillSignoffs = async (studentId: string, level: string) => {
    setLoadingSkills(true)
    try {
      const res = await fetch(`/api/admin/certificates/skills?student_id=${studentId}&level=${level}`)
      if (res.ok) {
        const data = await res.json()
        setSkillSignoffs(data)
      } else {
        setSkillSignoffs(null)
      }
    } catch {
      setSkillSignoffs(null)
    } finally {
      setLoadingSkills(false)
    }
  }

  const handleToggleSkill = async (skillIndex: number, currentlySignedOff: boolean) => {
    if (!selectedStudent || !certLevel) return
    const method = currentlySignedOff ? "DELETE" : "POST"
    try {
      const res = await fetch("/api/admin/certificates/skills", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: selectedStudent.id,
          level: certLevel,
          skill_index: skillIndex,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (method === "DELETE") {
          setSkillSignoffs((prev) =>
            prev
              ? {
                  ...prev,
                  skills: prev.skills.map((s) =>
                    s.index === skillIndex ? { ...s, signedOff: false } : s
                  ),
                  completedCount: prev.completedCount - 1,
                  allComplete: false,
                }
              : null
          )
        } else {
          setSkillSignoffs((prev) =>
            prev
              ? {
                  ...prev,
                  skills: prev.skills.map((s) =>
                    s.index === skillIndex ? { ...s, signedOff: true } : s
                  ),
                  completedCount: data.completedCount,
                  allComplete: data.allComplete,
                }
              : null
          )
        }
      } else {
        const data = await res.json().catch(() => ({}))
        toast({ title: "Error", description: data.error || "Failed to update skill", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Connection error", variant: "destructive" })
    }
  }

  const handleLevelChange = (level: string) => {
    setCertLevel(level)
    setCertSuccess(null)
    setSkillSignoffs(null)
    if (level && selectedStudent) {
      fetchSkillSignoffs(selectedStudent.id, level)
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
      const data = await res.json()
      if (res.ok) {
        setStudents((prev) => [
          {
            id: data.studentId || crypto.randomUUID(),
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
      } else {
        toast({ title: "Error", description: data.error || "Failed to add student", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Connection error — please try again", variant: "destructive" })
    } finally {
      setIsAddingStudent(false)
    }
  }

  // Create a walk-in booking from the trainer view. Hits the same
  // /api/bookings endpoint the owner's New Booking dialog uses;
  // service-role on the server-side bypasses RLS so a trainer
  // (member of the gym) can write. Validation mirrors the owner
  // dialog: service + name + (today's) date required. Time is
  // optional — a walk-in might just want "this morning's class."
  const handleCreateWalkIn = async () => {
    setWalkInError("")
    if (!walkInForm.serviceId) {
      setWalkInError("Pick a service first.")
      return
    }
    if (!walkInForm.guestName.trim()) {
      setWalkInError("Enter the customer's name.")
      return
    }
    const selectedService = services.find((s) => s.id === walkInForm.serviceId)
    if (!selectedService) {
      setWalkInError("Invalid service.")
      return
    }
    if (!organization?.id) {
      setWalkInError("No gym context.")
      return
    }

    setIsCreatingWalkIn(true)
    try {
      const today = new Date().toISOString().split("T")[0]
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: organization.id,
          service_id: walkInForm.serviceId,
          guest_name: walkInForm.guestName.trim(),
          guest_email: walkInForm.guestEmail.trim() || null,
          guest_phone: walkInForm.guestPhone.trim() || null,
          // Walk-ins are always today by definition. If they want
          // a future date, that's a booking, not a walk-in — they
          // can do it through the public site.
          booking_date: today,
          booking_time: walkInForm.bookingTime || null,
          payment_method: walkInForm.paymentMethod,
          payment_status: walkInForm.isPaid ? "paid" : "pending",
          payment_amount_thb: selectedService.price_thb,
          payment_currency: "THB",
          status: "confirmed",
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to create walk-in booking")
      }

      // Splice the new booking into the local Today list so it
      // shows up immediately without a full refetch. The server
      // returns the inserted row in `booking`.
      const inserted = data.booking
      if (inserted) {
        setBookings((prev) =>
          [
            ...prev,
            {
              id: inserted.id,
              booking_date: inserted.booking_date,
              booking_time: inserted.booking_time,
              status: inserted.status,
              payment_status: inserted.payment_status,
              payment_method: inserted.payment_method,
              payment_amount_thb: inserted.payment_amount_thb,
              guest_name: inserted.guest_name,
              guest_email: inserted.guest_email,
              guest_phone: inserted.guest_phone,
              customer_notes: inserted.customer_notes ?? null,
              services: { name: selectedService.name, category: "", duration_minutes: selectedService.duration_minutes ?? null },
              users: null,
            } as Booking,
          ].sort((a, b) => (a.booking_time ?? "").localeCompare(b.booking_time ?? "")),
        )
      }

      toast({
        title: "Walk-in added",
        description: `${walkInForm.guestName.trim()} · ${selectedService.name}${walkInForm.isPaid ? " (paid)" : ""}`,
      })
      // Reset + close.
      setWalkInForm({
        serviceId: "",
        guestName: "",
        guestEmail: "",
        guestPhone: "",
        bookingTime: "",
        paymentMethod: "cash",
        isPaid: true,
      })
      setShowWalkInBooking(false)
    } catch (err) {
      setWalkInError(err instanceof Error ? err.message : "Couldn't add walk-in.")
    } finally {
      setIsCreatingWalkIn(false)
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-inter antialiased pb-20 overflow-x-hidden">
      <ImpersonationBanner />
      {/* Frosted header */}
      <header className="sticky top-0 z-40 bg-zinc-950/70 backdrop-blur-xl border-b border-zinc-900/80">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold text-white truncate leading-tight">
              {organization?.name || "Trainer"}
            </h1>
            <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500 mt-0.5">
              {activeView === "today" && "Today · วันนี้"}
              {activeView === "students" && "Students · นักเรียน"}
              {activeView === "profile" && "Profile · โปรไฟล์"}
              {activeView === "ockock" && "OckOck · ผู้ช่วย"}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            className="p-2 -mr-2 text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {/* Today View */}
        {activeView === "today" && (
          <div className="space-y-4">
            {/* Fight invitations — self-hides when nothing is pending */}
            <FightInvitationsCard />
            {/* Confirmed upcoming bouts — self-hides for non-fighters */}
            <UpcomingFightsCard />
            {/* Welcome strip — indigo accent, restrained */}
            <div className="rounded-xl ring-1 ring-indigo-500/20 bg-gradient-to-b from-indigo-500/[0.06] to-zinc-900/40 backdrop-blur-sm px-4 py-3">
              <p className="text-[13px] text-white">
                สวัสดี{" "}
                <span className="font-semibold">
                  {trainerProfile.display_name}
                </span>
              </p>
              <p className="text-[12px] text-zinc-500 mt-0.5">
                {bookings.length === 0
                  ? "No sessions today — enjoy the rest!"
                  : `${pendingBookings.length} upcoming${needsAttentionBookings.length > 0 ? ` · ${needsAttentionBookings.length} need attention` : ""}${completedBookings.length > 0 ? ` · ${completedBookings.length} done` : ""}`}
              </p>
            </div>

            {/* List/Calendar toggle */}
            <div className="flex items-center justify-between">
              <div className="flex bg-zinc-950/40 ring-1 ring-zinc-800 rounded-lg p-1 gap-1">
                <button
                  onClick={() => setScheduleView("list")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-medium transition-all ${
                    scheduleView === "list"
                      ? "bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700/60"
                      : "text-zinc-500 hover:text-zinc-200"
                  }`}
                >
                  <LucideList className="w-3.5 h-3.5" />
                  <span>List</span>
                </button>
                <button
                  onClick={() => setScheduleView("calendar")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-medium transition-all ${
                    scheduleView === "calendar"
                      ? "bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700/60"
                      : "text-zinc-500 hover:text-zinc-200"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Calendar</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                {scheduleView === "list" && selectedDate !== new Date().toISOString().split("T")[0] && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchBookingsForDate(new Date().toISOString().split("T")[0])}
                    className="border-zinc-800 bg-transparent text-xs"
                  >
                    Back to Today
                  </Button>
                )}
                <button
                  onClick={() => fetchBookingsForDate(selectedDate)}
                  disabled={isLoading}
                  className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  aria-label="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                </button>
                {/* + Walk-in — the front-desk action. Opens a small
                    dialog that creates a same-day booking with cash
                    payment, then the trainer marks them present + paid
                    through the existing booking actions. */}
                <Button
                  onClick={() => setShowWalkInBooking(true)}
                  size="sm"
                  className="h-9 bg-indigo-500 hover:bg-indigo-400 text-white gap-1 px-3"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-[12px] font-medium">Walk-in</span>
                </Button>
              </div>
            </div>

            {/* Calendar View */}
            {scheduleView === "calendar" && (
              <Card className="bg-zinc-900/40 ring-1 ring-zinc-900">
                <CardContent className="p-4">
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                      className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="font-medium">
                      {calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </h3>
                    <button
                      onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                      className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="text-center text-xs text-zinc-500 py-1">
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
                              ? "bg-indigo-500 text-white"
                              : isToday
                              ? "bg-zinc-800 text-white"
                              : "hover:bg-zinc-800"
                          }`}
                        >
                          <span>{day}</span>
                          {dayBookings.length > 0 && (
                            <div className="flex gap-0.5 mt-0.5">
                              {hasGroup && (
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
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
                  <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-zinc-900">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <div className="w-2 h-2 rounded-full bg-indigo-400" />
                      <span>Group</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span>Private</span>
                    </div>
                  </div>

                  {isLoadingMonth && (
                    <div className="absolute inset-0 bg-zinc-900/40 flex items-center justify-center rounded-lg">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-300" />
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
                    <p className="text-sm text-zinc-400">
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
                  <Card className="bg-zinc-900/40 ring-1 ring-zinc-900">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/15 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-indigo-300" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{pendingBookings.length}</p>
                          <p className="text-xs text-zinc-400">Upcoming (รอ)</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-zinc-900/40 ring-1 ring-zinc-900">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{completedBookings.length}</p>
                          <p className="text-xs text-zinc-400">Done (เสร็จ)</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Bookings List */}
                <div className="space-y-4">
                  {bookings.length === 0 ? (
                    <Card className="bg-zinc-900/40 ring-1 ring-zinc-900">
                      <CardContent className="p-6 text-center">
                        <Calendar className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                        <p className="text-zinc-400">No bookings today</p>
                        <p className="text-xs text-zinc-500">ไม่มีการจองวันนี้</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Needs Attention Section */}
                      {needsAttentionBookings.length > 0 && (
                        <div className="space-y-3">
                          <h2 className="text-sm font-medium text-zinc-400">
                            Needs Attention ({needsAttentionBookings.length})
                          </h2>
                          {needsAttentionBookings.map((booking) => {
                            const isPaidOnline = booking.payment_method === "card" && booking.payment_status === "paid"
                            const needsCashCollection = booking.payment_status !== "paid" && booking.status === "completed"
                            
                            return (
                              <Card key={booking.id} className="bg-zinc-900/40 ring-1 ring-zinc-900">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {booking.users?.avatar_url ? (
                                          <Image
                                            src={booking.users.avatar_url || "/placeholder.svg"}
                                            alt=""
                                            width={40}
                                            height={40}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <User className="w-5 h-5 text-zinc-400" />
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-medium text-white truncate">
                                          {booking.users?.full_name || booking.guest_name || booking.users?.email || booking.guest_email || "Walk-in"}
                                        </p>
                                        <p className="text-xs text-zinc-400">
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
                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-900">
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
                                      className={`w-full mt-2 ${needsCashCollection ? "ring-1 ring-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20" : "ring-1 ring-amber-500/25 text-amber-300/80 hover:bg-amber-500/10"}`}
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
                          <h2 className="text-sm font-medium text-zinc-400">
                            Completed ({fullyCompletedBookings.length})
                          </h2>
                          <Card className="bg-zinc-900/30 ring-1 ring-zinc-900">
                            <CardContent className="p-2 divide-y divide-zinc-900">
                              {fullyCompletedBookings.map((booking) => (
                                <div key={booking.id} className="flex items-center gap-3 py-2 px-2">
                                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                  <span className="text-sm text-zinc-300 truncate flex-1">
                                    {booking.users?.full_name || booking.guest_name || "Guest"}
                                  </span>
                                  <span className="text-xs text-zinc-500">
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  placeholder="Search students... (ค้นหา)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-zinc-900/50 ring-1 ring-zinc-800 text-white"
                />
              </div>
              <Button
                onClick={() => setShowAddStudent(true)}
                className="bg-indigo-500 hover:bg-indigo-400"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Students List */}
            <div className="space-y-2">
              {filteredStudents.length === 0 ? (
                <Card className="bg-zinc-900/40 ring-1 ring-zinc-900">
                  <CardContent className="p-6 text-center">
                    <Users className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                    <p className="text-zinc-400">No students found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredStudents.map((student) => (
                  <Card 
                    key={student.id} 
                    className="bg-zinc-900/40 ring-1 ring-zinc-900 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                    onClick={() => openStudentDetail(student)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {student.avatar_url ? (
                            <Image
                              src={student.avatar_url || "/placeholder.svg"}
                              alt=""
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-zinc-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">
                            {student.full_name || "Unknown"}
                          </p>
                          <p className="text-xs text-zinc-400 truncate">{student.email}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-500" />
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
            <Card className="bg-zinc-900/40 ring-1 ring-zinc-900">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <label className="relative w-20 h-20 rounded-full bg-zinc-800 border-2 border-zinc-700 overflow-hidden flex-shrink-0 cursor-pointer group">
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
                        <Camera className="w-8 h-8 text-zinc-500" />
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
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center border-2 border-neutral-900">
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
                    <p className="text-sm text-zinc-400">{profile.title || "Trainer"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Switch
                        checked={profile.is_available}
                        onCheckedChange={(checked) =>
                          setProfile((prev) => ({ ...prev, is_available: checked }))
                        }
                      />
                      <span className="text-xs text-zinc-400">
                        {profile.is_available ? "Available (พร้อมสอน)" : "Unavailable (ไม่ว่าง)"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Photos */}
            <Card className="bg-zinc-900/40 ring-1 ring-zinc-900">
              <CardContent className="p-4 space-y-3">
                <Label className="text-zinc-300">Photos (รูปภาพ) - Max 5</Label>
                <div className="flex gap-2 flex-wrap">
                  {(profile.photos || []).map((photo, idx) => (
                    <div
                      key={idx}
                      className="w-16 h-16 rounded-lg bg-zinc-800 overflow-hidden relative group"
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
                    <label className="w-16 h-16 rounded-lg bg-zinc-900 border border-dashed border-zinc-700 flex items-center justify-center cursor-pointer hover:border-indigo-500/40 transition-colors">
                      {isUploadingPhoto ? (
                        <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5 text-zinc-400" />
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
                <p className="text-xs text-zinc-500">Tap the camera icon to upload a photo</p>
              </CardContent>
            </Card>

            {/* Basic Info */}
            <Card className="bg-zinc-900/40 ring-1 ring-zinc-900">
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Display Name (ชื่อที่แสดง)</Label>
                  <Input
                    value={profile.display_name}
                    onChange={(e) => setProfile((prev) => ({ ...prev, display_name: e.target.value }))}
                    className="bg-zinc-900/50 ring-1 ring-zinc-800 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Title (ตำแหน่ง)</Label>
                    <Input
                      value={profile.title || ""}
                      onChange={(e) => setProfile((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Head Trainer"
                      className="bg-zinc-900/50 ring-1 ring-zinc-800 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Years Experience</Label>
                    <Input
                      type="number"
                      value={profile.years_experience || ""}
                      onChange={(e) => setProfile((prev) => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
                      placeholder="10"
                      className="bg-zinc-900/50 ring-1 ring-zinc-800 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Bio (ประวัติ)</Label>
                  <Textarea
                    value={profile.bio || ""}
                    onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell students about yourself... (เล่าเกี่ยวกับตัวคุณ...)"
                    className="bg-zinc-900/50 ring-1 ring-zinc-800 text-white min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Specialties (ความเชี่ยวชาญ)</Label>
                  <Input
                    value={(profile.specialties || []).join(", ")}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        specialties: e.target.value.split(",").map((s) => s.trim()),
                      }))
                    }
                    placeholder="Clinch, Elbows, Pad Work (comma separated)"
                    className="bg-zinc-900/50 ring-1 ring-zinc-800 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Fight Record */}
            <Card className="bg-zinc-900/40 ring-1 ring-zinc-900">
              <CardContent className="p-4 space-y-3">
                <Label className="text-zinc-300">Fight Record (สถิติการชก)</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs text-zinc-500">Wins (ชนะ)</Label>
                    <Input
                      type="number"
                      value={profile.fight_record_wins || 0}
                      onChange={(e) =>
                        setProfile((prev) => ({ ...prev, fight_record_wins: parseInt(e.target.value) || 0 }))
                      }
                      className="bg-zinc-900/50 ring-1 ring-zinc-800 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-500">Losses (แพ้)</Label>
                    <Input
                      type="number"
                      value={profile.fight_record_losses || 0}
                      onChange={(e) =>
                        setProfile((prev) => ({ ...prev, fight_record_losses: parseInt(e.target.value) || 0 }))
                      }
                      className="bg-zinc-900/50 ring-1 ring-zinc-800 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-500">Draws (เสมอ)</Label>
                    <Input
                      type="number"
                      value={profile.fight_record_draws || 0}
                      onChange={(e) =>
                        setProfile((prev) => ({ ...prev, fight_record_draws: parseInt(e.target.value) || 0 }))
                      }
                      className="bg-zinc-900/50 ring-1 ring-zinc-800 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Availability */}
            <Card className="bg-zinc-900/40 ring-1 ring-zinc-900">
              <CardContent className="p-4 space-y-4">
                <Label className="text-zinc-300">Availability (ความพร้อม)</Label>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">Available for Training</p>
                    <p className="text-xs text-zinc-500">พร้อมรับสอน</p>
                  </div>
                  <Switch
                    checked={profile.is_available ?? true}
                    onCheckedChange={(checked) => setProfile((prev) => ({ ...prev, is_available: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">Open to Fights</p>
                    <p className="text-xs text-zinc-500">เปิดรับแมทช์ชก</p>
                  </div>
                  <Switch
                    checked={profile.open_to_fights ?? false}
                    onCheckedChange={(checked) => setProfile((prev) => ({ ...prev, open_to_fights: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">Open to Events</p>
                    <p className="text-xs text-zinc-500">เปิดรับงานอีเว้นท์</p>
                  </div>
                  <Switch
                    checked={profile.open_to_events ?? false}
                    onCheckedChange={(checked) => setProfile((prev) => ({ ...prev, open_to_events: checked }))}
                  />
                </div>

                {!profile.is_available && (
                  <div className="space-y-2 pt-2 border-t border-zinc-900">
                    <Label className="text-zinc-400 text-xs">Availability Note (optional)</Label>
                    <Input
                      value={profile.availability_note || ""}
                      onChange={(e) => setProfile((prev) => ({ ...prev, availability_note: e.target.value }))}
                      placeholder="e.g., On vacation until March 1st"
                      className="bg-zinc-900/50 ring-1 ring-zinc-800 text-white text-sm"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="w-full bg-indigo-500 hover:bg-indigo-400"
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

            {/* Public Instructor Profile (/i/[handle]) — opt-in */}
            <InstructorPublicPanel />

            {/* View Public Profile */}
            {organization?.slug && (
              <a
                href={`/gyms/${organization.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-lg border border-zinc-800 py-2.5 text-sm text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
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
                    className="rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-xs text-zinc-300 hover:border-indigo-500/40/50 hover:text-white transition-colors"
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
                        ? "bg-indigo-500 text-white"
                        : "bg-zinc-900 text-white"
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
                  <div className="bg-zinc-900 rounded-2xl px-4 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2 pt-3 border-t border-zinc-900">
              <Input
                placeholder="Ask OckOck... (ถาม OckOck)"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                className="bg-zinc-900/50 ring-1 ring-zinc-800 text-white"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isSending || !inputMessage.trim()}
                className="bg-indigo-500 hover:bg-indigo-400"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom navigation — frosted, indigo on active */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-900/80 pb-safe">
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
                activeView === "ockock" ? "text-indigo-300" : "text-zinc-500 hover:text-zinc-200"
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
        <DialogContent className="bg-zinc-950 border-zinc-900 text-white max-w-md mx-4 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                {selectedStudent?.avatar_url ? (
                  <Image
                    src={selectedStudent.avatar_url || "/placeholder.svg"}
                    alt=""
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-zinc-400" />
                )}
              </div>
              <div>
                <DialogTitle>{selectedStudent?.full_name || "Unknown Student"}</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  {selectedStudent?.email}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {isLoadingStudent ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-300" />
            </div>
          ) : (
            <div className="space-y-5 mt-2">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-white">{selectedStudent?.total_sessions || 0}</p>
                  <p className="text-[10px] text-zinc-500">Sessions</p>
                </div>
                <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-white">{selectedStudent?.credits_remaining || 0}</p>
                  <p className="text-[10px] text-zinc-500">Credits</p>
                </div>
                <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
                  <p className="text-sm font-medium text-white">
                    {selectedStudent?.last_visit
                      ? new Date(selectedStudent.last_visit).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "—"}
                  </p>
                  <p className="text-[10px] text-zinc-500">Last Visit</p>
                </div>
              </div>

              {/* Notes Section */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" />
                  Notes
                </p>
                <div className="flex gap-2">
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note about this student..."
                    rows={2}
                    className="bg-zinc-900/50 ring-1 ring-zinc-800 text-white text-sm resize-none"
                  />
                  <Button
                    onClick={handleAddNote}
                    disabled={isLoading || !newNote.trim()}
                    className="bg-indigo-500 hover:bg-indigo-400 self-end"
                    size="sm"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
                {studentNotes.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {studentNotes.map((note) => (
                      <div key={note.id} className="bg-zinc-900/30 rounded-lg px-3 py-2 text-sm">
                        <p className="text-neutral-200">{note.content}</p>
                        <p className="text-[10px] text-zinc-600 mt-1">
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
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    Recent Sessions
                  </p>
                  <div className="space-y-1">
                    {studentBookingHistory.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between text-sm py-1.5 border-b border-zinc-900/50 last:border-0">
                        <span className="text-zinc-300">
                          {new Date(booking.booking_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <span className="text-zinc-500 text-xs">{booking.services?.name || "Session"}</span>
                        <Badge className={`text-[10px] ${booking.status === "completed" ? "bg-green-500/10 text-green-400" : "bg-neutral-500/10 text-zinc-400"}`}>
                          {booking.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Issue Certificate */}
              {selectedStudent?.email && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-3 h-3" />
                    Certification
                  </p>
                  {certSuccess ? (
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm">
                      <p className="text-emerald-400 font-medium">Certificate issued!</p>
                      <p className="text-zinc-400 text-xs mt-1">#{certSuccess}</p>
                      <a
                        href={`/verify/${certSuccess}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-400 text-xs flex items-center gap-1 mt-2 hover:text-orange-300"
                      >
                        View certificate <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <>
                      <select
                        value={certLevel}
                        onChange={(e) => handleLevelChange(e.target.value)}
                        className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
                      >
                        <option value="">Select level...</option>
                        <option value="naga">🐍 Naga (Level 1)</option>
                        <option value="phayra-nak">🐉 Phayra Nak (Level 2)</option>
                        <option value="singha">🦁 Singha (Level 3)</option>
                        <option value="hanuman">🐒 Hanuman (Level 4)</option>
                        <option value="garuda">🦅 Garuda (Level 5)</option>
                      </select>

                      {/* Skills Checklist */}
                      {certLevel && (
                        <div className="rounded-lg border border-zinc-900 bg-zinc-900/40 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-zinc-300">Skills Assessment</p>
                            {skillSignoffs && (
                              <Badge className={`text-[10px] ${skillSignoffs.allComplete ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-zinc-800 text-zinc-300 border-zinc-700"}`}>
                                {skillSignoffs.completedCount}/{skillSignoffs.totalCount}
                              </Badge>
                            )}
                          </div>

                          {loadingSkills ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                            </div>
                          ) : skillSignoffs ? (
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                              {skillSignoffs.skills.map((skill) => (
                                <button
                                  key={skill.index}
                                  onClick={() => handleToggleSkill(skill.index, skill.signedOff)}
                                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors ${
                                    skill.signedOff
                                      ? "bg-emerald-500/10 text-emerald-300"
                                      : "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800"
                                  }`}
                                >
                                  {skill.signedOff ? (
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  ) : (
                                    <div className="w-3.5 h-3.5 rounded-full border border-zinc-700 shrink-0" />
                                  )}
                                  <span className="flex-1">{skill.name}</span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-zinc-500 py-2">Select a level to see required skills</p>
                          )}

                          {/* Progress bar */}
                          {skillSignoffs && skillSignoffs.totalCount > 0 && (
                            <div className="mt-2">
                              <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${skillSignoffs.allComplete ? "bg-emerald-500" : "bg-orange-500"}`}
                                  style={{ width: `${(skillSignoffs.completedCount / skillSignoffs.totalCount) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Issue button */}
                      {certLevel && (
                        <Button
                          onClick={handleIssueCertificate}
                          disabled={isIssuingCert || !certLevel}
                          className={`w-full ${skillSignoffs?.allComplete ? "bg-emerald-600 hover:bg-emerald-500" : "bg-indigo-500 hover:bg-indigo-400"}`}
                          size="sm"
                        >
                          {isIssuingCert ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Award className="w-4 h-4 mr-2" />
                          )}
                          {skillSignoffs?.allComplete ? "Issue Certificate" : "Issue Certificate (skip skills check)"}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Walk-in Booking Dialog — same-day cash/card booking from
          the trainer's phone. Mirror of the owner's New Booking
          dialog at components/admin/today-tab.tsx but trimmed for
          the front-desk moment (date is always today, no future-
          booking option). After create, the new booking appears in
          the Today list and the trainer can mark Arrived + Cash
          through the existing actions. */}
      <Dialog open={showWalkInBooking} onOpenChange={setShowWalkInBooking}>
        <DialogContent className="bg-zinc-950 border-zinc-900 text-white max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Walk-in (มาวันนี้)</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Quick same-day booking. Mark them arrived + cash after.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {/* Service */}
            <div className="space-y-1">
              <Label htmlFor="walkin-service" className="text-[12px] text-zinc-300">
                Service *
              </Label>
              {services.length === 0 ? (
                <p className="text-[12px] text-amber-300">
                  No services configured yet. Ask the owner to set them up in /admin → Services.
                </p>
              ) : (
                <select
                  id="walkin-service"
                  value={walkInForm.serviceId}
                  onChange={(e) =>
                    setWalkInForm((p) => ({ ...p, serviceId: e.target.value }))
                  }
                  className="w-full h-11 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-indigo-500/60"
                >
                  <option value="">Pick service</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — ฿{s.price_thb.toLocaleString()}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Name */}
            <div className="space-y-1">
              <Label htmlFor="walkin-name" className="text-[12px] text-zinc-300">
                Name *
              </Label>
              <Input
                id="walkin-name"
                value={walkInForm.guestName}
                onChange={(e) =>
                  setWalkInForm((p) => ({ ...p, guestName: e.target.value }))
                }
                placeholder="Customer name"
                autoComplete="name"
                className="h-11 bg-zinc-900 border-zinc-800 text-white"
              />
            </div>

            {/* Email + phone in a single row to keep the dialog tight */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="walkin-email" className="text-[12px] text-zinc-300">
                  Email
                </Label>
                <Input
                  id="walkin-email"
                  type="email"
                  inputMode="email"
                  value={walkInForm.guestEmail}
                  onChange={(e) =>
                    setWalkInForm((p) => ({ ...p, guestEmail: e.target.value }))
                  }
                  placeholder="optional"
                  autoComplete="email"
                  className="h-11 bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="walkin-phone" className="text-[12px] text-zinc-300">
                  Phone
                </Label>
                <Input
                  id="walkin-phone"
                  type="tel"
                  inputMode="tel"
                  value={walkInForm.guestPhone}
                  onChange={(e) =>
                    setWalkInForm((p) => ({ ...p, guestPhone: e.target.value }))
                  }
                  placeholder="optional"
                  autoComplete="tel"
                  className="h-11 bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
            </div>

            {/* Time + Payment in a row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="walkin-time" className="text-[12px] text-zinc-300">
                  Time
                </Label>
                <select
                  id="walkin-time"
                  value={walkInForm.bookingTime}
                  onChange={(e) =>
                    setWalkInForm((p) => ({ ...p, bookingTime: e.target.value }))
                  }
                  className="w-full h-11 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-indigo-500/60"
                >
                  <option value="">No specific time</option>
                  {WALKIN_TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="walkin-pay" className="text-[12px] text-zinc-300">
                  Payment
                </Label>
                <select
                  id="walkin-pay"
                  value={walkInForm.paymentMethod}
                  onChange={(e) =>
                    setWalkInForm((p) => ({
                      ...p,
                      paymentMethod: e.target.value as "cash" | "stripe",
                    }))
                  }
                  className="w-full h-11 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-indigo-500/60"
                >
                  <option value="cash">Cash</option>
                  <option value="stripe">Card</option>
                </select>
              </div>
            </div>

            {/* Already paid toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={walkInForm.isPaid}
                onChange={(e) =>
                  setWalkInForm((p) => ({ ...p, isPaid: e.target.checked }))
                }
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900"
              />
              <span className="text-[13px] text-zinc-300">
                Payment collected (เก็บเงินแล้ว)
              </span>
            </label>

            {walkInError && (
              <p role="alert" className="text-[12px] text-rose-400">
                {walkInError}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => {
                  setWalkInError("")
                  setShowWalkInBooking(false)
                }}
                disabled={isCreatingWalkIn}
                className="h-11 bg-transparent border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateWalkIn}
                disabled={isCreatingWalkIn || services.length === 0}
                className="h-11 bg-indigo-500 hover:bg-indigo-400 text-white"
              >
                {isCreatingWalkIn ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  "Add (เพิ่ม)"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
        <DialogContent className="bg-zinc-950 border-zinc-900 text-white max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Add Student (เพิ่มนักเรียน)</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Add a walk-in student and send them an invite
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddStudent} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Name (ชื่อ)</Label>
              <Input
                value={newStudent.name}
                onChange={(e) => setNewStudent((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Student name"
                className="bg-zinc-900/50 ring-1 ring-zinc-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Email (อีเมล) *</Label>
              <Input
                type="email"
                value={newStudent.email}
                onChange={(e) => setNewStudent((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="student@email.com"
                required
                className="bg-zinc-900/50 ring-1 ring-zinc-800 text-white"
              />
            </div>
            <Button
              type="submit"
              disabled={isAddingStudent || !newStudent.email}
              className="w-full bg-indigo-500 hover:bg-indigo-400"
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

/**
 * Public instructor profile opt-in. Lives at the bottom of the trainer
 * profile view. Toggle + handle picker + deep link when enabled. Powers
 * /i/[handle] — the named-examiner lineage page that cert pages link to.
 */
function InstructorPublicPanel() {
  const [state, setState] = useState<{
    enabled: boolean
    handle: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/trainer/instructor-profile", { cache: "no-store" })
      const data = await res.json()
      if (res.ok && data.profile) {
        setState({
          enabled: !!data.profile.public_instructor_enabled,
          handle: data.profile.public_instructor_handle ?? "",
        })
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const save = async (patch: Record<string, unknown>) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/trainer/instructor-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Save failed")
      setState({
        enabled: !!data.profile.public_instructor_enabled,
        handle: data.profile.public_instructor_handle ?? "",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading || !state) {
    return (
      <div className="rounded-xl bg-zinc-900/40 ring-1 ring-zinc-900 p-4 text-center text-[12px] text-zinc-500">
        Loading instructor profile…
      </div>
    )
  }

  return (
    <Card className="bg-zinc-900/40 ring-1 ring-zinc-900">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Public Instructor Profile
            </p>
            <p className="text-[13px] text-white mt-1">
              A page showing who you&apos;ve graded, where you teach.
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Your name on student certificates becomes clickable.
            </p>
          </div>
          <button
            onClick={() => save({ enabled: !state.enabled })}
            disabled={saving || (state.enabled === false && !state.handle)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-40 ${
              state.enabled ? "bg-emerald-500" : "bg-zinc-700"
            }`}
            aria-pressed={state.enabled}
            aria-label="Toggle public instructor profile"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                state.enabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-[0.14em] text-zinc-500 block mb-1">
            Handle
          </label>
          <div className="flex items-center gap-1">
            <span className="text-[12px] text-zinc-500 font-mono">/i/</span>
            <input
              type="text"
              value={state.handle}
              onChange={(e) =>
                setState((s) =>
                  s
                    ? {
                        ...s,
                        handle: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                      }
                    : s,
                )
              }
              onBlur={() => {
                if (state.handle.length >= 3) save({ handle: state.handle })
              }}
              placeholder="khun-wisarut"
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-[13px] text-white placeholder:text-zinc-600 outline-none focus:border-zinc-700"
              maxLength={32}
            />
          </div>
          <p className="text-[10px] text-zinc-600 mt-1">
            Lowercase letters, digits, hyphens. 3–32 chars.
          </p>
        </div>

        {error && (
          <p className="text-[12px] text-red-300 bg-red-500/10 rounded px-2 py-1.5">
            {error}
          </p>
        )}

        {state.enabled && state.handle && (
          <a
            href={`/i/${state.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[12px] text-orange-300 hover:text-orange-200"
          >
            View your public instructor profile
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </CardContent>
    </Card>
  )
}
