import { NextResponse } from "next/server"
import { getCourseAuthorAccess } from "@/lib/auth-helpers"
import { improveText, type ImproveMode } from "@/lib/courses/ai-authoring"

const VALID_MODES: ImproveMode[] = ["polish", "expand", "shorten", "translate-th"]

export async function POST(request: Request) {
  const { allowed } = await getCourseAuthorAccess()
  if (!allowed) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const text = (body.text as string)?.trim()
  const mode = body.mode as ImproveMode
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 })
  }
  if (!VALID_MODES.includes(mode)) {
    return NextResponse.json(
      { error: `mode must be one of ${VALID_MODES.join(", ")}` },
      { status: 400 }
    )
  }

  try {
    const result = await improveText({
      text,
      mode,
      context: body.context,
    })
    return NextResponse.json(result)
  } catch (err) {
    console.error("[courses/ai/improve-text] failed:", err)
    return NextResponse.json(
      {
        error: "AI generation failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 503 }
    )
  }
}
