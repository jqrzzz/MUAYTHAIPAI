/**
 * Dynamic OG image for a fight event — `/ockock/fights/[id]/opengraph-image`.
 *
 * Renders 1200×630 with event name, date, venue, promoter, and a
 * ticket-availability badge. Every shared link to a fight detail page
 * gets a real preview card on iMessage, Facebook, X, LinkedIn, etc.
 *
 * Falls back to a generic OckOck card if the event doesn't exist or
 * its status is draft (we shouldn't be linking to drafts anyway).
 */
import { ImageResponse } from "next/og"
import { createServiceClient } from "@/lib/supabase/service"

export const runtime = "nodejs"
export const alt = "OckOck — Muay Thai fight event"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const supabase = createServiceClient()

interface Props {
  params: Promise<{ id: string }>
}

export default async function FightEventOG({ params }: Props) {
  const { id } = await params

  // Pull only what we need to render. The page itself fetches more for
  // the bout card; OG just needs name/date/venue/promoter + tickets.
  const { data: event } = await supabase
    .from("fight_events")
    .select(`
      name, event_date, event_time, venue_name, venue_city,
      ticket_sales_open, status,
      organizations:org_id (name)
    `)
    .eq("id", id)
    .maybeSingle()

  // Generic fallback card if event missing / draft. Shouldn't normally
  // be hit because we 404 drafts before social ever scrapes them.
  if (!event || event.status === "draft") {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#09090b",
            color: "#fafafa",
            fontFamily: "sans-serif",
            gap: 16,
          }}
        >
          <div style={{ fontSize: 60, fontWeight: 700, display: "flex" }}>OckOck</div>
          <div
            style={{
              fontSize: 22,
              color: "#a1a1aa",
              letterSpacing: 2,
              display: "flex",
            }}
          >
            MUAY THAI · THAILAND
          </div>
        </div>
      ),
      { ...size },
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const org = Array.isArray((event as any).organizations)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (event as any).organizations[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : (event as any).organizations
  const promoterName = (org?.name as string) || "Promoter TBD"

  // Lowest active ticket price drives the "From ฿X" badge. Skip the
  // query if sales are closed — the badge becomes "Tickets coming soon".
  let lowestPrice: number | null = null
  if (event.ticket_sales_open) {
    const { data: tiers } = await supabase
      .from("event_tickets")
      .select("price_thb, quantity_total, quantity_sold")
      .eq("event_id", id)
      .eq("is_active", true)
    const withInventory = (tiers ?? []).filter(
      (t) => (t.quantity_total ?? 0) - (t.quantity_sold ?? 0) > 0,
    )
    if (withInventory.length > 0) {
      lowestPrice = Math.min(...withInventory.map((t) => t.price_thb ?? 0))
    }
  }

  const eventDate = event.event_date
    ? new Date(event.event_date + "T00:00:00")
    : null
  const dateLabel = eventDate
    ? eventDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Date TBD"
  const venueLabel =
    [event.venue_name, event.venue_city].filter(Boolean).join(", ") ||
    "Venue TBD"

  // Pick a ticket badge tone based on availability. Amber for "buy now",
  // zinc for "coming soon" so the social card communicates the call to
  // action at a glance.
  const ticketBadge =
    lowestPrice != null
      ? {
          text: `TICKETS FROM ฿${lowestPrice.toLocaleString()}`,
          fg: "#000000",
          bg: "#fbbf24",
        }
      : event.ticket_sales_open
        ? {
            text: "SOLD OUT",
            fg: "#fecaca",
            bg: "#7f1d1d",
          }
        : {
            text: "TICKETS COMING SOON",
            fg: "#fbbf24",
            bg: "#1a1305",
          }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#09090b",
          backgroundImage:
            "radial-gradient(circle at 50% 0%, #fbbf2426 0%, transparent 55%)",
          padding: "56px 80px",
          fontFamily: "sans-serif",
          color: "#fafafa",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 18,
            color: "#a1a1aa",
            letterSpacing: 4,
          }}
        >
          <span style={{ display: "flex" }}>OCKOCK · FIGHT NIGHT</span>
          <span style={{ display: "flex" }}>muaythaipai.com</span>
        </div>

        {/* Event headline */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: "#fbbf24",
              letterSpacing: 6,
              fontWeight: 600,
            }}
          >
            {dateLabel.toUpperCase()}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 700,
              letterSpacing: -1.5,
              lineHeight: 1.05,
              maxWidth: 1000,
            }}
          >
            {event.name}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginTop: 4,
            }}
          >
            <span
              style={{
                display: "flex",
                fontSize: 24,
                color: "#d4d4d8",
                letterSpacing: 1,
              }}
            >
              {venueLabel}
            </span>
            <span
              style={{
                display: "flex",
                width: 6,
                height: 6,
                borderRadius: 999,
                backgroundColor: "#52525b",
              }}
            />
            <span
              style={{
                display: "flex",
                fontSize: 22,
                color: "#a1a1aa",
                letterSpacing: 1,
              }}
            >
              {promoterName}
            </span>
          </div>
        </div>

        {/* Ticket badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 24,
            borderTop: "1px solid #27272a",
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "14px 22px",
              borderRadius: 12,
              backgroundColor: ticketBadge.bg,
              color: ticketBadge.fg,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 3,
            }}
          >
            {ticketBadge.text}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 18,
              color: "#71717a",
              letterSpacing: 3,
            }}
          >
            ห้ามพลาด · DON&apos;T MISS IT
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
