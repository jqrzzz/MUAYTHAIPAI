"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { BookingDetails } from "./types"

interface PaymentSummaryProps {
  serviceName: string
  servicePrice: number
  serviceDuration: string
  bookingDetails: BookingDetails
}

export function PaymentSummary({ serviceName, servicePrice, serviceDuration, bookingDetails }: PaymentSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <span>Service:</span>
          <span className="font-medium">{serviceName}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span className="font-medium">
            {new Date(bookingDetails.date).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
        {!serviceName.toLowerCase().includes("membership") && (
          <div className="flex justify-between">
            <span>Time:</span>
            <span className="font-medium">{bookingDetails.time}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Duration:</span>
          <span className="font-medium">{serviceDuration}</span>
        </div>
        <Separator />
        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span>฿{servicePrice.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}
