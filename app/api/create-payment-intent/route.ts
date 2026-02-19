import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { convertThbToUsd } from "@/lib/payment-config"
import { env, hasEnv } from "@/lib/env"

export async function POST(request: NextRequest) {
  try {
    if (!hasEnv("STRIPE_SECRET_KEY")) {
      console.error("STRIPE_SECRET_KEY is not configured")
      return NextResponse.json({ error: "Payment system not configured" }, { status: 500 })
    }

    const stripe = new Stripe(env.stripe.secretKey(), {
      apiVersion: "2024-06-20",
    })

    const body = await request.json()
    const { thbAmount, metadata = {} } = body

    if (!thbAmount || thbAmount < 20) {
      console.error("Invalid THB amount:", thbAmount)
      return NextResponse.json({ error: "Amount must be at least ฿20 THB" }, { status: 400 })
    }

    const usdCents = convertThbToUsd(thbAmount)

    if (usdCents < 50) {
      console.error("USD amount too low:", usdCents, "cents")
      return NextResponse.json({ error: "Amount too low for processing" }, { status: 400 })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: usdCents,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        business: "Muay Thai Pai",
        location: "Pai, Thailand",
        thb_amount: thbAmount.toString(),
        display_currency: "THB",
        ...metadata,
      },
    })

    console.log(
      "[v0] Payment intent created:",
      paymentIntent.id,
      `${usdCents} cents ($${(usdCents / 100).toFixed(2)}) for ฿${thbAmount}`,
    )

    return NextResponse.json({
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    })
  } catch (error) {
    console.error("Stripe payment intent error:", error instanceof Error ? error.message : "Unknown error")

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          error: "Payment setup failed",
          details: error.message,
          type: error.type,
          code: error.code,
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        error: "Failed to create payment intent",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
