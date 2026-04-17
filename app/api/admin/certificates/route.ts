import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { randomBytes } from "crypto"

// GET - List certificates issued by this gym
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  if (!membership) {
    return NextResponse.json({ error: "No organization access" }, { status: 403 })
  }

  const { data: certificates, error } = await supabase
    .from("certificates")
    .select(`
      *,
      users:user_id (full_name, email),
      issued_by_trainer:issued_by (display_name)
    `)
    .eq("org_id", membership.org_id)
    .order("issued_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ certificates })
}

// POST - Issue a new certificate
export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  if (!membership || !["owner", "admin", "trainer"].includes(membership.role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const body = await request.json()
  const { student_email, level, level_number } = body

  if (!student_email || !level) {
    return NextResponse.json({ error: "student_email and level are required" }, { status: 400 })
  }

  const VALID_LEVELS = ["naga", "phayra-nak", "singha", "hanuman", "garuda"]
  const normalizedLevel = level.toLowerCase()
  if (!VALID_LEVELS.includes(normalizedLevel)) {
    return NextResponse.json(
      { error: `Invalid level. Must be one of: ${VALID_LEVELS.join(", ")}` },
      { status: 400 }
    )
  }

  // Find student user
  const { data: student } = await supabase
    .from("users")
    .select("id")
    .eq("email", student_email)
    .single()

  if (!student) {
    return NextResponse.json({ error: "Student not found. They must have an account first." }, { status: 404 })
  }

  // Check for duplicate — same student, same level, same gym
  const { data: existing } = await supabase
    .from("certificates")
    .select("id")
    .eq("org_id", membership.org_id)
    .eq("user_id", student.id)
    .eq("level", normalizedLevel)
    .eq("status", "active")
    .single()

  if (existing) {
    return NextResponse.json(
      { error: "This student already has an active certificate at this level from your gym" },
      { status: 409 }
    )
  }

  // Enforce level progression — require all prior levels before issuing higher ones
  const levelIndex = VALID_LEVELS.indexOf(normalizedLevel)
  if (levelIndex > 0) {
    const requiredLevels = VALID_LEVELS.slice(0, levelIndex)
    const { data: earnedCerts } = await supabase
      .from("certificates")
      .select("level")
      .eq("user_id", student.id)
      .eq("status", "active")
      .in("level", requiredLevels)

    const earnedLevels = new Set((earnedCerts ?? []).map((c: { level: string }) => c.level))
    const missing = requiredLevels.filter((l) => !earnedLevels.has(l))
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Student must complete ${missing.map((l) => l.replace(/-/g, " ")).join(", ")} first` },
        { status: 400 }
      )
    }
  }

  // Get issuing trainer's profile (if the user is a trainer)
  const { data: trainerProfile } = await supabase
    .from("trainer_profiles")
    .select("id")
    .eq("org_id", membership.org_id)
    .eq("user_id", user.id)
    .single()

  // Generate unique certificate number
  const certNumber = `MTP-${level.toUpperCase().slice(0, 3)}-${randomBytes(4).toString("hex").toUpperCase()}`
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://muaythaipai.com"

  const { data: certificate, error } = await supabase
    .from("certificates")
    .insert({
      org_id: membership.org_id,
      user_id: student.id,
      level: normalizedLevel,
      level_number: level_number || VALID_LEVELS.indexOf(normalizedLevel) + 1,
      issued_by: trainerProfile?.id || null,
      certificate_number: certNumber,
      verification_url: `${siteUrl}/verify/${certNumber}`,
      status: "active",
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ certificate })
}

// PATCH - Revoke or reinstate a certificate
export async function PATCH(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Only owners and admins can revoke certificates" }, { status: 403 })
  }

  const body = await request.json()
  const { certificate_id, status } = body as { certificate_id?: string; status?: string }

  if (!certificate_id || !status || !["active", "revoked"].includes(status)) {
    return NextResponse.json(
      { error: "certificate_id and status (active|revoked) are required" },
      { status: 400 }
    )
  }

  const { data: updated, error } = await supabase
    .from("certificates")
    .update({ status })
    .eq("id", certificate_id)
    .eq("org_id", membership.org_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!updated) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
  }

  return NextResponse.json({ certificate: updated })
}
