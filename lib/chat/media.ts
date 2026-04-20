import type { SupabaseClient } from "@supabase/supabase-js"
import type { IncomingAttachment } from "./types"

const LINE_CONTENT_API = "https://api-data.line.me/v2/bot/message"
const GRAPH_API_BASE = "https://graph.facebook.com/v21.0"

export async function downloadAndStoreAttachments(
  supabase: SupabaseClient,
  attachments: IncomingAttachment[],
  channel: string,
  orgId: string,
): Promise<string[]> {
  const urls: string[] = []

  for (const attachment of attachments) {
    if (attachment.type !== "image" && attachment.type !== "video") continue
    const url = await downloadAndStore(supabase, attachment, channel, orgId)
    if (url) urls.push(url)
  }

  return urls
}

async function downloadAndStore(
  supabase: SupabaseClient,
  attachment: IncomingAttachment,
  channel: string,
  orgId: string,
): Promise<string | null> {
  try {
    let binary: ArrayBuffer | null = null
    let contentType = attachment.mime || "image/jpeg"

    if (channel === "line") {
      const result = await downloadFromLine(attachment)
      if (result) {
        binary = result.binary
        if (result.contentType) contentType = result.contentType
      }
    } else if (channel === "whatsapp") {
      const result = await downloadFromWhatsApp(attachment)
      if (result) {
        binary = result.binary
        contentType = result.contentType || contentType
      }
    }

    if (!binary || binary.byteLength === 0) return null

    const ext = extensionFromMime(contentType)
    const slug = Math.random().toString(36).slice(2, 8)
    const filename = `content-media/${orgId}/${Date.now()}-${slug}.${ext}`

    const { data, error } = await supabase.storage
      .from("uploads")
      .upload(filename, binary, { contentType, upsert: false })

    if (error || !data) {
      console.error("[chat/media] upload failed:", error?.message)
      return null
    }

    const { data: urlData } = supabase.storage
      .from("uploads")
      .getPublicUrl(data.path)

    return urlData.publicUrl
  } catch (err) {
    console.error(
      "[chat/media] download/store failed:",
      err instanceof Error ? err.message : err,
    )
    return null
  }
}

async function downloadFromLine(
  attachment: IncomingAttachment,
): Promise<{ binary: ArrayBuffer; contentType?: string } | null> {
  const data = attachment.data as Record<string, unknown> | undefined
  const messageId = data?.line_message_id
  if (!messageId) return null

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return null

  const res = await fetch(`${LINE_CONTENT_API}/${messageId}/content`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) return null
  return {
    binary: await res.arrayBuffer(),
    contentType: res.headers.get("content-type") || undefined,
  }
}

async function downloadFromWhatsApp(
  attachment: IncomingAttachment,
): Promise<{ binary: ArrayBuffer; contentType: string } | null> {
  const data = attachment.data as Record<string, unknown> | undefined
  const mediaId = data?.whatsapp_media_id
  if (!mediaId) return null

  const token = process.env.WHATSAPP_ACCESS_TOKEN
  if (!token) return null

  const metaRes = await fetch(`${GRAPH_API_BASE}/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!metaRes.ok) return null

  const meta = (await metaRes.json()) as { url?: string; mime_type?: string }
  if (!meta.url) return null

  const downloadRes = await fetch(meta.url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!downloadRes.ok) return null

  return {
    binary: await downloadRes.arrayBuffer(),
    contentType: meta.mime_type || attachment.mime || "image/jpeg",
  }
}

function extensionFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
  }
  return map[mime] || "jpg"
}
