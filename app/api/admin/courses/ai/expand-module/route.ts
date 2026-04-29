import { NextResponse } from "next/server"
import { getCourseAuthorAccess } from "@/lib/auth-helpers"
import { suggestLessonsForModule } from "@/lib/courses/ai-authoring"

export async function POST(request: Request) {
  const { allowed } = await getCourseAuthorAccess()
  if (!allowed) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const courseTitle = (body.course_title as string)?.trim()
  const moduleTitle = (body.module_title as string)?.trim()
  if (!courseTitle || !moduleTitle) {
    return NextResponse.json(
      { error: "course_title and module_title are required" },
      { status: 400 }
    )
  }

  try {
    const result = await suggestLessonsForModule({
      courseTitle,
      moduleTitle,
      moduleDescription: body.module_description,
      count: typeof body.count === "number" ? body.count : undefined,
      certLevel: body.cert_level,
      audience: body.audience,
    })
    return NextResponse.json(result)
  } catch (err) {
    console.error("[courses/ai/expand-module] failed:", err)
    return NextResponse.json(
      {
        error: "AI generation failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 503 }
    )
  }
}
