/**
 * Bout invitation management (promoter side).
 *
 *   GET  /api/promoter/events/[id]/bouts/[boutId]/invitations
 *        → list invitations sent for this bout (with fighter info)
 *
 *   POST /api/promoter/events/[id]/bouts/[boutId]/invitations
 *        body: { fighter_id, corner: 'red'|'blue', message? }
 *        → create a pending invitation. Returns 409 if there's already
 *          an active pending invitation for the same (bout, corner).
 *
 * Cancel lives in the [invId] subroute as DELETE — see ./[invId]/route.ts.
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPromoterAuth, verifyEventOwnership } from "@/lib/auth-helpers"
import { EmailService } from "@/lib/email-service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; boutId: string }> },
) {
  const { id: eventId, boutId } = await params
  const supabase = await createClient()
  const auth = await getPromoterAuth(supabase)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!(await verifyEventOwnership(supabase, eventId, auth.orgId))) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  const { data, error } = await supabase
    .from("bout_invitations")
    .select(`
      id, bout_id, corner, fighter_id, status, message,
      responded_at, decline_reason, created_at, updated_at,
      fighter:trainer_profiles!bout_invitations_fighter_id_fkey (
        id, display_name, photo_url,
        fight_record_wins, fight_record_losses, fight_record_draws,
        weight_class, fighter_country,
        organizations ( name )
      )
    `)
    .eq("bout_id", boutId)
    .order("created_at", { ascending: false })

  if (error) {
    // Migration 059 might not be applied yet — keep the editor usable
    // by returning an empty list rather than 500.
    console.warn("[invitations.GET] query failed (table may not exist):", error.message)
    return NextResponse.json({ invitations: [] })
  }

  return NextResponse.json({ invitations: data ?? [] })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; boutId: string }> },
) {
  const { id: eventId, boutId } = await params
  const supabase = await createClient()
  const auth = await getPromoterAuth(supabase)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!(await verifyEventOwnership(supabase, eventId, auth.orgId))) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const fighter_id = typeof body?.fighter_id === "string" ? body.fighter_id : ""
  const corner = body?.corner === "blue" ? "blue" : body?.corner === "red" ? "red" : null
  const message =
    typeof body?.message === "string" && body.message.trim().length > 0
      ? body.message.trim().slice(0, 500)
      : null

  if (!fighter_id || !corner) {
    return NextResponse.json(
      { error: "fighter_id and corner ('red' | 'blue') are required" },
      { status: 400 },
    )
  }

  // Guard: the bout has to belong to this event (verifyEventOwnership
  // proved the event is the promoter's; we double-check the bout link).
  const { data: bout } = await supabase
    .from("event_bouts")
    .select("id, event_id, fighter_red_id, fighter_blue_id")
    .eq("id", boutId)
    .eq("event_id", eventId)
    .maybeSingle()
  if (!bout) {
    return NextResponse.json({ error: "Bout not found" }, { status: 404 })
  }

  // Don't invite someone already in the corner.
  const cornerField = corner === "red" ? "fighter_red_id" : "fighter_blue_id"
  if ((bout as Record<string, unknown>)[cornerField] === fighter_id) {
    return NextResponse.json(
      { error: "This fighter is already assigned to that corner." },
      { status: 409 },
    )
  }

  // Unique partial index enforces one pending invite per (bout, corner)
  // — we surface that as a 409 with a friendly message instead of a
  // raw constraint violation.
  const { data: existingPending } = await supabase
    .from("bout_invitations")
    .select("id")
    .eq("bout_id", boutId)
    .eq("corner", corner)
    .eq("status", "pending")
    .maybeSingle()
  if (existingPending) {
    return NextResponse.json(
      {
        error:
          "There's already a pending invitation for that corner. Cancel it first or wait for a response.",
      },
      { status: 409 },
    )
  }

  const { data: invitation, error } = await supabase
    .from("bout_invitations")
    .insert({
      bout_id: boutId,
      corner,
      fighter_id,
      invited_by_user_id: auth.userId,
      invited_by_org_id: auth.orgId,
      message,
      status: "pending",
    })
    .select(`
      id, bout_id, corner, fighter_id, status, message,
      responded_at, decline_reason, created_at, updated_at,
      fighter:trainer_profiles!bout_invitations_fighter_id_fkey (
        id, display_name, photo_url,
        fight_record_wins, fight_record_losses, fight_record_draws,
        weight_class, fighter_country,
        organizations ( name )
      )
    `)
    .single()

  if (error) {
    if (error.message?.includes("bout_invitations")) {
      return NextResponse.json(
        { error: "Invitation feature isn't enabled yet on this database. Apply migration 059 first." },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fire-and-forget notification email — the L4 loop falls apart if the
  // fighter has to remember to check their dashboard. Fail silent so a
  // Resend hiccup doesn't break the invitation itself; the dashboard
  // card still surfaces the invite even if the email never lands.
  sendInvitationEmailBestEffort(supabase, boutId, fighter_id, message).catch(
    (err) => console.warn("[invitations.POST] email send failed:", err),
  )

  return NextResponse.json({ invitation })
}

// Hydrate the rich data the email template needs (fighter email, event
// name + date + venue, promoter org name, bout details) and dispatch.
// Lives here rather than inline so the POST handler stays readable.
async function sendInvitationEmailBestEffort(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  boutId: string,
  fighterId: string,
  message: string | null,
) {
  // Fighter — pull email from the users row backing the trainer profile.
  const { data: fighter } = await supabase
    .from("trainer_profiles")
    .select("display_name, user_id, users:user_id (email)")
    .eq("id", fighterId)
    .maybeSingle()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fighterUser = fighter ? (fighter as any).users : null
  const fighterEmail = Array.isArray(fighterUser)
    ? fighterUser[0]?.email
    : fighterUser?.email
  if (!fighter || !fighterEmail) return

  // Bout + event for context — name, date, venue, weight class, rounds.
  const { data: boutRow } = await supabase
    .from("event_bouts")
    .select(`
      weight_class, scheduled_rounds, is_main_event,
      event:fight_events!event_bouts_event_id_fkey (
        name, event_date, venue_name, venue_city, org_id,
        organizations:org_id (name, city)
      )
    `)
    .eq("id", boutId)
    .maybeSingle()
  if (!boutRow) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const event = Array.isArray((boutRow as any).event)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (boutRow as any).event[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : (boutRow as any).event
  if (!event) return
  const promoterOrg = Array.isArray(event.organizations)
    ? event.organizations[0]
    : event.organizations

  // Find this invitation's corner. We don't have it as a parameter so
  // re-read it (cheaper than threading it through and the only round
  // trip in the email path).
  const { data: inv } = await supabase
    .from("bout_invitations")
    .select("corner")
    .eq("bout_id", boutId)
    .eq("fighter_id", fighterId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!inv) return

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://muaythaipai.com"
  await EmailService.getInstance().sendBoutInvitationEmail({
    fighterEmail,
    fighterName: fighter.display_name || "Fighter",
    promoterOrgName: promoterOrg?.name || "Promoter",
    promoterCity: promoterOrg?.city ?? null,
    eventName: event.name || "Fight event",
    eventDate: event.event_date ?? null,
    venue:
      [event.venue_name, event.venue_city].filter(Boolean).join(", ") || null,
    weightClass: boutRow.weight_class ?? null,
    scheduledRounds: boutRow.scheduled_rounds ?? 5,
    corner: inv.corner === "blue" ? "blue" : "red",
    isMainEvent: !!boutRow.is_main_event,
    message,
    respondUrl: `${siteUrl}/trainer`,
  })
}
