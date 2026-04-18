import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { randomBytes } from "crypto"
import { LEVEL_IDS, getLevelById, getLevelIndex } from "@/lib/certification-levels"

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

  const normalizedLevel = level.toLowerCase()
  const levelConfig = getLevelById(normalizedLevel)
  if (!levelConfig) {
    return NextResponse.json(
      { error: `Invalid level. Must be one of: ${LEVEL_IDS.join(", ")}` },
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

  // Enforce level progression — require all prior levels (checked cross-gym)
  const levelIndex = getLevelIndex(normalizedLevel)
  if (levelIndex > 0) {
    const requiredLevels = LEVEL_IDS.slice(0, levelIndex)
    const { data: earnedCerts } = await supabase
      .from("certificates")
      .select("level, issued_at")
      .eq("user_id", student.id)
      .eq("status", "active")
      .in("level", requiredLevels)

    const earnedMap = new Map(
      (earnedCerts ?? []).map((c: { level: string; issued_at: string }) => [c.level, c.issued_at])
    )
    const missing = requiredLevels.filter((l) => !earnedMap.has(l))
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Student must complete ${missing.map((l) => l.replace(/-/g, " ")).join(", ")} first` },
        { status: 400 }
      )
    }

    // Enforce minimum time since previous level
    const prevLevelId = LEVEL_IDS[levelIndex - 1]
    const prevIssuedAt = earnedMap.get(prevLevelId)
    if (prevIssuedAt && levelConfig.minDaysAfterPrevious > 0) {
      const daysSince = Math.floor(
        (Date.now() - new Date(prevIssuedAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSince < levelConfig.minDaysAfterPrevious) {
        const remaining = levelConfig.minDaysAfterPrevious - daysSince
        return NextResponse.json(
          {
            error: `Too soon — ${remaining} day${remaining === 1 ? "" : "s"} remaining before ${levelConfig.name} can be issued (minimum ${levelConfig.minDaysAfterPrevious} days after ${prevLevelId.replace(/-/g, " ")})`,
          },
          { status: 400 }
        )
      }
    }
  }

  // Check skill signoffs if they exist
  const { data: signoffs } = await supabase
    .from("skill_signoffs")
    .select("skill_index")
    .eq("student_id", student.id)
    .eq("org_id", membership.org_id)
    .eq("level", normalizedLevel)

  const signedCount = signoffs?.length ?? 0
  const requiredCount = levelConfig.skills.length
  if (signedCount < requiredCount) {
    const skip = body.skip_skills_check === true
    if (!skip) {
      return NextResponse.json(
        {
          error: `${signedCount}/${requiredCount} skills signed off. Complete all skill requirements or pass skip_skills_check: true to override.`,
          signedOff: signedCount,
          required: requiredCount,
        },
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

  // Trainer authorization: trainers can issue up to Singha (Level 3).
  // Hanuman (4) and Garuda (5) require owner or admin role.
  if (membership.role === "trainer" && levelConfig.number >= 4) {
    return NextResponse.json(
      { error: `Only gym owners and admins can issue ${levelConfig.name} (Level ${levelConfig.number}) certificates` },
      { status: 403 }
    )
  }

  // Generate unique certificate number
  const certNumber = `MTP-${level.toUpperCase().slice(0, 3)}-${randomBytes(4).toString("hex").toUpperCase()}`
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://muaythaipai.com"

  const { data: certificate, error } = await supabase
    .from("certificates")
    .insert({
      org_id: membership.org_id,
      user_id: student.id,
      level: normalizedLevel,
      level_number: level_number || levelConfig.number,
      issued_by: trainerProfile?.id || null,
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

  // Link certificate back to certification_enrollment if one exists
  if (certificate) {
    await supabase
      .from("certification_enrollments")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        certificate_id: certificate.id,
        updated_at: new Date().toISOString(),
      })
      .eq("org_id", membership.org_id)
      .eq("user_id", student.id)
      .eq("level", normalizedLevel)
      .eq("status", "active")
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
