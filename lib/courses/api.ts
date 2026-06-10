/**
 * Shared course CRUD for the gym (`/api/admin/courses/*`) and operator
 * (`/api/platform-admin/courses/*`) route trees.
 *
 * The two trees were ~95% duplicated. They differ in exactly two ways:
 *   - auth: gym membership (owner/admin for writes) vs platform admin
 *   - scope: a gym owns courses where `org_id = <its org>`; the operator owns
 *     the platform-wide courses where `org_id IS NULL`.
 *
 * Both collapse to a `CourseScope { supabase, orgId }` (orgId `null` = platform).
 * Each route resolves its OWN scope — auth stays explicit and visible per route,
 * the security boundary isn't hidden — then delegates the CRUD here.
 *
 * Behaviour is preserved 1:1 with the previous routes, except the per-tree
 * allowed-field lists (which had drifted in both directions) are unified to the
 * superset: gym course-create can now set published_at/estimated_hours, and
 * platform lesson create/update can now set hero_image_url/gallery — both
 * parity fixes, neither a removal.
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"

export type CourseScope = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
  /** null = the platform-wide course set (org_id IS NULL). */
  orgId: string | null
}

type Resolved = { ok: true; scope: CourseScope } | { ok: false; res: NextResponse }

function deny(status: number, error: string): { ok: false; res: NextResponse } {
  return { ok: false, res: NextResponse.json({ error }, { status }) }
}

/** Gym scope. Reads need any active membership; writes need owner/admin. */
export async function resolveGymScope(opts: { write: boolean }): Promise<Resolved> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Mirror the original getMembership(): no user → null membership, which the
  // routes treated as 401 on reads and 403 on writes (not an early 401).
  const membership = user
    ? (
        await supabase
          .from("org_members")
          .select("org_id, role")
          .eq("user_id", user.id)
          .eq("status", "active")
          .single()
      ).data
    : null

  if (!membership) {
    return opts.write ? deny(403, "Permission denied") : deny(401, "Unauthorized")
  }
  if (opts.write && !["owner", "admin"].includes(membership.role)) {
    return deny(403, "Permission denied")
  }
  return { ok: true, scope: { supabase, orgId: membership.org_id } }
}

/** Operator scope — the platform-wide courses (org_id IS NULL). */
export async function resolvePlatformScope(opts: { write: boolean }): Promise<Resolved> {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return opts.write ? deny(403, "Permission denied") : deny(401, "Unauthorized")
  }
  return { ok: true, scope: { supabase, orgId: null } }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withOrg(query: any, orgId: string | null) {
  return orgId === null ? query.is("org_id", null) : query.eq("org_id", orgId)
}

async function updateCourseCounts(scope: CourseScope, courseId: string) {
  const { supabase } = scope
  const { count: totalModules } = await supabase
    .from("course_modules")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId)
  const { count: totalLessons } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId)
  await supabase
    .from("courses")
    .update({ total_modules: totalModules ?? 0, total_lessons: totalLessons ?? 0 })
    .eq("id", courseId)
}

/** A course exists AND belongs to this scope (gym's org, or platform/null). */
async function courseInScope(scope: CourseScope, courseId: string): Promise<boolean> {
  const { data } = await withOrg(
    scope.supabase.from("courses").select("id").eq("id", courseId),
    scope.orgId,
  ).single()
  return !!data
}

/** A lesson's parent course belongs to this scope. */
async function lessonInScope(scope: CourseScope, lessonId: string): Promise<boolean> {
  const { data } = await scope.supabase
    .from("lessons")
    .select("course_id, courses!inner(org_id)")
    .eq("id", lessonId)
    .single()
  if (!data) return false
  const course = data.courses as unknown as { org_id: string | null }
  return course.org_id === scope.orgId
}

const COURSE_FIELDS = [
  "title", "slug", "description", "short_description", "difficulty", "category",
  "certificate_level", "is_free", "price_thb", "status", "cover_image_url",
  "display_order", "is_featured", "published_at", "estimated_hours",
] as const

const LESSON_FIELDS = [
  "module_id", "course_id", "title", "description", "content_type",
  "video_url", "video_duration_seconds", "text_content",
  "drill_instructions", "drill_duration_minutes",
  "lesson_order", "is_preview", "estimated_minutes",
  "hero_image_url", "gallery",
] as const

const QUIZ_FIELDS = [
  "lesson_id", "question_text", "question_type",
  "options", "correct_answer", "explanation", "question_order",
] as const

function pick(
  body: Record<string, unknown>,
  fields: readonly string[],
  base: Record<string, unknown> = {},
): Record<string, unknown> {
  const out = { ...base }
  for (const k of fields) if (k in body) out[k] = body[k]
  return out
}

// ──────────────────────────── courses ────────────────────────────

export async function coursesGet(scope: CourseScope) {
  const { data: courses, error } = await withOrg(
    scope.supabase.from("courses").select("*, course_modules(id, lessons(id))"),
    scope.orgId,
  )
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = (courses || []).map((row: Record<string, unknown>) => {
    const { course_modules: mods, ...course } = row
    const modules = (mods ?? []) as { lessons: unknown[] }[]
    return {
      ...course,
      module_count: modules.length,
      lesson_count: modules.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0),
    }
  })
  return NextResponse.json({ courses: result })
}

export async function coursesPost(scope: CourseScope, request: Request) {
  const body = await request.json()
  if (!body.title || !body.slug) {
    return NextResponse.json({ error: "title and slug are required" }, { status: 400 })
  }
  const insert = pick(body, COURSE_FIELDS, { org_id: scope.orgId })
  const { data, error } = await scope.supabase.from("courses").insert(insert).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ course: data })
}

export async function coursesPatch(scope: CourseScope, request: Request) {
  const body = await request.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })
  const filtered = pick(updates, COURSE_FIELDS)
  const { data, error } = await withOrg(
    scope.supabase.from("courses").update(filtered).eq("id", id),
    scope.orgId,
  )
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ course: data })
}

export async function coursesDelete(scope: CourseScope, request: Request) {
  const id = new URL(request.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const { error } = await withOrg(
    scope.supabase.from("courses").delete().eq("id", id),
    scope.orgId,
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// ──────────────────────────── modules ────────────────────────────

export async function modulesGet(scope: CourseScope, request: Request) {
  const courseId = new URL(request.url).searchParams.get("course_id")
  if (!courseId) return NextResponse.json({ error: "course_id is required" }, { status: 400 })
  if (!(await courseInScope(scope, courseId))) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 })
  }
  const { data: modules, error } = await scope.supabase
    .from("course_modules")
    .select("*, lessons(id, title, content_type, lesson_order, is_preview, estimated_minutes)")
    .eq("course_id", courseId)
    .order("module_order", { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ modules: modules || [] })
}

export async function modulesPost(scope: CourseScope, request: Request) {
  const body = await request.json()
  const { course_id, title } = body
  if (!course_id || !title) {
    return NextResponse.json({ error: "course_id and title are required" }, { status: 400 })
  }
  if (!(await courseInScope(scope, course_id))) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 })
  }
  const { data, error } = await scope.supabase
    .from("course_modules")
    .insert({
      course_id,
      title,
      description: body.description || null,
      module_order: body.module_order ?? 0,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await updateCourseCounts(scope, course_id)
  return NextResponse.json({ module: data })
}

export async function modulesPatch(scope: CourseScope, request: Request) {
  const body = await request.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })
  const { data: existing } = await scope.supabase
    .from("course_modules")
    .select("course_id")
    .eq("id", id)
    .single()
  if (!existing || !(await courseInScope(scope, existing.course_id))) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 })
  }
  const filtered = pick(updates, ["title", "description", "module_order"])
  const { data, error } = await scope.supabase
    .from("course_modules")
    .update(filtered)
    .eq("id", id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ module: data })
}

export async function modulesDelete(scope: CourseScope, request: Request) {
  const id = new URL(request.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const { data: existing } = await scope.supabase
    .from("course_modules")
    .select("course_id")
    .eq("id", id)
    .single()
  if (!existing || !(await courseInScope(scope, existing.course_id))) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 })
  }
  const { error } = await scope.supabase.from("course_modules").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await updateCourseCounts(scope, existing.course_id)
  return NextResponse.json({ success: true })
}

// ──────────────────────────── lessons ────────────────────────────

export async function lessonsGet(scope: CourseScope, request: Request) {
  const moduleId = new URL(request.url).searchParams.get("module_id")
  if (!moduleId) return NextResponse.json({ error: "module_id is required" }, { status: 400 })
  const { data: mod } = await scope.supabase
    .from("course_modules")
    .select("course_id")
    .eq("id", moduleId)
    .single()
  if (!mod || !(await courseInScope(scope, mod.course_id))) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 })
  }
  const { data: lessons, error } = await scope.supabase
    .from("lessons")
    .select("*")
    .eq("module_id", moduleId)
    .order("lesson_order", { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lessons: lessons || [] })
}

export async function lessonsPost(scope: CourseScope, request: Request) {
  const body = await request.json()
  const { module_id, course_id, title } = body
  if (!module_id || !course_id || !title) {
    return NextResponse.json(
      { error: "module_id, course_id, and title are required" },
      { status: 400 },
    )
  }
  if (!(await courseInScope(scope, course_id))) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 })
  }
  const insert = pick(body, LESSON_FIELDS)
  const { data, error } = await scope.supabase.from("lessons").insert(insert).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await updateCourseCounts(scope, course_id)
  return NextResponse.json({ lesson: data })
}

export async function lessonsPatch(scope: CourseScope, request: Request) {
  const body = await request.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })
  const { data: existing } = await scope.supabase
    .from("lessons")
    .select("course_id")
    .eq("id", id)
    .single()
  if (!existing || !(await courseInScope(scope, existing.course_id))) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
  }
  // module_id / course_id aren't reassignable on update.
  const filtered = pick(
    updates,
    LESSON_FIELDS.filter((f) => f !== "module_id" && f !== "course_id"),
  )
  const { data, error } = await scope.supabase
    .from("lessons")
    .update(filtered)
    .eq("id", id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lesson: data })
}

export async function lessonsDelete(scope: CourseScope, request: Request) {
  const id = new URL(request.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const { data: existing } = await scope.supabase
    .from("lessons")
    .select("course_id")
    .eq("id", id)
    .single()
  if (!existing || !(await courseInScope(scope, existing.course_id))) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
  }
  const { error } = await scope.supabase.from("lessons").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await updateCourseCounts(scope, existing.course_id)
  return NextResponse.json({ success: true })
}

// ──────────────────────── quiz questions ────────────────────────

export async function quizGet(scope: CourseScope, request: Request) {
  const lessonId = new URL(request.url).searchParams.get("lesson_id")
  if (!lessonId) return NextResponse.json({ error: "lesson_id is required" }, { status: 400 })
  if (!(await lessonInScope(scope, lessonId))) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
  }
  const { data: questions, error } = await scope.supabase
    .from("quiz_questions")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("question_order", { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ questions: questions || [] })
}

export async function quizPost(scope: CourseScope, request: Request) {
  const body = await request.json()
  const { lesson_id, question_text } = body
  if (!lesson_id || !question_text) {
    return NextResponse.json(
      { error: "lesson_id and question_text are required" },
      { status: 400 },
    )
  }
  if (!(await lessonInScope(scope, lesson_id))) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
  }
  const insert = pick(body, QUIZ_FIELDS)
  const { data, error } = await scope.supabase.from("quiz_questions").insert(insert).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ question: data })
}

export async function quizPatch(scope: CourseScope, request: Request) {
  const body = await request.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })
  const { data: existing } = await scope.supabase
    .from("quiz_questions")
    .select("lesson_id")
    .eq("id", id)
    .single()
  if (!existing || !(await lessonInScope(scope, existing.lesson_id))) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 })
  }
  const filtered = pick(updates, QUIZ_FIELDS.filter((f) => f !== "lesson_id"))
  const { data, error } = await scope.supabase
    .from("quiz_questions")
    .update(filtered)
    .eq("id", id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ question: data })
}

export async function quizDelete(scope: CourseScope, request: Request) {
  const id = new URL(request.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const { data: existing } = await scope.supabase
    .from("quiz_questions")
    .select("lesson_id")
    .eq("id", id)
    .single()
  if (!existing || !(await lessonInScope(scope, existing.lesson_id))) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 })
  }
  const { error } = await scope.supabase.from("quiz_questions").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
