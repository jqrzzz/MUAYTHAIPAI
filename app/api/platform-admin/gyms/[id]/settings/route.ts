/**
 * Operator-side editor for a single gym's notification settings.
 *
 * GET   /api/platform-admin/gyms/[id]/settings  → current notification config
 * PATCH /api/platform-admin/gyms/[id]/settings  → { notification_email?, notify_on_booking_email? }
 *
 * Lets a platform operator set where a gym's booking alerts go WITHOUT having
 * to "View as gym admin" — the gym Settings screen is otherwise unreachable
 * for a platform admin (the /admin route bounces them back to the console).
 *
 * Uses a service-role client: the operator isn't an org_member of the gym, so
 * the RLS-scoped session can't read/write that gym's org_settings. This route
 * is operator-gated, so service-role is safe.
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { getPlatformAdmin } from "@/lib/auth-helpers"
import { createClient as createServiceClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function serviceDb() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await params
  const db = serviceDb()

  const [{ data: org }, { data: settings }] = await Promise.all([
    db.from("organizations").select("id, name, email").eq("id", id).maybeSingle(),
    db
      .from("org_settings")
      .select("notification_email, notification_emails, notify_on_booking_email")
      .eq("org_id", id)
      .maybeSingle(),
  ])

  if (!org) {
    return NextResponse.json({ error: "Gym not found" }, { status: 404 })
  }

  return NextResponse.json({
    gym: { id: org.id, name: org.name, email: org.email },
    notification_email: settings?.notification_email ?? "",
    notification_emails: settings?.notification_emails ?? [],
    notify_on_booking_email: settings?.notify_on_booking_email ?? true,
  })
}

const patchSchema = z.object({
  notification_email: z.string().email().or(z.literal("")).optional(),
  notify_on_booking_email: z.boolean().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, isPlatformAdmin } = await getPlatformAdmin()
  if (!user || !isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await params

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email (or leave it blank)." }, { status: 400 })
  }

  const db = serviceDb()

  // Confirm the gym exists before writing settings for it.
  const { data: org } = await db.from("organizations").select("id").eq("id", id).maybeSingle()
  if (!org) {
    return NextResponse.json({ error: "Gym not found" }, { status: 404 })
  }

  const patch: Record<string, unknown> = {}
  if (parsed.data.notification_email !== undefined) {
    patch.notification_email = parsed.data.notification_email || null
  }
  if (parsed.data.notify_on_booking_email !== undefined) {
    patch.notify_on_booking_email = parsed.data.notify_on_booking_email
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ success: true })
  }

  // Update if a settings row exists, otherwise insert one. (org_settings has
  // one row per org; every gym gets one at creation, but be defensive.)
  const { data: existing } = await db
    .from("org_settings")
    .select("org_id")
    .eq("org_id", id)
    .maybeSingle()

  const { error } = existing
    ? await db.from("org_settings").update(patch).eq("org_id", id)
    : await db.from("org_settings").insert({ org_id: id, ...patch })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
