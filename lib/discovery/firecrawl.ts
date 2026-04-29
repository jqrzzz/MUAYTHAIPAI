/**
 * Firecrawl wrapper — given a URL, returns clean markdown plus metadata.
 *
 * Configured via FIRECRAWL_API_KEY. Until the key is set, callers receive
 * a structured "not configured" error.
 */

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1"

export class FirecrawlNotConfiguredError extends Error {
  constructor() {
    super("FIRECRAWL_API_KEY is not set")
    this.name = "FirecrawlNotConfiguredError"
  }
}

export interface FirecrawlScrapeResult {
  markdown: string
  metadata: {
    title?: string
    description?: string
    language?: string
    sourceURL?: string
    statusCode?: number
    [key: string]: unknown
  }
}

function getKey() {
  const key = process.env.FIRECRAWL_API_KEY
  if (!key) throw new FirecrawlNotConfiguredError()
  return key
}

/**
 * Scrape a single URL. We ask only for markdown — keeps payloads small
 * and is the best format to feed downstream to Claude for extraction.
 */
export async function scrapeUrl(url: string, options?: {
  onlyMainContent?: boolean
  waitFor?: number
}): Promise<FirecrawlScrapeResult> {
  const key = getKey()
  const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: options?.onlyMainContent ?? true,
      waitFor: options?.waitFor,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Firecrawl scrape failed (${res.status}): ${text}`)
  }

  const json = (await res.json()) as {
    success: boolean
    data?: { markdown?: string; metadata?: FirecrawlScrapeResult["metadata"] }
    error?: string
  }

  if (!json.success || !json.data) {
    throw new Error(`Firecrawl returned no data: ${json.error || "unknown"}`)
  }

  return {
    markdown: json.data.markdown || "",
    metadata: json.data.metadata || {},
  }
}
