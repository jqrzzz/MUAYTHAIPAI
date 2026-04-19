import { NextResponse } from "next/server"
import { CERTIFICATION_LEVELS } from "@/lib/certification-levels"

export const runtime = "nodejs"

// GET /api/public/certification-levels
// Returns all certification level definitions. Public, no auth.
export async function GET() {
  const levels = CERTIFICATION_LEVELS.map((l) => ({
    id: l.id,
    number: l.number,
    name: l.name,
    creature: l.creature,
    icon: l.icon,
    duration: l.duration,
    requiresGym: l.requiresGym,
    certFeeTHB: l.certFeeTHB,
    assessmentFeeTHB: l.assessmentFeeTHB,
    skillCount: l.skills.length,
    skills: l.skills,
    color: l.color,
    bgGradient: l.bgGradient,
  }))

  return NextResponse.json({ levels })
}
