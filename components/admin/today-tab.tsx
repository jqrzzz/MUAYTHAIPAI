"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, UserCheck, UserX, Banknote, List, Users } from "lucide-react"
import { getTodayInPaiTimezone } from "@/lib/timezone"

interface Booking {
  id: string
  guest_name: string | null
  guest_email: string | null
  booking_date: string
  booking_time: string | null
  status: string
  payment_status: string
  payment_method: string | null
  payment_amount_thb: number | null
  payment_amount_usd: number | null
  payment_currency: string | null
  services: { name: string; category: string } | null
}

interface ServiceOption {
  id: string
  name: string
  price_thb: number
  is_active: boolean
}

const TIME_SLOTS = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
]

interface TodayTabProps {
  initialBookings: Booking[]
  services: ServiceOption[]
  orgId: string
  todayDate: string
  onFeedback: (type: "success" | "error", message: string) => void
  onRefresh: () => void
}

export default function TodayTab({
  initialBookings,
  services,
  orgId,
  todayDate,
  onFeedback,
  onRefresh,
}: TodayTabProps) {
  const [bookings, setBookings] = useState(initialBookings)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false)
  const [isCreatingBooking, setIsCreatingBooking] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "classes">("list")
  const [bookingError, setBookingError] = useState("")
  const [newBookingForm, setNewBookingForm] = useState({
    serviceId: "",
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    bookingDate: getTodayInPaiTimezone(),
    bookingTime: "",
    paymentMethod: "cash" as "cash" | "stripe",
    isPaid: true,
  })

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setIsUpdating(bookingId)
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, org_id: orgId }),
      })
      if (response.ok) {
        setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)))
      } else {
        onFeedback("error", "Failed to update booking status")
      }
    } catch {
      onFeedback("error", "Network error — couldn't update booking")
    } finally {
      setIsUpdating(null)
    }
  }

  const markAsPaid = async (bookingId: string) => {
    setIsUpdating(bookingId)
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: "paid", org_id: orgId }),
      })
      if (response.ok) {
        setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, payment_status: "paid" } : b)))
        onFeedback("success", "Payment recorded")
      } else {
        onFeedback("error", "Failed to record payment")
      }
    } catch {
      onFeedback("error", "Network error — couldn't record payment")
    } finally {
      setIsUpdating(null)
    }
  }

  const handleCreateBooking = async () => {
    setBookingError("")
    if (!newBookingForm.serviceId) { setBookingError("Please select a service"); return }
    if (!newBookingForm.guestName.trim()) { setBookingError("Please enter customer name"); return }
    if (!newBookingForm.bookingDate) { setBookingError("Please select a date"); return }

    const selectedService = services.find((s) => s.id === newBookingForm.serviceId)
    if (!selectedService) { setBookingError("Invalid service selected"); return }

    setIsCreatingBooking(true)
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          service_id: newBookingForm.serviceId,
          guest_name: newBookingForm.guestName.trim(),
          guest_email: newBookingForm.guestEmail.trim() || null,
          guest_phone: newBookingForm.guestPhone.trim() || null,
          booking_date: newBookingForm.bookingDate,
          booking_time: newBookingForm.bookingTime || null,
          payment_method: newBookingForm.paymentMethod,
          payment_status: newBookingForm.isPaid ? "paid" : "pending",
          payment_amount_thb: selectedService.price_thb,
          payment_currency: "THB",
          status: "confirmed",
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create booking")
      }

      setNewBookingForm({
        serviceId: "", guestName: "", guestEmail: "", guestPhone: "",
        bookingDate: getTodayInPaiTimezone(), bookingTime: "",
        paymentMethod: "cash", isPaid: true,
      })
      setIsNewBookingOpen(false)
      onFeedback("success", "Booking created successfully")
      onRefresh()
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : "Failed to create booking")
    } finally {
      setIsCreatingBooking(false)
    }
  }

  return (
    <Card className="bg-neutral-900/50 border-neutral-800">
      <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
        <div>
          <CardTitle className="text-white">Today&apos;s Bookings (การจองวันนี้)</CardTitle>
          <CardDescription>
            {todayDate} • {bookings.length} bookings
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle: flat list vs grouped by class. Operators with
              class-based gyms (group sessions at fixed times) want the
              class view; operators with private-session-heavy gyms keep
              the flat list. Persists per-render. */}
          <div className="inline-flex items-center rounded-md border border-neutral-700 p-0.5 bg-neutral-900">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs ${
                viewMode === "list"
                  ? "bg-neutral-700 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Flat list — every booking shown in time order"
            >
              <List className="h-3 w-3" />
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode("classes")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs ${
                viewMode === "classes"
                  ? "bg-neutral-700 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Grouped by class — same service + time bucketed together"
            >
              <Users className="h-3 w-3" />
              Classes
            </button>
          </div>
          <Dialog open={isNewBookingOpen} onOpenChange={setIsNewBookingOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-indigo-500 hover:bg-indigo-400">
              <Plus className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden md:inline">New Booking</span>
              <span className="md:hidden">New</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-neutral-900 border-neutral-700 max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="text-white">New Booking</DialogTitle>
              <DialogDescription>Add a walk-in or phone booking</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="service" className="text-neutral-200">Service *</Label>
                <Select
                  value={newBookingForm.serviceId}
                  onValueChange={(value) => setNewBookingForm((prev) => ({ ...prev, serviceId: value }))}
                >
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {services
                      .filter((s) => s.is_active)
                      .map((service) => (
                        <SelectItem key={service.id} value={service.id} className="text-white">
                          {service.name} - ฿{service.price_thb.toLocaleString()}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-neutral-200">Customer Name *</Label>
                <Input
                  id="name"
                  value={newBookingForm.guestName}
                  onChange={(e) => setNewBookingForm((prev) => ({ ...prev, guestName: e.target.value }))}
                  placeholder="Enter name"
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-200">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={newBookingForm.guestEmail}
                  onChange={(e) => setNewBookingForm((prev) => ({ ...prev, guestEmail: e.target.value }))}
                  placeholder="customer@email.com"
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-neutral-200">Phone (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newBookingForm.guestPhone}
                  onChange={(e) => setNewBookingForm((prev) => ({ ...prev, guestPhone: e.target.value }))}
                  placeholder="+66..."
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-neutral-200">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newBookingForm.bookingDate}
                    min={getTodayInPaiTimezone()}
                    onChange={(e) => setNewBookingForm((prev) => ({ ...prev, bookingDate: e.target.value }))}
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time" className="text-neutral-200">Time</Label>
                  <Select
                    value={newBookingForm.bookingTime}
                    onValueChange={(value) => setNewBookingForm((prev) => ({ ...prev, bookingTime: value }))}
                  >
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700">
                      {TIME_SLOTS.map((slot) => (
                        <SelectItem key={slot} value={slot} className="text-white">
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-neutral-200">Payment</Label>
                  <Select
                    value={newBookingForm.paymentMethod}
                    onValueChange={(value: "cash" | "stripe") =>
                      setNewBookingForm((prev) => ({ ...prev, paymentMethod: value }))
                    }
                  >
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700">
                      <SelectItem value="cash" className="text-white">Cash</SelectItem>
                      <SelectItem value="stripe" className="text-white">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-200">Status</Label>
                  <div className="flex items-center h-10 gap-2">
                    <input
                      type="checkbox"
                      id="isPaid"
                      checked={newBookingForm.isPaid}
                      onChange={(e) => setNewBookingForm((prev) => ({ ...prev, isPaid: e.target.checked }))}
                      className="w-4 h-4 rounded border-neutral-600 bg-neutral-800"
                    />
                    <Label htmlFor="isPaid" className="text-neutral-300 text-sm">Payment collected</Label>
                  </div>
                </div>
              </div>

              {bookingError && <p className="text-red-400 text-sm">{bookingError}</p>}

              <Button
                onClick={handleCreateBooking}
                disabled={isCreatingBooking}
                className="w-full bg-indigo-500 hover:bg-indigo-400"
              >
                {isCreatingBooking ? "Creating..." : "Create Booking"}
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-8 text-neutral-400">No bookings today (ไม่มีการจองวันนี้)</div>
        ) : viewMode === "classes" ? (
          <ClassesView
            bookings={bookings}
            isUpdating={isUpdating}
            updateBookingStatus={updateBookingStatus}
            markAsPaid={markAsPaid}
          />
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-neutral-800/50 rounded-lg gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-400">{booking.booking_time || "Any time"}</span>
                    <span className="font-medium text-white uppercase">{booking.guest_name}</span>
                  </div>
                  <p className="text-sm text-neutral-400">{booking.services?.name || "Service"}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-indigo-300 font-medium">
                    {booking.payment_currency === "USD" ? "$" : "฿"}
                    {booking.payment_currency === "USD"
                      ? booking.payment_amount_usd?.toLocaleString()
                      : booking.payment_amount_thb?.toLocaleString()}
                  </span>
                  <Badge
                    variant={booking.payment_status === "paid" ? "default" : "outline"}
                    className={
                      booking.payment_status === "paid" ? "bg-green-600" : "border-amber-500 text-amber-500"
                    }
                  >
                    {booking.payment_status === "paid" ? "Paid (ชำระแล้ว)" : "Pending (รอชำระ)"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      booking.status === "completed"
                        ? "border-green-500 text-green-500"
                        : booking.status === "no_show"
                          ? "border-red-500 text-red-500"
                          : "border-neutral-500"
                    }
                  >
                    {booking.status === "completed"
                      ? "Arrived (มาถึง)"
                      : booking.status === "no_show"
                        ? "No Show (ไม่มา)"
                        : "Confirmed (ยืนยัน)"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {booking.status !== "completed" && booking.status !== "no_show" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateBookingStatus(booking.id, "completed")}
                        disabled={isUpdating === booking.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <UserCheck className="w-4 h-4 mr-1" /> Arrived (มาถึง)
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateBookingStatus(booking.id, "no_show")}
                        disabled={isUpdating === booking.id}
                        className="border-red-600 text-red-500 hover:bg-red-600 hover:text-white"
                      >
                        <UserX className="w-4 h-4 mr-1" /> No Show (ไม่มา)
                      </Button>
                    </>
                  )}
                  {booking.payment_status !== "paid" && booking.payment_method === "cash" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsPaid(booking.id)}
                      disabled={isUpdating === booking.id}
                      className="border-amber-600 text-amber-500 hover:bg-amber-600 hover:text-white"
                    >
                      <Banknote className="w-4 h-4 mr-1" /> Mark Paid (ชำระแล้ว)
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Class roster view — buckets today's bookings by service+time so the
 * operator sees "9:00 Group Muay Thai · 8 booked" with the attendee
 * roster, instead of a flat list. Useful for class-based gyms; the
 * flat list is still available for private-session-heavy gyms via the
 * view toggle.
 */
function ClassesView({
  bookings,
  isUpdating,
  updateBookingStatus,
  markAsPaid,
}: {
  bookings: Booking[]
  isUpdating: string | null
  updateBookingStatus: (id: string, status: string) => void
  markAsPaid: (id: string) => void
}) {
  // Group by `${service_name}|${time}`. Bookings with no time bucket
  // together as "Anytime".
  const groups = new Map<
    string,
    {
      time: string
      serviceName: string
      bookings: Booking[]
    }
  >()
  for (const b of bookings) {
    const time = b.booking_time?.slice(0, 5) ?? "Anytime"
    const serviceName = b.services?.name || "Service"
    const key = `${time}|${serviceName}`
    const existing = groups.get(key)
    if (existing) {
      existing.bookings.push(b)
    } else {
      groups.set(key, { time, serviceName, bookings: [b] })
    }
  }

  // Sort groups by time (Anytime last)
  const sorted = Array.from(groups.values()).sort((a, b) => {
    if (a.time === "Anytime") return 1
    if (b.time === "Anytime") return -1
    return a.time.localeCompare(b.time)
  })

  return (
    <div className="space-y-3">
      {sorted.map(({ time, serviceName, bookings: groupBookings }) => {
        const completedCount = groupBookings.filter(
          (b) => b.status === "completed",
        ).length
        const noShowCount = groupBookings.filter(
          (b) => b.status === "no_show",
        ).length
        const paidCount = groupBookings.filter(
          (b) => b.payment_status === "paid",
        ).length
        return (
          <div
            key={`${time}|${serviceName}`}
            className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-3 space-y-2"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <p className="text-base font-semibold text-white">
                  {time === "Anytime" ? "Anytime" : time}{" "}
                  <span className="text-neutral-400 font-normal">
                    · {serviceName}
                  </span>
                </p>
                <p className="text-xs text-neutral-500">
                  {groupBookings.length} booked
                  {completedCount > 0 && (
                    <span className="text-green-400">
                      {" · "}
                      {completedCount} arrived
                    </span>
                  )}
                  {noShowCount > 0 && (
                    <span className="text-red-400">
                      {" · "}
                      {noShowCount} no-show
                    </span>
                  )}
                  {paidCount > 0 && (
                    <span className="text-amber-400">
                      {" · "}
                      {paidCount} paid
                    </span>
                  )}
                </p>
              </div>
            </div>
            <ul className="space-y-1">
              {groupBookings.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between gap-2 px-2 py-1.5 rounded bg-neutral-900 border border-neutral-800/60 text-sm"
                >
                  <span className="text-white truncate">{b.guest_name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        b.status === "completed"
                          ? "border-green-500/40 text-green-400"
                          : b.status === "no_show"
                            ? "border-red-500/40 text-red-400"
                            : "border-neutral-700 text-neutral-400"
                      }`}
                    >
                      {b.status === "completed"
                        ? "Arrived"
                        : b.status === "no_show"
                          ? "No-show"
                          : "Confirmed"}
                    </Badge>
                    {b.status !== "completed" && b.status !== "no_show" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateBookingStatus(b.id, "completed")}
                        disabled={isUpdating === b.id}
                        className="h-6 px-2 text-[10px] text-green-400 hover:text-green-300 hover:bg-green-900/20"
                      >
                        <UserCheck className="w-3 h-3" />
                      </Button>
                    )}
                    {b.status !== "completed" && b.status !== "no_show" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateBookingStatus(b.id, "no_show")}
                        disabled={isUpdating === b.id}
                        className="h-6 px-2 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <UserX className="w-3 h-3" />
                      </Button>
                    )}
                    {b.payment_status !== "paid" &&
                      b.payment_method === "cash" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsPaid(b.id)}
                          disabled={isUpdating === b.id}
                          className="h-6 px-2 text-[10px] text-amber-400 hover:text-amber-300 hover:bg-amber-900/20"
                        >
                          <Banknote className="w-3 h-3" />
                        </Button>
                      )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
