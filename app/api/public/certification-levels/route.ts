import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { CERTIFICATION_LEVELS } from "@/lib/certification-levels"
import { getCertSkillsMap } from "@/lib/cert-skills"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/public/certification-levels
// Returns all certification level definitions. Public, no auth.
// Skills are DB-backed (operator-reworded) with a code fallback.
export async function GET() {
  const db = createServiceClient()
  const skillsMap = await getCertSkillsMap(db)

  const levels = CERTIFICATION_LEVELS.map((l) => {
    const skills = skillsMap[l.id] ?? l.skills
    return {
      id: l.id,
      number: l.number,
      name: l.name,
      creature: l.creature,
      icon: l.icon,
      duration: l.duration,
      priceTHB: l.priceTHB,
      skillCount: skills.length,
      skills,
      color: l.color,
      bgGradient: l.bgGradient,
    }
  })

  return NextResponse.json({ levels })
}
