"use client"

/**
 * Conversational onboarding — the default first-run experience for a new
 * gym. OckOck asks the owner to describe their gym in their own words
 * (Thai or English), turns it into a structured setup via /api/onboarding/
 * extract, lets them review/edit it, then writes it through the same
 * /api/admin/settings + /api/admin/services endpoints the step-form uses.
 *
 * The step-by-step form is still available at /onboarding/form for owners
 * who'd rather click through fields.
 */
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2, Plus, Trash2 } from "lucide-react"

const AVATAR = "/images/ockock-avatar.png"

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const
const DAY_LABEL: Record<(typeof DAYS)[number], string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
}

type Day = (typeof DAYS)[number]
type DayHours = { open: string; close: string; closed: boolean }
type ServiceRow = { name: string; description: string; duration_minutes: string; price_thb: string }
type ExtractedHour = { day: Day; open: string; close: string }
type Extracted = { description: string; services: ServiceRow[]; hours: ExtractedHour[]; notes: string }

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

type Phase = "intro" | "thinking" | "review" | "applying" | "done"

const BLANK_SERVICE: ServiceRow = { name: "", description: "", duration_minutes: "90", price_thb: "500" }

function defaultHours(): Record<Day, DayHours> {
  return Object.fromEntries(
    DAYS.map((d) => [d, { open: "07:00", close: "18:00", closed: d === "sunday" }]),
  ) as Record<Day, DayHours>
}

function hoursFromExtract(arr: ExtractedHour[]): Record<Day, DayHours> {
  if (!arr.length) return defaultHours()
  const byDay = new Map(arr.map((h) => [h.day, h]))
  return Object.fromEntries(
    DAYS.map((d) => {
      const h = byDay.get(d)
      return [d, h ? { open: h.open, close: h.close, closed: false } : { open: "07:00", close: "18:00", closed: true }]
    }),
  ) as Record<Day, DayHours>
}

export default function OnboardingConversation({
  orgId,
  organization,
}: {
  orgId: string
  organization: Organization
}) {
  const router = useRouter()
  const gymName = organization.name || "your gym"

  const [phase, setPhase] = useState<Phase>("intro")
  const [blurb, setBlurb] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Review state
  const [description, setDescription] = useState(organization.description || "")
  const [services, setServices] = useState<ServiceRow[]>([{ ...BLANK_SERVICE }])
  const [hours, setHours] = useState<Record<Day, DayHours>>(defaultHours())
  const [notes, setNotes] = useState("")

  // Draft persistence — survive a tab close or accidental refresh. Scoped
  // per gym so a different gym in the same browser doesn't bleed in.
  const draftKey = `ockock-onboarding-draft-${orgId}`
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey)
      if (raw) {
        const draft = JSON.parse(raw) as Partial<{
          phase: Phase
          blurb: string
          description: string
          services: ServiceRow[]
          hours: Record<Day, DayHours>
          notes: string
        }>
        if (typeof draft.blurb === "string") setBlurb(draft.blurb)
        if (typeof draft.description === "string") setDescription(draft.description)
        if (Array.isArray(draft.services) && draft.services.length > 0) setServices(draft.services)
        if (draft.hours) setHours(draft.hours)
        if (typeof draft.notes === "string") setNotes(draft.notes)
        // Only restore the review phase — never resume mid-extract / mid-apply.
        if (draft.phase === "review") setPhase("review")
      }
    } catch {
      // Corrupt or unreadable draft — ignore.
    }
    setHydrated(true)
  }, [draftKey])

  useEffect(() => {
    if (!hydrated) return
    // Persist only the editable user state, never transient phases.
    if (phase === "thinking" || phase === "applying" || phase === "done") return
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ phase, blurb, description, services, hours, notes }),
      )
    } catch {
      // Quota / serialize errors — fail silently.
    }
  }, [draftKey, hydrated, phase, blurb, description, services, hours, notes])

  const runExtract = useCallback(async () => {
    const text = blurb.trim()
    if (!text) return
    setError(null)
    setPhase("thinking")
    try {
      const res = await fetch("/api/onboarding/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      // Even when the API errors out we keep the user moving — drop them
      // into the editable review with sensible defaults rather than a
      // dead-end. But we surface a friendly message so they know
      // something didn't go to plan and to double-check their fields.
      if (!res.ok) {
        setServices([{ ...BLANK_SERVICE }])
        setHours(defaultHours())
        setPhase("review")
        setError("OckOck couldn't read that fully — fill in what's missing below and you're good.")
        return
      }
      const data = (await res.json().catch(() => ({}))) as Partial<{
        description: string
        services: { name: string; description: string; duration_minutes: number; price_thb: number }[]
        hours: ExtractedHour[]
        notes: string
      }>
      const extractedServices: ServiceRow[] = (data.services ?? []).map((s) => ({
        name: String(s.name ?? ""),
        description: String(s.description ?? ""),
        duration_minutes: String(s.duration_minutes ?? 90),
        price_thb: String(s.price_thb ?? 0),
      }))
      setDescription((data.description || organization.description || "").trim())
      setServices(extractedServices.length ? extractedServices : [{ ...BLANK_SERVICE }])
      setHours(hoursFromExtract(data.hours ?? []))
      setNotes((data.notes || "").trim())
      setPhase("review")
    } catch {
      // Network/parse failure — still let them into the editable review.
      setServices([{ ...BLANK_SERVICE }])
      setHours(defaultHours())
      setPhase("review")
      setError("OckOck couldn't read that fully — fill in what's missing below and you're good.")
    }
  }, [blurb, organization.description])

  const apply = useCallback(async () => {
    const valid = services.filter((s) => s.name.trim())
    if (valid.length === 0) {
      setError("Add at least one service so OckOck can take bookings.")
      return
    }
    setError(null)
    setPhase("applying")
    try {
      // 1. Gym description (preserve the contact fields collected at signup)
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          organization: {
            description: description.trim() || null,
            email: organization.email || null,
            phone: organization.phone || null,
            whatsapp: organization.whatsapp || null,
            address: organization.address || null,
            city: organization.city || null,
            province: organization.province || null,
          },
        }),
      })

      // 2. Operating hours (only the open days, matching the step-form's shape)
      const operating_hours: Record<string, { open: string; close: string }> = {}
      for (const d of DAYS) {
        if (!hours[d].closed) operating_hours[d] = { open: hours[d].open, close: hours[d].close }
      }
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId, settings: { operating_hours } }),
      })

      // 3. Services — one at a time, like the step-form. Track per-row
      // success so we can give a precise error if some saved and some
      // didn't (rather than silently landing in "done" with partial data).
      let saved = 0
      const failedNames: string[] = []
      for (const s of valid) {
        const res = await fetch("/api/admin/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            org_id: orgId,
            name: s.name.trim(),
            description: s.description.trim() || null,
            duration_minutes: parseInt(s.duration_minutes) || 90,
            price_thb: parseInt(s.price_thb) || 0,
            is_active: true,
          }),
        })
        if (res.ok) saved++
        else failedNames.push(s.name)
      }
      if (saved === 0) {
        throw new Error(
          `OckOck couldn't save any services (${failedNames.join(", ")}). Try again?`,
        )
      }
      if (failedNames.length > 0) {
        // Partial success — surface the bad rows but let the gym go live.
        // The owner can re-add the missing ones from the services tab.
        setError(
          `Saved ${saved} of ${valid.length} services. Couldn't save: ${failedNames.join(", ")}. Add them from the Services tab.`,
        )
      }
      // 4. Starter bookable schedule from the hours above, so the public
      // booking page shows the gym's real window instead of fallback times.
      // Best-effort: never block going live on it.
      try {
        await fetch("/api/admin/time-slots/generate", { method: "POST" })
      } catch {
        /* non-blocking */
      }
      // Onboarding complete — clear the saved draft so a refresh doesn't
      // dredge it back.
      try {
        localStorage.removeItem(draftKey)
      } catch {
        /* ignore */
      }
      setPhase("done")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong saving your gym. Try again?")
      setPhase("review")
    }
  }, [services, hours, description, orgId, organization, draftKey])

  // ---- shared chrome ----
  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-zinc-950 font-inter text-zinc-100 antialiased">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[360px] bg-[radial-gradient(circle_at_50%_-10%,rgba(99,102,241,0.16),transparent_60%)]"
      />
      <div className="relative mx-auto max-w-2xl px-4 py-12 sm:py-16">{children}</div>
    </div>
  )

  const ockockSays = (text: React.ReactNode) => (
    <div className="flex items-start gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={AVATAR} alt="OckOck" className="mt-0.5 h-10 w-10 shrink-0 rounded-full bg-zinc-900 object-contain p-1 ring-1 ring-zinc-800" />
      <div className="rounded-2xl rounded-tl-sm bg-zinc-900/60 px-4 py-3 text-[15px] leading-relaxed text-zinc-200 ring-1 ring-zinc-800">
        {text}
      </div>
    </div>
  )

  // =========================== INTRO ===========================
  if (phase === "intro") {
    return shell(
      <div className="space-y-6">
        {ockockSays(
          <>
            Sawadee! I&apos;m OckOck 🐃 — let&apos;s get <span className="font-semibold text-white">{gymName}</span> set up.
            Tell me about it in your own words: what you offer and roughly what you charge, your hours, anything else worth
            knowing. Thai or English, however you like — don&apos;t worry about getting it perfect, I&apos;ll show you what
            I got and you can fix anything.
          </>,
        )}
        <label htmlFor="gym-blurb" className="sr-only">
          Tell OckOck about your gym
        </label>
        <textarea
          id="gym-blurb"
          value={blurb}
          onChange={(e) => setBlurb(e.target.value)}
          rows={7}
          autoFocus
          aria-describedby="gym-blurb-hint"
          placeholder="e.g. We're a family gym in Chiang Mai. Drop-in 400 baht, week pass 2,500, privates 1,500/hour. Open 7am–6pm weekdays, half day Saturday, closed Sunday. We do kids classes too, and Kru Lek leads the morning pads."
          className="w-full resize-y rounded-2xl bg-zinc-900/60 px-4 py-3 text-[15px] leading-relaxed text-zinc-100 placeholder:text-zinc-600 ring-1 ring-zinc-800 focus:outline-none focus:ring-indigo-500/40"
        />
        <p id="gym-blurb-hint" className="sr-only">
          Describe your gym in your own words. Include what you offer, prices, and hours. OckOck will turn this into your settings.
        </p>
        {error && <p className="text-[13px] text-red-400">{error}</p>}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={runExtract}
            disabled={!blurb.trim()}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-500 px-6 text-[14px] font-medium text-white transition-colors hover:bg-indigo-400 disabled:bg-zinc-800 disabled:text-zinc-600"
          >
            Set up {gymName === "your gym" ? "my gym" : gymName} <ArrowRight className="h-4 w-4" />
          </button>
          <Link href="/onboarding/form" className="text-[13px] text-zinc-500 hover:text-zinc-300">
            Prefer to fill in a quick form? →
          </Link>
        </div>
      </div>,
    )
  }

  // =========================== THINKING ===========================
  if (phase === "thinking") {
    return shell(
      <div className="space-y-6">
        <div className="flex justify-end">
          <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-indigo-500 px-4 py-3 text-[14px] leading-relaxed text-white">
            {blurb.trim()}
          </div>
        </div>
        {ockockSays(
          <span className="inline-flex items-center gap-2 text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Got it — setting things up…
          </span>,
        )}
      </div>,
    )
  }

  // =========================== DONE ===========================
  if (phase === "done") {
    return shell(
      <div className="space-y-6 text-center">
        <div className="text-6xl">🐃</div>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {gymName} is set up!
        </h1>
        {/* Surface partial-save warnings (some services failed to save)
            so the owner doesn't discover the gap by surprise later. */}
        {error && (
          <div className="mx-auto max-w-md rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-left">
            <p className="text-[13px] text-amber-200">{error}</p>
          </div>
        )}
        <p className="mx-auto max-w-md text-[15px] leading-relaxed text-zinc-400">
          OckOck is ready to answer your customers — in your gym&apos;s voice, in Thai or English. You can tweak anything
          from your dashboard.
        </p>
        <div className="flex flex-col items-center gap-3 pt-2">
          <button
            onClick={() => router.push("/admin")}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-500 px-6 text-[14px] font-medium text-white transition-colors hover:bg-indigo-400"
          >
            Go to your dashboard <ArrowRight className="h-4 w-4" />
          </button>
          <p className="max-w-md text-[12px] text-zinc-600">
            Want OckOck answering on LINE, WhatsApp, or Telegram too? Connect a channel anytime from the
            Channels tab in your dashboard.
          </p>
        </div>
      </div>,
    )
  }

  // =========================== REVIEW / APPLYING ===========================
  const applying = phase === "applying"
  const updateService = (i: number, patch: Partial<ServiceRow>) =>
    setServices((arr) => arr.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))

  return shell(
    <div className="space-y-7">
      {ockockSays(
        <>
          Here&apos;s what I got for <span className="font-semibold text-white">{gymName}</span>. Change anything that&apos;s
          off, then we&apos;re live.
        </>,
      )}

      {/* Description */}
      <section>
        <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.14em] text-zinc-500">
          About your gym
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          disabled={applying}
          placeholder="A sentence or two about your gym — shown on your public page."
          className="w-full resize-y rounded-xl bg-zinc-900/60 px-3.5 py-2.5 text-[14px] leading-relaxed text-zinc-100 placeholder:text-zinc-600 ring-1 ring-zinc-800 focus:outline-none focus:ring-indigo-500/40 disabled:opacity-60"
        />
      </section>

      {/* Services */}
      <section>
        <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.14em] text-zinc-500">
          Services & prices
        </label>
        <div className="space-y-2">
          {services.map((s, i) => (
            <div key={i} className="rounded-xl bg-zinc-900/40 p-3 ring-1 ring-zinc-900">
              <div className="flex items-center gap-2">
                <input
                  value={s.name}
                  onChange={(e) => updateService(i, { name: e.target.value })}
                  disabled={applying}
                  placeholder="Service name (e.g. Drop-in session)"
                  className="flex-1 rounded-lg bg-zinc-950/60 px-3 py-2 text-[14px] text-zinc-100 placeholder:text-zinc-600 ring-1 ring-zinc-800 focus:outline-none focus:ring-indigo-500/40 disabled:opacity-60"
                />
                {services.length > 1 && (
                  <button
                    onClick={() => setServices((arr) => arr.filter((_, idx) => idx !== i))}
                    disabled={applying}
                    aria-label="Remove service"
                    className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] text-zinc-500">฿</span>
                  <input
                    value={s.price_thb}
                    onChange={(e) => updateService(i, { price_thb: e.target.value.replace(/[^\d]/g, "") })}
                    disabled={applying}
                    inputMode="numeric"
                    placeholder="500"
                    className="w-24 rounded-lg bg-zinc-950/60 px-3 py-1.5 text-[13px] text-zinc-100 placeholder:text-zinc-600 ring-1 ring-zinc-800 focus:outline-none focus:ring-indigo-500/40 disabled:opacity-60"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    value={s.duration_minutes}
                    onChange={(e) => updateService(i, { duration_minutes: e.target.value.replace(/[^\d]/g, "") })}
                    disabled={applying}
                    inputMode="numeric"
                    placeholder="90"
                    className="w-20 rounded-lg bg-zinc-950/60 px-3 py-1.5 text-[13px] text-zinc-100 placeholder:text-zinc-600 ring-1 ring-zinc-800 focus:outline-none focus:ring-indigo-500/40 disabled:opacity-60"
                  />
                  <span className="text-[13px] text-zinc-500">min</span>
                </div>
                <input
                  value={s.description}
                  onChange={(e) => updateService(i, { description: e.target.value })}
                  disabled={applying}
                  placeholder="Short description (optional)"
                  className="min-w-[12rem] flex-1 rounded-lg bg-zinc-950/60 px-3 py-1.5 text-[13px] text-zinc-100 placeholder:text-zinc-600 ring-1 ring-zinc-800 focus:outline-none focus:ring-indigo-500/40 disabled:opacity-60"
                />
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setServices((arr) => [...arr, { ...BLANK_SERVICE }])}
          disabled={applying}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] text-indigo-400 hover:text-indigo-300 disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" /> Add a service
        </button>
      </section>

      {/* Hours */}
      <section>
        <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.14em] text-zinc-500">
          Hours
        </label>
        <div className="space-y-1.5">
          {DAYS.map((d) => (
            <div key={d} className="flex items-center gap-3 rounded-lg bg-zinc-900/40 px-3 py-1.5 ring-1 ring-zinc-900">
              <span className="w-10 text-[13px] text-zinc-400">{DAY_LABEL[d]}</span>
              <label className="flex items-center gap-1.5 text-[12px] text-zinc-500">
                <input
                  type="checkbox"
                  checked={!hours[d].closed}
                  disabled={applying}
                  onChange={(e) => setHours((h) => ({ ...h, [d]: { ...h[d], closed: !e.target.checked } }))}
                  className="h-3.5 w-3.5 accent-indigo-500"
                />
                Open
              </label>
              {!hours[d].closed && (
                <div className="flex items-center gap-1.5 text-[13px] text-zinc-300">
                  <input
                    type="time"
                    value={hours[d].open}
                    disabled={applying}
                    onChange={(e) => setHours((h) => ({ ...h, [d]: { ...h[d], open: e.target.value } }))}
                    className="rounded-md bg-zinc-950/60 px-2 py-1 text-[13px] text-zinc-100 ring-1 ring-zinc-800 focus:outline-none focus:ring-indigo-500/40 disabled:opacity-60"
                  />
                  <span className="text-zinc-600">–</span>
                  <input
                    type="time"
                    value={hours[d].close}
                    disabled={applying}
                    onChange={(e) => setHours((h) => ({ ...h, [d]: { ...h[d], close: e.target.value } }))}
                    className="rounded-md bg-zinc-950/60 px-2 py-1 text-[13px] text-zinc-100 ring-1 ring-zinc-800 focus:outline-none focus:ring-indigo-500/40 disabled:opacity-60"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {notes && (
        <p className="rounded-lg bg-zinc-900/40 px-3.5 py-2.5 text-[13px] text-zinc-400 ring-1 ring-zinc-900">
          OckOck also picked up: <span className="text-zinc-300">{notes}</span> — add it to your gym page anytime from
          the dashboard.
        </p>
      )}

      {error && <p className="text-[13px] text-red-400">{error}</p>}

      <div className="flex flex-col items-center gap-3 pt-1">
        <button
          onClick={apply}
          disabled={applying}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-500 px-6 text-[14px] font-medium text-white transition-colors hover:bg-indigo-400 disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          {applying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Setting up {gymName}…
            </>
          ) : (
            <>
              Looks good — go live 🐃
            </>
          )}
        </button>
        {!applying && (
          <button onClick={() => setPhase("intro")} className="text-[13px] text-zinc-500 hover:text-zinc-300">
            ← Let me describe it again
          </button>
        )}
      </div>
    </div>,
  )
}
