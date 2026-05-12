/**
 * Gym staff review queue for student skill demonstrations.
 *
 *   GET — list pending (and optionally other status) submissions for
 *         the staff's org, with student + skill metadata joined.
 *
 * The PATCH for a single submission lives at /[id]/route.ts so it can
 * also run the approve→signoff side effect cleanly.
 */
import { NextResponse } from "next/server"
import { requireGymStaff } from "@/lib/auth-helpers"
import { CERTIFICATION_LEVELS } from "@/lib/certification-levels"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ALLOWED_STATUS = new Set(["pending", "approved", "rejected", "sent_back", "all"])

export async function GET(request: Request) {
  const auth = await requireGymStaff()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId } = auth

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get("status") ?? "pending"
  if (!ALLOWED_STATUS.has(statusFilter)) {
    return NextResponse.json({ error: "Invalid status filter" }, { status: 400 })
  }

  let query = supabase
    .from("skill_submissions")
    .select(
      "id, student_id, level, skill_index, video_url, student_notes, status, reviewer_id, reviewer_notes, decided_at, created_at, student:student_id (id, full_name, email)",
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Decorate rows with skill name from the level definition
  const submissions = (data ?? []).map((row) => {
    const lvl = CERTIFICATION_LEVELS.find((l) => l.id === row.level)
    const skillName = lvl?.skills[row.skill_index] ?? "Unknown skill"
    return { ...row, level_name: lvl?.name ?? row.level, skill_name: skillName }
  })

  return NextResponse.json({ submissions })
}
