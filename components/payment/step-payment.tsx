"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { CreditCard, Banknote, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, PaymentRequestButtonElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { LegalCompliance } from "@/components/legal-compliance"
import { getPaymentSummary } from "@/lib/payment-config"
import type { BookingDetails, ServiceDetails, PaymentResult, PaymentMethod } from "./types"
import { useTheme } from "next-themes"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

// Card Payment Form Component
function CardPaymentForm({
  bookingDetails,
  serviceDetails,
  onPaymentSuccess,
  onPaymentError,
  disabled,
}: {
  bookingDetails: BookingDetails
  serviceDetails: ServiceDetails
  onPaymentSuccess: (result: PaymentResult) => void
  onPaymentError: (error: string) => void
  disabled?: boolean
}) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const resolvedTheme = mounted ? theme : "dark"

  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setPaymentError(null)

    if (!stripe || !elements) {
      const error = "Stripe has not loaded yet. Please refresh the page and try again."
      setPaymentError(error)
      onPaymentError(error)
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      const error = "Card element not found. Please refresh the page and try again."
      setPaymentError(error)
      onPaymentError(error)
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thbAmount: serviceDetails.price,
          metadata: {
            customer_name: bookingDetails.name,
            customer_email: bookingDetails.email,
            service_type: serviceDetails.name,
            service_id: serviceDetails.id,
            booking_date: bookingDetails.date,
            booking_time: bookingDetails.time,
            skill_level: bookingDetails.skillLevel,
            referral_source: bookingDetails.referralSource,
          },
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.details || responseData.error || "Failed to create payment intent")
      }

      const { clientSecret } = responseData

      if (!clientSecret) {
        throw new Error("No client secret received from payment intent")
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: bookingDetails.name,
            email: bookingDetails.email,
          },
        },
      })

      if (error) {
        console.error("Payment confirmation error:", error)
        let errorMessage = error.message || "Payment failed"

        if (error.code === "card_declined") {
          errorMessage = "Your card was declined. Please try a different card or contact your bank."
        } else if (error.code === "expired_card") {
          errorMessage = "Your card has expired. Please use a different card."
        } else if (error.code === "incorrect_cvc") {
          errorMessage = "The CVC code is incorrect. Please check and try again."
        } else if (error.code === "processing_error") {
          errorMessage = "There was an error processing your payment. Please try again."
        }

        setPaymentError(errorMessage)
        onPaymentError(errorMessage)
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        onPaymentSuccess({
          success: true,
          paymentId: paymentIntent.id,
          receiptUrl: paymentIntent.receipt_url || undefined,
        })
      } else {
        console.error("Unexpected payment status:", paymentIntent?.status)
        const error = `Payment status: ${paymentIntent?.status || "unknown"}`
        setPaymentError(error)
        onPaymentError(error)
      }
    } catch (error) {
      console.error("Payment processing error:", error)
      const errorMessage = error instanceof Error ? error.message : "Payment failed"
      setPaymentError(errorMessage)
      onPaymentError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: resolvedTheme === "dark" ? "#ffffff" : "#424770",
        backgroundColor: resolvedTheme === "dark" ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.5)",
        "::placeholder": {
          color: resolvedTheme === "dark" ? "#aab7c4" : "#aab7c4",
        },
      },
    },
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {paymentError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{paymentError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <Label htmlFor="card-element">Card Information</Label>
        <div
          className={`p-4 border rounded-lg ${
            resolvedTheme === "dark" ? "bg-black/20 border-white/20" : "bg-white/50 border-gray-300"
          }`}
        >
          <CardElement id="card-element" options={cardElementOptions} />
        </div>
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing || disabled}
        className="w-full h-14 md:h-16 bg-orange-600 hover:bg-orange-700 text-sm md:text-base font-medium"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span className="truncate">Processing Payment...</span>
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4 md:h-5 md:w-5" />
            <span className="truncate">Pay ฿{serviceDetails.price.toLocaleString()}</span>
          </>
        )}
      </Button>
    </form>
  )
}

// Apple Pay Button Component
function ApplePayButton({
  bookingDetails,
  serviceDetails,
  onPaymentSuccess,
  onPaymentError,
  disabled,
}: {
  bookingDetails: BookingDetails
  serviceDetails: ServiceDetails
  onPaymentSuccess: (result: PaymentResult) => void
  onPaymentError: (error: string) => void
  disabled?: boolean
}) {
  const stripe = useStripe()
  const [paymentRequest, setPaymentRequest] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!stripe) return

    const { usdCents } = getPaymentSummary(serviceDetails.price)

    const pr = stripe.paymentRequest({
      country: "US",
      currency: "usd",
      total: {
        label: serviceDetails.name,
        amount: usdCents,
      },
      requestPayerName: true,
      requestPayerEmail: true,
    })

    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr)
      }
    })

    pr.on("paymentmethod", async (ev) => {
      setIsProcessing(true)

      try {
        const response = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            thbAmount: serviceDetails.price,
            metadata: {
              customer_name: bookingDetails.name,
              customer_email: bookingDetails.email,
              service_type: serviceDetails.name,
              service_id: serviceDetails.id,
              booking_date: bookingDetails.date,
              booking_time: bookingDetails.time,
              skill_level: bookingDetails.skillLevel,
              referral_source: bookingDetails.referralSource,
            },
          }),
        })

        const { clientSecret } = await response.json()

        const { error, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false },
        )

        if (error) {
          ev.complete("fail")
          onPaymentError(error.message || "Payment failed")
        } else {
          ev.complete("success")
          if (paymentIntent.status === "succeeded") {
            onPaymentSuccess({
              success: true,
              paymentId: paymentIntent.id,
              receiptUrl: paymentIntent.receipt_url || undefined,
            })
          }
        }
      } catch (error) {
        ev.complete("fail")
        onPaymentError(error instanceof Error ? error.message : "Payment failed")
      } finally {
        setIsProcessing(false)
      }
    })
  }, [stripe, serviceDetails, bookingDetails, onPaymentSuccess, onPaymentError])

  if (!paymentRequest) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Apple Pay is not available on this device. Please use the card payment option.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <PaymentRequestButtonElement options={{ paymentRequest }} className="PaymentRequestButton" />
      {isProcessing && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing payment...
        </div>
      )}
    </div>
  )
}

// Payment Method Selector
interface PaymentMethodSelectorProps {
  onSelect: (method: PaymentMethod) => void
}

export function PaymentMethodSelector({ onSelect }: PaymentMethodSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base md:text-lg">Choose Payment Method</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 md:space-y-3">
        <Button
          onClick={() => onSelect("cash")}
          variant="outline"
          className="w-full h-12 md:h-14 text-sm md:text-base font-medium hover:bg-green-600 hover:text-white transition-colors"
        >
          <Banknote className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6" />
          <span className="truncate">Pay at Gym</span>
        </Button>

        <Button
          onClick={() => onSelect("apple-pay")}
          variant="outline"
          className="w-full h-12 md:h-14 text-sm md:text-base font-medium hover:bg-black hover:text-white transition-colors"
        >
          <svg className="mr-2 md:mr-3 h-6 w-6 md:h-8 md:w-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          <span className="truncate">Pay with Apple Pay</span>
        </Button>

        <Button
          onClick={() => onSelect("card")}
          variant="outline"
          className="w-full h-12 md:h-14 text-sm md:text-base font-medium hover:bg-orange-600 hover:text-white transition-colors"
        >
          <CreditCard className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6" />
          <span className="truncate">Pay with Card</span>
        </Button>
      </CardContent>
    </Card>
  )
}

// Cash Payment Form
interface CashPaymentFormProps {
  servicePrice: number
  isLegallyCompliant: boolean
  onComplianceChange: (compliant: boolean) => void
  onSubmit: () => void
}

export function CashPaymentForm({
  servicePrice,
  isLegallyCompliant,
  onComplianceChange,
  onSubmit,
}: CashPaymentFormProps) {
  return (
    <>
      <LegalCompliance onComplianceChange={onComplianceChange} className="mb-6" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Pay at Gym
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your booking will be confirmed. Please bring <strong>฿{servicePrice.toLocaleString()}</strong> cash to
              your session.
            </AlertDescription>
          </Alert>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-orange-800 mb-2">Important:</h4>
            <ul className="text-orange-700 text-sm space-y-1">
              <li>Payment is due upon arrival at the gym</li>
              <li>Please arrive 15 minutes early</li>
              <li>Bring exact change if possible</li>
              <li>Contact us if you need to cancel or reschedule</li>
            </ul>
          </div>

          <Button
            onClick={onSubmit}
            disabled={!isLegallyCompliant}
            className="w-full h-14 md:h-16 bg-green-600 hover:bg-green-700 text-sm md:text-base font-medium px-4"
          >
            <span className="truncate">Confirm Booking - Pay at Gym</span>
          </Button>
        </CardContent>
      </Card>
    </>
  )
}

// Card/Apple Pay Payment Form Wrapper
interface OnlinePaymentFormProps {
  selectedPaymentMethod: "card" | "apple-pay"
  bookingDetails: BookingDetails
  serviceDetails: ServiceDetails
  isLegallyCompliant: boolean
  onComplianceChange: (compliant: boolean) => void
  onPaymentSuccess: (result: PaymentResult) => void
  onPaymentError: (error: string) => void
}

export function OnlinePaymentForm({
  selectedPaymentMethod,
  bookingDetails,
  serviceDetails,
  isLegallyCompliant,
  onComplianceChange,
  onPaymentSuccess,
  onPaymentError,
}: OnlinePaymentFormProps) {
  return (
    <>
      <LegalCompliance onComplianceChange={onComplianceChange} className="mb-6" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Elements stripe={stripePromise}>
            {selectedPaymentMethod === "apple-pay" ? (
              <ApplePayButton
                bookingDetails={bookingDetails}
                serviceDetails={serviceDetails}
                onPaymentSuccess={onPaymentSuccess}
                onPaymentError={onPaymentError}
                disabled={!isLegallyCompliant}
              />
            ) : (
              <CardPaymentForm
                bookingDetails={bookingDetails}
                serviceDetails={serviceDetails}
                onPaymentSuccess={onPaymentSuccess}
                onPaymentError={onPaymentError}
                disabled={!isLegallyCompliant}
              />
            )}
          </Elements>
        </CardContent>
      </Card>
    </>
  )
}
