"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Award,
  Lock,
  CheckCircle,
  ArrowRight,
  BookOpen,
  Loader2,
} from "lucide-react"
import { ContinueLearning } from "@/components/blog/continue-learning"
import {
  PageBackground,
  MarketingTopNav,
  MarketingBottomNav,
  SacredDecoration,
  CONTENT_FADE_IN,
  useMounted,
} from "@/components/marketing"
import { CERTIFICATION_LEVELS, type CertificationLevel } from "@/lib/certification-levels"

interface UserCert {
  level: string
  issued_at: string
  certificate_number: string
}

interface UserEnrollment {
  course_id: string
  status: string
  progress_pct: number
  completed_lessons: number
  total_lessons: number
}

interface CourseInfo {
  id: string
  slug: string
  certificate_level: string
  total_lessons: number
  estimated_hours: number
}

const LEVEL_IMAGES: Record<string, string> = {
  naga: "/images/naga-level1.png",
  "phayra-nak": "/images/phayra-nak-level2.png",
  singha: "/images/ratchasi-level3.png",
  hanuman: "/images/hanuman-level4.png",
  garuda: "/images/garuda-level5.png",
}

const LEVEL_THEMES: Record<string, { tagline: string; meaning: string }> = {
  naga: {
    tagline: "Begin the path",
    meaning: "The Naga serpent deity represents protection and guidance — the beginning of every warrior's journey.",
  },
  "phayra-nak": {
    tagline: "Find your flow",
    meaning: "The Serpent King embodies adaptability and transformation — learning to move with purpose.",
  },
  singha: {
    tagline: "Fight with heart",
    meaning: "The Mythical Lion stands for strength and courage — developing real fighting ability.",
  },
  hanuman: {
    tagline: "Lead from the front",
    meaning: "The Divine Warrior symbolizes perseverance and loyalty — mastery beyond technique.",
  },
  garuda: {
    tagline: "Guard the art",
    meaning: "The Divine Eagle carries wisdom and responsibility — the pinnacle, and the beginning of a lifelong duty.",
  },
}

export default function CertificateProgramsClient() {
  const mounted = useMounted()
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null)
  const [userCerts, setUserCerts] = useState<UserCert[]>([])
  const [enrollments, setEnrollments] = useState<UserEnrollment[]>([])
  const [courses, setCourses] = useState<CourseInfo[]>([])
  const [loadingUser, setLoadingUser] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [certRes, courseRes, enrollRes] = await Promise.all([
          fetch("/api/student/certificates").catch(() => null),
          fetch("/api/public/courses?category=certification"),
          fetch("/api/student/courses").catch(() => null),
        ])

        if (certRes?.ok) {
          const certData = await certRes.json()
          setUserCerts(certData.certificates || [])
        }

        if (courseRes.ok) {
          const courseData = await courseRes.json()
          setCourses(
            (courseData.courses || []).map((c: Record<string, unknown>) => ({
              id: c.id,
              slug: c.slug,
              certificate_level: c.certificate_level,
              total_lessons: c.total_lessons,
              estimated_hours: c.estimated_hours,
            }))
          )
        }

        if (enrollRes?.ok) {
          const enrollData = await enrollRes.json()
          setEnrollments(
            (enrollData.courses || [])
              .filter((c: Record<string, unknown>) => c.enrollment)
              .map((c: Record<string, unknown>) => {
                const e = c.enrollment as Record<string, unknown>
                return {
                  course_id: c.id as string,
                  status: e.status as string,
                  progress_pct: (e.progress_pct as number) || 0,
                  completed_lessons: (e.completed_lessons as number) || 0,
                  total_lessons: (e.total_lessons as number) || 0,
                }
              })
          )
        }
      } catch {
        // Not logged in or API unavailable
      } finally {
        setLoadingUser(false)
      }
    }
    load()
  }, [])

  function getLevelStatus(level: CertificationLevel): "certified" | "in_progress" | "available" | "locked" {
    if (userCerts.some((c) => c.level === level.id)) return "certified"

    const course = courses.find((c) => c.certificate_level === level.id)
    if (course) {
      const enrollment = enrollments.find((e) => e.course_id === course.id)
      if (enrollment?.status === "active") return "in_progress"
    }

    if (level.number === 1) return "available"

    const prevLevel = CERTIFICATION_LEVELS[level.number - 2]
    if (userCerts.some((c) => c.level === prevLevel.id)) return "available"

    return "locked"
  }

  function getCourseForLevel(levelId: string): CourseInfo | undefined {
    return courses.find((c) => c.certificate_level === levelId)
  }

  function getEnrollmentForLevel(levelId: string): UserEnrollment | undefined {
    const course = getCourseForLevel(levelId)
    if (!course) return undefined
    return enrollments.find((e) => e.course_id === course.id)
  }

  if (!mounted) return null

  return (
    <PageBackground>
      <SacredDecoration />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={CONTENT_FADE_IN}
        className="relative z-20 min-h-screen"
      >
        <MarketingTopNav />

        {/* Hero */}
        <div className="pt-24 pb-12 px-4 text-center max-w-3xl mx-auto">
          <motion.h1
            className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-700 bg-clip-text text-transparent dark:from-amber-300 dark:via-orange-400 dark:to-yellow-500"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            NAGA TO GARUDA
          </motion.h1>

          <motion.p
            className="mt-4 text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Five levels of authentic Muay Thai certification. Train in Thailand, earn
            verifiable credentials, and join a network of practitioners who carry the
            art forward.
          </motion.p>

          {/* Journey line */}
          <motion.div
            className="mt-8 flex items-center justify-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            {CERTIFICATION_LEVELS.map((level, i) => {
              const status = getLevelStatus(level)
              return (
                <div key={level.id} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      status === "certified"
                        ? "bg-emerald-500 text-black"
                        : status === "in_progress"
                          ? "bg-orange-500 text-black"
                          : status === "available"
                            ? "bg-white/10 text-white border border-white/20"
                            : "bg-white/5 text-neutral-600 border border-white/5"
                    }`}
                  >
                    {status === "certified" ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      level.number
                    )}
                  </div>
                  {i < CERTIFICATION_LEVELS.length - 1 && (
                    <div
                      className={`w-6 sm:w-10 h-px ${
                        status === "certified" ? "bg-emerald-500/50" : "bg-white/10"
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </motion.div>
        </div>

        {/* Levels */}
        <div className="max-w-3xl mx-auto px-4 pb-24 space-y-4">
          {CERTIFICATION_LEVELS.map((level, i) => {
            const status = getLevelStatus(level)
            const course = getCourseForLevel(level.id)
            const enrollment = getEnrollmentForLevel(level.id)
            const theme = LEVEL_THEMES[level.id]
            const isExpanded = expandedLevel === level.id

            return (
              <motion.div
                key={level.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
              >
                <div
                  className={`rounded-2xl border overflow-hidden transition-colors ${
                    status === "certified"
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : status === "in_progress"
                        ? "border-orange-500/30 bg-orange-500/5"
                        : status === "locked"
                          ? "border-white/5 bg-white/[0.01] opacity-60"
                          : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  {/* Card header */}
                  <button
                    onClick={() => setExpandedLevel(isExpanded ? null : level.id)}
                    className="w-full text-left p-5 flex items-start gap-4"
                  >
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                        status === "certified"
                          ? "bg-emerald-500/15"
                          : status === "in_progress"
                            ? "bg-orange-500/15"
                            : "bg-white/5"
                      }`}
                    >
                      {level.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-neutral-500">
                          Level {level.number}
                        </span>
                        {status === "certified" && (
                          <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                            <CheckCircle className="h-3 w-3" />
                            Certified
                          </span>
                        )}
                        {status === "in_progress" && enrollment && (
                          <span className="text-xs font-medium text-orange-400">
                            {enrollment.progress_pct}% complete
                          </span>
                        )}
                        {status === "locked" && (
                          <span className="flex items-center gap-1 text-xs text-neutral-600">
                            <Lock className="h-3 w-3" />
                            Locked
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {level.name}
                        <span className="ml-2 text-sm font-normal text-neutral-500">
                          {level.creature}
                        </span>
                      </h3>

                      <p className="text-sm text-gray-600 dark:text-neutral-400 mt-0.5">
                        {theme?.tagline}
                      </p>

                      {/* Progress bar for in-progress */}
                      {status === "in_progress" && enrollment && (
                        <div className="mt-2 h-1.5 rounded-full bg-white/10 w-full max-w-xs">
                          <div
                            className="h-1.5 rounded-full bg-orange-500 transition-all"
                            style={{ width: `${enrollment.progress_pct}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Right side */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        ฿{level.priceTHB.toLocaleString()}
                      </span>
                      <span className="text-xs text-neutral-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {level.duration}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-neutral-500 mt-1" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-neutral-500 mt-1" />
                      )}
                    </div>
                  </button>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: "auto",
                          opacity: 1,
                          transition: {
                            height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
                            opacity: { duration: 0.3, delay: 0.1 },
                          },
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                          transition: {
                            height: { duration: 0.25, ease: [0.04, 0.62, 0.23, 0.98] },
                            opacity: { duration: 0.15 },
                          },
                        }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-0">
                          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-5" />

                          {/* Cultural meaning */}
                          {theme && (
                            <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed mb-5">
                              {theme.meaning}
                            </p>
                          )}

                          {/* Skills grid */}
                          <div className="mb-5">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
                              Skills Assessed
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {level.skills.map((skill, si) => (
                                <div
                                  key={si}
                                  className="flex items-start gap-2 text-sm text-gray-700 dark:text-neutral-300"
                                >
                                  <Award className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-orange-400/60" />
                                  <span>{skill}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Prerequisites */}
                          {level.number > 1 && (
                            <div className="mb-5 rounded-lg bg-white/5 p-3">
                              <p className="text-xs text-neutral-500">
                                <span className="font-semibold">Prerequisite:</span>{" "}
                                {CERTIFICATION_LEVELS[level.number - 2].name} certificate
                                {level.minDaysAfterPrevious > 0 && (
                                  <> + {level.minDaysAfterPrevious} day wait</>
                                )}
                              </p>
                            </div>
                          )}

                          {/* Course info and CTA */}
                          {course && (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                              <div className="flex items-center gap-3 text-xs text-neutral-500">
                                <span className="flex items-center gap-1">
                                  <BookOpen className="h-3 w-3" />
                                  {course.total_lessons} lessons
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {course.estimated_hours}h
                                </span>
                              </div>

                              <div className="sm:ml-auto">
                                {status === "certified" ? (
                                  <Link
                                    href={`/courses/${course.slug}`}
                                    className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Review Course
                                  </Link>
                                ) : status === "in_progress" ? (
                                  <Link
                                    href={`/courses/${course.slug}`}
                                    className="flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-black hover:bg-orange-400 transition-colors"
                                  >
                                    Continue Learning
                                    <ArrowRight className="h-4 w-4" />
                                  </Link>
                                ) : status === "available" ? (
                                  <Link
                                    href={`/courses/${course.slug}`}
                                    className="flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-black hover:from-orange-400 hover:to-amber-400 transition-colors"
                                  >
                                    Start Course
                                    <ArrowRight className="h-4 w-4" />
                                  </Link>
                                ) : (
                                  <div className="flex items-center gap-1.5 rounded-lg border border-white/10 px-4 py-2 text-sm text-neutral-500">
                                    <Lock className="h-4 w-4" />
                                    Complete {CERTIFICATION_LEVELS[level.number - 2].name} first
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {!course && (
                            <p className="text-xs text-neutral-500 italic">
                              Online course coming soon
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* How it works */}
        <div className="max-w-3xl mx-auto px-4 pb-16">
          <motion.div
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              How It Works
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-orange-500/15 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="h-5 w-5 text-orange-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  1. Learn Online
                </h3>
                <p className="text-xs text-gray-600 dark:text-neutral-400">
                  Complete the course for your level — lessons, drills, and quizzes at your pace.
                </p>
              </div>

              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-orange-500/15 flex items-center justify-center mx-auto mb-3">
                  <Award className="h-5 w-5 text-orange-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  2. Train at a Gym
                </h3>
                <p className="text-xs text-gray-600 dark:text-neutral-400">
                  Visit a MUAYTHAIPAI network gym in Thailand. Demonstrate each skill for sign-off.
                </p>
              </div>

              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-orange-500/15 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-5 w-5 text-orange-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  3. Get Certified
                </h3>
                <p className="text-xs text-gray-600 dark:text-neutral-400">
                  Receive a verifiable certificate. Share it, print it, and carry it forward.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <ContinueLearning excludeLinks={["certificate-programs"]} />
        <MarketingBottomNav />
      </motion.div>
    </PageBackground>
  )
}
