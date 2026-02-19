"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { CheckCircle, Download, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getPaymentSummary } from "@/lib/payment-config"
import type { BookingDetails, PaymentResult } from "./types"

interface StepSuccessProps {
  paymentResult: PaymentResult
  serviceName: string
  servicePrice: number
  bookingDetails: BookingDetails
  onClose: () => void
}

export function StepSuccess({ paymentResult, serviceName, servicePrice, bookingDetails, onClose }: StepSuccessProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const resolvedTheme = mounted ? theme : "dark"

  const isCashPayment = paymentResult.paymentId?.startsWith("CASH-")

  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>

      <div>
        <h3 className="text-2xl font-bold text-green-800 mb-2">
          {isCashPayment ? "Booking Confirmed!" : "Payment Successful!"}
        </h3>
        <p className={`${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
          {isCashPayment
            ? "Your booking has been confirmed. Please bring cash payment to your session."
            : "Your booking has been confirmed. We'll send you a confirmation email shortly."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking Confirmation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-left">
          <div className="flex justify-between">
            <span>{isCashPayment ? "Booking ID:" : "Payment ID:"}</span>
            <span className="font-mono text-sm">{paymentResult.paymentId}</span>
          </div>
          <div className="flex justify-between">
            <span>Service:</span>
            <span>{serviceName}</span>
          </div>
          <div className="flex justify-between">
            <span>Date & Time:</span>
            <span>
              {new Date(bookingDetails.date).toLocaleDateString()} at {bookingDetails.time}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Customer:</span>
            <span>{bookingDetails.name}</span>
          </div>
          <Separator />
          {!isCashPayment && (
            <>
              <div className="flex justify-between">
                <span>Amount (THB):</span>
                <span className="font-medium">฿{servicePrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Charged (USD):</span>
                <span>{getPaymentSummary(servicePrice).usd}</span>
              </div>
              <div className="text-xs text-gray-500 text-center">
                Exchange rate: {getPaymentSummary(servicePrice).exchangeRate}
              </div>
            </>
          )}
          {isCashPayment && (
            <div className="flex justify-between font-bold">
              <span>Amount Due:</span>
              <span>฿{servicePrice.toLocaleString()}</span>
            </div>
          )}
          {isCashPayment && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Payment due upon arrival</strong> - Please bring cash to your session
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        {paymentResult.receiptUrl && (
          <Button variant="outline" asChild>
            <a href={paymentResult.receiptUrl} target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Download Receipt
            </a>
          </Button>
        )}
        <Button onClick={onClose} className="flex-1">
          Done
        </Button>
      </div>
    </div>
  )
}
