import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CERTIFICATION_LEVELS, getLevelById } from "@/lib/certification-levels"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Fetch certificates, enrollments, and skill signoffs in parallel
  const [certsRes, enrollmentsRes, signoffsRes] = await Promise.all([
    supabase
      .from("certificates")
      .select("id, level, level_number, issued_at, certificate_number, org_id, status, organizations:org_id (name)")
      .eq("user_id", user.id)
      .eq("status", "active"),
    supabase
      .from("certification_enrollments")
      .select("id, level, status, enrolled_at, org_id, organizations:org_id (name)")
      .eq("user_id", user.id)
      .in("status", ["active"]),
    supabase
      .from("skill_signoffs")
      .select("level, skill_index, org_id")
      .eq("student_id", user.id),
  ])

  const certificates = certsRes.data || []
  const enrollments = enrollmentsRes.data || []
  const signoffs = signoffsRes.data || []

  // Build signoff counts per level
  const signoffsByLevel: Record<string, number> = {}
  for (const s of signoffs) {
    signoffsByLevel[s.level] = (signoffsByLevel[s.level] || 0) + 1
  }

  // Build earned levels set with issued dates
  const earnedMap = new Map<string, { issued_at: string; certificate_number: string }>()
  for (const c of certificates) {
    earnedMap.set(c.level, { issued_at: c.issued_at, certificate_number: c.certificate_number })
  }

  // Build enrollment map
  const enrollmentMap = new Map<string, { enrolled_at: string; org_name: string }>()
  for (const e of enrollments) {
    const org = e.organizations as unknown as { name: string } | null
    enrollmentMap.set(e.level, { enrolled_at: e.enrolled_at, org_name: org?.name || "" })
  }

  // Build progress for each level
  const levels = CERTIFICATION_LEVELS.map((level) => {
    const earned = earnedMap.get(level.id)
    const enrollment = enrollmentMap.get(level.id)
    const skillsSignedOff = signoffsByLevel[level.id] || 0
    const skillsTotal = level.skills.length

    // Calculate days until eligible (based on previous level issuance)
    let daysUntilEligible = 0
    let eligible = true
    if (level.minDaysAfterPrevious > 0) {
      const prevLevelIndex = level.number - 2
      if (prevLevelIndex >= 0) {
        const prevLevelId = CERTIFICATION_LEVELS[prevLevelIndex].id
        const prevEarned = earnedMap.get(prevLevelId)
        if (!prevEarned) {
          eligible = false
        } else {
          const daysSince = Math.floor(
            (Date.now() - new Date(prevEarned.issued_at).getTime()) / (1000 * 60 * 60 * 24)
          )
          if (daysSince < level.minDaysAfterPrevious) {
            daysUntilEligible = level.minDaysAfterPrevious - daysSince
            eligible = false
          }
        }
      }
    }

    // Check if all prior levels are earned
    const priorLevelsEarned = CERTIFICATION_LEVELS
      .filter((l) => l.number < level.number)
      .every((l) => earnedMap.has(l.id))

    return {
      id: level.id,
      number: level.number,
      name: level.name,
      icon: level.icon,
      creature: level.creature,
      duration: level.duration,
      color: level.color,
      earned: !!earned,
      earnedAt: earned?.issued_at || null,
      certificateNumber: earned?.certificate_number || null,
      enrolled: !!enrollment,
      enrolledAt: enrollment?.enrolled_at || null,
      enrolledGym: enrollment?.org_name || null,
      skillsSignedOff,
      skillsTotal,
      eligible: eligible && priorLevelsEarned,
      daysUntilEligible,
    }
  })

  return NextResponse.json({ levels })
}
