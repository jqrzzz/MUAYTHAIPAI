import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"
import { scrapeUrl, FirecrawlNotConfiguredError } from "@/lib/discovery/firecrawl"
import { extractFromMarkdown } from "@/lib/discovery/extract"

/**
 * Enrich a batch of pending discovered gyms — Firecrawl + Claude
 * extraction in one shot. Each call processes up to `limit` rows so
 * we stay under serverless function timeouts; operator clicks again
 * to take the next batch.
 *
 * Eligible: has website AND (no last_extracted_at OR last_extracted_at
 * older than 30 days). Oldest first.
 */
export async function POST(request: Request) {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const limit = Math.min(Math.max(Number(body.limit) || 5, 1), 10)
  const city = (body.city as string | undefined)?.trim()
  const province = (body.province as string | undefined)?.trim()

  // Find candidates: have website, never extracted (oldest first)
  let pendingQuery = supabase
    .from("discovered_gyms")
    .select("id, name, website, last_extracted_at")
    .not("website", "is", null)
    .is("last_extracted_at", null)
    .order("created_at", { ascending: true })
    .limit(limit)

  if (city) pendingQuery = pendingQuery.ilike("city", `%${city}%`)
  if (province) pendingQuery = pendingQuery.ilike("province", `%${province}%`)

  const { data: candidates, error: fetchErr } = await pendingQuery
  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  // Total remaining to give the operator a sense of progress
  let countQuery = supabase
    .from("discovered_gyms")
    .select("id", { count: "exact", head: true })
    .not("website", "is", null)
    .is("last_extracted_at", null)
  if (city) countQuery = countQuery.ilike("city", `%${city}%`)
  if (province) countQuery = countQuery.ilike("province", `%${province}%`)
  const { count: totalRemaining } = await countQuery

  let succeeded = 0
  const failed: Array<{ id: string; name: string; reason: string }> = []

  for (const c of candidates || []) {
    try {
      const scrape = await scrapeUrl(c.website!)
      await supabase
        .from("discovered_gyms")
        .update({
          raw_scrape_md: scrape.markdown,
          last_crawled_at: new Date().toISOString(),
        })
        .eq("id", c.id)

      const extraction = await extractFromMarkdown({
        markdown: scrape.markdown,
        gymName: c.name,
      })

      const contact = extraction.extraction.contact || {}
      const updates: Record<string, unknown> = {
        raw_extraction: extraction.extraction,
        ai_summary: extraction.ai_summary,
        ai_tags: extraction.ai_tags,
        last_extracted_at: new Date().toISOString(),
      }
      if (contact.email) updates.email = contact.email
      if (contact.phone) updates.phone = contact.phone
      if (contact.line_id) updates.line_id = contact.line_id
      if (contact.instagram) updates.instagram = contact.instagram
      if (contact.facebook) updates.facebook = contact.facebook

      await supabase.from("discovered_gyms").update(updates).eq("id", c.id)
      succeeded++
    } catch (err) {
      const reason =
        err instanceof FirecrawlNotConfiguredError
          ? "FIRECRAWL_API_KEY not set"
          : err instanceof Error
            ? err.message
            : String(err)
      failed.push({ id: c.id, name: c.name, reason })
      // If Firecrawl isn't configured, no point continuing the batch
      if (err instanceof FirecrawlNotConfiguredError) {
        break
      }
    }
  }

  return NextResponse.json({
    processed: (candidates || []).length,
    succeeded,
    failed,
    remaining: Math.max(0, (totalRemaining ?? 0) - succeeded),
  })
}

/**
 * Quick GET to surface how many rows are eligible for enrichment.
 */
export async function GET() {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { count } = await supabase
    .from("discovered_gyms")
    .select("id", { count: "exact", head: true })
    .not("website", "is", null)
    .is("last_extracted_at", null)
  return NextResponse.json({ pending: count ?? 0 })
}
