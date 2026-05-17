/**
 * PATCH /api/promoter/events/[id]/matchmaker/[suggestionId]
 *
 * Resolve a matchmaker suggestion as either accepted (create the
 * bout + assign-or-invite both fighters) or dismissed (just record
 * the rejection for learning).
 *
 * Body:
 *   { action: "accept" | "dismiss" }
 *
 * On accept:
 *   1. Insert a new event_bouts row with weight_class + scheduled_rounds
 *      from the suggestion. Fighter columns start NULL.
 *   2. For each corner: same-org fighter → direct assignment (PATCH
 *      the bout row). Cross-org fighter → bout invitation (existing
 *      consent flow).
 *   3. Stamp the suggestion: status='accepted', accepted_bout_id=...
 *
 * Idempotency: re-accepting an already-resolved suggestion returns
 * 409. Dismissing an already-dismissed suggestion is a no-op 200 so
 * the UI can flush a stale list without errors.
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPromoterAuth, verifyEventOwnership } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; suggestionId: string }> },
) {
  const { id: eventId, suggestionId } = await params
  const supabase = await createClient()
  const auth = await getPromoterAuth(supabase)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!(await verifyEventOwnership(supabase, eventId, auth.orgId))) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const action = body?.action
  if (action !== "accept" && action !== "dismiss") {
    return NextResponse.json({ error: "action must be 'accept' or 'dismiss'" }, { status: 400 })
  }

  // Load the suggestion + verify it belongs to this event. The RLS
  // SELECT policy gates on event ownership via the join, so a
  // missing row here = either bad ID or wrong org.
  const { data: suggestion, error: loadErr } = await supabase
    .from("matchmaker_suggestions")
    .select("id, event_id, status, fighter_red_id, fighter_blue_id, weight_class, scheduled_rounds")
    .eq("id", suggestionId)
    .eq("event_id", eventId)
    .single()

  if (loadErr || !suggestion) {
    // 42P01 = migration 066 not applied. The UI may be holding
    // transient (in-memory) suggestion IDs from a degraded matchmaker
    // call; treat dismiss as a no-op success so the list can clean
    // itself up.
    if (loadErr?.code === "42P01") {
      return NextResponse.json({ ok: true, persisted: false })
    }
    return NextResponse.json({ error: "Suggestion not found" }, { status: 404 })
  }

  if (suggestion.status !== "pending") {
    if (action === "dismiss") {
      // Already-resolved dismiss is idempotent — just succeed so
      // the client UI can clean up without surfacing a stale-state
      // error to the promoter.
      return NextResponse.json({ ok: true, already_resolved: true })
    }
    return NextResponse.json(
      { error: `Suggestion is already ${suggestion.status}.` },
      { status: 409 },
    )
  }

  // ----- Dismiss path: stamp + return -----
  if (action === "dismiss") {
    const { error } = await supabase
      .from("matchmaker_suggestions")
      .update({ status: "dismissed", resolved_at: new Date().toISOString() })
      .eq("id", suggestionId)
    if (error) {
      console.error("[matchmaker/resolve] dismiss failed:", error)
      return NextResponse.json({ error: "Couldn't dismiss suggestion" }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  // ----- Accept path: create bout, then assign/invite each fighter -----
  if (!suggestion.fighter_red_id || !suggestion.fighter_blue_id) {
    return NextResponse.json(
      { error: "Suggestion is missing a fighter — can't create the bout." },
      { status: 422 },
    )
  }

  // Next bout_order for the event (same convention as the bouts POST
  // endpoint — keep them in sync so the AI-added bouts append to the
  // card cleanly).
  const { data: lastBout } = await supabase
    .from("event_bouts")
    .select("bout_order")
    .eq("event_id", eventId)
    .order("bout_order", { ascending: false })
    .limit(1)
  const nextOrder =
    lastBout && lastBout.length > 0 ? (lastBout[0].bout_order ?? 0) + 1 : 1

  // Look up each fighter's org so we can decide assign-vs-invite.
  // Same-org as promoter → direct assignment (verbal consent
  // assumed). Cross-org → invitation, fighter has to opt in.
  const { data: fighters } = await supabase
    .from("trainer_profiles")
    .select("id, org_id, display_name")
    .in("id", [suggestion.fighter_red_id, suggestion.fighter_blue_id])

  const fighterMap = new Map((fighters ?? []).map((f) => [f.id, f]))
  const redFighter = fighterMap.get(suggestion.fighter_red_id)
  const blueFighter = fighterMap.get(suggestion.fighter_blue_id)
  if (!redFighter || !blueFighter) {
    return NextResponse.json(
      { error: "One of the suggested fighters no longer exists." },
      { status: 422 },
    )
  }

  const redSameOrg = redFighter.org_id === auth.orgId
  const blueSameOrg = blueFighter.org_id === auth.orgId

  // Create the bout. Direct assignment goes in at INSERT for
  // same-org fighters; cross-org fighters are added later via
  // bout_invitations once the bout exists.
  const { data: bout, error: boutErr } = await supabase
    .from("event_bouts")
    .insert({
      event_id: eventId,
      bout_order: nextOrder,
      weight_class: suggestion.weight_class,
      scheduled_rounds: suggestion.scheduled_rounds ?? 5,
      is_main_event: false,
      fighter_red_id: redSameOrg ? suggestion.fighter_red_id : null,
      fighter_blue_id: blueSameOrg ? suggestion.fighter_blue_id : null,
    })
    .select("id")
    .single()

  if (boutErr || !bout) {
    console.error("[matchmaker/accept] bout insert failed:", boutErr)
    return NextResponse.json(
      { error: boutErr?.message ?? "Couldn't create bout" },
      { status: 500 },
    )
  }

  // Cross-org fighters get invitations. Failures here don't roll
  // back the bout — the promoter can re-invite from the editor.
  // We report the outcome per corner so the UI can show a clean
  // summary.
  const invitations: Array<{ corner: "red" | "blue"; fighter_name: string }> = []
  const assignments: Array<{ corner: "red" | "blue"; fighter_name: string }> = []

  if (redSameOrg) {
    assignments.push({ corner: "red", fighter_name: redFighter.display_name ?? "Red corner" })
  } else {
    const { error: invErr } = await supabase
      .from("bout_invitations")
      .insert({
        bout_id: bout.id,
        corner: "red",
        fighter_id: suggestion.fighter_red_id,
        invited_by_user_id: auth.userId,
        invited_by_org_id: auth.orgId,
        status: "pending",
      })
    if (invErr) {
      console.error("[matchmaker/accept] red invitation failed:", invErr)
      // Continue — bout exists, promoter can re-invite manually.
    } else {
      invitations.push({ corner: "red", fighter_name: redFighter.display_name ?? "Red corner" })
    }
  }

  if (blueSameOrg) {
    assignments.push({ corner: "blue", fighter_name: blueFighter.display_name ?? "Blue corner" })
  } else {
    const { error: invErr } = await supabase
      .from("bout_invitations")
      .insert({
        bout_id: bout.id,
        corner: "blue",
        fighter_id: suggestion.fighter_blue_id,
        invited_by_user_id: auth.userId,
        invited_by_org_id: auth.orgId,
        status: "pending",
      })
    if (invErr) {
      console.error("[matchmaker/accept] blue invitation failed:", invErr)
    } else {
      invitations.push({ corner: "blue", fighter_name: blueFighter.display_name ?? "Blue corner" })
    }
  }

  // Stamp the suggestion as accepted. This is the training signal —
  // pair (prompt_version, accepted) is what powers the learning loop.
  await supabase
    .from("matchmaker_suggestions")
    .update({
      status: "accepted",
      accepted_bout_id: bout.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", suggestionId)

  return NextResponse.json({
    ok: true,
    bout_id: bout.id,
    assignments,
    invitations,
  })
}
