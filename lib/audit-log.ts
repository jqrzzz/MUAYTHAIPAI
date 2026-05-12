/**
 * Audit log helper.
 *
 * Single function called from API routes whenever a sensitive
 * platform-operator action happens. Best-effort — failures here
 * never block the action itself.
 *
 * Use the namespaced conventions:
 *   impersonate.start, impersonate.end
 *   payout.settle, payout.cancel
 *   booking.refund
 *   subscription.override
 *   blacklist.add, blacklist.remove
 *   support.reply, support.resolve
 *   data.edit  (generic — include `field` + before/after in metadata)
 */
import type { SupabaseClient } from "@supabase/supabase-js"

export interface AuditEntry {
  /** snake_case + namespaced (e.g. "payout.settle") */
  action: string
  actorUserId?: string | null
  actorEmail?: string | null
  targetType?: string | null
  targetId?: string | null
  /** Denormalized — gym name, user email, etc. for readability */
  targetLabel?: string | null
  metadata?: Record<string, unknown> | null
  /** Pass the Request to capture IP + user-agent for incident response */
  request?: Request | null
}

export async function logAudit(
  supabase: SupabaseClient,
  entry: AuditEntry,
): Promise<void> {
  try {
    const ip = entry.request
      ? entry.request.headers.get("x-forwarded-for") ??
        entry.request.headers.get("x-real-ip") ??
        null
      : null
    const ua = entry.request?.headers.get("user-agent") ?? null

    await supabase.from("platform_audit_log").insert({
      actor_user_id: entry.actorUserId ?? null,
      actor_email: entry.actorEmail ?? null,
      action: entry.action,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId ?? null,
      target_label: entry.targetLabel ?? null,
      metadata: entry.metadata ?? null,
      ip_address: ip,
      user_agent: ua,
    })
  } catch (err) {
    // Audit failure must never break the caller's action
    console.error("[audit] write failed:", err)
  }
}
