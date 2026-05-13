/**
 * POST /api/admin/announcements
 *
 * Direct admin entry point for broadcasting to students — same effect as
 * asking OckOck "let everyone know morning class is cancelled." Reuses
 * the chat send-announcement handler so the email body, recipient
 * selection, and mtp_communication_log writes all stay consistent.
 *
 * GET /api/admin/announcements/preview is exposed as a sub-route below
 * to surface a recipient count before the owner commits to send.
 *
 * Rate-limited per gym (3 per hour) so a fat-fingered click can't blast
 * the inbox repeatedly.
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendAnnouncementHandler } from "@/lib/chat/actions/handlers/send-announcement"
import { checkLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  // 3 broadcasts per hour per gym. Tight on purpose — a real comms
  // workflow should land in a proper campaigns flow with throttling
  // and unsubscribe; this is for the occasional cancellation or notice.
  const gate = await checkLimit({
    key: `broadcast:${membership.org_id}`,
    max: 3,
    windowSeconds: 3600,
  })
  if (!gate.ok) {
    return NextResponse.json(
      { error: "Too many broadcasts. Try again in an hour." },
      { status: 429, headers: gate.headers },
    )
  }

  const body = await request.json().catch(() => ({}))
  const subject = typeof body?.subject === "string" ? body.subject : ""
  const message = typeof body?.body === "string" ? body.body : ""

  const result = await sendAnnouncementHandler.execute(
    supabase,
    { subject, body: message, target: "all_students" },
    { orgId: membership.org_id, userId: user.id },
  )

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }
  return NextResponse.json(result.result)
}

// GET /api/admin/announcements?preview=1 returns recipient count without
// actually sending. Lets the UI show "Will send to 47 students."
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  // Mirror the same distinct-user-from-bookings logic used inside
  // sendAnnouncementHandler.loadRecipients without sending anything.
  const { data: bookings } = await supabase
    .from("bookings")
    .select("user_id, users(id, email)")
    .eq("org_id", membership.org_id)
    .not("user_id", "is", null)
    .limit(2000)

  const seen = new Set<string>()
  for (const row of bookings ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u = (row as any).users
    const user = Array.isArray(u) ? u[0] : u
    if (user?.id && user?.email) seen.add(user.id)
  }
  return NextResponse.json({ recipient_count: seen.size })
}
