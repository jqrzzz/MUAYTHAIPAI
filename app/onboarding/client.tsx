"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Check,
  ChevronRight,
  MapPin,
  Clock,
  Dumbbell,
  Loader2,
  Sparkles,
  Link2,
  Award,
  Wand2,
} from "lucide-react"
import { CERTIFICATION_LEVELS } from "@/lib/certification-levels"
import OckOckChatWidget from "@/components/public/ockock-chat-widget"
import ChannelCredentialsCard from "@/components/admin/channel-credentials-card"

// ============================================
// Types
// ============================================

interface Organization {
  id: string
  name: string
  slug: string
  description: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  address: string | null
  city: string | null
  province: string | null
  logo_url: string | null
}

interface GymDetailsForm {
  description: string
  email: string
  phone: string
  whatsapp: string
  address: string
  city: string
  province: string
}

interface ServiceForm {
  name: string
  description: string
  duration_minutes: string
  price_thb: string
}

interface OperatingHours {
  [day: string]: { open: string; close: string; closed: boolean }
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
}

const DEFAULT_HOURS: OperatingHours = Object.fromEntries(
  DAYS.map((d) => [d, { open: "08:00", close: "18:00", closed: false }])
)

const SERVICE_TEMPLATES: ServiceForm[] = [
  { name: "Group Muay Thai Class", description: "Traditional group training session", duration_minutes: "90", price_thb: "500" },
  { name: "Private 1-on-1 Training", description: "Personal training with a dedicated coach", duration_minutes: "60", price_thb: "1500" },
  { name: "Morning Session", description: "Early morning training — running, pad work, technique", duration_minutes: "120", price_thb: "400" },
  { name: "Kids Muay Thai", description: "Training for young fighters ages 6-14", duration_minutes: "60", price_thb: "400" },
]

type Step =
  | "details"
  | "services"
  | "hours"
  | "certifications"
  | "meet-ockock"
  | "channels"
  | "done"
const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: "details", label: "Details", icon: <MapPin className="h-4 w-4" /> },
  { key: "services", label: "Services", icon: <Dumbbell className="h-4 w-4" /> },
  { key: "hours", label: "Hours", icon: <Clock className="h-4 w-4" /> },
  { key: "certifications", label: "Certifications", icon: <Award className="h-4 w-4" /> },
  { key: "meet-ockock", label: "Meet OckOck", icon: <Sparkles className="h-4 w-4" /> },
  { key: "channels", label: "Channels", icon: <Link2 className="h-4 w-4" /> },
  { key: "done", label: "Done", icon: <Check className="h-4 w-4" /> },
]

// ============================================
// Main Component
// ============================================

export default function OnboardingClient({
  orgId,
  organization,
}: {
  orgId: string
  organization: Organization
}) {
  const router = useRouter()
  const [step, setStep] = useState<Step>("details")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [details, setDetails] = useState<GymDetailsForm>({
    description: organization.description || "",
    email: organization.email || "",
    phone: organization.phone || "",
    whatsapp: organization.whatsapp || "",
    address: organization.address || "",
    city: organization.city || "",
    province: organization.province || "",
  })

  const [services, setServices] = useState<ServiceForm[]>([
    { name: "", description: "", duration_minutes: "90", price_thb: "500" },
  ])

  const [hours, setHours] = useState<OperatingHours>(DEFAULT_HOURS)

  // Save gym details
  async function saveDetails() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          organization: {
            description: details.description || null,
            email: details.email || null,
            phone: details.phone || null,
            whatsapp: details.whatsapp || null,
            address: details.address || null,
            city: details.city || null,
            province: details.province || null,
          },
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || "Failed to save details")
      }
      setStep("services")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  // Save services
  async function saveServices() {
    const validServices = services.filter((s) => s.name.trim())
    if (validServices.length === 0) {
      setError("Add at least one service to continue.")
      return
    }

    setSaving(true)
    setError(null)
    try {
      let savedCount = 0
      for (const svc of validServices) {
        const res = await fetch("/api/admin/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            org_id: orgId,
            name: svc.name.trim(),
            description: svc.description.trim() || null,
            duration_minutes: parseInt(svc.duration_minutes) || 90,
            price_thb: parseInt(svc.price_thb) || 0,
            is_active: true,
          }),
        })
        if (!res.ok) {
          const msg = savedCount > 0
            ? `Saved ${savedCount} service(s), but failed on "${svc.name}". You can continue and fix this later in Settings.`
            : `Failed to create "${svc.name}". Please try again.`
          throw new Error(msg)
        }
        savedCount++
      }
      setStep("hours")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save services.")
    } finally {
      setSaving(false)
    }
  }

  // Save hours and finish
  async function saveHours() {
    setSaving(true)
    setError(null)
    try {
      const hoursPayload: Record<string, { open: string; close: string }> = {}
      for (const day of DAYS) {
        if (!hours[day].closed) {
          hoursPayload[day] = { open: hours[day].open, close: hours[day].close }
        }
      }

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          settings: { operating_hours: hoursPayload },
        }),
      })
      if (!res.ok) throw new Error("Failed to save hours")
      // Generate a starter bookable schedule from these hours so the gym's
      // public booking shows its real window. Best-effort, idempotent.
      try {
        await fetch("/api/admin/time-slots/generate", { method: "POST" })
      } catch {
        /* non-blocking */
      }
      setStep("certifications")
    } catch {
      setError("Failed to save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  // Add a template service
  function addTemplate(template: ServiceForm) {
    const alreadyAdded = services.some((s) => s.name === template.name)
    if (alreadyAdded) return
    // Replace empty first slot or append
    if (services.length === 1 && !services[0].name.trim()) {
      setServices([{ ...template }])
    } else {
      setServices([...services, { ...template }])
    }
  }

  const stepIndex = STEPS.findIndex((s) => s.key === step)

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <div className="border-b border-white/10 bg-neutral-950/80 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <p className="text-sm text-neutral-400">Setting up</p>
          <h1 className="text-lg font-bold text-white">{organization.name}</h1>
        </div>
      </div>

      {/* Progress */}
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  i < stepIndex
                    ? "bg-emerald-500/20 text-emerald-400"
                    : i === stepIndex
                      ? "bg-orange-500/20 text-orange-400"
                      : "bg-white/5 text-neutral-600"
                }`}
              >
                {i < stepIndex ? <Check className="h-3.5 w-3.5" /> : s.icon}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px flex-1 ${
                    i < stepIndex ? "bg-emerald-500/30" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex">
          {STEPS.map((s, i) => (
            <p
              key={s.key}
              className={`flex-1 text-[11px] ${
                i === stepIndex ? "text-white" : "text-neutral-600"
              }`}
            >
              {s.label}
            </p>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-4 py-8">
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {step === "details" && (
          <DetailsStep
            form={details}
            setForm={setDetails}
            onNext={saveDetails}
            saving={saving}
          />
        )}
        {step === "services" && (
          <ServicesStep
            services={services}
            setServices={setServices}
            templates={SERVICE_TEMPLATES}
            onAddTemplate={addTemplate}
            onNext={saveServices}
            saving={saving}
          />
        )}
        {step === "hours" && (
          <HoursStep
            hours={hours}
            setHours={setHours}
            onNext={saveHours}
            onSkip={() => setStep("certifications")}
            saving={saving}
          />
        )}
        {step === "certifications" && (
          <CertificationsStep
            gymName={organization.name}
            city={organization.city}
            onNext={() => setStep("meet-ockock")}
          />
        )}
        {step === "meet-ockock" && (
          <MeetOckOckStep
            gymName={organization.name}
            orgSlug={organization.slug}
            onNext={() => setStep("channels")}
            onSkip={() => setStep("channels")}
          />
        )}
        {step === "channels" && (
          <ChannelsStep
            onNext={() => setStep("done")}
            onSkip={() => setStep("done")}
          />
        )}
        {step === "done" && (
          <DoneStep
            gymName={organization.name}
            onGo={() => router.push("/admin")}
          />
        )}
      </div>
    </div>
  )
}

// ============================================
// Step Components
// ============================================

function DetailsStep({
  form,
  setForm,
  onNext,
  saving,
}: {
  form: GymDetailsForm
  setForm: (f: GymDetailsForm) => void
  onNext: () => void
  saving: boolean
}) {
  const update = (field: keyof GymDetailsForm, value: string) =>
    setForm({ ...form, [field]: value })

  return (
    <div>
      <h2 className="text-xl font-bold text-white">Tell us about your gym</h2>
      <p className="mt-1 text-sm text-neutral-400">
        This info appears on your public profile and booking page.
      </p>

      <div className="mt-6 space-y-4">
        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="What makes your gym special? Style of training, atmosphere, etc."
            rows={3}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-orange-500/50 resize-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="gym@example.com"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-orange-500/50"
            />
          </Field>
          <Field label="Phone">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+66..."
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-orange-500/50"
            />
          </Field>
        </div>

        <Field label="WhatsApp (popular for walk-in travelers)">
          <input
            type="tel"
            value={form.whatsapp}
            onChange={(e) => update("whatsapp", e.target.value)}
            placeholder="+66..."
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-orange-500/50"
          />
        </Field>

        <hr className="border-white/10" />

        <Field label="Street Address">
          <input
            type="text"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="123 Main Rd"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-orange-500/50"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="City">
            <input
              type="text"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              placeholder="e.g. Pai"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-orange-500/50"
            />
          </Field>
          <Field label="Province">
            <input
              type="text"
              value={form.province}
              onChange={(e) => update("province", e.target.value)}
              placeholder="e.g. Mae Hong Son"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-orange-500/50"
            />
          </Field>
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={onNext}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-2.5 font-semibold text-black transition-colors hover:bg-orange-400 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Continue
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function ServicesStep({
  services,
  setServices,
  templates,
  onAddTemplate,
  onNext,
  saving,
}: {
  services: ServiceForm[]
  setServices: (s: ServiceForm[]) => void
  templates: ServiceForm[]
  onAddTemplate: (t: ServiceForm) => void
  onNext: () => void
  saving: boolean
}) {
  const [aiLoading, setAiLoading] = useState(false)
  const [aiTried, setAiTried] = useState(false)

  const fetchAiSuggestions = useCallback(async () => {
    setAiLoading(true)
    try {
      const res = await fetch("/api/admin/onboarding/suggest-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        const data = (await res.json()) as {
          services: { name: string; description: string; duration_minutes: number; price_thb: number }[]
        }
        if (Array.isArray(data.services) && data.services.length > 0) {
          setServices(
            data.services.map((s) => ({
              name: s.name,
              description: s.description,
              duration_minutes: String(s.duration_minutes),
              price_thb: String(s.price_thb),
            })),
          )
        }
      }
    } catch {
      // Silent fallback — owner still has the empty row + quick-add chips.
    }
    setAiLoading(false)
    setAiTried(true)
  }, [setServices])

  // Auto-run on first mount, but only if the owner hasn't already typed
  // something (services starts as one empty row).
  useEffect(() => {
    const isPristine =
      services.length === 1 &&
      !services[0].name &&
      !services[0].description
    if (!aiTried && isPristine) {
      fetchAiSuggestions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updateService(index: number, field: keyof ServiceForm, value: string) {
    const updated = services.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    )
    setServices(updated)
  }

  function removeService(index: number) {
    if (services.length <= 1) return
    setServices(services.filter((_, i) => i !== index))
  }

  function addBlank() {
    setServices([
      ...services,
      { name: "", description: "", duration_minutes: "90", price_thb: "500" },
    ])
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-white">Set up your services</h2>
      <p className="mt-1 text-sm text-neutral-400">
        What can students book? OckOck drafted three to get you started — edit, remove, or add your own.
      </p>

      {/* OckOck regenerate */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={fetchAiSuggestions}
          disabled={aiLoading}
          className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300 transition-colors hover:bg-indigo-500/20 disabled:opacity-50"
        >
          {aiLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Wand2 className="h-3 w-3" />
          )}
          {aiLoading ? "OckOck is drafting..." : "Regenerate with OckOck"}
        </button>
        {templates.map((t) => (
          <button
            key={t.name}
            onClick={() => onAddTemplate(t)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300 transition-colors hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-400"
          >
            + {t.name}
          </button>
        ))}
      </div>

      {/* Service list */}
      <div className="mt-6 space-y-4">
        {services.map((svc, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium text-neutral-500">
                Service {i + 1}
              </p>
              {services.length > 1 && (
                <button
                  onClick={() => removeService(i)}
                  className="text-xs text-neutral-600 hover:text-red-400"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="mt-3 space-y-3">
              <Field label="Name">
                <input
                  type="text"
                  value={svc.name}
                  onChange={(e) => updateService(i, "name", e.target.value)}
                  placeholder="e.g. Group Muay Thai Class"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-orange-500/50"
                />
              </Field>
              <Field label="Description">
                <input
                  type="text"
                  value={svc.description}
                  onChange={(e) => updateService(i, "description", e.target.value)}
                  placeholder="Short description..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-orange-500/50"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Duration (minutes)">
                  <input
                    type="number"
                    value={svc.duration_minutes}
                    onChange={(e) => updateService(i, "duration_minutes", e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-orange-500/50"
                  />
                </Field>
                <Field label="Price (THB)">
                  <input
                    type="number"
                    value={svc.price_thb}
                    onChange={(e) => updateService(i, "price_thb", e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-orange-500/50"
                  />
                </Field>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addBlank}
        className="mt-3 text-sm text-neutral-400 hover:text-orange-400"
      >
        + Add another service
      </button>

      <div className="mt-8">
        <button
          onClick={onNext}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-2.5 font-semibold text-black transition-colors hover:bg-orange-400 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Continue
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Step: Certifications — preview the Naga–Garuda ladder this gym can
// issue. Read-only visual + OckOck-written intro. The actual issuance
// happens once they have real students; this step just makes the wedge
// visible during onboarding so the new owner knows what they're signing
// up for.
function CertificationsStep({
  gymName,
  city,
  onNext,
}: {
  gymName: string
  city: string | null
  onNext: () => void
}) {
  const [intro, setIntro] = useState<string | null>(null)
  const [introLoading, setIntroLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIntroLoading(true)
    fetch("/api/admin/onboarding/cert-intro", { method: "POST" })
      .then(async (res) => (res.ok ? (await res.json()) : null))
      .then((data) => {
        if (cancelled) return
        if (data?.intro) setIntro(data.intro)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIntroLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <h2 className="text-xl font-bold text-white">Issue real certificates</h2>
      <p className="mt-1 text-sm text-neutral-400">
        {gymName}
        {city ? ` in ${city}` : ""} can issue verifiable certifications across
        the five Naga–Garuda levels. Every cert is public, shareable, and signed
        by a named examiner.
      </p>

      {/* OckOck intro */}
      <div className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.06] p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
          <p className="text-[11px] font-medium text-indigo-200 uppercase tracking-wider">
            OckOck&apos;s take
          </p>
        </div>
        {introLoading ? (
          <div className="flex items-center gap-2 text-sm text-indigo-200/70">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Drafting an intro for {gymName}…
          </div>
        ) : (
          <p className="text-sm text-indigo-100/90 leading-relaxed">
            {intro ??
              "You can issue verifiable certificates across all five Naga–Garuda levels. Every cert your gym issues becomes a public, shareable proof of training."}
          </p>
        )}
      </div>

      {/* Level ladder */}
      <div className="mt-6 space-y-2.5">
        {CERTIFICATION_LEVELS.map((lvl) => (
          <div
            key={lvl.id}
            className={`flex items-center gap-3 rounded-xl border ${lvl.borderColor} bg-white/[0.03] p-3.5`}
          >
            <div className="text-3xl shrink-0">{lvl.icon}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <p className={`font-display text-[15px] ${lvl.color}`}>
                  {lvl.name}
                </p>
                <p className="text-[11px] text-neutral-500">
                  Level {lvl.number} · {lvl.creature}
                </p>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                {lvl.duration} ·{" "}
                <span className="tabular-nums text-neutral-300">
                  {lvl.priceTHB.toLocaleString()} THB
                </span>{" "}
                · {lvl.skills.length} skills attested
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11px] text-neutral-500 leading-relaxed">
        Prices and skill lists are platform-set so every gym&apos;s Naga is the same
        credential. You&apos;ll enroll students, sign off their skills, and issue
        the cert when they&apos;re ready — all from your dashboard.
      </p>

      <div className="mt-8">
        <button
          onClick={onNext}
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-2.5 font-semibold text-black transition-colors hover:bg-orange-400"
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function HoursStep({
  hours,
  setHours,
  onNext,
  onSkip,
  saving,
}: {
  hours: OperatingHours
  setHours: (h: OperatingHours) => void
  onNext: () => void
  onSkip: () => void
  saving: boolean
}) {
  function updateDay(day: string, field: "open" | "close" | "closed", value: string | boolean) {
    setHours({ ...hours, [day]: { ...hours[day], [field]: value } })
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-white">Operating hours</h2>
      <p className="mt-1 text-sm text-neutral-400">
        When is your gym open? This helps travelers plan their visit.
      </p>

      <div className="mt-6 space-y-2">
        {DAYS.map((day) => (
          <div
            key={day}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
              hours[day].closed
                ? "border-white/5 bg-white/[0.01]"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className="w-24">
              <p className={`text-sm font-medium ${hours[day].closed ? "text-neutral-600" : "text-white"}`}>
                {DAY_LABELS[day]}
              </p>
            </div>

            <label className="flex items-center gap-2 text-xs text-neutral-400">
              <input
                type="checkbox"
                checked={hours[day].closed}
                onChange={(e) => updateDay(day, "closed", e.target.checked)}
                className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-800"
              />
              Closed
            </label>

            {!hours[day].closed && (
              <div className="ml-auto flex items-center gap-2">
                <input
                  type="time"
                  value={hours[day].open}
                  onChange={(e) => updateDay(day, "open", e.target.value)}
                  className="rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white outline-none focus:border-orange-500/50"
                />
                <span className="text-neutral-600">to</span>
                <input
                  type="time"
                  value={hours[day].close}
                  onChange={(e) => updateDay(day, "close", e.target.value)}
                  className="rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white outline-none focus:border-orange-500/50"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={onNext}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-2.5 font-semibold text-black transition-colors hover:bg-orange-400 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save & Finish
        </button>
        <button
          onClick={onSkip}
          className="text-sm text-neutral-500 hover:text-white"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}

// ============================================
// Step: Meet OckOck — let the new owner chat with their fresh AI
// receptionist before they hit the dashboard. The widget already loads
// a knowledge block from this gym's services + hours, so the very first
// reply should already be in their gym's voice.
// ============================================

function MeetOckOckStep({
  gymName,
  orgSlug,
  onNext,
  onSkip,
}: {
  gymName: string
  orgSlug: string
  onNext: () => void
  onSkip: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/10 ring-1 ring-orange-500/30">
          <Image
            src="/images/ockock-avatar.png"
            alt="OckOck"
            width={56}
            height={56}
            className="rounded-full"
          />
        </div>
        <h2 className="text-2xl font-bold text-white">Meet OckOck</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-400">
          OckOck (อ๊อกอ๊อก) is your gym&apos;s friendly receptionist.
          We&apos;ve already taught it about your services and hours from
          what you just entered. Tap the chat in the corner and ask anything
          a customer would.
        </p>
      </div>

      <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.04] p-5">
        <p className="text-sm font-semibold text-orange-200 mb-2">
          Try asking:
        </p>
        <ul className="space-y-1.5 text-sm text-neutral-300">
          <li>&ldquo;How much for a private session?&rdquo;</li>
          <li>&ldquo;What time are morning classes?&rdquo;</li>
          <li>&ldquo;What should I bring?&rdquo;</li>
        </ul>
        <p className="mt-3 text-xs text-neutral-500 leading-relaxed">
          OckOck only answers from your data. When it doesn&apos;t know
          something, it asks. You can teach it more from{" "}
          <span className="text-orange-300">/admin → OckOck → Train OckOck</span>{" "}
          later.
        </p>
      </div>

      {/* Mount OckOck pinned to this gym, forced visible since the
          global widget hides on /onboarding via HIDDEN_PREFIXES check. */}
      <OckOckChatWidget orgSlug={orgSlug} forceVisible />

      <div className="flex items-center gap-2">
        <button
          onClick={onNext}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 py-3 font-semibold text-black transition-colors hover:bg-orange-400"
        >
          Got it — what&apos;s next?
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={onSkip}
          className="text-sm text-neutral-400 hover:text-white px-3"
        >
          Skip
        </button>
      </div>
      <p className="text-center text-[11px] text-neutral-600">
        OckOck for {gymName} is live on your public gym page already.
      </p>
    </div>
  )
}

// ============================================
// Step: Connect a channel (optional). Reuses the per-gym credentials
// card from the Channels admin tab so the form, validation, and save
// logic match. Owners who don't have tokens handy can skip and come
// back from /admin → Channels later.
// ============================================

function ChannelsStep({
  onNext,
  onSkip,
}: {
  onNext: () => void
  onSkip: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/15 ring-1 ring-blue-500/30">
          <Link2 className="h-6 w-6 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Connect your channels</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-400">
          Paste your LINE Official Account or WhatsApp Business tokens so
          OckOck can answer DMs from those channels too. Optional — you
          can do this later from{" "}
          <span className="text-blue-300">/admin → Channels</span>.
        </p>
      </div>

      <ChannelCredentialsCard />

      <div className="flex items-center gap-2">
        <button
          onClick={onNext}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 py-3 font-semibold text-black transition-colors hover:bg-orange-400"
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={onSkip}
          className="text-sm text-neutral-400 hover:text-white px-3"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}

function DoneStep({
  gymName,
  onGo,
}: {
  gymName: string
  onGo: () => void
}) {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
        <Check className="h-8 w-8 text-emerald-400" />
      </div>
      <h2 className="text-2xl font-bold text-white">{gymName} is ready!</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-neutral-400">
        Your gym is set up and visible on the MUAYTHAIPAI network. You can now
        manage bookings, invite trainers, and customize your profile from the
        dashboard.
      </p>
      <button
        onClick={onGo}
        className="mt-8 rounded-lg bg-orange-500 px-8 py-3 font-semibold text-black transition-colors hover:bg-orange-400"
      >
        Go to Dashboard
      </button>
    </div>
  )
}

// ============================================
// Shared
// ============================================

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-300">
        {label}
      </label>
      {children}
    </div>
  )
}
