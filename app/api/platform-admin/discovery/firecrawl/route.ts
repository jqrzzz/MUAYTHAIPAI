import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"
import { scrapeUrl, FirecrawlNotConfiguredError } from "@/lib/discovery/firecrawl"

export async function POST(request: Request) {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const id = body.id as string | undefined
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  const { data: gym, error: fetchErr } = await supabase
    .from("discovered_gyms")
    .select("id, name, website")
    .eq("id", id)
    .single()
  if (fetchErr || !gym) {
    return NextResponse.json({ error: "Gym not found" }, { status: 404 })
  }
  if (!gym.website) {
    return NextResponse.json({ error: "Gym has no website to scrape" }, { status: 400 })
  }

  try {
    const result = await scrapeUrl(gym.website)

    const { data: updated, error: updateErr } = await supabase
      .from("discovered_gyms")
      .update({
        raw_scrape_md: result.markdown,
        last_crawled_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, last_crawled_at")
      .single()

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }
    return NextResponse.json({
      gym: updated,
      bytes: result.markdown.length,
      title: result.metadata.title,
    })
  } catch (err) {
    if (err instanceof FirecrawlNotConfiguredError) {
      return NextResponse.json(
        { error: "Firecrawl not configured", detail: "Set FIRECRAWL_API_KEY in env." },
        { status: 503 }
      )
    }
    console.error("[discovery/firecrawl] failed:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scrape failed" },
      { status: 500 }
    )
  }
}
