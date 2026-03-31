"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save } from "lucide-react"

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
  organization: { name: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orgSettings: any
  orgId: string
}

export default function SettingsTab({ organization, orgSettings, orgId }: SettingsTabProps) {
  const router = useRouter()
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [settingsSuccess, setSettingsSuccess] = useState(false)
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
          },
        }),
      })

      if (response.ok) {
        setSettingsSuccess(true)
        setTimeout(() => setSettingsSuccess(false), 3000)
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to save settings:", error)
    } finally {
      setIsSavingSettings(false)
    }
  }

  return (
    <div className="space-y-6">
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
      </div>
    </div>
  )
}
