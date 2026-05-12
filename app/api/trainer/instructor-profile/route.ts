/**
 * Trainer's controls for their public instructor profile (/i/[handle]).
 *
 * GET  /api/trainer/instructor-profile — current state
 * PATCH                                 — opt in/out + handle
 *
 * Auth: any authenticated user who has at least one active
 * trainer_profile row. We don't gate on a single org because trainers
 * can teach at multiple gyms and the public profile aggregates across.
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const RESERVED = new Set([
  "admin", "api", "app", "auth", "book", "courses", "dashboard",
  "gyms", "i", "login", "logout", "p", "platform-admin", "settings",
  "signup", "student", "support", "trainer", "verify",
])

const PatchSchema = z.object({
  enabled: z.boolean().optional(),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(32)
    .regex(
      /^[a-z][a-z0-9-]*$/,
      "Use lowercase letters, digits, and hyphens (start with a letter)",
    )
    .nullable()
    .optional(),
})

async function requireTrainer() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null }
  // Require at least one active trainer_profile
  const { data: profile } = await supabase
    .from("trainer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()
  if (!profile) return { supabase, user: null }
  return { supabase, user }
}

export async function GET() {
  const { supabase, user } = await requireTrainer()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { data } = await supabase
    .from("users")
    .select(
      "full_name, public_instructor_enabled, public_instructor_handle",
    )
    .eq("id", user.id)
    .single()
  return NextResponse.json({ profile: data })
}

export async function PATCH(request: Request) {
  const { supabase, user } = await requireTrainer()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = PatchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = {}
  if (parsed.data.enabled !== undefined) {
    update.public_instructor_enabled = parsed.data.enabled
  }
  if (parsed.data.handle !== undefined) {
    const h = parsed.data.handle
    if (h && RESERVED.has(h)) {
      return NextResponse.json(
        { error: `Handle "${h}" is reserved — pick another` },
        { status: 400 },
      )
    }
    update.public_instructor_handle = h || null
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 })
  }

  if (update.public_instructor_enabled === true) {
    const { data: cur } = await supabase
      .from("users")
      .select("public_instructor_handle")
      .eq("id", user.id)
      .single()
    const handleToUse = update.public_instructor_handle ?? cur?.public_instructor_handle
    if (!handleToUse) {
      return NextResponse.json(
        { error: "Pick a handle before enabling the public profile" },
        { status: 400 },
      )
    }
  }

  const { data, error } = await supabase
    .from("users")
    .update(update)
    .eq("id", user.id)
    .select(
      "full_name, public_instructor_enabled, public_instructor_handle",
    )
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "That handle is already taken — try another" },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ profile: data })
}
