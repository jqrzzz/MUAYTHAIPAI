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
  difficulty: string
  category: string
  certificate_level: string | null
  is_free: boolean
  price_thb: number
  total_modules: number
  total_lessons: number
  estimated_hours: number
  organizations: { name: string; slug: string; logo_url: string | null } | null
}

interface Lesson {
  id: string
  title: string
  description: string | null
  content_type: string
  video_duration_seconds: number | null
  estimated_minutes: number | null
  lesson_order: number
  is_preview: boolean
}

interface Module {
  id: string
  title: string
  description: string | null
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
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(modules.slice(0, 2).map((m) => m.id))
  )

  // Load enrollment and progress
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/courses/progress?course_id=${course.id}`)
        if (res.ok) {
          const data = await res.json()
          setEnrollment(data.enrollment)
          setProgress(data.progress || [])
        }
      } catch {
        // Not logged in — that's fine
      } finally {
        setLoading(false)
      }
    }
    load()
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

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            All Courses
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Course Hero */}
            {course.cover_image_url && (
              <div className="relative mb-6 w-full aspect-video overflow-hidden rounded-xl">
                <Image
                  src={course.cover_image_url}
                  alt={course.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 768px"
                  priority
                  className="object-cover"
                />
              </div>
            )}

            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                course.difficulty === "beginner" ? "bg-emerald-500/15 text-emerald-400" :
                course.difficulty === "intermediate" ? "bg-amber-500/15 text-amber-400" :
                course.difficulty === "advanced" ? "bg-red-500/15 text-red-400" :
                "bg-blue-500/15 text-blue-400"
              }`}>
                {course.difficulty}
              </span>
              <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-neutral-400">
                {course.category}
              </span>
              {course.certificate_level && (
                <span className="rounded-full bg-purple-500/15 px-2.5 py-0.5 text-xs text-purple-400 flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  Earns {course.certificate_level} certificate
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-white">{course.title}</h1>

            {course.organizations && (
              <p className="mt-1 text-sm text-neutral-500">
                by{" "}
                <Link href={`/gyms/${course.organizations.slug}`} className="text-orange-400 hover:underline">
                  {course.organizations.name}
                </Link>
              </p>
            )}

            {course.description && (
              <div className="mt-4 text-sm leading-relaxed text-neutral-400 whitespace-pre-line">
                {course.description}
              </div>
            )}

            {/* Curriculum */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-white mb-4">Curriculum</h2>

              <div className="space-y-2">
                {modules.map((mod, mi) => (
                  <div key={mod.id} className="rounded-xl border border-white/10 overflow-hidden">
                    {/* Module header */}
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className="flex w-full items-center justify-between bg-white/[0.03] px-4 py-3 text-left"
                    >
                      <div>
                        <p className="text-xs text-neutral-500">Module {mi + 1}</p>
                        <p className="font-medium text-white">{mod.title}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-neutral-600">
                          {mod.lessons.length} lessons
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
                                  <LessonIcon status={status} contentType={lesson.content_type} />
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
                ))}
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
                </>
              ) : (
                <>
                  <div className="mb-4 text-center">
                    {course.is_free ? (
                      <p className="text-lg font-bold text-emerald-400">Free</p>
                    ) : (
                      <p className="text-2xl font-bold text-white">
                        ฿{course.price_thb.toLocaleString()}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
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
