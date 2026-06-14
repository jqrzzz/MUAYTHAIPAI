"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  Play,
  CheckCircle,
  Lock,
  Clock,
  BookOpen,
  Award,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  Dumbbell,
  HelpCircle,
} from "lucide-react"
import { CERTIFICATION_LEVELS, type CertificationLevelId } from "@/lib/certification-levels"

// ============================================
// Types
// ============================================

interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  short_description: string | null
  cover_image_url: string | null
  difficulty: string | null
  category: string | null
  certificate_level: string | null
  is_free: boolean | null
  price_thb: number | null
  total_modules: number | null
  total_lessons: number | null
  estimated_hours: number | null
  organizations: { name: string; slug: string; logo_url: string | null } | null
}

interface Lesson {
  id: string
  title: string
  description: string | null
  content_type: string | null
  video_duration_seconds: number | null
  estimated_minutes: number | null
  lesson_order: number | null
  is_preview: boolean | null
}

interface Module {
  id: string
  title: string
  description: string | null
  summary: string | null
  module_order: number
  lessons: Lesson[]
}

interface LessonProgress {
  lesson_id: string
  status: string
  video_position_seconds: number
  completed_at: string | null
}

interface Enrollment {
  id: string
  status: string
  completed_lessons: number
  total_lessons: number
  progress_pct: number
}

const CONTENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  video: <Play className="h-3.5 w-3.5" />,
  text: <FileText className="h-3.5 w-3.5" />,
  drill: <Dumbbell className="h-3.5 w-3.5" />,
  quiz: <HelpCircle className="h-3.5 w-3.5" />,
}

// ============================================
// Main Component
// ============================================

export default function CourseDetailClient({
  course,
  modules,
}: {
  course: Course
  modules: Module[]
}) {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [progress, setProgress] = useState<LessonProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [enrollError, setEnrollError] = useState<string | null>(null)
  const [confirmingPayment, setConfirmingPayment] = useState(false)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(modules.slice(0, 2).map((m) => m.id))
  )

  // Load enrollment and progress. Returning from Stripe Checkout
  // (?purchased=1) the webhook may lag the redirect by a beat — poll a few
  // times until the enrollment flips from paused to active.
  useEffect(() => {
    let cancelled = false
    async function load() {
      const purchased =
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("purchased") === "1"
      const attempts = purchased ? 5 : 1
      let active = false
      for (let i = 0; i < attempts; i++) {
        try {
          const res = await fetch(`/api/courses/progress?course_id=${course.id}`, {
            cache: "no-store",
          })
          if (res.ok) {
            const data = await res.json()
            if (cancelled) return
            setEnrollment(data.enrollment)
            setProgress(data.progress || [])
            active = data.enrollment && data.enrollment.status !== "paused"
          }
        } catch {
          // Not logged in — that's fine
        }
        if (!purchased || active) break
        setConfirmingPayment(true)
        if (i < attempts - 1) await new Promise((r) => setTimeout(r, 1600))
      }
      if (cancelled) return
      setConfirmingPayment(false)
      if (purchased && !active) {
        setEnrollError("Payment received — your course is still activating. Refresh in a moment.")
      }
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [course.id])

  async function handleEnroll() {
    setEnrolling(true)
    setEnrollError(null)
    try {
      const res = await fetch("/api/courses/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: course.id }),
      })
      if (res.status === 401) {
        window.location.href = `/student/login?redirect=/courses/${course.slug}`
        return
      }
      if (res.status === 402) {
        // Paid course — go through checkout
        const checkoutRes = await fetch("/api/courses/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_id: course.id }),
        })
        if (checkoutRes.ok) {
          const checkoutData = await checkoutRes.json()
          if (checkoutData.checkout_url) {
            window.location.href = checkoutData.checkout_url
            return
          }
          // Simulated payment (Stripe not connected yet)
          setEnrollment(checkoutData.enrollment)
        } else {
          const errData = await checkoutRes.json().catch(() => null)
          setEnrollError(errData?.error || "Checkout failed. Please try again.")
        }
      } else if (res.ok) {
        const data = await res.json()
        setEnrollment(data.enrollment)
      } else {
        const data = await res.json().catch(() => null)
        setEnrollError(data?.error || "Enrollment failed. Please try again.")
      }
    } catch {
      setEnrollError("Network error. Please check your connection.")
    } finally {
      setEnrolling(false)
    }
  }

  function toggleModule(moduleId: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  function getLessonStatus(lessonId: string): "completed" | "in_progress" | "locked" | "available" {
    if (!enrollment) return "locked"
    const p = progress.find((p) => p.lesson_id === lessonId)
    if (p?.status === "completed") return "completed"
    if (p?.status === "in_progress") return "in_progress"
    return "available"
  }

  // Find where to resume
  const allLessons = modules.flatMap((m) => m.lessons)
  const completedIds = new Set(progress.filter((p) => p.status === "completed").map((p) => p.lesson_id))
  const nextLesson = allLessons.find((l) => !completedIds.has(l.id))

  const isEnrolled = enrollment && enrollment.status !== "paused"

  // Resolve cert level metadata for the belt progression band + hero eyebrow
  const currentLevel = course.certificate_level
    ? CERTIFICATION_LEVELS.find(
        (l) =>
          l.id === course.certificate_level ||
          l.name.toLowerCase() === course.certificate_level?.toLowerCase(),
      )
    : null

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Slim top nav — minimal so the hero can breathe */}
      <header className="absolute top-0 inset-x-0 z-20">
        <div className="mx-auto max-w-6xl px-5 py-4">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-[12px] text-white/70 hover:text-white transition-colors backdrop-blur-sm bg-black/20 rounded-full px-3 py-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Courses
          </Link>
        </div>
      </header>

      {/* Cinematic hero */}
      <section className="relative w-full overflow-hidden">
        {course.cover_image_url ? (
          <>
            <div className="absolute inset-0">
              <Image
                src={course.cover_image_url}
                alt={course.title}
                fill
                sizes="100vw"
                priority
                className="object-cover scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/40 via-neutral-950/70 to-neutral-950" />
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/60 via-transparent to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900" />
        )}

        <div className="relative mx-auto max-w-6xl px-5 pt-24 pb-20 sm:pt-32 sm:pb-28 min-h-[60vh] flex flex-col justify-end">
          {currentLevel && (
            <p className="font-display text-[12px] uppercase tracking-[0.28em] text-white/80 mb-3 flex items-center gap-2">
              <span aria-hidden="true">{currentLevel.icon}</span>
              {currentLevel.name} · Level {currentLevel.number} ·{" "}
              <span className="text-white/60 italic font-serif normal-case tracking-normal">
                {currentLevel.creature}
              </span>
            </p>
          )}
          <h1 className="font-display text-[40px] sm:text-[64px] leading-[1.05] text-white max-w-3xl">
            {course.title}
          </h1>
          {course.short_description && (
            <p className="font-serif italic text-[18px] sm:text-[22px] text-white/80 max-w-2xl mt-4 leading-relaxed">
              {course.short_description}
            </p>
          )}
          {course.organizations && (
            <p className="mt-5 text-[13px] text-white/60">
              Taught at{" "}
              <Link
                href={`/gyms/${course.organizations.slug}`}
                className="text-orange-300 hover:text-orange-200 transition-colors"
              >
                {course.organizations.name}
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* Belt progression band — only renders when course has a cert level */}
      {currentLevel && (
        <BeltProgressionBand current={currentLevel.id} />
      )}

      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="lg:grid lg:grid-cols-3 lg:gap-10">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider ${
                course.difficulty === "beginner" ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20" :
                course.difficulty === "intermediate" ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20" :
                course.difficulty === "advanced" ? "bg-red-500/15 text-red-300 ring-1 ring-red-500/20" :
                "bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/20"
              }`}>
                {course.difficulty}
              </span>
              <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-neutral-400 ring-1 ring-white/10">
                {course.category}
              </span>
              {course.certificate_level && (
                <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[11px] text-purple-300 ring-1 ring-purple-500/20 flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  Earns {course.certificate_level} certificate
                </span>
              )}
            </div>

            {course.description && (
              <div className="font-serif text-[17px] leading-[1.7] text-neutral-300 whitespace-pre-line max-w-2xl">
                {course.description}
              </div>
            )}

            {/* Curriculum */}
            <div className="mt-10">
              <p className="font-display text-[11px] uppercase tracking-[0.22em] text-neutral-500 mb-2">
                Course Curriculum
              </p>
              <h2 className="font-display text-[28px] text-white mb-6">
                {modules.length} {modules.length === 1 ? "module" : "modules"} · {course.total_lessons} lessons
              </h2>

              <div className="space-y-3">
                {modules.map((mod, mi) => {
                  const moduleCompleted = mod.lessons.every((l) =>
                    completedIds.has(l.id),
                  )
                  const moduleStarted = mod.lessons.some((l) =>
                    completedIds.has(l.id),
                  )
                  const moduleProgress = mod.lessons.length
                    ? Math.round(
                        (mod.lessons.filter((l) => completedIds.has(l.id))
                          .length /
                          mod.lessons.length) *
                          100,
                      )
                    : 0
                  return (
                  <div
                    key={mod.id}
                    className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  >
                    {/* Module header */}
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className="flex w-full items-center justify-between px-5 py-4 text-left gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-full font-display text-[14px] tabular-nums ring-1 shrink-0 ${
                            moduleCompleted
                              ? "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30"
                              : moduleStarted
                                ? "bg-orange-500/15 text-orange-300 ring-orange-500/30"
                                : "bg-white/[0.04] text-neutral-500 ring-white/10"
                          }`}
                        >
                          {moduleCompleted ? <CheckCircle className="h-4 w-4" /> : mi + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-display text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                            Module {mi + 1}
                          </p>
                          <p className="font-medium text-white text-[15px] truncate">
                            {mod.title}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {moduleStarted && !moduleCompleted && (
                          <span className="text-[11px] text-orange-300 tabular-nums">
                            {moduleProgress}%
                          </span>
                        )}
                        <span className="text-[11px] text-neutral-500">
                          {mod.lessons.length} {mod.lessons.length === 1 ? "lesson" : "lessons"}
                        </span>
                        {expandedModules.has(mod.id) ? (
                          <ChevronUp className="h-4 w-4 text-neutral-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-neutral-500" />
                        )}
                      </div>
                    </button>

                    {/* Lessons */}
                    {expandedModules.has(mod.id) && (
                      <div className="border-t border-white/5">
                        {/* AI-generated module summary — sets the scene before the
                            lesson list. Falls back to nothing if not generated. */}
                        {mod.summary && (
                          <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-b from-indigo-500/[0.04] to-transparent">
                            <p className="font-serif italic text-[15px] text-neutral-300 leading-relaxed">
                              {mod.summary}
                            </p>
                          </div>
                        )}
                        {mod.lessons.map((lesson) => {
                          const status = getLessonStatus(lesson.id)
                          const canAccess = isEnrolled || lesson.is_preview

                          return (
                            <div key={lesson.id}>
                              {canAccess ? (
                                <Link
                                  href={`/courses/${course.slug}/${lesson.id}`}
                                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
                                >
                                  <LessonIcon status={status} contentType={lesson.content_type ?? ""} />
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${status === "completed" ? "text-neutral-500" : "text-white"}`}>
                                      {lesson.title}
                                    </p>
                                    {lesson.estimated_minutes && (
                                      <p className="text-xs text-neutral-600">{lesson.estimated_minutes} min</p>
                                    )}
                                  </div>
                                  {lesson.is_preview && !isEnrolled && (
                                    <span className="text-[10px] text-emerald-400 border border-emerald-500/20 rounded px-1.5 py-0.5">
                                      Preview
                                    </span>
                                  )}
                                </Link>
                              ) : (
                                <div className="flex items-center gap-3 px-4 py-3 opacity-50">
                                  <Lock className="h-4 w-4 text-neutral-600" />
                                  <div className="flex-1">
                                    <p className="text-sm text-neutral-500">{lesson.title}</p>
                                    {lesson.estimated_minutes && (
                                      <p className="text-xs text-neutral-600">{lesson.estimated_minutes} min</p>
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
                  )
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="mt-8 lg:mt-0">
            <div className="sticky top-6 rounded-xl border border-white/10 bg-white/[0.03] p-5">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 text-center mb-5">
                <div>
                  <BookOpen className="mx-auto mb-1 h-4 w-4 text-neutral-500" />
                  <p className="text-sm font-semibold text-white">{course.total_lessons}</p>
                  <p className="text-[10px] text-neutral-600">Lessons</p>
                </div>
                <div>
                  <Clock className="mx-auto mb-1 h-4 w-4 text-neutral-500" />
                  <p className="text-sm font-semibold text-white">{course.estimated_hours}h</p>
                  <p className="text-[10px] text-neutral-600">Duration</p>
                </div>
                <div>
                  <Award className="mx-auto mb-1 h-4 w-4 text-neutral-500" />
                  <p className="text-sm font-semibold text-white">{course.total_modules}</p>
                  <p className="text-[10px] text-neutral-600">Modules</p>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
                </div>
              ) : isEnrolled ? (
                <>
                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-neutral-400">Progress</span>
                      <span className="text-xs font-medium text-white">
                        {enrollment.progress_pct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-orange-500 transition-all"
                        style={{ width: `${enrollment.progress_pct}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-neutral-600">
                      {enrollment.completed_lessons} / {enrollment.total_lessons} lessons completed
                    </p>
                  </div>

                  {nextLesson ? (
                    <Link
                      href={`/courses/${course.slug}/${nextLesson.id}`}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-2.5 font-semibold text-black hover:bg-orange-400 transition-colors"
                    >
                      <Play className="h-4 w-4" />
                      Continue Learning
                    </Link>
                  ) : (
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                      <CheckCircle className="mx-auto mb-1 h-5 w-5 text-emerald-400" />
                      <p className="text-sm font-medium text-emerald-400">Course Completed</p>
                    </div>
                  )}
                  <Link
                    href={`/courses/${course.slug}/study-pack`}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 py-2 text-sm text-neutral-300 transition-colors"
                    title="Open a printable study pack of the entire course"
                  >
                    <FileText className="h-4 w-4" />
                    Download study pack
                  </Link>
                </>
              ) : (
                <>
                  <div className="mb-4 text-center">
                    {course.is_free ? (
                      <p className="text-lg font-bold text-emerald-400">Free</p>
                    ) : (
                      <p className="text-2xl font-bold text-white">
                        ฿{(course.price_thb ?? 0).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {confirmingPayment && (
                    <div className="mb-3 flex items-center justify-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-300">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Payment received — activating your course…
                    </div>
                  )}
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling || confirmingPayment}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-2.5 font-semibold text-black hover:bg-orange-400 transition-colors disabled:opacity-50"
                  >
                    {enrolling ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {course.is_free ? "Start Learning" : "Enroll Now"}
                  </button>
                  {enrollError && (
                    <p className="mt-2 text-xs text-red-400 text-center">{enrollError}</p>
                  )}
                </>
              )}

              {course.certificate_level && (
                <p className="mt-4 text-center text-xs text-neutral-500">
                  Completing this course earns the{" "}
                  <span className="text-purple-400 capitalize">{course.certificate_level}</span>{" "}
                  certification
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LessonIcon({ status, contentType }: { status: string; contentType: string }) {
  if (status === "completed") {
    return <CheckCircle className="h-4 w-4 text-emerald-400" />
  }
  if (status === "in_progress") {
    return (
      <div className="h-4 w-4 rounded-full border-2 border-orange-400 flex items-center justify-center">
        <div className="h-1.5 w-1.5 rounded-full bg-orange-400" />
      </div>
    )
  }
  return <span className="text-neutral-500">{CONTENT_TYPE_ICONS[contentType] || CONTENT_TYPE_ICONS.video}</span>
}

/**
 * Belt progression band — visual journey through the Naga → Garuda ladder.
 * Shown at the top of any course tied to a certification level. Each node
 * is a belt; the current course's belt is highlighted, prior belts are
 * marked completed, future belts are dimmed.
 */
function BeltProgressionBand({ current }: { current: CertificationLevelId }) {
  const currentIdx = CERTIFICATION_LEVELS.findIndex((l) => l.id === current)
  return (
    <section className="border-y border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-950/40 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-5 py-5">
        <p className="font-display text-[10px] uppercase tracking-[0.24em] text-neutral-500 mb-3 text-center sm:text-left">
          The Naga–Garuda Path
        </p>
        <div className="relative">
          {/* Connecting line (desktop only — mobile is too narrow) */}
          <div className="hidden sm:block absolute left-0 right-0 top-1/2 h-px bg-white/10" />
          <div className="relative flex items-center justify-between gap-2 sm:gap-4">
            {CERTIFICATION_LEVELS.map((level, idx) => {
              const isCurrent = idx === currentIdx
              const isPast = idx < currentIdx
              const isFuture = idx > currentIdx
              return (
                <div
                  key={level.id}
                  className={`flex-1 flex flex-col items-center text-center ${
                    isFuture ? "opacity-40" : ""
                  }`}
                >
                  <div
                    className={`relative inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full text-[20px] sm:text-[22px] ring-2 transition-transform ${
                      isCurrent
                        ? "bg-gradient-to-br from-orange-500/30 to-orange-600/20 ring-orange-400 scale-110 shadow-lg shadow-orange-500/20"
                        : isPast
                          ? "bg-emerald-500/15 ring-emerald-500/40"
                          : "bg-neutral-900 ring-white/10"
                    }`}
                  >
                    <span aria-hidden="true">{level.icon}</span>
                    {isPast && (
                      <CheckCircle className="absolute -bottom-1 -right-1 h-3.5 w-3.5 text-emerald-300 bg-neutral-950 rounded-full" />
                    )}
                  </div>
                  <p
                    className={`font-display text-[10px] sm:text-[12px] uppercase tracking-[0.16em] mt-2 ${
                      isCurrent
                        ? "text-orange-300"
                        : isPast
                          ? "text-emerald-300"
                          : "text-neutral-500"
                    }`}
                  >
                    {level.name}
                  </p>
                  <p className="hidden sm:block font-serif italic text-[11px] text-neutral-500 mt-0.5">
                    {level.creature}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
