"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, ChevronRight, ArrowLeft, Loader2, Award } from "lucide-react"
import Link from "next/link"
import {
  PageBackground,
  MarketingTopNav,
  MarketingBottomNav,
  SacredDecoration,
  useMounted,
} from "@/components/marketing"
import { CERTIFICATION_LEVELS, type CertificationLevel } from "@/lib/certification-levels"

type Step = "level" | "details" | "confirm" | "success"

export default function EnrollClient() {
  const mounted = useMounted()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>("level")
  const [selectedLevel, setSelectedLevel] = useState<CertificationLevel | null>(null)
  const [form, setForm] = useState({ name: "", email: "", phone: "" })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [enrollmentResult, setEnrollmentResult] = useState<{
    levelName: string
    gymName: string
    message: string
  } | null>(null)

  const orgSlug = searchParams.get("gym") || "wisarut-family-gym"
  const [gymName, setGymName] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/public/services?gym=${orgSlug}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.gym?.name) setGymName(data.gym.name)
      })
      .catch(() => {})
  }, [orgSlug])

  if (!mounted) return null

  const handleSelectLevel = (level: CertificationLevel) => {
    setSelectedLevel(level)
    setStep("details")
    setError("")
  }

  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return
    setStep("confirm")
    setError("")
  }

  const handleEnroll = async () => {
    if (!selectedLevel) return
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/public/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          level: selectedLevel.id,
          orgSlug,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Something went wrong")
        return
      }
      if (data.alreadyEnrolled) {
        setError(data.message)
        return
      }
      setEnrollmentResult(data)
      setStep("success")
    } catch {
      setError("Connection error — please try again")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageBackground>
      <SacredDecoration />
      <div className="relative z-20 min-h-screen">
        <MarketingTopNav />

        <div className="max-w-2xl mx-auto px-4 pt-24 pb-32">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-500 bg-clip-text text-transparent">
              BEGIN YOUR PATH
            </h1>
            <p className="mt-2 text-neutral-400 text-sm">
              Naga-to-Garuda Muay Thai Certification System
            </p>
          </motion.div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {(["level", "details", "confirm"] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step === s || (["details", "confirm", "success"].indexOf(step) > i - 1 && step !== "level")
                      ? "bg-orange-600 text-white"
                      : "bg-neutral-800 text-neutral-500"
                  } ${step === "success" ? "bg-emerald-600 text-white" : ""}`}
                >
                  {step === "success" || (["details", "confirm", "success"].indexOf(step) > ["level", "details", "confirm"].indexOf(s))
                    ? <CheckCircle className="w-4 h-4" />
                    : i + 1}
                </div>
                {i < 2 && <div className="w-8 h-px bg-neutral-700" />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Select Level */}
            {step === "level" && (
              <motion.div
                key="level"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <h2 className="text-lg font-semibold text-white text-center mb-4">Choose your certification level</h2>
                {CERTIFICATION_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => handleSelectLevel(level)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:border-orange-500/30 hover:bg-neutral-800/50 transition-all text-left group"
                  >
                    <span className="text-3xl">{level.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-base font-bold ${level.color}`}>{level.name}</span>
                        <span className="text-[10px] text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full">
                          Level {level.number}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">{level.creature} &middot; {level.duration}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{level.skills.length} skills assessed</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-white">{level.priceTHB.toLocaleString()} THB</p>
                      <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-orange-400 transition-colors ml-auto mt-1" />
                    </div>
                  </button>
                ))}
              </motion.div>
            )}

            {/* Step 2: Student Details */}
            {step === "details" && selectedLevel && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button
                  onClick={() => setStep("level")}
                  className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white mb-4 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to levels
                </button>

                <div className={`rounded-xl border ${selectedLevel.borderColor} bg-neutral-900/50 p-4 mb-6`}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedLevel.icon}</span>
                    <div>
                      <p className={`font-bold ${selectedLevel.color}`}>{selectedLevel.name} — Level {selectedLevel.number}</p>
                      <p className="text-xs text-neutral-400">{selectedLevel.duration} &middot; {selectedLevel.priceTHB.toLocaleString()} THB</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmitDetails} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your full name"
                      className="w-full px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Phone (optional)</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+66..."
                      className="w-full px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transition-colors"
                  >
                    Continue
                  </button>
                </form>
              </motion.div>
            )}

            {/* Step 3: Confirm */}
            {step === "confirm" && selectedLevel && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button
                  onClick={() => setStep("details")}
                  className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white mb-4 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>

                <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 space-y-4">
                  <h2 className="text-lg font-bold text-white text-center">Confirm Enrollment</h2>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Program</span>
                      <span className={`font-medium ${selectedLevel.color}`}>
                        {selectedLevel.icon} {selectedLevel.name} (Level {selectedLevel.number})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Duration</span>
                      <span className="text-white">{selectedLevel.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Skills assessed</span>
                      <span className="text-white">{selectedLevel.skills.length} competencies</span>
                    </div>
                    <hr className="border-neutral-800" />
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Name</span>
                      <span className="text-white">{form.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Email</span>
                      <span className="text-white">{form.email}</span>
                    </div>
                    {form.phone && (
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Phone</span>
                        <span className="text-white">{form.phone}</span>
                      </div>
                    )}
                    <hr className="border-neutral-800" />
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Gym</span>
                      <span className="text-white">{gymName || orgSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold">
                      <span className="text-neutral-300">Total</span>
                      <span className="text-orange-400">{selectedLevel.priceTHB.toLocaleString()} THB</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-500 text-center">
                    Payment is collected at the gym. This enrollment confirms your spot.
                  </p>

                  {error && (
                    <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
                  )}

                  <button
                    onClick={handleEnroll}
                    disabled={submitting}
                    className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enrolling...
                      </>
                    ) : (
                      <>
                        <Award className="w-4 h-4" />
                        Confirm Enrollment
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Success */}
            {step === "success" && enrollmentResult && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 15, delay: 0.2 }}
                  className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto"
                >
                  <CheckCircle className="w-10 h-10 text-white" />
                </motion.div>

                <div>
                  <h2 className="text-2xl font-bold text-white">You&apos;re Enrolled!</h2>
                  <p className="text-neutral-400 mt-2 text-sm">{enrollmentResult.message}</p>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 text-sm space-y-2">
                  <p className="text-neutral-400">
                    <strong className="text-white">What&apos;s next:</strong>
                  </p>
                  <ul className="text-neutral-400 space-y-1 text-left">
                    <li>1. We&apos;ll confirm your dates via email within 24 hours</li>
                    <li>2. Payment is collected at the gym on arrival</li>
                    <li>3. Your trainer will assess skills during your program</li>
                    <li>4. Earn your certificate upon successful completion</li>
                  </ul>
                </div>

                <div className="flex flex-col gap-2">
                  <Link
                    href="/certificate-programs"
                    className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    View all certification programs &rarr;
                  </Link>
                  <Link
                    href="/"
                    className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    Back to homepage
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <MarketingBottomNav />
      </div>
    </PageBackground>
  )
}
