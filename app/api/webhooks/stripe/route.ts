import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { EmailService } from "@/lib/email-service"
import { env, hasEnv } from "@/lib/env"
import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "crypto"
import { CERTIFICATION_LEVELS } from "@/lib/certification-levels"
import { PAYMENT_CONFIG } from "@/lib/payment-config"

const stripe = new Stripe(env.stripe.secretKey(), {
  apiVersion: "2024-06-20",
})

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function saveBookingToDatabase(data: {
  serviceName: string
  guestName: string
  guestEmail: string
  bookingDate: string
  bookingTime?: string
  paymentAmountUsd: number
  stripePaymentIntentId: string
  userId?: string
  orgId?: string
}) {
  try {
    // Resolve org_id: use metadata if provided, otherwise look up the first org with this service
    let orgId = data.orgId

    if (!orgId) {
      // Fallback: find any org that has a service matching this name
      const { data: serviceMatch } = await supabase
        .from("services")
        .select("org_id")
        .ilike("name", `%${data.serviceName}%`)
        .limit(1)
        .single()
      orgId = serviceMatch?.org_id
    }

    if (!orgId) {
      console.error("No org_id found for booking:", data.serviceName)
      return null
    }

    // Find service by name within the org
    const { data: service } = await supabase
      .from("services")
      .select("id")
      .eq("org_id", orgId)
      .ilike("name", `%${data.serviceName}%`)
      .single()

    let finalUserId = data.userId || null
    if (!finalUserId && data.guestEmail) {
      const { data: existingUser } = await supabase.from("users").select("id").eq("email", data.guestEmail).single()

      if (existingUser) {
        finalUserId = existingUser.id
      }
    }

    const commissionRate = PAYMENT_CONFIG.platform.commissionRate
    const commissionAmount = Math.round(data.paymentAmountUsd * commissionRate * 100) / 100

    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        org_id: orgId,
        service_id: service?.id || null,
        user_id: finalUserId,
        guest_name: data.guestName,
        guest_email: data.guestEmail,
        booking_date: data.bookingDate,
        booking_time: data.bookingTime || null,
        status: "confirmed",
        payment_status: "paid",
        payment_method: "stripe",
        payment_currency: "USD",
        payment_amount_usd: data.paymentAmountUsd,
        payment_amount_thb: null,
        commission_rate: commissionRate,
        commission_amount_usd: commissionAmount,
        stripe_payment_intent_id: data.stripePaymentIntentId,
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to save booking to database:", error)
      return null
    }

    console.log(
      "Booking saved to database:",
      booking.id,
      `$${data.paymentAmountUsd} USD (commission: $${commissionAmount})`,
      finalUserId ? `(linked to user ${finalUserId})` : "(guest)",
    )
    return booking
  } catch (err) {
    console.error("Error saving booking:", err)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = headers()
    const signature = headersList.get("stripe-signature")

    if (!signature) {
      console.error("Missing Stripe signature")
      return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 })
    }

    if (!hasEnv("STRIPE_WEBHOOK_SECRET")) {
      console.error("Missing STRIPE_WEBHOOK_SECRET environment variable")
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, env.stripe.webhookSecret())
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log("Payment succeeded:", paymentIntent.id, `$${(paymentIntent.amount / 100).toFixed(2)} USD`)

        const metadata = paymentIntent.metadata
        const service = metadata.service_type || metadata.service_name

        if (metadata.customer_email && metadata.customer_name && service) {
          const bookingData = {
            customerName: metadata.customer_name,
            customerEmail: metadata.customer_email,
            serviceType: service,
            bookingDate: metadata.booking_date || "TBD",
            bookingTime: metadata.booking_time,
            amount: paymentIntent.amount / 100,
            paymentId: paymentIntent.id,
          }

          // Send emails
          const emailService = EmailService.getInstance()
          const customerEmailSent = await emailService.sendBookingConfirmation(bookingData)
          const staffEmailSent = await emailService.sendStaffNotification(bookingData)
          console.log(`Emails sent - Customer: ${customerEmailSent}, Staff: ${staffEmailSent}`)

          await saveBookingToDatabase({
            serviceName: service,
            guestName: metadata.customer_name,
            guestEmail: metadata.customer_email,
            bookingDate: metadata.booking_date || new Date().toISOString().split("T")[0],
            bookingTime: metadata.booking_time,
            paymentAmountUsd: paymentIntent.amount / 100,
            stripePaymentIntentId: paymentIntent.id,
            userId: metadata.user_id || undefined,
            orgId: metadata.org_id || undefined,
          })
        } else {
          console.warn("Missing required booking details in metadata, skipping emails")
        }

        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.error("Payment failed:", paymentIntent.id, paymentIntent.last_payment_error?.message || "Unknown")
        break
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        console.log("Checkout session completed:", session.id)
        await handleCheckoutCompleted(session)
        break
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session
        console.log("Async payment succeeded:", session.id)
        break
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session
        console.error("Async payment failed:", session.id)
        break
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session
        console.log("Checkout session expired:", session.id)
        break
      }

      default:
        break
    }

    return NextResponse.json({
      received: true,
      eventType: event.type,
      eventId: event.id,
    })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json(
      {
        error: "Webhook handler failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Health check endpoint
export async function GET() {
  const healthStatus = {
    status: "Webhook endpoint is active and ready",
    endpoint: "/api/webhooks/stripe",
    methods: ["POST", "GET"],
    environment: {
      hasStripeSecret: hasEnv("STRIPE_SECRET_KEY"),
      hasWebhookSecret: hasEnv("STRIPE_WEBHOOK_SECRET"),
    },
  }

  return NextResponse.json(healthStatus)
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const metadata = session.metadata || {}

    if (metadata.type === "certificate_purchase" && metadata.user_id && metadata.level) {
      await issueCertificateFromPayment(metadata.user_id, metadata.level)
      return
    }

    const customerEmail = session.customer_details?.email || metadata.customer_email
    const service = metadata.service_type || metadata.service_name

    if (customerEmail && metadata.customer_name && service) {
      const bookingData = {
        customerName: metadata.customer_name,
        customerEmail: customerEmail,
        serviceType: service,
        bookingDate: metadata.booking_date || "TBD",
        bookingTime: metadata.booking_time,
        amount: session.amount_total ? session.amount_total / 100 : 0,
        paymentId: (session.payment_intent as string) || session.id,
      }

      const emailService = EmailService.getInstance()
      const customerEmailSent = await emailService.sendBookingConfirmation(bookingData)
      const staffEmailSent = await emailService.sendStaffNotification(bookingData)
      console.log(`Emails sent - Customer: ${customerEmailSent}, Staff: ${staffEmailSent}`)

      await saveBookingToDatabase({
        serviceName: service,
        guestName: metadata.customer_name,
        guestEmail: customerEmail,
        bookingDate: metadata.booking_date || new Date().toISOString().split("T")[0],
        bookingTime: metadata.booking_time,
        paymentAmountUsd: session.amount_total ? session.amount_total / 100 : 0,
        stripePaymentIntentId: (session.payment_intent as string) || session.id,
        userId: metadata.user_id || undefined,
        orgId: metadata.org_id || undefined,
      })
    } else {
      console.warn("Missing booking details in session metadata")
    }
  } catch (error) {
    console.error("Error handling checkout completion:", error)
  }
}

async function issueCertificateFromPayment(userId: string, level: string) {
  const levelConfig = CERTIFICATION_LEVELS.find((l) => l.id === level)
  if (!levelConfig) return

  const { data: existing } = await supabase
    .from("certificates")
    .select("id")
    .eq("user_id", userId)
    .eq("level", level)
    .eq("status", "active")
    .single()

  if (existing) {
    console.log(`Certificate already exists for user ${userId} at level ${level}`)
    return
  }

  const certNumber = `MTP-${level.toUpperCase().slice(0, 3)}-${randomBytes(4).toString("hex").toUpperCase()}`
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://muaythaipai.com"

  const { error } = await supabase
    .from("certificates")
    .insert({
      org_id: null,
      user_id: userId,
      level,
      level_number: levelConfig.number,
      issued_by: null,
      certificate_number: certNumber,
      verification_url: `${siteUrl}/verify/${certNumber}`,
      certificate_pdf_url: `${siteUrl}/verify/${certNumber}/print`,
      status: "active",
    })

  if (error) {
    console.error("Failed to issue certificate:", error)
  } else {
    console.log(`Certificate ${certNumber} issued for user ${userId} at level ${level}`)
  }
}
