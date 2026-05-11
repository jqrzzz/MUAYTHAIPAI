/**
 * Generate a student-facing summary of a course module via AI.
 *
 * POST /api/admin/courses/modules/[id]/ai-summary
 *
 * Pulls the module's lessons (title + description + text_content +
 * drill_instructions snippets), sends to gpt-4o-mini, gets back a
 * 2-3 sentence student-friendly summary. Stores on course_modules.summary
 * and stamps summary_generated_at.
 *
 * Auth: platform admin (for platform-wide curriculum) OR org admin/owner
 * (for their own gym courses).
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"
import { MODEL_VOICE } from "@/lib/ai-models"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30

const BodySchema = z
  .object({
    /** Optional steer — e.g. "emphasize beginner-friendliness" */
    steer: z.string().max(200).optional(),
  })
  .default({})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const parsed = BodySchema.safeParse(await request.json().catch(() => ({})))
  const steer = parsed.success ? parsed.data.steer : undefined

  // Resolve the module + its course to do authz
  const { data: module, error: modErr } = await supabase
    .from("course_modules")
    .select(`
      id, title, description, course_id,
      courses:course_id (id, title, org_id, certificate_level)
    `)
    .eq("id", id)
    .single()

  if (modErr || !module) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const course = Array.isArray((module as any).courses)
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (module as any).courses[0]
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (module as any).courses

  // Authz: platform admin always; otherwise org owner/admin of the course's org
  const { data: userRow } = await supabase
    .from("users")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single()
  let allowed = !!userRow?.is_platform_admin
  if (!allowed && course?.org_id) {
    const { data: member } = await supabase
      .from("org_members")
      .select("role")
      .eq("org_id", course.org_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single()
    allowed = member?.role === "owner" || member?.role === "admin"
  }
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Pull the lessons for context
  const { data: lessons } = await supabase
    .from("lessons")
    .select("title, description, content_type, text_content, drill_instructions, estimated_minutes")
    .eq("module_id", id)
    .order("lesson_order")
    .limit(20)

  const lessonsBlurb = (lessons ?? [])
    .map((l, i) => {
      const lines: string[] = [`${i + 1}. [${l.content_type}] ${l.title}`]
      if (l.description) lines.push(`   ${l.description.slice(0, 200)}`)
      if (l.text_content && l.content_type === "text") {
        lines.push(`   Body excerpt: ${l.text_content.slice(0, 300)}…`)
      }
      if (l.drill_instructions && l.content_type === "drill") {
        lines.push(`   Drill: ${l.drill_instructions.slice(0, 200)}…`)
      }
      return lines.join("\n")
    })
    .join("\n\n")

  const certLevel = course?.certificate_level ?? ""
  const systemPrompt = `You write student-facing module summaries for a Muay Thai certification program${
    certLevel ? ` at the ${certLevel} level` : ""
  }. Your job: read the lessons inside this module and write a 2-3 sentence summary that a student reads at the top of the module page.

Voice: warm, confident, slightly poetic (Muay Thai has cultural depth). Speak directly to the student ("you'll learn..."). Avoid corporate language. No bullet points. No emoji. Don't list every lesson — synthesize the arc.

End with a single short imperative sentence that sets intention ("Train slowly here." / "This is the foundation everything else stands on." / "Don't skip the drill at the end.").${
    steer ? `\n\nSteer: ${steer}` : ""
  }

Length: 2-3 sentences total, then the closing imperative. Max ~80 words.`

  let summary: string
  try {
    const result = await generateText({
      model: MODEL_VOICE,
      system: systemPrompt,
      prompt: `Course: ${course?.title ?? "—"}
Module: ${module.title}
${module.description ? `Module description: ${module.description}\n` : ""}
Lessons (${lessons?.length ?? 0}):
${lessonsBlurb || "(no lessons yet — generate a forward-looking placeholder)"}`,
    })
    summary = result.text.trim()
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed" },
      { status: 502 },
    )
  }

  const { data: updated, error: updateErr } = await supabase
    .from("course_modules")
    .update({
      summary,
      summary_generated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, summary, summary_generated_at")
    .single()
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, module: updated })
}
