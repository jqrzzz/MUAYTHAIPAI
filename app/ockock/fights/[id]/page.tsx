import type { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"
import { ockockUrl } from "@/lib/ockock/url"
import FightDetailClient from "./client"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  // Defensive try/catch — if Supabase is briefly down we don't want
  // the page render to crash on metadata generation.
  let event: { name: string; event_date: string | null; venue_name: string | null; venue_city: string | null; status: string } | null = null
  try {
    const { data } = await supabase
      .from("fight_events")
      .select("name, event_date, venue_name, venue_city, status")
      .eq("id", id)
      .maybeSingle()
    event = data as typeof event
  } catch {
    return {
      title: "Fight Event | OckOck",
      description: "Muay Thai fight event details and tickets.",
    }
  }

  if (!event || event.status === "draft") {
    return {
      title: "Fight Event | OckOck",
      description: "Muay Thai fight event details and tickets.",
      robots: "noindex",
    }
  }

  const pageUrl = ockockUrl(`/fights/${id}`)
  const dateLabel = event.event_date
    ? new Date(event.event_date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Date TBD"
  const venueLabel =
    [event.venue_name, event.venue_city].filter(Boolean).join(", ") || "Venue TBD"

  const title = `${event.name} | OckOck`
  const description = `${dateLabel} · ${venueLabel}. See the fight card and buy tickets.`

  // Next 14 auto-attaches the dynamic opengraph-image.tsx output to
  // og:image. The explicit blocks below pin title + description + URL
  // for consistent previews across all social platforms.
  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "website",
      url: pageUrl,
      title,
      description,
      siteName: "OckOck · MUAYTHAIPAI",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export default async function FightDetailPage({ params }: Props) {
  const { id } = await params

  // Fetch event + bouts + tickets to mint a SportsEvent JSON-LD that
  // an AI engine (and Google Events) can index. The fight detail
  // client also fetches this server-side via the public API for the
  // hero, so we tolerate the duplicate read here — JSON-LD only
  // renders if the event is published. Failures keep the page
  // alive without structured data.
  let jsonLd: object | null = null
  try {
    const [{ data: event }, { data: bouts }, { data: tiers }] = await Promise.all([
      supabase
        .from("fight_events")
        .select(`
          id, name, description, event_date, event_time,
          venue_name, venue_address, venue_city, venue_country, status,
          ticket_sales_open, cover_image_url,
          organizations:org_id (name, slug)
        `)
        .eq("id", id)
        .eq("status", "published")
        .maybeSingle(),
      supabase
        .from("event_bouts")
        .select(`
          fighter_red:trainer_profiles!event_bouts_fighter_red_id_fkey ( display_name ),
          fighter_blue:trainer_profiles!event_bouts_fighter_blue_id_fkey ( display_name ),
          status
        `)
        .eq("event_id", id)
        .neq("status", "cancelled"),
      supabase
        .from("event_tickets")
        .select("price_thb, quantity_total, quantity_sold")
        .eq("event_id", id)
        .eq("is_active", true)
        .order("price_thb", { ascending: true })
        .limit(1),
    ])

    if (event) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const org = Array.isArray((event as any).organizations)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (event as any).organizations[0]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        : (event as any).organizations
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://muaythaipai.com"
      const eventUrl = ockockUrl(`/fights/${event.id}`)
      const startIso = event.event_date
        ? `${event.event_date}T${event.event_time || "19:00:00"}+07:00`
        : null
      const lowestPrice = tiers && tiers.length > 0 ? tiers[0].price_thb : null
      const lowestRemaining = tiers && tiers.length > 0
        ? (tiers[0].quantity_total ?? 0) - (tiers[0].quantity_sold ?? 0)
        : 0

      // Performers: each bout's red + blue fighters as separate Person
      // entries so Google Events can render the matchup card. Skipped
      // if both corners are TBD.
      const performers: Array<{ "@type": "Person"; name: string }> = []
      for (const b of bouts ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const red = Array.isArray((b as any).fighter_red) ? (b as any).fighter_red[0] : (b as any).fighter_red
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const blue = Array.isArray((b as any).fighter_blue) ? (b as any).fighter_blue[0] : (b as any).fighter_blue
        if (red?.display_name) performers.push({ "@type": "Person", name: red.display_name })
        if (blue?.display_name) performers.push({ "@type": "Person", name: blue.display_name })
      }

      jsonLd = {
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        "@id": eventUrl,
        name: event.name,
        description: event.description || `Muay Thai fight night${event.venue_city ? ` in ${event.venue_city}` : ""}.`,
        url: eventUrl,
        sport: "Muay Thai",
        ...(event.cover_image_url ? { image: event.cover_image_url } : {}),
        ...(startIso ? { startDate: startIso } : {}),
        // eventStatus + eventAttendanceMode are the signals Google uses
        // to determine whether to surface in Events rich results.
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: {
          "@type": "Place",
          name: event.venue_name || "Venue TBD",
          address: {
            "@type": "PostalAddress",
            streetAddress: event.venue_address || undefined,
            addressLocality: event.venue_city || undefined,
            addressCountry: event.venue_country || "Thailand",
          },
        },
        organizer: org
          ? {
              "@type": "Organization",
              name: org.name,
              url: org.slug ? `${siteUrl}/gyms/${org.slug}` : undefined,
            }
          : undefined,
        ...(performers.length > 0 ? { performer: performers } : {}),
        ...(event.ticket_sales_open && lowestPrice != null
          ? {
              offers: {
                "@type": "Offer",
                url: eventUrl,
                price: lowestPrice,
                priceCurrency: "THB",
                availability:
                  lowestRemaining > 0
                    ? "https://schema.org/InStock"
                    : "https://schema.org/SoldOut",
                validFrom: new Date().toISOString(),
              },
            }
          : {}),
      }
    }
  } catch (err) {
    console.warn("[fight-detail jsonld] build failed:", err)
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <FightDetailClient />
    </>
  )
}
