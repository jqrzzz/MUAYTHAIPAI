"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save, Clock } from "lucide-react"

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
  notification_email?: string | null
  show_prices?: boolean
  show_trainer_selection?: boolean
  [key: string]: unknown
}

interface SettingsTabProps {
  organization: { name: string; slug?: string }
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
    notification_email: orgSettings?.notification_email || "",
    show_prices: orgSettings?.show_prices ?? true,
    show_trainer_selection: orgSettings?.show_trainer_selection ?? true,
  })

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
          },
          settings: {
            booking_advance_days: settingsForm.booking_advance_days,
            booking_max_days_ahead: settingsForm.booking_max_days_ahead,
            allow_guest_bookings: settingsForm.allow_guest_bookings,
            require_payment_upfront: settingsForm.require_payment_upfront,
            notify_on_booking_email: settingsForm.notify_on_booking_email,
            notification_email: settingsForm.notification_email || null,
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
                placeholder="Pai"
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
          <CardTitle className="text-white">Notifications</CardTitle>
          <CardDescription>How you want to be notified about bookings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              Email notifications for new bookings
            </Label>
          </div>

          {settingsForm.notify_on_booking_email && (
            <div className="space-y-2 pl-7">
              <Label className="text-neutral-200">Notification email address</Label>
              <Input
                type="email"
                value={settingsForm.notification_email}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, notification_email: e.target.value }))}
                placeholder="staff@yourgym.com"
                className="bg-neutral-800 border-neutral-700 text-white max-w-md"
              />
              <p className="text-xs text-neutral-500">Leave empty to use the gym email above</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleSaveSettings}
          disabled={isSavingSettings}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSavingSettings ? "Saving..." : "Save Settings"}
        </Button>
        {settingsSuccess && <span className="text-green-400 text-sm">Settings saved successfully!</span>}
        {settingsError && <span className="text-red-400 text-sm">{settingsError}</span>}
      </div>
    </div>
  )
}
