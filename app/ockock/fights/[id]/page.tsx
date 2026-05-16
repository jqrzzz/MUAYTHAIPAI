import type { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://muaythaipai.com"
  const pageUrl = `${siteUrl}/ockock/fights/${id}`
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

export default function FightDetailPage() {
  return <FightDetailClient />
}
