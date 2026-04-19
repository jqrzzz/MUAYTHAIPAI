import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { getLevelById, LEVEL_IDS } from "@/lib/certification-levels"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase credentials")
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// POST /api/public/enroll
// Public endpoint — no auth required. Creates/finds user, creates enrollment + booking.
// Body: { name, email, phone?, level, orgSlug }
export async function POST(request: Request) {
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
      { status: 400 }
    )
  }

  if (!email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  }

  const levelConfig = getLevelById(level)
  if (!levelConfig) {
    return NextResponse.json(
      { error: `Invalid level. Must be one of: ${LEVEL_IDS.join(", ")}` },
      { status: 400 }
    )
  }

  const supabase = getServiceClient()

  // Resolve organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("slug", orgSlug)
    .maybeSingle()

  if (!org) {
    return NextResponse.json({ error: "Gym not found" }, { status: 404 })
  }

  // Find or create student user
  let userId: string
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle()

  if (existingUser) {
    userId = existingUser.id
  } else {
    const newId = crypto.randomUUID()
    const { error: createErr } = await supabase.from("users").insert({
      id: newId,
      email: email.toLowerCase().trim(),
      full_name: name.trim(),
      phone: phone?.trim() || null,
    })
    if (createErr) {
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
    }
    userId = newId
  }

  // Check for existing enrollment at this level + gym
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
      enrollment: existingEnrollment,
      message: existingEnrollment.status === "completed"
        ? "You have already completed this level"
        : "You are already enrolled in this level",
      alreadyEnrolled: true,
    })
  }

  // Create booking record
  const { data: booking } = await supabase
    .from("bookings")
    .insert({
      org_id: org.id,
      user_id: userId,
      guest_name: name.trim(),
      guest_email: email.toLowerCase().trim(),
      guest_phone: phone?.trim() || null,
      booking_date: new Date().toISOString().split("T")[0],
      status: "confirmed",
      payment_status: "pending",
      payment_amount_thb: levelConfig.priceTHB,
      payment_method: null,
    })
    .select("id")
    .single()

  // Create certification enrollment
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
    .select()
    .single()

  if (enrollErr) {
    return NextResponse.json({ error: enrollErr.message }, { status: 500 })
  }

  return NextResponse.json({
    enrollment,
    levelName: levelConfig.name,
    gymName: org.name,
    message: `You're enrolled in the ${levelConfig.name} certification at ${org.name}!`,
  })
}
