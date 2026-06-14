/**
 * POST /api/courses/checkout — Stripe Checkout for a paid course.
 *
 * Mirrors the cert/ticket pattern: create a pending enrollment (status
 * "paused" — the enrollments status enum has no "pending"), open a Stripe
 * Checkout Session, and let the webhook (kind=course_enrollment) flip it to
 * active. The webhook is the source of truth for "paid", so a slow/failed
 * redirect never loses a payment.
 *
 * Replaces the old simulated flow that enrolled without charging. With Stripe
 * unconfigured this now returns 503 instead of granting access — free courses
 * are unaffected (they enroll via /api/courses/enroll).
 *
 * Body: { course_id }  →  { checkout_url }
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { stripe } from "@/lib/stripe"
import { hasEnv } from "@/lib/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getServiceClient() {
  return createServiceClient()
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Sign in to purchase" }, { status: 401 })
  }

  const { course_id } = await request.json().catch(() => ({}))
  if (!course_id) {
    return NextResponse.json({ error: "course_id required" }, { status: 400 })
  }

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, slug, price_thb, is_free, status, total_lessons")
    .eq("id", course_id)
    .eq("status", "published")
    .single()
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 })
  }
  if (course.is_free || course.price_thb === 0) {
    return NextResponse.json({ error: "This course is free — enroll directly" }, { status: 400 })
  }

  if (!hasEnv("STRIPE_SECRET_KEY")) {
    return NextResponse.json(
      { error: "Online payment isn't set up yet — please check back soon." },
      { status: 503 },
    )
  }

  // Existing enrollment: active/completed means they already have it; a
  // paused row with no completed payment is an abandoned checkout we reuse.
  const { data: existing } = await supabase
    .from("enrollments")
    .select("id, status, payment_method")
    .eq("user_id", user.id)
    .eq("course_id", course_id)
    .maybeSingle()
  if (existing && existing.status !== "paused") {
    return NextResponse.json({ error: "Already enrolled" }, { status: 400 })
  }

  // RLS gives students INSERT but not UPDATE/DELETE on enrollments, and the
  // webhook + rollback both need writes — so row lifecycle goes through the
  // service client (user identity comes from the authed session above).
  const svc = getServiceClient()
  let enrollmentId = existing?.id ?? null
  let createdFresh = false
  if (!enrollmentId) {
    const { data: pending, error: insertErr } = await svc
      .from("enrollments")
      .insert({
        user_id: user.id,
        course_id,
        status: "paused",
        payment_method: "pending_stripe",
        payment_amount_thb: course.price_thb,
        total_lessons: course.total_lessons ?? 0,
      })
      .select("id")
      .single()
    if (insertErr || !pending) {
      return NextResponse.json(
        { error: insertErr?.message || "Couldn't start enrollment" },
        { status: 500 },
      )
    }
    enrollmentId = pending.id
    createdFresh = true
  }

  const origin = new URL(request.url).origin
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: "thb",
            product_data: { name: course.title },
            // THB has 2 decimals (satang) → smallest unit is value × 100.
            unit_amount: (course.price_thb ?? 0) * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/courses/${course.slug}?purchased=1`,
      cancel_url: `${origin}/courses/${course.slug}`,
      metadata: {
        kind: "course_enrollment",
        enrollment_id: enrollmentId,
        course_id,
        user_id: user.id,
      },
    })
    return NextResponse.json({ checkout_url: session.url })
  } catch (err) {
    console.error("[courses.checkout] stripe failed:", err)
    // Only roll back a row we just created — a pre-existing paused row may
    // predate this attempt and shouldn't vanish because Stripe hiccuped.
    if (createdFresh && enrollmentId) {
      await svc.from("enrollments").delete().eq("id", enrollmentId)
    }
    return NextResponse.json({ error: "Couldn't open checkout. Try again." }, { status: 500 })
  }
}
