import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"

/**
 * Server-side proxy for Google Places photos. The Places photo media
 * endpoint requires the API key, so we fetch upstream and stream the
 * image back to the browser. Aggressive cache headers — photos don't
 * change once issued.
 *
 * Query: ?name=places/<id>/photos/<photo_id>&w=320
 */
export async function GET(request: Request) {
  const { isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) {
    return new NextResponse("GOOGLE_PLACES_API_KEY not configured", { status: 503 })
  }

  const { searchParams } = new URL(request.url)
  const name = searchParams.get("name")
  const w = Math.min(parseInt(searchParams.get("w") || "320", 10) || 320, 1600)

  if (!name || !/^places\/[^/]+\/photos\/[^/]+$/.test(name)) {
    return new NextResponse("Invalid photo name", { status: 400 })
  }

  const upstream = `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${w}&key=${encodeURIComponent(key)}`
  const res = await fetch(upstream, { cache: "no-store" })
  if (!res.ok) {
    return new NextResponse(`Upstream error ${res.status}`, { status: res.status })
  }

  const body = await res.arrayBuffer()
  const contentType = res.headers.get("content-type") || "image/jpeg"
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, immutable",
    },
  })
}
