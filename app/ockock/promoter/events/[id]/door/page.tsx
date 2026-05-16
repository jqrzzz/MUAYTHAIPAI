/**
 * Door scanning page — /ockock/promoter/events/[id]/door
 *
 * Used by event staff at the venue: open this on a phone, scan QR
 * codes from buyer emails (or type the order reference), see instant
 * green/amber/red feedback on whether the ticket is valid.
 *
 * Auth: promoter org membership. The page itself is a thin shell that
 * verifies ownership server-side then hands off to a client component
 * that handles camera + scan loop.
 */
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { verifyEventOwnership, getPromoterAuth } from "@/lib/auth-helpers"
import DoorScanClient from "./client"

interface Props {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export default async function DoorScanPage({ params }: Props) {
  const { id: eventId } = await params
  const supabase = await createClient()
  const auth = await getPromoterAuth(supabase)
  if (!auth) {
    redirect(`/login?next=/ockock/promoter/events/${eventId}/door`)
  }
  if (!(await verifyEventOwnership(supabase, eventId, auth.orgId))) {
    redirect("/ockock/promoter")
  }

  // Pull the event name + date so the page header makes it obvious
  // which event the staff is scanning for (preventing wrong-event mix-ups).
  // Also pull active tiers so the "Record cash sale" tab can show
  // a picker without a follow-up client fetch.
  const [eventRes, tiersRes] = await Promise.all([
    supabase
      .from("fight_events")
      .select("name, event_date, venue_name")
      .eq("id", eventId)
      .maybeSingle(),
    supabase
      .from("event_tickets")
      .select("id, tier_name, price_thb, quantity_total, quantity_sold, is_active")
      .eq("event_id", eventId)
      .eq("is_active", true)
      .order("price_thb", { ascending: true }),
  ])

  const tiers = (tiersRes.data ?? []).map((t) => ({
    id: t.id,
    tier_name: t.tier_name,
    price_thb: t.price_thb,
    quantity_remaining: Math.max(0, (t.quantity_total ?? 0) - (t.quantity_sold ?? 0)),
  }))

  return (
    <DoorScanClient
      eventId={eventId}
      eventName={eventRes.data?.name || "Event"}
      eventDate={eventRes.data?.event_date ?? null}
      venueName={eventRes.data?.venue_name ?? null}
      tiers={tiers}
    />
  )
}
