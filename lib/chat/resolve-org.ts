/**
 * Resolve the org_id + per-gym channel credentials for an inbound
 * webhook payload.
 *
 * Webhooks for LINE / WhatsApp etc. carry an identifier of the receiving
 * account in the payload itself (LINE: `destination`, WhatsApp:
 * `entry[].changes[].value.metadata.phone_number_id`). Each gym registers
 * that identifier against its public_inbox group via mtp_chat_group_channels.
 *
 * This helper takes the channel + receiver id and walks back to:
 *   - the gym's org_id (via mtp_chat_group_channels → mtp_chat_groups)
 *   - the gym's saved credentials (via loadChannelCredentials)
 *
 * Returns null when no match — caller falls back to env-var creds, which
 * keeps the demo gym working without a DB row.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { loadChannelCredentials, type ChannelName } from "./credentials"
import type { ChannelCredentials } from "./types"

export async function resolveOrgFromReceiver(
  supabase: SupabaseClient,
  channel: ChannelName,
  receiverAccountId: string | undefined,
): Promise<{ orgId: string; credentials: ChannelCredentials } | null> {
  if (!receiverAccountId) return null

  const { data: row } = await supabase
    .from("mtp_chat_group_channels")
    .select("mtp_chat_groups(org_id, is_active)")
    .eq("channel", channel)
    .eq("external_account_id", receiverAccountId)
    .eq("is_active", true)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const group = (row as any)?.mtp_chat_groups
  const orgId = Array.isArray(group) ? group[0]?.org_id : group?.org_id
  if (!orgId) return null

  const credentials = await loadChannelCredentials(supabase, orgId, channel)
  if (!credentials) return null

  return { orgId, credentials }
}
