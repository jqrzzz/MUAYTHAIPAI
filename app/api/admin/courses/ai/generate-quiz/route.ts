import { NextResponse } from "next/server"
import { getCourseAuthorAccess } from "@/lib/auth-helpers"
import { generateQuizForLesson } from "@/lib/courses/ai-authoring"

export async function POST(request: Request) {
  const { allowed } = await getCourseAuthorAccess()
  if (!allowed) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const lessonTitle = (body.lesson_title as string)?.trim()
  if (!lessonTitle) {
    return NextResponse.json({ error: "lesson_title is required" }, { status: 400 })
  }

  try {
    const result = await generateQuizForLesson({
      lessonTitle,
      lessonText: body.lesson_text,
      courseTitle: body.course_title,
      count: typeof body.count === "number" ? body.count : undefined,
    })
    return NextResponse.json(result)
  } catch (err) {
    console.error("[courses/ai/generate-quiz] failed:", err)
    return NextResponse.json(
      {
        error: "AI generation failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 503 }
    )
  }
}
