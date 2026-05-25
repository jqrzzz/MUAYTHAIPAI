"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Play,
  FileText,
  Dumbbell,
  HelpCircle,
  BookOpen,
  BookText,
  Loader2,
  Printer,
} from "lucide-react"

// ============================================
// Types
// ============================================

interface Course {
  id: string
  title: string
  slug: string
}

interface GalleryItem {
  url: string
  caption?: string | null
  alt?: string | null
}

interface Lesson {
  id: string
  title: string
  description: string | null
  content_type: string
  video_url: string | null
  video_duration_seconds: number | null
  text_content: string | null
  drill_instructions: string | null
  drill_duration_minutes: number | null
  estimated_minutes: number | null
  is_preview: boolean
  hero_image_url: string | null
  gallery: GalleryItem[] | null
}

interface NavLesson {
  id: string
  title: string
  lesson_order: number
  content_type: string
  is_preview: boolean
  estimated_minutes: number | null
}

interface NavModule {
  id: string
  title: string
  module_order: number
  lessons: NavLesson[]
}

interface QuizQuestion {
  id: string
  question_text: string
  question_type: string
  options: { id: string; text: string }[] | null
  explanation: string | null
  question_order: number
}

// ============================================
// Main Component
// ============================================

export default function LessonPlayerClient({
  course,
  lesson,
  moduleName,
  modules,
  quizQuestions,
}: {
  course: Course
  lesson: Lesson
  moduleName: string
  modules: NavModule[]
  quizQuestions: QuizQuestion[] | null
}) {
  const router = useRouter()
  const [completed, setCompleted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(false)
  // Reading mode: serif typography + off-white background, hides video,
  // for long-form reading on a phone in transit / before training.
  // Persisted to localStorage so it sticks across lessons.
  const [readingMode, setReadingMode] = useState(false)
  useEffect(() => {
    setReadingMode(
      typeof window !== "undefined" &&
        window.localStorage.getItem("mtp_reading_mode") === "1",
    )
  }, [])
  const toggleReadingMode = () => {
    setReadingMode((on) => {
      const next = !on
      if (typeof window !== "undefined") {
        window.localStorage.setItem("mtp_reading_mode", next ? "1" : "0")
      }
      return next
    })
  }

  // Build flat lesson list for prev/next navigation
  const flatLessons = modules.flatMap((m) => m.lessons)
  const currentIndex = flatLessons.findIndex((l) => l.id === lesson.id)
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null

  // Load existing progress
  useEffect(() => {
    async function loadProgress() {
      try {
        const res = await fetch(`/api/courses/progress?course_id=${course.id}`)
        if (res.ok) {
          const data = await res.json()
          const lessonProgress = data.progress?.find(
            (p: { lesson_id: string }) => p.lesson_id === lesson.id
          )
          if (lessonProgress?.status === "completed") {
            setCompleted(true)
          }
        }
      } catch {
        // Not logged in
      }
    }
    loadProgress()
  }, [course.id, lesson.id])

  async function markComplete() {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch("/api/courses/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lesson_id: lesson.id,
          course_id: course.id,
          status: "completed",
        }),
      })
      if (res.ok) {
        setCompleted(true)
      } else {
        setSaveError("Couldn't save progress. Please try again.")
      }
    } catch {
      setSaveError("Network error. Please check your connection.")
    } finally {
      setSaving(false)
    }
  }

  async function goNextAndComplete() {
    if (!completed) await markComplete()
    if (nextLesson) {
      router.push(`/courses/${course.slug}/${nextLesson.id}`)
    } else {
      router.push(`/courses/${course.slug}`)
    }
  }

  return (
    <div
      className={`min-h-screen ${
        readingMode ? "bg-stone-50 text-stone-900" : "bg-neutral-950"
      }`}
    >
      {/* Top bar */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-sm border-b ${
          readingMode
            ? "border-stone-200 bg-stone-50/95"
            : "border-white/10 bg-neutral-950/95"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 gap-2">
          <Link
            href={`/courses/${course.slug}`}
            className={`flex items-center gap-1.5 text-sm shrink-0 ${
              readingMode
                ? "text-stone-600 hover:text-stone-900"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{course.title}</span>
          </Link>

          <div className="text-center min-w-0 flex-1">
            <p
              className={`text-xs truncate ${
                readingMode ? "text-stone-500" : "text-neutral-500"
              }`}
            >
              {moduleName}
            </p>
            <p
              className={`text-sm font-medium truncate ${
                readingMode ? "text-stone-900" : "text-white"
              }`}
            >
              {lesson.title}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleReadingMode}
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                readingMode
                  ? "border-stone-300 bg-stone-100 text-stone-700 hover:bg-stone-200"
                  : "border-white/10 text-neutral-400 hover:text-white"
              }`}
              title="Toggle reading mode"
              aria-pressed={readingMode}
            >
              <BookText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {readingMode ? "Reading" : "Read"}
              </span>
            </button>
            <Link
              href={`/courses/${course.slug}/study-pack`}
              className={`hidden sm:inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                readingMode
                  ? "border-stone-300 text-stone-700 hover:bg-stone-100"
                  : "border-white/10 text-neutral-400 hover:text-white"
              }`}
              title="Open the printable study pack for this whole course"
            >
              <Printer className="h-3.5 w-3.5" />
              Study pack
            </Link>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                readingMode
                  ? "border-stone-300 text-stone-700 hover:bg-stone-100"
                  : "border-white/10 text-neutral-400 hover:text-white"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Contents</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Main content */}
        <main className="flex-1">
          {/* Content area */}
          <div className={`mx-auto px-4 py-8 ${readingMode ? "max-w-[680px]" : "max-w-3xl"}`}>
            {/* Reading mode: large display title at the top of the page */}
            {readingMode && (
              <div className="mb-6 text-center">
                <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                  {moduleName}
                </p>
                <h1 className="font-display text-[36px] leading-tight text-stone-900 mt-2">
                  {lesson.title}
                </h1>
              </div>
            )}

            {/* Hero image — shows above the video / body for any lesson type */}
            {lesson.hero_image_url && (
              <div
                className={`mb-6 overflow-hidden rounded-2xl border ${
                  readingMode
                    ? "border-stone-200 bg-stone-100"
                    : "border-white/10 bg-black"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lesson.hero_image_url}
                  alt={lesson.title}
                  className="w-full max-h-[480px] object-cover"
                />
              </div>
            )}

            {/* Video lesson — real embed when we have a URL, a clean
                placeholder when the demo hasn't been recorded yet. */}
            {lesson.content_type === "video" && (
              lesson.video_url ? (
                readingMode ? (
                  <a
                    href={lesson.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-6 block rounded-xl border border-stone-200 bg-stone-100 p-4 text-stone-700 hover:bg-stone-200 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <Play className="h-4 w-4" />
                      <span>Watch the demonstration online</span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1 truncate">
                      {lesson.video_url}
                    </p>
                  </a>
                ) : (
                  <VideoPlayer url={lesson.video_url} />
                )
              ) : (
                <VideoPlaceholder readingMode={readingMode} />
              )
            )}

            {/* Text lesson */}
            {lesson.content_type === "text" && lesson.text_content && (
              <div
                className={
                  readingMode
                    ? "font-serif max-w-none text-stone-800 leading-[1.7] text-[17px]"
                    : "prose prose-invert prose-sm max-w-none rounded-xl border border-white/10 bg-white/[0.02] p-6"
                }
              >
                <div className="whitespace-pre-line">{lesson.text_content}</div>
              </div>
            )}

            {/* Drill lesson */}
            {lesson.content_type === "drill" && (
              <div
                className={`rounded-xl border p-6 ${
                  readingMode
                    ? "border-orange-300 bg-orange-50"
                    : "border-orange-500/20 bg-orange-500/5"
                }`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Dumbbell
                    className={`h-5 w-5 ${
                      readingMode ? "text-orange-700" : "text-orange-400"
                    }`}
                  />
                  <h2
                    className={`text-lg font-semibold ${
                      readingMode ? "text-stone-900" : "text-white"
                    }`}
                  >
                    Training Drill
                  </h2>
                  {lesson.drill_duration_minutes && (
                    <span
                      className={`ml-auto text-sm ${
                        readingMode ? "text-orange-700" : "text-orange-400"
                      }`}
                    >
                      {lesson.drill_duration_minutes} min
                    </span>
                  )}
                </div>
                {lesson.drill_instructions && (
                  <div
                    className={`whitespace-pre-line leading-relaxed ${
                      readingMode
                        ? "font-serif text-stone-800 text-[17px]"
                        : "text-sm text-neutral-300"
                    }`}
                  >
                    {lesson.drill_instructions}
                  </div>
                )}
              </div>
            )}

            {/* Quiz lesson — keep dark in both modes for legibility (high contrast = answers) */}
            {lesson.content_type === "quiz" && quizQuestions && (
              <QuizPlayer
                questions={quizQuestions}
                courseId={course.id}
                lessonId={lesson.id}
                onComplete={() => setCompleted(true)}
              />
            )}

            {/* Description */}
            {lesson.description && (
              <div
                className={`mt-6 leading-relaxed ${
                  readingMode
                    ? "font-serif text-stone-600 text-[16px] italic"
                    : "text-sm text-neutral-400"
                }`}
              >
                {lesson.description}
              </div>
            )}

            {/* Photo gallery — step-by-step photos, freeze frames, target zones */}
            {lesson.gallery && lesson.gallery.length > 0 && (
              <section className="mt-8">
                <h2
                  className={`mb-3 ${
                    readingMode
                      ? "text-xs uppercase tracking-[0.18em] text-stone-500"
                      : "text-sm font-medium text-neutral-300"
                  }`}
                >
                  Reference photos
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {lesson.gallery.map((item, i) => (
                    <figure
                      key={i}
                      className={`rounded-lg overflow-hidden border ${
                        readingMode
                          ? "border-stone-200 bg-stone-100"
                          : "border-white/10 bg-black/40"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.url}
                        alt={item.alt || item.caption || `Reference ${i + 1}`}
                        className="w-full aspect-square object-cover"
                      />
                      {item.caption && (
                        <figcaption
                          className={`px-2 py-1.5 text-[11px] leading-snug ${
                            readingMode ? "text-stone-700" : "text-neutral-400"
                          }`}
                        >
                          {item.caption}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </section>
            )}

            {/* Error message */}
            {saveError && (
              <p className="mt-6 text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{saveError}</p>
            )}

            {/* Bottom actions */}
            <div
              className={`mt-8 flex items-center justify-between border-t pt-6 ${
                readingMode ? "border-stone-200" : "border-white/10"
              }`}
            >
              {prevLesson ? (
                <Link
                  href={`/courses/${course.slug}/${prevLesson.id}`}
                  className={`flex items-center gap-1.5 text-sm ${
                    readingMode
                      ? "text-stone-600 hover:text-stone-900"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Link>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                {!completed && lesson.content_type !== "quiz" && (
                  <button
                    onClick={markComplete}
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-400 hover:text-white disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5" />
                    )}
                    Mark Complete
                  </button>
                )}
                {completed && (
                  <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                    <CheckCircle className="h-4 w-4" />
                    Completed
                  </span>
                )}

                <button
                  onClick={goNextAndComplete}
                  className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-black hover:bg-orange-400"
                >
                  {nextLesson ? (
                    <>
                      Next Lesson
                      <ChevronRight className="h-4 w-4" />
                    </>
                  ) : (
                    "Finish Course"
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Sidebar - desktop: inline panel, mobile: overlay */}
        {showSidebar && (
          <>
            {/* Mobile overlay backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setShowSidebar(false)}
            />
            <aside className="fixed right-0 top-[3.25rem] bottom-0 z-50 w-80 max-w-[85vw] border-l border-white/10 bg-neutral-950 overflow-y-auto lg:static lg:z-auto lg:max-w-none lg:w-80 lg:max-h-[calc(100vh-3.5rem)]">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-neutral-400">Course Contents</h3>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="text-neutral-500 hover:text-white lg:hidden"
                    aria-label="Close sidebar"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {modules.map((mod) => (
                    <div key={mod.id}>
                      <p className="text-xs text-neutral-500 mb-1">{mod.title}</p>
                      <div className="space-y-0.5">
                        {mod.lessons.map((l) => (
                          <Link
                            key={l.id}
                            href={`/courses/${course.slug}/${l.id}`}
                            onClick={() => setShowSidebar(false)}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                              l.id === lesson.id
                                ? "bg-orange-500/10 text-orange-400"
                                : "text-neutral-400 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <span className="text-neutral-600">
                              {l.content_type === "video" ? <Play className="h-3 w-3" /> :
                               l.content_type === "text" ? <FileText className="h-3 w-3" /> :
                               l.content_type === "drill" ? <Dumbbell className="h-3 w-3" /> :
                               <HelpCircle className="h-3 w-3" />}
                            </span>
                            <span className="truncate">{l.title}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </>
        )}
      </div>
    </div>
  )
}

// ============================================
// Video Player
// ============================================

function VideoPlaceholder({ readingMode }: { readingMode: boolean }) {
  return (
    <div
      className={`aspect-video rounded-xl border flex flex-col items-center justify-center text-center gap-3 ${
        readingMode
          ? "border-stone-200 bg-stone-100 text-stone-500"
          : "border-white/10 bg-black/40 text-neutral-400"
      }`}
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full ${
          readingMode ? "bg-stone-200" : "bg-white/5"
        }`}
      >
        <Play className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium">Demonstration video coming soon</p>
    </div>
  )
}

function VideoPlayer({ url }: { url: string }) {
  // Detect platform and render appropriate embed
  const youtubeId = extractYouTubeId(url)
  const vimeoId = extractVimeoId(url)

  if (youtubeId) {
    return (
      <div className="aspect-video overflow-hidden rounded-xl bg-black">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`}
          title="Lesson video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    )
  }

  if (vimeoId) {
    return (
      <div className="aspect-video overflow-hidden rounded-xl bg-black">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?dnt=1`}
          title="Lesson video"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    )
  }

  // Direct video URL
  return (
    <div className="aspect-video overflow-hidden rounded-xl bg-black">
      <video
        src={url}
        controls
        className="h-full w-full"
        playsInline
      />
    </div>
  )
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  return match?.[1] || null
}

function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/)
  return match?.[1] || null
}

// ============================================
// Quiz Player
// ============================================

function QuizPlayer({
  questions,
  courseId,
  lessonId,
  onComplete,
}: {
  questions: QuizQuestion[]
  courseId: string
  lessonId: string
  onComplete: () => void
}) {
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [quizResults, setQuizResults] = useState<{
    score: number
    total: number
    correct_answers: Record<string, string>
  } | null>(null)
  const [quizError, setQuizError] = useState<string | null>(null)

  const question = questions[currentQ]
  if (!question) return null

  const totalQuestions = questions.length
  const answered = Object.keys(answers).length

  async function submitQuiz() {
    setSubmitting(true)
    setQuizError(null)

    try {
      const res = await fetch("/api/courses/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lesson_id: lessonId,
          course_id: courseId,
          status: "completed",
          quiz_answers: answers,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setQuizResults(data.quiz_results || null)
        onComplete()
        setShowResults(true)
      } else {
        const data = await res.json().catch(() => null)
        setQuizError(data?.error || "Failed to submit quiz. Please try again.")
      }
    } catch {
      setQuizError("Network error. Please check your connection and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (showResults && quizResults) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
        <div className="text-center mb-6">
          <p className="text-3xl font-bold text-white">
            {quizResults.score}/{quizResults.total}
          </p>
          <p className="text-sm text-neutral-400 mt-1">
            {quizResults.score === quizResults.total
              ? "Perfect score!"
              : quizResults.score >= quizResults.total * 0.7
                ? "Great job!"
                : "Keep practicing!"}
          </p>
        </div>

        <div className="space-y-4">
          {questions.map((q, i) => {
            const isCorrect = answers[q.id] === quizResults.correct_answers[q.id]
            return (
              <div
                key={q.id}
                className={`rounded-lg p-4 border ${
                  isCorrect ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"
                }`}
              >
                <p className="text-sm text-white mb-1">
                  {i + 1}. {q.question_text}
                </p>
                <p className={`text-xs ${isCorrect ? "text-emerald-400" : "text-red-400"}`}>
                  {isCorrect ? "Correct" : "Incorrect"}
                </p>
                {q.explanation && (
                  <p className="text-xs text-neutral-500 mt-1">{q.explanation}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
      {/* Progress */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs text-neutral-500">
          Question {currentQ + 1} of {totalQuestions}
        </span>
        <span className="text-xs text-neutral-500">{answered} answered</span>
      </div>

      {/* Question */}
      <h3 className="text-lg font-medium text-white mb-4">{question.question_text}</h3>

      {/* Options */}
      {question.options && (
        <div className="space-y-2">
          {question.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setAnswers({ ...answers, [question.id]: opt.id })}
              className={`w-full text-left rounded-lg border px-4 py-3 text-sm transition-colors ${
                answers[question.id] === opt.id
                  ? "border-orange-500/50 bg-orange-500/10 text-white"
                  : "border-white/10 bg-white/[0.02] text-neutral-300 hover:border-white/20"
              }`}
            >
              {opt.text}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {quizError && (
        <p className="mt-4 text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{quizError}</p>
      )}

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
          disabled={currentQ === 0}
          className="text-sm text-neutral-400 hover:text-white disabled:opacity-30"
        >
          Previous
        </button>

        {currentQ < totalQuestions - 1 ? (
          <button
            onClick={() => setCurrentQ(currentQ + 1)}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
          >
            Next
          </button>
        ) : (
          <button
            onClick={submitQuiz}
            disabled={submitting || answered < totalQuestions}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-black hover:bg-orange-400 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Quiz"}
          </button>
        )}
      </div>
    </div>
  )
}

