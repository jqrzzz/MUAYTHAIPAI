/**
 * Student passport settings.
 *
 * GET  /api/student/passport — current passport state for the logged-in student
 * PATCH /api/student/passport — opt-in / opt-out, set handle, set bio
 *
 * Handle validation:
 *   - 3-32 chars
 *   - lowercase letters, digits, hyphens
 *   - must start with a letter
 *   - reserved words rejected (admin, api, etc.)
 *   - uniqueness enforced by partial unique index in migration 046
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const RESERVED_HANDLES = new Set([
  "admin", "api", "app", "auth", "book", "courses", "dashboard",
  "gyms", "login", "logout", "p", "platform-admin", "settings",
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
    .regex(/^[a-z][a-z0-9-]*$/, "Use lowercase letters, digits, and hyphens (start with a letter)")
    .nullable()
    .optional(),
  bio: z.string().trim().max(400).nullable().optional(),
})

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { data } = await supabase
    .from("users")
    .select(
      "full_name, public_passport_enabled, public_passport_handle, public_passport_bio",
    )
    .eq("id", user.id)
    .single()
  return NextResponse.json({ passport: data })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
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
    update.public_passport_enabled = parsed.data.enabled
  }
  if (parsed.data.bio !== undefined) {
    update.public_passport_bio = parsed.data.bio || null
  }
  if (parsed.data.handle !== undefined) {
    const h = parsed.data.handle
    if (h && RESERVED_HANDLES.has(h)) {
      return NextResponse.json(
        { error: `Handle "${h}" is reserved — pick another` },
        { status: 400 },
      )
    }
    update.public_passport_handle = h || null
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 })
  }

  // If they're enabling the passport, they need a handle set.
  if (update.public_passport_enabled === true) {
    const { data: cur } = await supabase
      .from("users")
      .select("public_passport_handle")
      .eq("id", user.id)
      .single()
    const handleToUse = update.public_passport_handle ?? cur?.public_passport_handle
    if (!handleToUse) {
      return NextResponse.json(
        { error: "Pick a handle before enabling the public passport" },
        { status: 400 },
      )
    }
  }

  const { data, error } = await supabase
    .from("users")
    .update(update)
    .eq("id", user.id)
    .select(
      "full_name, public_passport_enabled, public_passport_handle, public_passport_bio",
    )
    .single()

  if (error) {
    // Surface the unique-handle collision in plain English
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "That handle is already taken — try another" },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ passport: data })
}
