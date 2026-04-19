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
import { Plus, UserCheck, UserX, Banknote } from "lucide-react"
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
  const [bookingError, setBookingError] = useState("")
  const [newBookingForm, setNewBookingForm] = useState({
    serviceId: "",
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    bookingDate: getTodayInPaiTimezone(),
    bookingTime: "",
    paymentMethod: "cash" as "cash" | "stripe",
    isPaid: false,
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
        paymentMethod: "cash", isPaid: false,
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-white">Today&apos;s Bookings (การจองวันนี้)</CardTitle>
          <CardDescription>
            {todayDate} • {bookings.length} bookings
          </CardDescription>
        </div>
        <Dialog open={isNewBookingOpen} onOpenChange={setIsNewBookingOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
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
                    <Label htmlFor="isPaid" className="text-neutral-300 text-sm">Already paid</Label>
                  </div>
                </div>
              </div>

              {bookingError && <p className="text-red-400 text-sm">{bookingError}</p>}

              <Button
                onClick={handleCreateBooking}
                disabled={isCreatingBooking}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {isCreatingBooking ? "Creating..." : "Create Booking"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-8 text-neutral-400">No bookings today (ไม่มีการจองวันนี้)</div>
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
                  <span className="text-orange-400 font-medium">
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
