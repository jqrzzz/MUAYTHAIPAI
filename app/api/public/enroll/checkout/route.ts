/**
 * POST /api/public/enroll/checkout
 *
 * Online payment for a Naga–Garuda cert enrolment. Mirrors the ticket
 * checkout: find/create the student, create a PENDING booking +
 * certification_enrollments row, open a Stripe Checkout Session, and let the
 * webhook (kind=cert_enrollment) flip both to paid. The webhook is the source
 * of truth for "paid", so a slow/failed redirect never loses a payment.
 *
 * Degrades gracefully (503) when Stripe isn't configured — the gym can still
 * take the "reserve, pay at the gym" path via /api/public/enroll.
 *
 * Body: { name, email, phone?, level, orgSlug }
 */
import { NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { stripe } from "@/lib/stripe"
import { hasEnv } from "@/lib/env"
import { getLevelById, LEVEL_IDS } from "@/lib/certification-levels"
import { checkLimit, ipFromRequest } from "@/lib/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

export async function POST(request: Request) {
  if (!hasEnv("STRIPE_SECRET_KEY")) {
    return NextResponse.json(
      { error: "Online payment isn't set up yet — reserve your spot and pay at the gym." },
      { status: 503 },
    )
  }

  const ip = ipFromRequest(request)
  const gate = await checkLimit({ key: `enroll-checkout:${ip}`, max: 20, windowSeconds: 3600 }).catch(
    () => ({ ok: true as const }),
  )
  if (!gate.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again in a moment." }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const { name, email, phone, level, orgSlug } = body as {
    name?: string
    email?: string
    phone?: string
    level?: string
    orgSlug?: string
  }
  if (!name?.trim() || !email?.trim() || !level || !orgSlug) {
    return NextResponse.json(
      { error: "name, email, level, and orgSlug are required" },
      { status: 400 },
    )
  }
  if (!email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  }
  const levelConfig = getLevelById(level)
  if (!levelConfig) {
    return NextResponse.json(
      { error: `Invalid level. Must be one of: ${LEVEL_IDS.join(", ")}` },
      { status: 400 },
    )
  }

  const supabase = getServiceClient()

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("slug", orgSlug)
    .maybeSingle()
  if (!org) {
    return NextResponse.json({ error: "Gym not found" }, { status: 404 })
  }

  // Find or create the student.
  const cleanEmail = email.toLowerCase().trim()
  let userId: string
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", cleanEmail)
    .maybeSingle()
  if (existingUser) {
    userId = existingUser.id
  } else {
    const newId = crypto.randomUUID()
    const { error: createErr } = await supabase.from("users").insert({
      id: newId,
      email: cleanEmail,
      full_name: name.trim(),
      phone: phone?.trim() || null,
    })
    if (createErr) {
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
    }
    userId = newId
  }

  // Already enrolled (and active/completed) at this level?
  const { data: existingEnrollment } = await supabase
    .from("certification_enrollments")
    .select("id, status")
    .eq("org_id", org.id)
    .eq("user_id", userId)
    .eq("level", level)
    .in("status", ["active", "completed"])
    .maybeSingle()
  if (existingEnrollment) {
    return NextResponse.json({
      alreadyEnrolled: true,
      message:
        existingEnrollment.status === "completed"
          ? "You have already completed this level"
          : "You are already enrolled in this level",
    })
  }

  // Pending booking + enrolment — both flip to paid in the webhook.
  const { data: booking } = await supabase
    .from("bookings")
    .insert({
      org_id: org.id,
      user_id: userId,
      guest_name: name.trim(),
      guest_email: cleanEmail,
      guest_phone: phone?.trim() || null,
      booking_date: new Date().toISOString().split("T")[0],
      status: "confirmed",
      payment_status: "pending",
      payment_amount_thb: levelConfig.priceTHB,
      payment_method: "stripe",
      payment_currency: "THB",
    })
    .select("id")
    .single()

  const { data: enrollment, error: enrollErr } = await supabase
    .from("certification_enrollments")
    .insert({
      org_id: org.id,
      user_id: userId,
      level,
      status: "active",
      payment_status: "pending",
      payment_amount_thb: levelConfig.priceTHB,
      booking_id: booking?.id || null,
    })
    .select("id")
    .single()
  if (enrollErr || !enrollment) {
    return NextResponse.json(
      { error: enrollErr?.message || "Couldn't create enrolment" },
      { status: 500 },
    )
  }

  const origin = new URL(request.url).origin
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: cleanEmail,
      line_items: [
        {
          price_data: {
            currency: "thb",
            product_data: {
              name: `${levelConfig.name} certification — ${org.name}`,
              description: `Naga–Garuda level ${levelConfig.number}`,
            },
            // THB has 2 decimals (satang) → smallest unit is value × 100.
            unit_amount: levelConfig.priceTHB * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/enroll?gym=${orgSlug}&paid=${level}`,
      cancel_url: `${origin}/enroll?gym=${orgSlug}`,
      metadata: {
        kind: "cert_enrollment",
        enrollment_id: enrollment.id,
        booking_id: booking?.id ?? "",
        org_id: org.id,
        level,
      },
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("[enroll.checkout] stripe failed:", err)
    // Roll back the pending rows Stripe won't be collecting on.
    await supabase.from("certification_enrollments").delete().eq("id", enrollment.id)
    if (booking?.id) await supabase.from("bookings").delete().eq("id", booking.id)
    return NextResponse.json({ error: "Couldn't open checkout. Try again." }, { status: 500 })
  }
}
