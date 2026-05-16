/**
 * PATCH /api/promoter/events/[id]/pricing/[recId]
 *
 * Resolve a pricing recommendation as either applied (set the
 * underlying tier's price + optionally quantity to the rec'd values)
 * or dismissed.
 *
 * Body:
 *   {
 *     action: "apply" | "dismiss"
 *     // For apply: the promoter may tweak before applying.
 *     applied_price_thb?:     number
 *     applied_quantity_total?: number
 *   }
 *
 * On apply with a `tier_id` on the rec: PATCH the event_tickets row
 * to the applied price + quantity. On apply without a tier_id (rec
 * was for a not-yet-created tier): we record the applied numbers
 * for learning but the promoter still has to create the tier via
 * the normal Add Tier flow — the rec is just guidance.
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPromoterAuth, verifyEventOwnership } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MIN_PRICE = 50
const MAX_PRICE = 100_000

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; recId: string }> },
) {
  const { id: eventId, recId } = await params
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
  if (action !== "apply" && action !== "dismiss") {
    return NextResponse.json(
      { error: "action must be 'apply' or 'dismiss'" },
      { status: 400 },
    )
  }

  const { data: rec, error: loadErr } = await supabase
    .from("pricing_recommendations")
    .select(
      "id, event_id, tier_id, recommended_price_thb, recommended_quantity_total, status",
    )
    .eq("id", recId)
    .eq("event_id", eventId)
    .single()

  if (loadErr || !rec) {
    if (loadErr?.code === "42P01") {
      // Migration missing — UI should never reach this state since the
      // POST refuses cleanly, but stay graceful.
      return NextResponse.json({ ok: true, persisted: false })
    }
    return NextResponse.json({ error: "Recommendation not found" }, { status: 404 })
  }

  if (rec.status !== "pending") {
    if (action === "dismiss") {
      return NextResponse.json({ ok: true, already_resolved: true })
    }
    return NextResponse.json(
      { error: `Recommendation is already ${rec.status}.` },
      { status: 409 },
    )
  }

  // ----- Dismiss path -----
  if (action === "dismiss") {
    const { error } = await supabase
      .from("pricing_recommendations")
      .update({ status: "dismissed", resolved_at: new Date().toISOString() })
      .eq("id", recId)
    if (error) {
      console.error("[pricing/resolve] dismiss failed:", error)
      return NextResponse.json(
        { error: "Couldn't dismiss recommendation" },
        { status: 500 },
      )
    }
    return NextResponse.json({ ok: true })
  }

  // ----- Apply path -----
  // The promoter may have tweaked the price/quantity before
  // applying. Use their values if provided, otherwise the rec's.
  const appliedPrice =
    typeof body.applied_price_thb === "number"
      ? Math.floor(body.applied_price_thb)
      : rec.recommended_price_thb
  const appliedQuantity =
    typeof body.applied_quantity_total === "number"
      ? Math.floor(body.applied_quantity_total)
      : rec.recommended_quantity_total

  if (appliedPrice < MIN_PRICE || appliedPrice > MAX_PRICE) {
    return NextResponse.json(
      { error: `Price must be between ฿${MIN_PRICE} and ฿${MAX_PRICE}.` },
      { status: 400 },
    )
  }
  if (
    appliedQuantity !== null &&
    appliedQuantity !== undefined &&
    (appliedQuantity < 0 || appliedQuantity > 100_000)
  ) {
    return NextResponse.json(
      { error: "Quantity must be 0 or greater (and under 100,000)." },
      { status: 400 },
    )
  }

  // If the rec is bound to an existing tier, push the new price.
  // Refuse if quantity would go below already-sold (matches the
  // editor's inline validation).
  let appliedToTier = false
  if (rec.tier_id) {
    const { data: tier } = await supabase
      .from("event_tickets")
      .select("id, quantity_sold")
      .eq("id", rec.tier_id)
      .eq("event_id", eventId)
      .single()

    if (tier) {
      if (
        appliedQuantity !== null &&
        appliedQuantity !== undefined &&
        appliedQuantity < (tier.quantity_sold ?? 0)
      ) {
        return NextResponse.json(
          {
            error: `Can't set quantity below ${tier.quantity_sold} — that many are already sold.`,
          },
          { status: 422 },
        )
      }

      const updates: Record<string, number> = { price_thb: appliedPrice }
      if (appliedQuantity !== null && appliedQuantity !== undefined) {
        updates.quantity_total = appliedQuantity
      }

      const { error: patchErr } = await supabase
        .from("event_tickets")
        .update(updates)
        .eq("id", rec.tier_id)

      if (patchErr) {
        console.error("[pricing/apply] tier patch failed:", patchErr)
        return NextResponse.json(
          { error: "Couldn't update the tier — try again." },
          { status: 500 },
        )
      }
      appliedToTier = true
    }
  }

  await supabase
    .from("pricing_recommendations")
    .update({
      status: "applied",
      applied_price_thb: appliedPrice,
      applied_quantity_total: appliedQuantity ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", recId)

  return NextResponse.json({
    ok: true,
    applied_to_tier: appliedToTier,
    applied_price_thb: appliedPrice,
    applied_quantity_total: appliedQuantity ?? null,
  })
}
