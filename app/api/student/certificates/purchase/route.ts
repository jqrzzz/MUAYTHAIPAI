import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { stripe } from "@/lib/stripe"
import { randomBytes } from "crypto"
import { CERTIFICATION_LEVELS } from "@/lib/certification-levels"
import { convertThbToUsd } from "@/lib/payment-config"

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 })
  }

  const { level } = await request.json()
  const levelConfig = CERTIFICATION_LEVELS.find((l) => l.id === level)

  if (!levelConfig || levelConfig.requiresGym) {
    return NextResponse.json(
      { error: "Only Naga certification can be earned online" },
      { status: 400 }
    )
  }

  if (levelConfig.certFeeTHB <= 0) {
    return NextResponse.json({ error: "No fee configured" }, { status: 400 })
  }

  const { data: existingCert } = await serviceClient
    .from("certificates")
    .select("id")
    .eq("user_id", user.id)
    .eq("level", level)
    .eq("status", "active")
    .single()

  if (existingCert) {
    return NextResponse.json({ error: "You already have this certificate" }, { status: 400 })
  }

  const { data: course } = await serviceClient
    .from("courses")
    .select("id, total_lessons")
    .eq("certificate_level", level)
    .eq("status", "published")
    .single()

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 })
  }

  const { count: completedCount } = await serviceClient
    .from("lesson_progress")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .eq("status", "completed")

  if ((completedCount || 0) < course.total_lessons) {
    return NextResponse.json(
      {
        error: `Complete all ${course.total_lessons} lessons first (${completedCount || 0} done)`,
        completed: completedCount || 0,
        total: course.total_lessons,
      },
      { status: 400 }
    )
  }

  const { data: sub } = await supabase
    .from("student_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single()

  let customerId = sub?.stripe_customer_id
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

  const priceUsdCents = convertThbToUsd(levelConfig.certFeeTHB)
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://muaythaipai.com"

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${levelConfig.name} Certificate — MUAYTHAIPAI`,
            description: `Level ${levelConfig.number} Muay Thai certification`,
          },
          unit_amount: priceUsdCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${siteUrl}/certificate-programs?certified=${level}`,
    cancel_url: `${siteUrl}/certificate-programs`,
    metadata: {
      user_id: user.id,
      type: "certificate_purchase",
      level,
    },
  })

  return NextResponse.json({ url: session.url })
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("session_id")

  if (!sessionId) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId)

  if (session.payment_status !== "paid") {
    return NextResponse.json({ status: "pending" })
  }

  if (
    session.metadata?.type !== "certificate_purchase" ||
    session.metadata?.user_id !== user.id
  ) {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 })
  }

  const level = session.metadata.level
  const levelConfig = CERTIFICATION_LEVELS.find((l) => l.id === level)
  if (!levelConfig) {
    return NextResponse.json({ error: "Invalid level" }, { status: 400 })
  }

  const { data: existingCert } = await serviceClient
    .from("certificates")
    .select("id, certificate_number")
    .eq("user_id", user.id)
    .eq("level", level)
    .eq("status", "active")
    .single()

  if (existingCert) {
    return NextResponse.json({ certificate: existingCert, status: "issued" })
  }

  const certNumber = `MTP-${level.toUpperCase().slice(0, 3)}-${randomBytes(4).toString("hex").toUpperCase()}`
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://muaythaipai.com"

  const { data: certificate, error } = await serviceClient
    .from("certificates")
    .insert({
      org_id: null,
      user_id: user.id,
      level,
      level_number: levelConfig.number,
      issued_by: null,
      certificate_number: certNumber,
      verification_url: `${siteUrl}/verify/${certNumber}`,
      certificate_pdf_url: `${siteUrl}/verify/${certNumber}/print`,
      status: "active",
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ certificate, status: "issued" })
}
