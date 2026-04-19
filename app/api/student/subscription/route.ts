import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"
import { NextResponse } from "next/server"
import { PAYMENT_CONFIG, convertThbToUsd } from "@/lib/payment-config"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: subscription } = await supabase
    .from("student_subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (!subscription) {
    return NextResponse.json({ subscription: null })
  }

  return NextResponse.json({ subscription })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Sign in to subscribe" }, { status: 401 })
  }

  const { returnUrl } = await request.json()

  const { data: existing } = await supabase
    .from("student_subscriptions")
    .select("id, status, stripe_customer_id")
    .eq("user_id", user.id)
    .single()

  if (existing?.status === "active") {
    return NextResponse.json({ error: "Already subscribed" }, { status: 400 })
  }

  let customerId = existing?.stripe_customer_id

  if (!customerId) {
    const { data: profile } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", user.id)
      .single()

    const customer = await stripe.customers.create({
      email: profile?.email || user.email,
      name: profile?.full_name || undefined,
      metadata: { user_id: user.id },
    })
    customerId = customer.id
  }

  const priceThb = PAYMENT_CONFIG.subscription.studentMonthly
  const priceUsdCents = convertThbToUsd(priceThb)

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "MUAYTHAIPAI Online Training",
            description: "Access all certification course content — every level",
          },
          unit_amount: priceUsdCents,
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    success_url: `${returnUrl || process.env.NEXT_PUBLIC_BASE_URL + "/courses"}?subscribed=true`,
    cancel_url: `${returnUrl || process.env.NEXT_PUBLIC_BASE_URL + "/certificate-programs"}`,
    metadata: {
      user_id: user.id,
      type: "student_subscription",
    },
  })

  return NextResponse.json({ url: session.url })
}
