"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Clock } from "lucide-react"

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

function formatTime(time: string | null) {
  if (!time) return "No time"
  return time.slice(0, 5)
}

function formatDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

function getStatusBadge(status: string) {
  switch (status) {
    case "confirmed":
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Confirmed</Badge>
    case "completed":
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>
    case "cancelled":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Cancelled</Badge>
    case "no_show":
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">No Show</Badge>
    default:
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">{status}</Badge>
  }
}

function getPaymentBadge(status: string, method: string | null) {
  if (status === "paid") {
    return (
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
        {method === "cash" ? "Cash Paid" : "Paid"}
      </Badge>
    )
  }
  return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Pending</Badge>
}

export default function RecentTab({ bookings }: { bookings: Booking[] }) {
  const [search, setSearch] = useState("")

  return (
    <Card className="bg-neutral-900/50 border-neutral-800">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-white">Recent Bookings</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </div>
          <Input
            placeholder="Search by name or service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-neutral-800 border-neutral-700 text-white md:max-w-[260px]"
          />
        </div>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-12 text-neutral-400">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent bookings</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings
              .filter((booking) => {
                if (!search.trim()) return true
                const q = search.toLowerCase()
                return (
                  (booking.guest_name || "").toLowerCase().includes(q) ||
                  (booking.services?.name || "").toLowerCase().includes(q)
                )
              })
              .map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg bg-neutral-800/50 border border-neutral-700 gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[80px]">
                      <p className="text-sm font-medium text-neutral-300">{formatDate(booking.booking_date)}</p>
                      <p className="text-xs text-neutral-500">{formatTime(booking.booking_time)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-white">{booking.guest_name || "Guest"}</p>
                      <p className="text-sm text-neutral-400">{booking.services?.name || "Unknown Service"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(booking.payment_amount_thb || booking.payment_amount_usd) && (
                      <span className="text-sm text-amber-400 font-medium">
                        {booking.payment_currency === "USD" || booking.payment_method === "stripe"
                          ? `$${(booking.payment_amount_usd || booking.payment_amount_thb || 0).toLocaleString()}`
                          : `฿${(booking.payment_amount_thb || 0).toLocaleString()}`}
                      </span>
                    )}
                    {getPaymentBadge(booking.payment_status, booking.payment_method)}
                    {getStatusBadge(booking.status)}
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
