import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"
import { extractFromMarkdown } from "@/lib/discovery/extract"

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
    .select("id, name, raw_scrape_md")
    .eq("id", id)
    .single()
  if (fetchErr || !gym) {
    return NextResponse.json({ error: "Gym not found" }, { status: 404 })
  }
  if (!gym.raw_scrape_md) {
    return NextResponse.json(
      { error: "No scraped content. Run Firecrawl first." },
      { status: 400 }
    )
  }

  try {
    const result = await extractFromMarkdown({
      markdown: gym.raw_scrape_md,
      gymName: gym.name,
    })

    // Pull contact fields out of the extraction so they're queryable at
    // the column level instead of buried in raw_extraction.
    const contact = result.extraction.contact || {}
    const updates: Record<string, unknown> = {
      raw_extraction: result.extraction,
      ai_summary: result.ai_summary,
      ai_tags: result.ai_tags,
      last_extracted_at: new Date().toISOString(),
    }
    if (contact.email) updates.email = contact.email
    if (contact.phone) updates.phone = contact.phone
    if (contact.line_id) updates.line_id = contact.line_id
    if (contact.instagram) updates.instagram = contact.instagram
    if (contact.facebook) updates.facebook = contact.facebook

    const { data: updated, error: updateErr } = await supabase
      .from("discovered_gyms")
      .update(updates)
      .eq("id", id)
      .select("id, ai_summary, ai_tags, raw_extraction, last_extracted_at")
      .single()

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }
    return NextResponse.json({ gym: updated, model: result.model })
  } catch (err) {
    console.error("[discovery/extract] failed:", err)
    return NextResponse.json(
      {
        error: "Extraction failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 503 }
    )
  }
}
