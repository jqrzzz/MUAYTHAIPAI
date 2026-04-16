/**
 * Action token create / consume helpers.
 *
 * All helpers take a service-role Supabase client — callers must be
 * inside trusted server context (AI tool executors, API routes with
 * their own auth checks, etc).
 */

import type { SupabaseClient } from "@supabase/supabase-js"

const DEFAULT_TTL_MINUTES = 15

export type CreateActionTokenInput = {
  supabase: SupabaseClient
  orgId: string
  userId: string
  actionType: string
  params: Record<string, unknown>
  preview: string
  ttlMinutes?: number
  proposedByConversation?: string | null
}

export type CreateActionTokenResult = {
  id: string
  deeplinkUrl: string
  expiresAt: string
}

export async function createActionToken(
  input: CreateActionTokenInput,
): Promise<CreateActionTokenResult> {
  const ttl = Math.max(1, input.ttlMinutes ?? DEFAULT_TTL_MINUTES)
  const expiresAt = new Date(Date.now() + ttl * 60_000).toISOString()

  const { data, error } = await input.supabase
    .from("action_tokens")
    .insert({
      org_id: input.orgId,
      user_id: input.userId,
      action_type: input.actionType,
      params: input.params,
      preview: input.preview,
      expires_at: expiresAt,
      proposed_by_conversation: input.proposedByConversation ?? null,
    })
    .select("id, expires_at")
    .single()

  if (error || !data) {
    throw new Error(`createActionToken failed: ${error?.message ?? "no row"}`)
  }

  return {
    id: data.id,
    expiresAt: data.expires_at,
    deeplinkUrl: buildActionUrl(data.id),
  }
}

export function buildActionUrl(tokenId: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://muaythaipai.com"
  return `${base}/a/${tokenId}`
}

export type LoadedActionToken = {
  id: string
  orgId: string
  userId: string
  actionType: string
  params: Record<string, unknown>
  preview: string
  createdAt: string
  expiresAt: string
  consumedAt: string | null
  proposedByConversation: string | null
}

export async function loadActionToken(
  supabase: SupabaseClient,
  tokenId: string,
): Promise<LoadedActionToken | null> {
  const { data } = await supabase
    .from("action_tokens")
    .select(
      "id, org_id, user_id, action_type, params, preview, created_at, expires_at, consumed_at, proposed_by_conversation",
    )
    .eq("id", tokenId)
    .maybeSingle()
  if (!data) return null
  return {
    id: data.id,
    orgId: data.org_id,
    userId: data.user_id,
    actionType: data.action_type,
    params: (data.params ?? {}) as Record<string, unknown>,
    preview: data.preview,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
    consumedAt: data.consumed_at,
    proposedByConversation: data.proposed_by_conversation,
  }
}

/**
 * Atomically mark a token consumed. Returns the row if we won the
 * race, null if the token was already consumed / expired / wrong user.
 *
 * Callers MUST check the return — on null, do not execute.
 */
export async function claimActionToken(params: {
  supabase: SupabaseClient
  tokenId: string
  userId: string
}): Promise<LoadedActionToken | null> {
  const now = new Date().toISOString()
  const { data } = await params.supabase
    .from("action_tokens")
    .update({ consumed_at: now })
    .eq("id", params.tokenId)
    .eq("user_id", params.userId)
    .is("consumed_at", null)
    .gt("expires_at", now)
    .select(
      "id, org_id, user_id, action_type, params, preview, created_at, expires_at, consumed_at, proposed_by_conversation",
    )
    .maybeSingle()
  if (!data) return null
  return {
    id: data.id,
    orgId: data.org_id,
    userId: data.user_id,
    actionType: data.action_type,
    params: (data.params ?? {}) as Record<string, unknown>,
    preview: data.preview,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
    consumedAt: data.consumed_at,
    proposedByConversation: data.proposed_by_conversation,
  }
}

export async function storeActionResult(
  supabase: SupabaseClient,
  tokenId: string,
  result: Record<string, unknown>,
): Promise<void> {
  await supabase
    .from("action_tokens")
    .update({ consumed_result: result })
    .eq("id", tokenId)
}
