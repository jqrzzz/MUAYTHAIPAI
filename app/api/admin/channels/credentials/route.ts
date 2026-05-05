/**
 * Per-gym channel credentials API.
 *
 *   GET  → masked status of every channel for the current org. Never
 *          returns raw secret values; the UI gets a configured/verified
 *          flag plus a "••••1234" preview.
 *   POST → upsert credentials for one channel. Empty/undefined fields
 *          are ignored (so the form doesn't wipe a saved token by being
 *          left blank). Setting any field flips is_verified → false.
 *
 * Auth: owner or admin only. Trainers can't connect channels.
 */

import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { getOrgMember } from "@/lib/auth-helpers"
import {
  CHANNEL_FIELDS,
  loadChannelCredentials,
  maskCredential,
  upsertChannelCredentials,
  type ChannelName,
} from "@/lib/chat/credentials"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const CHANNELS: ReadonlyArray<ChannelName> = [
  "line",
  "telegram",
  "whatsapp",
  "ig",
  "fb",
  "test",
]

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase credentials")
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

const PostSchema = z.object({
  channel: z.enum(CHANNELS as unknown as [ChannelName, ...ChannelName[]]),
  fields: z.record(z.string(), z.string().optional()).optional(),
  auto_send_enabled: z.boolean().optional(),
})

export async function GET(_req: NextRequest) {
  const { membership } = await getOrgMember()
  if (!membership) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!["owner", "admin"].includes(String(membership.role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const service = getServiceClient()

  // Bulk load: one row per channel that has DB creds, plus env fallbacks.
  const { data: rows } = await service
    .from("mtp_channel_credentials")
    .select(
      "channel, credentials, is_active, is_verified, last_verified_at, last_error, auto_send_enabled",
    )
    .eq("org_id", membership.org_id)

  const byChannel = new Map<
    string,
    {
      credentials: Record<string, string>
      is_active: boolean
      is_verified: boolean
      last_verified_at: string | null
      last_error: string | null
      auto_send_enabled: boolean
    }
  >()
  for (const row of rows ?? []) {
    byChannel.set(row.channel as string, {
      credentials: (row.credentials as Record<string, string>) || {},
      is_active: !!row.is_active,
      is_verified: !!row.is_verified,
      last_verified_at: row.last_verified_at ?? null,
      last_error: row.last_error ?? null,
      auto_send_enabled: !!row.auto_send_enabled,
    })
  }

  // For each known channel: build the masked field list and a top-level
  // configured / verified state. We also report when env-var fallback is
  // currently filling in for missing DB values, so the UI can warn the
  // operator to migrate.
  const channels = await Promise.all(
    CHANNELS.map(async (channel) => {
      const fields = CHANNEL_FIELDS[channel]
      const dbState = byChannel.get(channel)
      const merged = await loadChannelCredentials(
        service,
        membership.org_id,
        channel,
      )

      const fieldStatus = fields.map((f) => {
        const dbValue = dbState?.credentials[f.key]
        const mergedValue = merged?.[f.key]
        return {
          key: f.key,
          label: f.label,
          secret: f.secret,
          help: f.help ?? null,
          configured: Boolean(mergedValue),
          source: dbValue
            ? ("db" as const)
            : mergedValue
              ? ("env" as const)
              : ("none" as const),
          // Non-secret fields surface their actual value so the owner can
          // sanity-check what's saved. Secret fields show only the last
          // four characters.
          preview: f.secret
            ? maskCredential(mergedValue)
            : (mergedValue ?? ""),
        }
      })

      const allConfigured = fieldStatus.every((f) => f.configured)

      return {
        channel,
        configured: allConfigured,
        is_active: dbState?.is_active ?? false,
        is_verified: dbState?.is_verified ?? false,
        last_verified_at: dbState?.last_verified_at ?? null,
        last_error: dbState?.last_error ?? null,
        auto_send_enabled: dbState?.auto_send_enabled ?? false,
        // True if any field is being satisfied by env fallback rather
        // than the DB — usually meaningful only for the demo gym.
        using_env_fallback: fieldStatus.some((f) => f.source === "env"),
        fields: fieldStatus,
      }
    }),
  )

  return NextResponse.json({ channels })
}

export async function POST(request: NextRequest) {
  const { membership } = await getOrgMember()
  if (!membership) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!["owner", "admin"].includes(String(membership.role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const parsed = PostSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { channel, fields, auto_send_enabled } = parsed.data
  const service = getServiceClient()

  // Field updates: validate keys against the canonical schema so a typo
  // doesn't get silently stored.
  if (fields) {
    const allowed = new Set(CHANNEL_FIELDS[channel].map((f) => f.key))
    const cleaned: Record<string, string | undefined> = {}
    for (const [k, v] of Object.entries(fields)) {
      if (!allowed.has(k)) continue
      cleaned[k] = v
    }
    if (Object.keys(cleaned).length > 0) {
      const result = await upsertChannelCredentials(
        service,
        membership.org_id,
        channel,
        cleaned,
      )
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }
    }
  }

  // Auto-send toggle: independent of credential updates so the owner
  // can flip on auto-replies without re-pasting tokens.
  if (typeof auto_send_enabled === "boolean") {
    // Make sure a row exists first — toggling on a never-saved channel
    // creates an empty creds row so the engine can read the flag.
    const { data: existing } = await service
      .from("mtp_channel_credentials")
      .select("id")
      .eq("org_id", membership.org_id)
      .eq("channel", channel)
      .maybeSingle()

    if (existing) {
      const { error } = await service
        .from("mtp_channel_credentials")
        .update({ auto_send_enabled })
        .eq("id", existing.id)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      const { error } = await service.from("mtp_channel_credentials").insert({
        org_id: membership.org_id,
        channel,
        credentials: {},
        is_active: true,
        is_verified: false,
        auto_send_enabled,
      })
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ ok: true })
}
