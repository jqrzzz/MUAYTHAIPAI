"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save, Clock, Bell, Plus, X, Upload, Trash2, Loader2 } from "lucide-react"
import EmbedSnippetCard from "@/components/admin/embed-snippet-card"
import WaiverEditorCard from "@/components/admin/waiver-editor-card"
import BillingCard from "@/components/admin/billing-card"
import { InlineConfirm } from "@/components/ui/inline-confirm"

export interface SettingsOrgSettings {
  description?: string | null
  email?: string | null
  phone?: string | null
  whatsapp?: string | null
  address?: string | null
  city?: string | null
  province?: string | null
  instagram?: string | null
  facebook?: string | null
  website?: string | null
  booking_advance_days?: number
  booking_max_days_ahead?: number
  allow_guest_bookings?: boolean
  require_payment_upfront?: boolean
  notify_on_booking_email?: boolean
  notify_on_cancellation?: boolean
  notify_on_payment?: boolean
  notification_email?: string | null
  notification_emails?: string[]
  show_prices?: boolean
  show_trainer_selection?: boolean
  [key: string]: unknown
}

interface SettingsTabProps {
  organization: { name: string; slug?: string; logo_url?: string | null; timezone?: string | null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orgSettings: any
  orgId: string
}

export default function SettingsTab({ organization, orgSettings, orgId }: SettingsTabProps) {
  const router = useRouter()
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [settingsSuccess, setSettingsSuccess] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const
  const DAY_LABELS: Record<string, string> = {
    monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
    friday: "Fri", saturday: "Sat", sunday: "Sun",
  }

  const defaultHours = Object.fromEntries(
    DAYS.map((d) => [d, { open: "08:00", close: "18:00", closed: false }])
  )
  const savedHours = orgSettings?.operating_hours || {}
  const initialHours = Object.fromEntries(
    DAYS.map((d) => [
      d,
      savedHours[d]
        ? { open: savedHours[d].open, close: savedHours[d].close, closed: false }
        : defaultHours[d],
    ])
  )
  // Mark days not in savedHours as closed if operating_hours was explicitly set
  if (Object.keys(savedHours).length > 0) {
    for (const d of DAYS) {
      if (!savedHours[d]) {
        initialHours[d] = { ...defaultHours[d], closed: true }
      }
    }
  }

  const [operatingHours, setOperatingHours] = useState<
    Record<string, { open: string; close: string; closed: boolean }>
  >(initialHours)

  const [settingsForm, setSettingsForm] = useState({
    name: organization.name || "",
    logo_url: organization.logo_url || "",
    timezone: organization.timezone || "Asia/Bangkok",
    description: orgSettings?.description || "",
    email: orgSettings?.email || "",
    phone: orgSettings?.phone || "",
    whatsapp: orgSettings?.whatsapp || "",
    address: orgSettings?.address || "",
    city: orgSettings?.city || "",
    province: orgSettings?.province || "",
    instagram: orgSettings?.instagram || "",
    facebook: orgSettings?.facebook || "",
    website: orgSettings?.website || "",
    booking_advance_days: orgSettings?.booking_advance_days ?? 1,
    booking_max_days_ahead: orgSettings?.booking_max_days_ahead ?? 60,
    allow_guest_bookings: orgSettings?.allow_guest_bookings ?? true,
    require_payment_upfront: orgSettings?.require_payment_upfront ?? false,
    notify_on_booking_email: orgSettings?.notify_on_booking_email ?? true,
    notify_on_cancellation: orgSettings?.notify_on_cancellation ?? true,
    notify_on_payment: orgSettings?.notify_on_payment ?? true,
    notification_email: orgSettings?.notification_email || "",
    notification_emails: (orgSettings?.notification_emails as string[]) || [],
    show_prices: orgSettings?.show_prices ?? true,
    show_trainer_selection: orgSettings?.show_trainer_selection ?? true,
  })

  const [newRecipientEmail, setNewRecipientEmail] = useState("")

  // Snapshot the form + hours on mount so we can derive a dirty flag.
  // Reset after a successful save so the indicator returns to "All saved".
  const initialSnapshotRef = useRef<string>(
    JSON.stringify({ form: settingsForm, hours: operatingHours })
  )
  const currentSnapshot = JSON.stringify({ form: settingsForm, hours: operatingHours })
  const isDirty = currentSnapshot !== initialSnapshotRef.current

  // Warn before navigating away with unsaved changes
  useEffect(() => {
    if (!isDirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [isDirty])

  const addRecipient = () => {
    const email = newRecipientEmail.trim().toLowerCase()
    if (!email || !email.includes("@")) return
    if (settingsForm.notification_emails.includes(email)) return
    setSettingsForm((prev) => ({
      ...prev,
      notification_emails: [...prev.notification_emails, email],
    }))
    setNewRecipientEmail("")
  }

  const removeRecipient = (email: string) => {
    setSettingsForm((prev) => ({
      ...prev,
      notification_emails: prev.notification_emails.filter((e) => e !== email),
    }))
  }

  // Logo upload — POSTs to /api/admin/gym-logo (service-role upload to the
  // public gym-logos bucket; the endpoint updates organizations.logo_url too).
  const logoFileInputRef = useRef<HTMLInputElement>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    setLogoError(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/admin/gym-logo", { method: "POST", body: fd })
      const data = (await res.json().catch(() => ({}))) as { logo_url?: string; error?: string }
      if (!res.ok) {
        setLogoError(data.error || "Upload failed")
        return
      }
      setSettingsForm((prev) => ({ ...prev, logo_url: data.logo_url || "" }))
      router.refresh()
    } catch {
      setLogoError("Network error — try again")
    } finally {
      setLogoUploading(false)
      if (logoFileInputRef.current) logoFileInputRef.current.value = ""
    }
  }

  const handleLogoRemove = async () => {
    if (!settingsForm.logo_url) return
    // InlineConfirm handles the confirmation step inline.
    setLogoUploading(true)
    setLogoError(null)
    try {
      const res = await fetch("/api/admin/gym-logo", { method: "DELETE" })
      if (res.ok) {
        setSettingsForm((prev) => ({ ...prev, logo_url: "" }))
        router.refresh()
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setLogoError(data.error || "Remove failed")
      }
    } catch {
      setLogoError("Network error — try again")
    } finally {
      setLogoUploading(false)
    }
  }

  const handleSaveSettings = async () => {
    setIsSavingSettings(true)
    setSettingsSuccess(false)
    setSettingsError(null)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          organization: {
            name: settingsForm.name,
            description: settingsForm.description,
            email: settingsForm.email,
            phone: settingsForm.phone,
            whatsapp: settingsForm.whatsapp,
            address: settingsForm.address,
            city: settingsForm.city,
            province: settingsForm.province,
            instagram: settingsForm.instagram,
            facebook: settingsForm.facebook,
            website: settingsForm.website,
            // logo_url is normally set by /api/admin/gym-logo on upload,
            // but include it here too so the form is the source of truth.
            logo_url: settingsForm.logo_url || null,
            timezone: settingsForm.timezone || "Asia/Bangkok",
          },
          settings: {
            booking_advance_days: settingsForm.booking_advance_days,
            booking_max_days_ahead: settingsForm.booking_max_days_ahead,
            allow_guest_bookings: settingsForm.allow_guest_bookings,
            require_payment_upfront: settingsForm.require_payment_upfront,
            notify_on_booking_email: settingsForm.notify_on_booking_email,
            notify_on_cancellation: settingsForm.notify_on_cancellation,
            notify_on_payment: settingsForm.notify_on_payment,
            notification_email: settingsForm.notification_email || null,
            notification_emails: settingsForm.notification_emails,
            show_prices: settingsForm.show_prices,
            show_trainer_selection: settingsForm.show_trainer_selection,
            operating_hours: Object.fromEntries(
              DAYS.filter((d) => !operatingHours[d].closed).map((d) => [
                d,
                { open: operatingHours[d].open, close: operatingHours[d].close },
              ])
            ),
          },
        }),
      })

      if (response.ok) {
        setSettingsSuccess(true)
        // Reset the dirty-snapshot so the indicator flips back to "All saved"
        initialSnapshotRef.current = JSON.stringify({ form: settingsForm, hours: operatingHours })
        setTimeout(() => setSettingsSuccess(false), 5000)
        router.refresh()
      } else {
        setSettingsError("Failed to save settings. Please try again.")
      }
    } catch {
      setSettingsError("Failed to save settings. Please try again.")
    } finally {
      setIsSavingSettings(false)
    }
  }

  const siteUrl = typeof window !== "undefined" ? window.location.origin : ""
  const gymSlug = organization.slug

  return (
    <div className="space-y-6">
      {/* Public Links */}
      {gymSlug && (
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-emerald-400 mb-2">Your Public Links</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-neutral-400">Profile:</span>
                <a
                  href={`/gyms/${gymSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-emerald-400 transition-colors font-mono text-xs truncate"
                >
                  {siteUrl}/gyms/{gymSlug}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-neutral-400">Booking:</span>
                <a
                  href={`/book?gym=${gymSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-emerald-400 transition-colors font-mono text-xs truncate"
                >
                  {siteUrl}/book?gym={gymSlug}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gym Information */}
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">Gym Information</CardTitle>
          <CardDescription>Basic details about your gym</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo */}
          <div className="flex items-start gap-4 rounded-lg bg-neutral-900/40 p-4 ring-1 ring-neutral-800">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-800 ring-1 ring-neutral-700">
              {settingsForm.logo_url ? (
                // Use plain <img> to skip Next/Image domain config for the Supabase Storage public URL.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settingsForm.logo_url} alt="Gym logo" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-neutral-600">
                  <Upload className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Label className="text-neutral-200">Gym logo</Label>
              <p className="mt-0.5 text-xs text-neutral-500">
                Shows on your public gym page, embed widget, and student dashboards. JPEG / PNG / WebP / GIF, up to 5MB.
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <input
                  ref={logoFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleLogoUpload}
                  disabled={logoUploading}
                  className="sr-only"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => logoFileInputRef.current?.click()}
                  disabled={logoUploading}
                  className="border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700"
                >
                  {logoUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  <span className="ml-1.5">{settingsForm.logo_url ? "Replace" : "Upload"} logo</span>
                </Button>
                {settingsForm.logo_url && (
                  <InlineConfirm
                    onConfirm={handleLogoRemove}
                    disabled={logoUploading}
                    title="Remove gym logo"
                    className="inline-flex items-center rounded-md px-3 py-1.5 text-sm text-red-400 hover:bg-neutral-800 hover:text-red-300 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Remove
                  </InlineConfirm>
                )}
              </div>
              {logoError && <p className="mt-2 text-xs text-red-400">{logoError}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-neutral-200">Gym Name</Label>
              <Input
                value={settingsForm.name}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, name: e.target.value }))}
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-200">Email</Label>
              <Input
                type="email"
                value={settingsForm.email}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="gym@example.com"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-200">Phone</Label>
              <Input
                value={settingsForm.phone}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+66..."
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-200">WhatsApp</Label>
              <Input
                value={settingsForm.whatsapp}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, whatsapp: e.target.value }))}
                placeholder="+66..."
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-neutral-200">Description</Label>
            <Textarea
              value={settingsForm.description}
              onChange={(e) => setSettingsForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="A brief description of your gym..."
              className="bg-neutral-800 border-neutral-700 text-white min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-neutral-200">Address</Label>
              <Input
                value={settingsForm.address}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, address: e.target.value }))}
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-200">City</Label>
              <Input
                value={settingsForm.city}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, city: e.target.value }))}
                placeholder="e.g. Chiang Mai"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-200">Province</Label>
              <Input
                value={settingsForm.province}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, province: e.target.value }))}
                placeholder="Mae Hong Son"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-neutral-200">Timezone</Label>
              <select
                value={settingsForm.timezone}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, timezone: e.target.value }))}
                className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              >
                <option value="Asia/Bangkok">Asia/Bangkok (Thailand)</option>
                <option value="Asia/Singapore">Asia/Singapore</option>
                <option value="Asia/Kuala_Lumpur">Asia/Kuala Lumpur</option>
                <option value="Asia/Jakarta">Asia/Jakarta</option>
                <option value="Asia/Manila">Asia/Manila</option>
                <option value="Asia/Ho_Chi_Minh">Asia/Ho Chi Minh (Vietnam)</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
                <option value="Asia/Seoul">Asia/Seoul</option>
                <option value="UTC">UTC</option>
              </select>
              <p className="text-xs text-neutral-500">Used for booking times, daily digests, and analytics.</p>
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-200">Public URL</Label>
              <div className="rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm font-mono text-neutral-300 truncate">
                muaythaipai.com/gyms/{organization.slug ?? "—"}
              </div>
              <p className="text-xs text-neutral-500">
                To change your slug, email{" "}
                <a href="mailto:hello@muaythaipai.com" className="text-indigo-400 hover:text-indigo-300">
                  hello@muaythaipai.com
                </a>{" "}
                — we&apos;ll redirect your old links so nothing breaks.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">Social Links</CardTitle>
          <CardDescription>Your gym's social media profiles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-neutral-200">Instagram</Label>
              <Input
                value={settingsForm.instagram}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, instagram: e.target.value }))}
                placeholder="https://instagram.com/..."
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-200">Facebook</Label>
              <Input
                value={settingsForm.facebook}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, facebook: e.target.value }))}
                placeholder="https://facebook.com/..."
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-200">Website</Label>
              <Input
                value={settingsForm.website}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, website: e.target.value }))}
                placeholder="https://..."
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Settings */}
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">Booking Settings</CardTitle>
          <CardDescription>Configure how customers can book with you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-neutral-200">Advance booking required (days)</Label>
              <Input
                type="number"
                min="0"
                value={settingsForm.booking_advance_days}
                onChange={(e) =>
                  setSettingsForm((prev) => ({
                    ...prev,
                    booking_advance_days: Number.parseInt(e.target.value) || 0,
                  }))
                }
                className="bg-neutral-800 border-neutral-700 text-white"
              />
              <p className="text-xs text-neutral-500">0 = same day booking allowed</p>
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-200">Max days ahead to book</Label>
              <Input
                type="number"
                min="1"
                value={settingsForm.booking_max_days_ahead}
                onChange={(e) =>
                  setSettingsForm((prev) => ({
                    ...prev,
                    booking_max_days_ahead: Number.parseInt(e.target.value) || 60,
                  }))
                }
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allowGuestBookings"
                checked={settingsForm.allow_guest_bookings}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, allow_guest_bookings: e.target.checked }))}
                className="w-4 h-4 rounded border-neutral-600 bg-neutral-800"
              />
              <Label htmlFor="allowGuestBookings" className="text-neutral-200">
                Allow guest bookings (no account required)
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="requirePayment"
                checked={settingsForm.require_payment_upfront}
                onChange={(e) =>
                  setSettingsForm((prev) => ({ ...prev, require_payment_upfront: e.target.checked }))
                }
                className="w-4 h-4 rounded border-neutral-600 bg-neutral-800"
              />
              <Label htmlFor="requirePayment" className="text-neutral-200">
                Require payment upfront
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="showPrices"
                checked={settingsForm.show_prices}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, show_prices: e.target.checked }))}
                className="w-4 h-4 rounded border-neutral-600 bg-neutral-800"
              />
              <Label htmlFor="showPrices" className="text-neutral-200">
                Show prices on public site
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="showTrainers"
                checked={settingsForm.show_trainer_selection}
                onChange={(e) =>
                  setSettingsForm((prev) => ({ ...prev, show_trainer_selection: e.target.checked }))
                }
                className="w-4 h-4 rounded border-neutral-600 bg-neutral-800"
              />
              <Label htmlFor="showTrainers" className="text-neutral-200">
                Allow trainer selection when booking
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operating Hours */}
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Operating Hours
          </CardTitle>
          <CardDescription>When is your gym open for training?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {DAYS.map((day) => (
            <div
              key={day}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                operatingHours[day].closed
                  ? "border-neutral-800 bg-neutral-900/30"
                  : "border-neutral-700 bg-neutral-800/50"
              }`}
            >
              <span className={`w-10 text-sm font-medium ${operatingHours[day].closed ? "text-neutral-600" : "text-neutral-200"}`}>
                {DAY_LABELS[day]}
              </span>
              <label className="flex items-center gap-1.5 text-xs text-neutral-400">
                <input
                  type="checkbox"
                  checked={operatingHours[day].closed}
                  onChange={(e) =>
                    setOperatingHours((prev) => ({
                      ...prev,
                      [day]: { ...prev[day], closed: e.target.checked },
                    }))
                  }
                  className="w-3.5 h-3.5 rounded border-neutral-600 bg-neutral-800"
                />
                Closed
              </label>
              {!operatingHours[day].closed && (
                <div className="ml-auto flex items-center gap-2">
                  <Input
                    type="time"
                    value={operatingHours[day].open}
                    onChange={(e) =>
                      setOperatingHours((prev) => ({
                        ...prev,
                        [day]: { ...prev[day], open: e.target.value },
                      }))
                    }
                    className="bg-neutral-800 border-neutral-700 text-white w-28 h-8 text-sm"
                  />
                  <span className="text-neutral-600 text-xs">to</span>
                  <Input
                    type="time"
                    value={operatingHours[day].close}
                    onChange={(e) =>
                      setOperatingHours((prev) => ({
                        ...prev,
                        [day]: { ...prev[day], close: e.target.value },
                      }))
                    }
                    className="bg-neutral-800 border-neutral-700 text-white w-28 h-8 text-sm"
                  />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Choose what events trigger alerts and who receives them</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Event toggles */}
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Email alerts for</p>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="emailNotifications"
                checked={settingsForm.notify_on_booking_email}
                onChange={(e) =>
                  setSettingsForm((prev) => ({ ...prev, notify_on_booking_email: e.target.checked }))
                }
                className="w-4 h-4 rounded border-neutral-600 bg-neutral-800"
              />
              <Label htmlFor="emailNotifications" className="text-neutral-200">
                New bookings
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="cancelNotifications"
                checked={settingsForm.notify_on_cancellation}
                onChange={(e) =>
                  setSettingsForm((prev) => ({ ...prev, notify_on_cancellation: e.target.checked }))
                }
                className="w-4 h-4 rounded border-neutral-600 bg-neutral-800"
              />
              <Label htmlFor="cancelNotifications" className="text-neutral-200">
                Booking cancellations
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="paymentNotifications"
                checked={settingsForm.notify_on_payment}
                onChange={(e) =>
                  setSettingsForm((prev) => ({ ...prev, notify_on_payment: e.target.checked }))
                }
                className="w-4 h-4 rounded border-neutral-600 bg-neutral-800"
              />
              <Label htmlFor="paymentNotifications" className="text-neutral-200">
                Payments received
              </Label>
            </div>
          </div>

          <hr className="border-neutral-800" />

          {/* Primary notification email */}
          <div className="space-y-2">
            <Label className="text-neutral-200">Primary notification email</Label>
            <Input
              type="email"
              value={settingsForm.notification_email}
              onChange={(e) => setSettingsForm((prev) => ({ ...prev, notification_email: e.target.value }))}
              placeholder="owner@yourgym.com"
              className="bg-neutral-800 border-neutral-700 text-white max-w-md"
            />
            <p className="text-xs text-neutral-500">Leave empty to use the gym email above</p>
          </div>

          {/* Additional recipients */}
          <div className="space-y-3">
            <Label className="text-neutral-200">Additional recipients</Label>
            <p className="text-xs text-neutral-500">Add front desk staff, trainers, or managers who should also receive alerts</p>

            {settingsForm.notification_emails.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {settingsForm.notification_emails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-sm text-neutral-200"
                  >
                    {email}
                    <button
                      onClick={() => removeRecipient(email)}
                      className="text-neutral-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2 max-w-md">
              <Input
                type="email"
                value={newRecipientEmail}
                onChange={(e) => setNewRecipientEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRecipient() } }}
                placeholder="staff@yourgym.com"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addRecipient}
                className="border-neutral-700 hover:bg-neutral-800 shrink-0"
              >
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
          </div>

          <div className="rounded-lg bg-indigo-500/5 border border-indigo-500/20 p-3">
            <p className="text-xs text-indigo-200/80">
              In-app notifications always appear in the bell icon at the top of your dashboard, regardless of email settings.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Billing — subscription status + Stripe Customer Portal link */}
      <BillingCard />

      {/* Liability waiver — versioned text students sign before first class */}
      <WaiverEditorCard gymSlug={organization.slug ?? null} />

      {/* Embed widget snippet — only renders if we have a slug */}
      {organization.slug && <EmbedSnippetCard slug={organization.slug} />}

      {/* Save Button — sticky on small screens so the dirty state is always reachable */}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/60">
        <Button
          onClick={handleSaveSettings}
          disabled={isSavingSettings || !isDirty}
          className="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSavingSettings ? "Saving..." : "Save Settings"}
        </Button>
        {settingsSuccess ? (
          <span className="text-green-400 text-sm">Settings saved successfully!</span>
        ) : isDirty ? (
          <span className="inline-flex items-center gap-1.5 text-amber-400 text-sm">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Unsaved changes
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-neutral-500 text-sm">
            <span className="h-2 w-2 rounded-full bg-neutral-600" />
            All changes saved
          </span>
        )}
        {settingsError && <span className="text-red-400 text-sm">{settingsError}</span>}
      </div>
    </div>
  )
}
