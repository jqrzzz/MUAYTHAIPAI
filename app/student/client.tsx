"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  LogOut,
  Calendar,
  Award,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Dumbbell,
  ChevronRight,
  User,
  TrendingUp,
  Flame,
  Search,
  CreditCard,
  FileText,
  Send,
  Loader2,
  BookOpen,
} from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import StudentCoursesView from "@/components/student/courses-view"

const OCKOCK_AVATAR = "/images/ockock-avatar.png"

function OckOckAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  }
  return (
    <Image
      src={OCKOCK_AVATAR || "/placeholder.svg"}
      alt="OckOck"
      width={48}
      height={48}
      className={`${sizeClasses[size]} rounded-full object-cover`}
    />
  )
}

interface Booking {
  id: string
  booking_date: string
  booking_time: string | null
  status: string
  payment_status: string
  payment_method: string
  organizations: {
    name: string
    slug: string
    city: string
    logo_url: string | null
  } | null
  services: {
    name: string
    category: string
  } | null
}

interface Certificate {
  id: string
  level: string
  level_number: number
  issued_at: string
  certificate_number: string
  organizations: {
    name: string
    slug: string
  } | null
}

interface Gym {
  id: string
  name: string
  slug: string
  city: string | null
  province: string | null
  logo_url: string | null
  description: string | null
}

interface StudentCredit {
  id: string
  credit_type: string
  credits_remaining: number
  expires_at: string | null
  organizations: {
    name: string
    slug: string
    logo_url: string | null
  } | null
}

interface StudentNote {
  id: string
  content: string
  content_translated: string | null
  note_type: string
  created_at: string
  organizations: {
    name: string
    slug: string
  } | null
  trainer: {
    full_name: string | null
    display_name: string | null
  } | null
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface StudentDashboardProps {
  user: SupabaseUser
  profile: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  } | null
  bookings: Booking[]
  certificates: Certificate[]
  gyms: Gym[]
}

export default function StudentDashboardClient({ user, profile, bookings, certificates, gyms }: StudentDashboardProps) {
  const router = useRouter()
  const [activeView, setActiveView] = useState<
    "home" | "bookings" | "certificates" | "gyms" | "profile" | "credits" | "notes" | "ai" | "courses"
  >("home")

  const [credits, setCredits] = useState<StudentCredit[]>([])
  const [notes, setNotes] = useState<StudentNote[]>([])
  const [loadingCredits, setLoadingCredits] = useState(false)
  const [loadingNotes, setLoadingNotes] = useState(false)

  // Certification progress
  const [certProgress, setCertProgress] = useState<{
    id: string; number: number; name: string; icon: string; creature: string;
    duration: string; color: string; earned: boolean; earnedAt: string | null;
    certificateNumber: string | null; enrolled: boolean; enrolledAt: string | null;
    enrolledGym: string | null; skillsSignedOff: number; skillsTotal: number;
    courseCompleted: boolean;
    skills: { name: string; signedOff: boolean; signedOffAt: string | null }[];
    eligible: boolean; daysUntilEligible: number;
  }[]>([])
  const [loadingProgress, setLoadingProgress] = useState(false)

  // AI Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  useEffect(() => {
    if (
      (activeView === "certificates" || activeView === "home") &&
      certProgress.length === 0
    ) {
      fetchCertProgress()
    }
  }, [activeView])

  useEffect(() => {
    if (activeView === "credits" && credits.length === 0) {
      fetchCredits()
    }
  }, [activeView])

  useEffect(() => {
    if (activeView === "notes" && notes.length === 0) {
      fetchNotes()
    }
  }, [activeView])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const fetchCredits = async () => {
    setLoadingCredits(true)
    try {
      const res = await fetch("/api/student/credits")
      if (res.ok) {
        const data = await res.json()
        setCredits(data.credits || [])
      }
    } catch {
      // silent — student dashboard is read-only
    }
    setLoadingCredits(false)
  }

  const fetchNotes = async () => {
    setLoadingNotes(true)
    try {
      const res = await fetch("/api/student/notes")
      if (res.ok) {
        const data = await res.json()
        setNotes(data.notes || [])
      }
    } catch {
      // silent — student dashboard is read-only
    }
    setLoadingNotes(false)
  }

  const fetchCertProgress = async () => {
    setLoadingProgress(true)
    try {
      const res = await fetch("/api/student/certification-progress")
      if (res.ok) {
        const data = await res.json()
        setCertProgress(data.levels || [])
      }
    } catch {
      // silent
    }
    setLoadingProgress(false)
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return

    const userMessage = chatInput.trim()
    setChatInput("")
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setChatLoading(true)

    try {
      const res = await fetch("/api/student/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      })

      if (res.ok) {
        const data = await res.json()
        setChatMessages((prev) => [...prev, { role: "assistant", content: data.response }])
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, I couldn't process that. Please try again." },
        ])
      }
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Connection error. Please try again." }])
    }
    setChatLoading(false)
  }

  // Split bookings into upcoming and past
  const today = new Date().toISOString().split("T")[0]
  const upcomingBookings = bookings.filter((b) => b.booking_date >= today && b.status !== "cancelled")
  const pastBookings = bookings.filter((b) => b.booking_date < today || b.status === "completed")
  const completedSessions = bookings.filter((b) => b.status === "completed").length

  // Calculate streak (consecutive days trained)
  const streak = calculateStreak(pastBookings)

  // Unique gyms visited
  const gymsVisited = new Set(bookings.map((b) => b.organizations?.slug).filter(Boolean)).size

  const totalCredits = credits.reduce((sum, c) => sum + c.credits_remaining, 0)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">Confirmed</Badge>
      case "completed":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Completed</Badge>
      case "cancelled":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Cancelled</Badge>
      case "no_show":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">No Show</Badge>
      default:
        return <Badge className="bg-neutral-500/20 text-neutral-400 border-neutral-500/30 text-xs">{status}</Badge>
    }
  }

  const getLevelInfo = (level: string) => {
    const normalized = level.toLowerCase().replace(/[-_]/g, "")
    const levels: Record<string, { color: string; icon: string }> = {
      naga: { color: "from-blue-500 to-blue-700", icon: "🐍" },
      phayanak: { color: "from-emerald-500 to-emerald-700", icon: "🐉" },
      singha: { color: "from-amber-500 to-amber-700", icon: "🦁" },
      hanuman: { color: "from-slate-400 to-slate-600", icon: "🐒" },
      garuda: { color: "from-yellow-500 to-yellow-700", icon: "🦅" },
    }
    return levels[normalized] || { color: "from-neutral-500 to-neutral-700", icon: "🥊" }
  }

  const userName = profile?.full_name || user.email?.split("@")[0] || "Fighter"
  const greeting = getGreeting()

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* App-style Header */}
      <header className="sticky top-0 z-50 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-neutral-500">{greeting}</p>
              <h1 className="font-semibold text-white leading-tight">{userName}</h1>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveView("profile")}
            className="text-neutral-400 hover:text-white"
          >
            <User className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-24">
        {/* Home View */}
        {activeView === "home" && (
          <div className="py-6 space-y-6">
            {/* Quick Stats - Added credits card */}
            <div className="grid grid-cols-4 gap-2">
              <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                <CardContent className="p-3 text-center">
                  <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-white">{streak}</p>
                  <p className="text-[9px] text-orange-400/80 uppercase tracking-wide">Streak</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <CardContent className="p-3 text-center">
                  <TrendingUp className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-white">{completedSessions}</p>
                  <p className="text-[9px] text-blue-400/80 uppercase tracking-wide">Sessions</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <CardContent className="p-3 text-center">
                  <Award className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-white">{certificates.length}</p>
                  <p className="text-[9px] text-purple-400/80 uppercase tracking-wide">Certs</p>
                </CardContent>
              </Card>
              <button onClick={() => setActiveView("credits")} className="block">
                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 h-full hover:border-green-500/40 transition-colors">
                  <CardContent className="p-3 text-center">
                    <CreditCard className="w-4 h-4 text-green-500 mx-auto mb-1" />
                    <p className="text-xl font-bold text-white">{totalCredits || "—"}</p>
                    <p className="text-[9px] text-green-400/80 uppercase tracking-wide">Credits</p>
                  </CardContent>
                </Card>
              </button>
            </div>

            {/* Current cert journey */}
            {(() => {
              if (certProgress.length === 0) return null
              // Pick the level the student is most actively working on:
              //   1. enrolled-but-not-earned (most recent enrolment)
              //   2. highest level with signoffs but unearned
              //   3. highest level earned (showing achievement)
              const inProgress = certProgress
                .filter((l) => l.enrolled && !l.earned)
                .sort((a, b) => b.number - a.number)[0]
              const partial = certProgress
                .filter((l) => !l.earned && l.skillsSignedOff > 0)
                .sort((a, b) => b.number - a.number)[0]
              const earnedLatest = certProgress
                .filter((l) => l.earned)
                .sort((a, b) => b.number - a.number)[0]
              const current = inProgress || partial || earnedLatest
              if (!current) return null
              const remaining = current.skillsTotal - current.skillsSignedOff
              const pct =
                current.skillsTotal > 0
                  ? Math.round(
                      (current.skillsSignedOff / current.skillsTotal) * 100
                    )
                  : 0
              return (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-medium text-neutral-400">
                      Cert Journey
                    </h2>
                    <button
                      onClick={() => setActiveView("certificates")}
                      className="text-xs text-orange-500 hover:text-orange-400"
                    >
                      View Ladder
                    </button>
                  </div>
                  <button
                    onClick={() => setActiveView("certificates")}
                    className="w-full text-left"
                  >
                    <Card
                      className={`bg-gradient-to-br ${current.color} border-0 overflow-hidden hover:opacity-95 transition`}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">{current.icon}</div>
                          <div className="min-w-0 flex-1">
                            <Badge className="bg-white/20 text-white border-0 text-xs mb-1">
                              Level {current.number}
                            </Badge>
                            <h3 className="text-lg font-bold text-white capitalize truncate">
                              {current.name}
                            </h3>
                            {current.earned ? (
                              <p className="text-white/80 text-xs">
                                Earned · cert #{current.certificateNumber}
                              </p>
                            ) : current.enrolled ? (
                              <p className="text-white/80 text-xs">
                                Enrolled
                                {current.enrolledGym
                                  ? ` at ${current.enrolledGym}`
                                  : ""}
                              </p>
                            ) : (
                              <p className="text-white/80 text-xs">
                                In progress
                              </p>
                            )}
                            {!current.earned && (
                              <>
                                <div className="mt-2 h-1.5 rounded-full bg-black/30 overflow-hidden">
                                  <div
                                    className="h-full bg-white"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <p className="text-xs text-white/80 mt-1.5">
                                  {current.skillsSignedOff}/{current.skillsTotal} skills ·{" "}
                                  {remaining > 0
                                    ? `${remaining} to go`
                                    : "ready for assessment"}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                </div>
              )
            })()}

            {/* Next Session Card */}
            {upcomingBookings.length > 0 ? (
              <div>
                <h2 className="text-sm font-medium text-neutral-400 mb-3">Next Session</h2>
                <Card className="bg-gradient-to-br from-orange-600/20 to-red-600/10 border-orange-500/30 overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-lg font-semibold text-white">
                          {upcomingBookings[0].services?.name || "Training"}
                        </p>
                        <p className="text-orange-400 text-sm">{upcomingBookings[0].organizations?.name}</p>
                        <div className="flex items-center gap-3 mt-3 text-sm text-neutral-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(upcomingBookings[0].booking_date)}
                          </span>
                          {upcomingBookings[0].booking_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {upcomingBookings[0].booking_time}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                        <Dumbbell className="w-6 h-6 text-orange-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-neutral-900/50 border-neutral-800 border-dashed">
                <CardContent className="p-6 text-center">
                  <Calendar className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
                  <p className="text-neutral-400 text-sm mb-3">No upcoming sessions</p>
                  <Button onClick={() => setActiveView("gyms")} className="bg-orange-600 hover:bg-orange-500 text-sm">
                    Book Training
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Latest Certificate */}
            {certificates.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-neutral-400">Latest Achievement</h2>
                  <button
                    onClick={() => setActiveView("certificates")}
                    className="text-xs text-orange-500 hover:text-orange-400"
                  >
                    View All
                  </button>
                </div>
                <Card
                  className={`bg-gradient-to-br ${getLevelInfo(certificates[0].level).color} border-0 overflow-hidden`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{getLevelInfo(certificates[0].level).icon}</div>
                      <div>
                        <Badge className="bg-white/20 text-white border-0 text-xs mb-1">
                          Level {certificates[0].level_number}
                        </Badge>
                        <h3 className="text-lg font-bold text-white capitalize">
                          {certificates[0].level.replace(/[-_]/g, " ")}
                        </h3>
                        <p className="text-white/60 text-xs">{certificates[0].organizations?.name}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Quick Actions - Added AI and Notes buttons */}
            <div>
              <h2 className="text-sm font-medium text-neutral-400 mb-3">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveView("ai")}
                  className="bg-gradient-to-br from-orange-900/30 to-red-800/20 border border-orange-500/30 rounded-xl p-4 text-left hover:border-orange-500/50 transition-colors"
                >
                  <div className="w-8 h-8 mb-2">
                    <Image
                      src={OCKOCK_AVATAR || "/placeholder.svg"}
                      alt="OckOck"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  </div>
                  <p className="text-white font-medium text-sm">OckOck</p>
                  <p className="text-orange-400/70 text-xs">Your training coach</p>
                </button>
                <button
                  onClick={() => setActiveView("notes")}
                  className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-left hover:bg-neutral-800/50 transition-colors"
                >
                  <FileText className="w-5 h-5 text-blue-500 mb-2" />
                  <p className="text-white font-medium text-sm">Trainer Notes</p>
                  <p className="text-neutral-500 text-xs">View feedback</p>
                </button>
                <button
                  onClick={() => setActiveView("gyms")}
                  className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-left hover:bg-neutral-800/50 transition-colors"
                >
                  <Search className="w-5 h-5 text-orange-500 mb-2" />
                  <p className="text-white font-medium text-sm">Find Gyms</p>
                  <p className="text-neutral-500 text-xs">Browse network</p>
                </button>
                <button
                  onClick={() => setActiveView("courses")}
                  className="bg-gradient-to-br from-purple-900/30 to-indigo-800/20 border border-purple-500/30 rounded-xl p-4 text-left hover:border-purple-500/50 transition-colors"
                >
                  <BookOpen className="w-5 h-5 text-purple-400 mb-2" />
                  <p className="text-white font-medium text-sm">My Courses</p>
                  <p className="text-purple-400/70 text-xs">Track progress</p>
                </button>
                <button
                  onClick={() => setActiveView("bookings")}
                  className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-left hover:bg-neutral-800/50 transition-colors"
                >
                  <Calendar className="w-5 h-5 text-blue-500 mb-2" />
                  <p className="text-white font-medium text-sm">My Bookings</p>
                  <p className="text-neutral-500 text-xs">{bookings.length} total</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bookings View */}
        {activeView === "bookings" && (
          <div className="py-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">My Bookings</h2>
              <Badge className="bg-neutral-800 text-neutral-300 border-0">{bookings.length} total</Badge>
            </div>

            {upcomingBookings.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-3">Upcoming</h3>
                <div className="space-y-3">
                  {upcomingBookings.map((booking) => (
                    <Card key={booking.id} className="bg-neutral-900/50 border-neutral-800">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Dumbbell className="w-6 h-6 text-orange-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white truncate">{booking.services?.name || "Session"}</p>
                              {getStatusBadge(booking.status)}
                            </div>
                            <p className="text-sm text-orange-400 truncate">{booking.organizations?.name}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                              <span>{formatDate(booking.booking_date)}</span>
                              {booking.booking_time && <span>{booking.booking_time}</span>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {pastBookings.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-3">History</h3>
                <div className="space-y-2">
                  {pastBookings.slice(0, 20).map((booking) => (
                    <Card key={booking.id} className="bg-neutral-900/30 border-neutral-800/50">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center flex-shrink-0">
                            {booking.status === "completed" ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : booking.status === "no_show" ? (
                              <XCircle className="w-4 h-4 text-red-500" />
                            ) : (
                              <Dumbbell className="w-4 h-4 text-neutral-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-neutral-300 truncate">{booking.services?.name || "Session"}</p>
                            <p className="text-xs text-neutral-600">
                              {booking.organizations?.name} • {formatDate(booking.booking_date)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {bookings.length === 0 && (
              <Card className="bg-neutral-900/30 border-neutral-800/50 border-dashed">
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                  <p className="text-neutral-400 mb-4">No bookings yet</p>
                  <Button onClick={() => setActiveView("gyms")} className="bg-orange-600 hover:bg-orange-500">
                    Book Your First Session
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Certificates View */}
        {activeView === "certificates" && (
          <div className="py-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Certificates</h2>
              <Badge className="bg-neutral-800 text-neutral-300 border-0">{certificates.length} earned</Badge>
            </div>

            {certificates.length > 0 ? (
              <div className="space-y-4">
                {certificates.map((cert) => (
                  <Card
                    key={cert.id}
                    className={`bg-gradient-to-br ${getLevelInfo(cert.level).color} border-0 overflow-hidden`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="text-5xl">{getLevelInfo(cert.level).icon}</div>
                        <div className="flex-1">
                          <Badge className="bg-white/20 text-white border-0 text-xs mb-1">
                            Level {cert.level_number}
                          </Badge>
                          <h3 className="text-xl font-bold text-white capitalize">{cert.level.replace(/[-_]/g, " ")}</h3>
                          <p className="text-white/70 text-sm">{cert.organizations?.name}</p>
                          <p className="text-white/50 text-xs mt-1">
                            Issued {new Date(cert.issued_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {cert.certificate_number && (
                        <a
                          href={`/verify/${cert.certificate_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-white/30 text-xs mt-4 font-mono hover:text-white/60 transition-colors"
                        >
                          {cert.certificate_number} &rarr;
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-neutral-900/30 border-neutral-800/50 border-dashed">
                <CardContent className="p-8 text-center">
                  <Award className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                  <p className="text-neutral-400 mb-2">No certificates yet</p>
                  <p className="text-neutral-600 text-sm">Complete training programs to earn certificates</p>
                </CardContent>
              </Card>
            )}

            {/* Certification Progress */}
            <div>
              <h3 className="text-sm font-medium text-neutral-500 mb-3">Certification Progress</h3>
              {loadingProgress ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
                </div>
              ) : (
                <div className="space-y-2">
                  {(certProgress.length > 0 ? certProgress : ["naga", "phayra-nak", "singha", "hanuman", "garuda"].map((level, i) => ({
                    id: level, number: i + 1, name: level.replace(/[-_]/g, " "), icon: getLevelInfo(level).icon,
                    creature: "", duration: "", color: "", earned: certificates.some((c) => c.level.replace(/[-_]/g, "") === level.replace(/[-_]/g, "")),
                    earnedAt: null, certificateNumber: null, enrolled: false, enrolledAt: null, enrolledGym: null,
                    courseCompleted: false, skills: [], skillsSignedOff: 0, skillsTotal: 0, eligible: false, daysUntilEligible: 0,
                  }))).map((level) => (
                    <div
                      key={level.id}
                      className={`p-3 rounded-xl ${level.earned ? "bg-neutral-800/50" : level.enrolled ? "bg-neutral-800/30 border border-neutral-700/50" : "bg-neutral-900/30"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{level.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`capitalize font-medium ${level.earned ? "text-white" : level.enrolled ? "text-neutral-300" : "text-neutral-500"}`}>
                              {level.name}
                            </p>
                            <span className="text-[10px] text-neutral-600">Level {level.number}</span>
                          </div>
                          {level.earned && level.earnedAt && (
                            <p className="text-[11px] text-green-500/70 mt-0.5">
                              Earned {new Date(level.earnedAt).toLocaleDateString()}
                            </p>
                          )}
                          {level.enrolled && !level.earned && (
                            <p className="text-[11px] text-orange-400/70 mt-0.5">
                              Enrolled{level.enrolledGym ? ` at ${level.enrolledGym}` : ""}
                            </p>
                          )}
                          {!level.earned && level.courseCompleted && !level.enrolled && (
                            <p className="text-[11px] text-blue-400/70 mt-0.5">
                              Course completed — book in-person assessment to certify
                            </p>
                          )}
                          {!level.earned && !level.enrolled && level.daysUntilEligible > 0 && (
                            <p className="text-[11px] text-neutral-600 mt-0.5">
                              {level.daysUntilEligible} day{level.daysUntilEligible === 1 ? "" : "s"} until eligible
                            </p>
                          )}
                        </div>
                        <div className="shrink-0">
                          {level.earned ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : level.enrolled && level.skillsTotal > 0 ? (
                            <span className="text-[11px] font-medium text-orange-400">
                              {level.skillsSignedOff}/{level.skillsTotal}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {/* Skills checklist for enrolled or course-completed levels */}
                      {!level.earned && level.skills.length > 0 && (level.enrolled || level.courseCompleted) && (
                        <div className="mt-2 ml-11">
                          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden mb-2">
                            <div
                              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all"
                              style={{ width: `${Math.round((level.skillsSignedOff / level.skillsTotal) * 100)}%` }}
                            />
                          </div>
                          <div className="space-y-1">
                            {level.skills.map((skill, si) => (
                              <div key={si} className="flex items-center gap-2">
                                {skill.signedOff ? (
                                  <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full border border-neutral-700 flex-shrink-0" />
                                )}
                                <span className={`text-[11px] ${skill.signedOff ? "text-green-400/80" : "text-neutral-500"}`}>
                                  {skill.name}
                                </span>
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-neutral-600 mt-2">
                            {level.skillsSignedOff === level.skillsTotal
                              ? "All skills verified — ready for certification"
                              : `${level.skillsTotal - level.skillsSignedOff} skill${level.skillsTotal - level.skillsSignedOff === 1 ? "" : "s"} remaining`}
                          </p>
                        </div>
                      )}
                      {/* Certificate link + print */}
                      {level.earned && level.certificateNumber && (
                        <div className="flex items-center gap-3 mt-1 ml-11">
                          <a
                            href={`/verify/${level.certificateNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-neutral-600 hover:text-neutral-400 font-mono transition-colors"
                          >
                            {level.certificateNumber} &rarr;
                          </a>
                          <a
                            href={`/verify/${level.certificateNumber}/print`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-orange-500/60 hover:text-orange-400 transition-colors"
                          >
                            Download PDF
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gyms View */}
        {activeView === "gyms" && (
          <div className="py-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Thailand Gyms</h2>
              <p className="text-sm text-neutral-500">Book at any gym in the network</p>
            </div>

            <div className="space-y-3">
              {gyms.map((gym) => (
                <Card key={gym.id} className="bg-neutral-900/50 border-neutral-800">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-neutral-800 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                        {gym.logo_url ? (
                          <Image
                            src={gym.logo_url || "/placeholder.svg"}
                            alt={gym.name}
                            width={48}
                            height={48}
                            className="object-contain"
                          />
                        ) : (
                          <Dumbbell className="w-6 h-6 text-neutral-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/gyms/${gym.slug}`}>
                          <h3 className="font-medium text-white truncate hover:text-orange-400 transition-colors">{gym.name}</h3>
                        </Link>
                        <p className="text-sm text-neutral-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {gym.city}
                          {gym.province && `, ${gym.province}`}
                        </p>
                        {gym.description && (
                          <p className="text-xs text-neutral-600 mt-1 line-clamp-1">{gym.description}</p>
                        )}
                      </div>
                      <Link
                        href={`/book?gym=${gym.slug}`}
                        className="flex-shrink-0 rounded-lg bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-400 hover:bg-orange-500/20 transition-colors"
                      >
                        Book
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {gyms.length === 0 && (
              <Card className="bg-neutral-900/30 border-neutral-800/50 border-dashed">
                <CardContent className="p-8 text-center">
                  <MapPin className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                  <p className="text-neutral-400">No gyms available yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeView === "credits" && (
          <div className="py-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">My Credits</h2>
              <Button variant="ghost" size="sm" onClick={fetchCredits} className="text-neutral-400">
                Refresh
              </Button>
            </div>

            {loadingCredits ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
              </div>
            ) : credits.length > 0 ? (
              <div className="space-y-4">
                {credits.map((credit) => (
                  <Card key={credit.id} className="bg-neutral-900/50 border-neutral-800">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl font-bold text-green-500">{credit.credits_remaining}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white">{credit.credit_type}</p>
                          <p className="text-sm text-neutral-500">{credit.organizations?.name}</p>
                          {credit.expires_at && (
                            <p className="text-xs text-neutral-600 mt-1">
                              Expires: {new Date(credit.expires_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Badge
                          className={`${credit.credits_remaining > 3 ? "bg-green-500/20 text-green-400 border-green-500/30" : credit.credits_remaining > 0 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}
                        >
                          {credit.credits_remaining} left
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-neutral-900/30 border-neutral-800/50 border-dashed">
                <CardContent className="p-8 text-center">
                  <CreditCard className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                  <p className="text-neutral-400 mb-2">No credits yet</p>
                  <p className="text-neutral-600 text-sm">Purchase a package at any gym to get started</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeView === "notes" && (
          <div className="py-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Trainer Notes</h2>
              <Button variant="ghost" size="sm" onClick={fetchNotes} className="text-neutral-400">
                Refresh
              </Button>
            </div>

            {loadingNotes ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
              </div>
            ) : notes.length > 0 ? (
              <div className="space-y-4">
                {notes.map((note) => (
                  <Card key={note.id} className="bg-neutral-900/50 border-neutral-800">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-white">
                              {note.trainer?.display_name || note.trainer?.full_name || "Trainer"}
                            </p>
                            <Badge className="bg-neutral-800 text-neutral-400 border-0 text-xs capitalize">
                              {note.note_type}
                            </Badge>
                          </div>
                          <p className="text-neutral-300 text-sm">{note.content}</p>
                          {note.content_translated && note.content_translated !== note.content && (
                            <p className="text-neutral-500 text-sm mt-2 italic">"{note.content_translated}"</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-neutral-600">
                            <span>{note.organizations?.name}</span>
                            <span>•</span>
                            <span>{new Date(note.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-neutral-900/30 border-neutral-800/50 border-dashed">
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                  <p className="text-neutral-400 mb-2">No notes yet</p>
                  <p className="text-neutral-600 text-sm">Your trainers will add feedback after sessions</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeView === "ai" && (
          <div className="py-6 flex flex-col h-[calc(100vh-180px)]">
            <div className="flex items-center gap-3 mb-4">
              <OckOckAvatar size="md" />
              <div>
                <h2 className="text-lg font-semibold text-white">OckOck</h2>
                <p className="text-xs text-neutral-500">Your Muay Thai training coach</p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {chatMessages.length === 0 && (
                <div className="text-center py-8">
                  <OckOckAvatar size="lg" />
                  <p className="text-neutral-400 text-sm mb-1 mt-4">Sawasdee! I'm OckOck!</p>
                  <p className="text-neutral-500 text-xs mb-4">Ask me anything about your training!</p>
                  <div className="space-y-2">
                    {[
                      "How am I doing with my training?",
                      "What did my trainer say about me?",
                      "How many sessions do I have left?",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setChatInput(suggestion)
                        }}
                        className="block w-full text-left px-4 py-2 bg-neutral-900/50 border border-neutral-800 rounded-lg text-sm text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-300 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                  {msg.role === "assistant" && <OckOckAvatar size="sm" />}
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-orange-600 text-white rounded-br-md"
                        : "bg-neutral-800 text-neutral-200 rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start gap-2">
                  <OckOckAvatar size="sm" />
                  <div className="bg-neutral-800 px-4 py-3 rounded-2xl rounded-bl-md">
                    <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChatMessage()}
                placeholder="Ask OckOck anything..."
                className="flex-1 bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-600"
              />
              <Button
                onClick={sendChatMessage}
                disabled={!chatInput.trim() || chatLoading}
                className="bg-orange-600 hover:bg-orange-500"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Courses View */}
        {activeView === "courses" && <StudentCoursesView />}

        {/* Profile View */}
        {activeView === "profile" && (
          <div className="py-6 space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                {userName.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-semibold text-white">{userName}</h2>
              <p className="text-neutral-500 text-sm">{user.email}</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{completedSessions}</p>
                <p className="text-xs text-neutral-500">Sessions</p>
              </div>
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{certificates.length}</p>
                <p className="text-xs text-neutral-500">Certificates</p>
              </div>
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{gymsVisited}</p>
                <p className="text-xs text-neutral-500">Gyms Visited</p>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start bg-neutral-900/50 border-neutral-800 text-neutral-300 hover:bg-neutral-800"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation - App Style - Added AI tab */}
      <nav className="fixed bottom-0 left-0 right-0 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800/50 pb-safe">
        <div className="max-w-lg mx-auto px-4 py-2">
          <div className="flex items-center justify-around">
            <NavButton
              icon={<Dumbbell className="w-5 h-5" />}
              label="Home"
              active={activeView === "home"}
              onClick={() => setActiveView("home")}
            />
            <NavButton
              icon={<Calendar className="w-5 h-5" />}
              label="Bookings"
              active={activeView === "bookings"}
              onClick={() => setActiveView("bookings")}
              badge={upcomingBookings.length > 0 ? upcomingBookings.length : undefined}
            />
            <button
              onClick={() => setActiveView("ai")}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors relative ${
                activeView === "ai" ? "text-orange-500" : "text-neutral-500 hover:text-neutral-300"
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
              icon={<Award className="w-5 h-5" />}
              label="Certs"
              active={activeView === "certificates"}
              onClick={() => setActiveView("certificates")}
            />
            <NavButton
              icon={<MapPin className="w-5 h-5" />}
              label="Gyms"
              active={activeView === "gyms"}
              onClick={() => setActiveView("gyms")}
            />
          </div>
        </div>
      </nav>
    </div>
  )
}

// Helper Components
function NavButton({
  icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
  badge?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors relative ${
        active ? "text-orange-500" : "text-neutral-500 hover:text-neutral-300"
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
      {badge && (
        <span className="absolute -top-1 right-0 w-4 h-4 bg-orange-500 rounded-full text-[10px] text-white flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  )
}

// Helper Functions
function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalize today to midnight
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const dateStrNormalized = dateStr.split("T")[0] // Ensure date comparison is only by date part

  if (dateStrNormalized === today.toISOString().split("T")[0]) return "Today"
  if (dateStrNormalized === tomorrow.toISOString().split("T")[0]) return "Tomorrow"

  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

function calculateStreak(bookings: Booking[]): number {
  const completedDates = bookings
    .filter((b) => b.status === "completed")
    .map((b) => b.booking_date)
    .sort((a, b) => b.localeCompare(a)) // Most recent first

  if (completedDates.length === 0) return 0

  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  for (const dateStr of completedDates) {
    const bookingDate = new Date(dateStr)
    bookingDate.setHours(0, 0, 0, 0)

    // Calculate the difference in days.
    // Note: This calculation assumes dates are in the same timezone or handled appropriately.
    const diffTime = currentDate.getTime() - bookingDate.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) // Use Math.round for better accuracy with DST

    if (diffDays === 1) {
      // Check if it was the previous day
      streak++
      currentDate = bookingDate // Move to the date of the last completed session
    } else if (diffDays === 0) {
      // Handle same day entries if needed, though sorting should prevent this for streak logic
      // If we are processing the same day multiple times, it means multiple entries for the same date.
      // For streak calculation, we only care about consecutive unique days.
      // We already sorted, so the first occurrence of a date would be used.
      // If currentDate is already this bookingDate, it means we've already processed this day.
      if (currentDate.getTime() !== bookingDate.getTime()) {
        streak++
        currentDate = bookingDate
      }
    } else {
      break // Break if there's a gap of more than one day
    }
  }

  return streak
}
