"use client"

import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { shouldShowTimeSlots } from "@/lib/booking-config"
import type { BookingDetails } from "./types"

interface StepDateTimeProps {
  serviceName: string
  bookingDetails: BookingDetails
  onBookingDetailsChange: (details: BookingDetails) => void
  availableSlots: string[]
  onSubmit: () => void
}

export function StepDateTime({
  serviceName,
  bookingDetails,
  onBookingDetailsChange,
  availableSlots,
  onSubmit,
}: StepDateTimeProps) {
  const needsTime = shouldShowTimeSlots(serviceName)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Select Date & Time
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="date">{!needsTime ? "Membership Start Date" : "Preferred Date"}</Label>
          <Input
            id="date"
            type="date"
            value={bookingDetails.date}
            onChange={(e) => onBookingDetailsChange({ ...bookingDetails, date: e.target.value })}
            min={new Date().toISOString().split("T")[0]}
          />
        </div>

        {bookingDetails.date && needsTime && (
          <div>
            <Label>Available Time Slots</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {availableSlots.map((slot) => (
                <Button
                  key={slot}
                  variant={bookingDetails.time === slot ? "default" : "outline"}
                  onClick={() => onBookingDetailsChange({ ...bookingDetails, time: slot })}
                  className="text-sm"
                >
                  {slot}
                </Button>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={onSubmit}
          disabled={!bookingDetails.date || (needsTime && !bookingDetails.time)}
          className="w-full"
        >
          Continue to Payment
        </Button>
      </CardContent>
    </Card>
  )
}
