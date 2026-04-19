"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  Play,
  BookOpen,
  Award,
  Clock,
  CheckCircle,
  Loader2,
  Dumbbell,
  ArrowRight,
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
import { CERTIFICATION_LEVELS } from "@/lib/certification-levels"

interface CoursePreview {
  id: string
  title: string
  slug: string
  short_description: string | null
  cover_image_url: string | null
  difficulty: string
  certificate_level: string | null
  total_lessons: number
  estimated_hours: number
}

export default function OnlineClassesClient() {
  const mounted = useMounted()
  const [courses, setCourses] = useState<CoursePreview[]>([])
  const [loading, setLoading] = useState(true)
  const [hasSubscription, setHasSubscription] = useState(false)
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [courseRes, subRes] = await Promise.all([
          fetch("/api/public/courses"),
          fetch("/api/student/subscription").catch(() => null),
        ])
        if (courseRes.ok) {
          const data = await courseRes.json()
          setCourses(data.courses || [])
        }
        if (subRes?.ok) {
          const subData = await subRes.json()
          setHasSubscription(subData.subscription?.status === "active")
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSubscribe() {
    setSubscribing(true)
    try {
      const res = await fetch("/api/student/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnUrl: window.location.origin + "/courses" }),
      })
      if (res.status === 401) {
        window.location.href = "/student/login?redirect=/online-classes&subscribe=true"
        return
      }
      if (res.ok) {
        const data = await res.json()
        if (data.url) {
          window.location.href = data.url
          return
        }
      }
    } catch {
      // ignore
    } finally {
      setSubscribing(false)
    }
  }

  const certCourses = courses.filter((c) => c.certificate_level)
  const totalLessons = certCourses.reduce((sum, c) => sum + c.total_lessons, 0)
  const totalHours = certCourses.reduce((sum, c) => sum + c.estimated_hours, 0)

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
        <div className="pt-24 pb-16 px-4 text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-orange-400 mb-4">
              Train from anywhere in the world
            </span>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
              Learn Muay Thai Online
            </h1>
          </motion.div>

          <motion.p
            className="mt-5 text-base md:text-lg text-neutral-400 leading-relaxed max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Structured courses built by trainers in Thailand. From your first stance to
            competition strategy — {totalLessons > 0 ? `${totalLessons} lessons` : "dozens of lessons"},{" "}
            drills, and quizzes across 5 certification levels.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            {hasSubscription ? (
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-3.5 text-sm font-bold text-black hover:from-orange-400 hover:to-amber-400 transition-colors"
              >
                <Play className="h-4 w-4" />
                Go to My Courses
              </Link>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-3.5 text-sm font-bold text-black hover:from-orange-400 hover:to-amber-400 transition-colors disabled:opacity-50"
              >
                {subscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Start Learning — ฿299/mo
              </button>
            )}
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Browse courses
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        </div>

        {/* Stats bar */}
        <div className="max-w-3xl mx-auto px-4 pb-12">
          <motion.div
            className="grid grid-cols-3 gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{certCourses.length || 5}</p>
              <p className="text-xs text-neutral-500">Courses</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{totalLessons || "60+"}</p>
              <p className="text-xs text-neutral-500">Lessons</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{totalHours ? `${totalHours}h` : "40h+"}</p>
              <p className="text-xs text-neutral-500">Content</p>
            </div>
          </motion.div>
        </div>

        {/* What you get */}
        <div className="max-w-3xl mx-auto px-4 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-bold text-white mb-6 text-center">
              What You Get
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: BookOpen, title: "Structured Curriculum", desc: "Progressive courses from fundamentals through advanced competition strategy" },
                { icon: Dumbbell, title: "Drills & Practice Plans", desc: "Follow-along drills designed for solo training — heavy bag, shadow boxing, conditioning" },
                { icon: Award, title: "Real Certification", desc: "Earn your Naga certificate online. Levels 2-5 assessed at partner gyms in Thailand" },
                { icon: CheckCircle, title: "Knowledge Checks", desc: "Inline quizzes on history, technique, and fight theory to reinforce learning" },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
                >
                  <item.icon className="h-5 w-5 text-orange-400 mb-3" />
                  <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Course previews */}
        {!loading && certCourses.length > 0 && (
          <div className="max-w-3xl mx-auto px-4 pb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-xl font-bold text-white mb-6 text-center">
                5 Levels, One Path
              </h2>
              <div className="space-y-3">
                {CERTIFICATION_LEVELS.map((level) => {
                  const course = certCourses.find((c) => c.certificate_level === level.id)
                  return (
                    <Link
                      key={level.id}
                      href={course ? `/courses/${course.slug}` : "/certificate-programs"}
                      className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-orange-500/30 hover:bg-white/[0.04] transition-all group"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-lg"
                        style={{
                          backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                        }}
                      >
                        <span className={`bg-gradient-to-r ${level.bgGradient} bg-clip-text text-transparent text-2xl`}>
                          {level.icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${level.color}`}>
                            Level {level.number}: {level.name}
                          </span>
                          {!level.requiresGym && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">
                              Online cert
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {course
                            ? `${course.total_lessons} lessons · ${course.estimated_hours}h`
                            : "Coming soon"}
                        </p>
                      </div>
                      {course && (
                        <div className="flex-shrink-0">
                          {course.cover_image_url ? (
                            <Image
                              src={course.cover_image_url}
                              alt={level.name}
                              width={60}
                              height={40}
                              className="rounded-lg object-cover"
                            />
                          ) : (
                            <ArrowRight className="h-4 w-4 text-neutral-600 group-hover:text-orange-400 transition-colors" />
                          )}
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          </div>
        )}

        {/* Pricing */}
        <div className="max-w-3xl mx-auto px-4 pb-12">
          <motion.div
            className="rounded-2xl border border-orange-500/20 bg-gradient-to-b from-orange-500/5 to-transparent p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-bold text-white mb-2">
              One subscription. Every course.
            </h2>
            <p className="text-neutral-400 text-sm mb-6">
              Access all {certCourses.length || 5} certification courses, {totalLessons || "60+"} lessons,
              and earn your Naga certificate online.
            </p>

            <div className="mb-6">
              <span className="text-4xl font-black text-white">฿299</span>
              <span className="text-neutral-500 text-sm">/month</span>
              <p className="text-xs text-neutral-500 mt-1">~$10 USD · Cancel anytime</p>
            </div>

            <div className="flex flex-col items-center gap-3 mb-6">
              {[
                "All course content — every level",
                "Naga certification earned fully online",
                "New content added regularly",
                "Cancel anytime, no commitment",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-neutral-300">
                  <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {hasSubscription ? (
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-3 text-sm font-bold text-white hover:bg-emerald-400 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                You&apos;re Subscribed — Go Learn
              </Link>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-3 text-sm font-bold text-black hover:from-orange-400 hover:to-amber-400 transition-colors disabled:opacity-50"
              >
                {subscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Start Learning Now
              </button>
            )}
          </motion.div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto px-4 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-bold text-white mb-6 text-center">
              Common Questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "Do I need any equipment?",
                  a: "No. Many drills use bodyweight only. A heavy bag helps but isn't required to start.",
                },
                {
                  q: "Can I really get certified online?",
                  a: "Level 1 (Naga) can be earned fully online. Levels 2-5 require a physical assessment at a MUAYTHAIPAI partner gym in Thailand.",
                },
                {
                  q: "What if I'm a complete beginner?",
                  a: "The Naga course starts from zero — your first stance, your first punch. No experience needed.",
                },
                {
                  q: "Can I cancel anytime?",
                  a: "Yes. Cancel your subscription whenever you want. You keep access until the end of your billing period.",
                },
                {
                  q: "Is this different from the certification programs?",
                  a: "Same courses, same content. The subscription gives you access to learn. Certification is a separate step after you've completed the coursework.",
                },
              ].map((item) => (
                <div
                  key={item.q}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
                >
                  <h3 className="text-sm font-semibold text-white mb-1.5">{item.q}</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <ContinueLearning excludeLinks={["online-classes"]} />
        <MarketingBottomNav />
      </motion.div>
    </PageBackground>
  )
}
