import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { CERTIFICATION_LEVELS, getPreviousLevel } from "@/lib/certification-levels"

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/courses/checkout — create a checkout session for a paid course
// When Stripe is connected, this will create a real payment intent.
// For now, it returns a mock session that the client can use to proceed.
export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Sign in to purchase" }, { status: 401 })
  }

  const { course_id } = await request.json()
  if (!course_id) {
    return NextResponse.json({ error: "course_id required" }, { status: 400 })
  }

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, slug, price_thb, is_free, status, certificate_level")
    .eq("id", course_id)
    .eq("status", "published")
    .single()

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 })
  }

  if (course.is_free || course.price_thb === 0) {
    return NextResponse.json({ error: "This course is free — enroll directly" }, { status: 400 })
  }

  // Prerequisite check for certification courses
  if (course.certificate_level) {
    const level = CERTIFICATION_LEVELS.find((l) => l.id === course.certificate_level)
    const prevLevel = getPreviousLevel(course.certificate_level)

    if (prevLevel) {
      const { data: prevCert } = await serviceClient
        .from("certificates")
        .select("id, issued_at")
        .eq("user_id", user.id)
        .eq("level", prevLevel.id)
        .eq("status", "active")
        .single()

      if (!prevCert) {
        return NextResponse.json(
          { error: `You need an active ${prevLevel.name} (Level ${prevLevel.number}) certificate before enrolling in this course.` },
          { status: 403 }
        )
      }

      if (level && level.minDaysAfterPrevious > 0) {
        const daysSince = Math.floor(
          (Date.now() - new Date(prevCert.issued_at).getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSince < level.minDaysAfterPrevious) {
          const remaining = level.minDaysAfterPrevious - daysSince
          return NextResponse.json(
            { error: `Please wait ${remaining} more day${remaining === 1 ? "" : "s"} after your ${prevLevel.name} certificate before enrolling. (${level.minDaysAfterPrevious}-day minimum)` },
            { status: 403 }
          )
        }
      }
    }
  }

  // Check if already enrolled
  const { data: existing } = await supabase
    .from("enrollments")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("course_id", course_id)
    .single()

  if (existing && existing.status !== "paused") {
    return NextResponse.json({ error: "Already enrolled" }, { status: 400 })
  }

  // === STRIPE INTEGRATION POINT ===
  // When Stripe is connected, replace this block with:
  //
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  // const session = await stripe.checkout.sessions.create({
  //   mode: 'payment',
  //   line_items: [{
  //     price_data: {
  //       currency: 'thb',
  //       product_data: { name: course.title },
  //       unit_amount: course.price_thb * 100,
  //     },
  //     quantity: 1,
  //   }],
  //   metadata: { course_id, user_id: user.id },
  //   success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/courses/${course.slug}?enrolled=true`,
  //   cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/courses/${course.slug}`,
  // })
  //
  // return NextResponse.json({ checkout_url: session.url })

  // For now: simulate a successful payment and enroll directly
  const { data: enrollment, error } = await supabase
    .from("enrollments")
    .upsert(
      {
        user_id: user.id,
        course_id: course_id,
        total_lessons: 0,
        status: "active",
        payment_method: "pending_stripe",
        payment_amount_thb: course.price_thb,
      },
      { onConflict: "user_id,course_id" }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update total_lessons from course
  const { count } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("course_id", course_id)

  if (count) {
    await supabase
      .from("enrollments")
      .update({ total_lessons: count })
      .eq("id", enrollment.id)
  }

  return NextResponse.json({
    enrollment: { ...enrollment, total_lessons: count || 0 },
    payment_status: "simulated",
    message: "Enrolled successfully. Stripe payment will be required when connected.",
  })
}
