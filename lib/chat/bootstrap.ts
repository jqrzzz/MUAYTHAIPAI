/**
 * Idempotently ensure an org has the foundational chat groups in place.
 *
 * Creates:
 *   - public_inbox  → all incoming messages from visitors / students
 *                      across web, LINE, WhatsApp, IG, FB, etc.
 *   - owner_assist  → private channel between the owner and OckOck
 *                      (the owner-AI persona for running ops)
 *
 * Safe to call any number of times — only inserts groups that don't
 * already exist. Used at gym signup time (eager) and as a self-heal in
 * /api/public/chat (lazy, fixes any pre-existing gym that signed up
 * before this helper existed).
 */

import type { SupabaseClient } from "@supabase/supabase-js"

type ChatGroupPurpose = "public_inbox" | "owner_assist"

const DEFAULT_GROUPS: ReadonlyArray<{
  purpose: ChatGroupPurpose
  name: string
  description: string
}> = [
  {
    purpose: "public_inbox",
    name: "Public Inbox",
    description:
      "All incoming messages from visitors and students across every connected channel.",
  },
  {
    purpose: "owner_assist",
    name: "Owner Assistant",
    description:
      "Private channel between the gym owner and OckOck.",
  },
]

export async function ensureChatGroups(
  supabase: SupabaseClient,
  orgId: string,
): Promise<{ created: ChatGroupPurpose[] }> {
  const { data: existing } = await supabase
    .from("mtp_chat_groups")
    .select("purpose")
    .eq("org_id", orgId)

  const have = new Set<string>((existing ?? []).map((g) => g.purpose as string))
  const missing = DEFAULT_GROUPS.filter((g) => !have.has(g.purpose))

  if (missing.length === 0) return { created: [] }

  const { error } = await supabase.from("mtp_chat_groups").insert(
    missing.map((g) => ({
      org_id: orgId,
      name: g.name,
      purpose: g.purpose,
      description: g.description,
      is_active: true,
    })),
  )

  if (error) {
    // Best-effort: log and continue. The endpoint that called us decides
    // how strict to be — signup shouldn't fail because of this, but the
    // public chat self-heal can return 503 to the visitor and have them
    // retry.
    console.error("[chat/bootstrap] failed to create groups:", error)
    return { created: [] }
  }

  return { created: missing.map((g) => g.purpose) }
}
