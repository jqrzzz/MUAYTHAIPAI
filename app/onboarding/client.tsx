"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronRight, MapPin, Clock, Dumbbell, Loader2 } from "lucide-react"

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

type Step = "details" | "services" | "hours" | "done"
const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: "details", label: "Gym Details", icon: <MapPin className="h-4 w-4" /> },
  { key: "services", label: "Services", icon: <Dumbbell className="h-4 w-4" /> },
  { key: "hours", label: "Hours", icon: <Clock className="h-4 w-4" /> },
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
      if (!res.ok) throw new Error("Failed to save details")
      setStep("services")
    } catch {
      setError("Failed to save. Please try again.")
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
        if (!res.ok) throw new Error(`Failed to create service: ${svc.name}`)
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
      setStep("done")
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
            onSkip={() => setStep("done")}
            saving={saving}
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
        What can students book? You can always add more later.
      </p>

      {/* Quick-add templates */}
      <div className="mt-4">
        <p className="mb-2 text-xs font-medium text-neutral-500 uppercase tracking-wide">Quick add</p>
        <div className="flex flex-wrap gap-2">
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
