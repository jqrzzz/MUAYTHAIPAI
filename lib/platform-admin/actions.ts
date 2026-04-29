/**
 * Action executors — the actual write operations the AI command bar
 * proposes. Called by /api/platform-admin/ai/confirm after the
 * operator taps Confirm on a signed action token.
 */

import { randomBytes } from "node:crypto"
import type { createClient } from "@/lib/supabase/server"
import { sendDiscoveryInvite } from "@/lib/discovery/invite-email"

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

export interface ActionResult {
  ok: boolean
  message: string
  data?: Record<string, unknown>
}

export async function executeInviteGym(
  supabase: SupabaseClient,
  args: { gym_id: string; email?: string; send_email?: boolean }
): Promise<ActionResult> {
  const { data: gym } = await supabase
    .from("discovered_gyms")
    .select("id, name, email, city, province, invite_token, invited_at")
    .eq("id", args.gym_id)
    .maybeSingle()
  if (!gym) return { ok: false, message: "Gym not found" }

  const token = gym.invite_token || randomBytes(24).toString("base64url")
  const inviteEmail = args.email || gym.email || null
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://muaythaipai.com"
  const inviteUrl = `${baseUrl}/signup?invite=${encodeURIComponent(token)}`

  await supabase
    .from("discovered_gyms")
    .update({
      invite_token: token,
      invited_at: gym.invited_at || new Date().toISOString(),
      invite_email: inviteEmail,
      status: "invited",
    })
    .eq("id", args.gym_id)

  let emailSent = false
  let emailReason: string | undefined
  if (args.send_email !== false && inviteEmail) {
    const r = await sendDiscoveryInvite({
      to: inviteEmail,
      gymName: gym.name,
      inviteUrl,
      city: gym.city,
      province: gym.province,
    })
    emailSent = r.sent
    emailReason = r.reason
  }
  return {
    ok: true,
    message: emailSent
      ? `Invite sent to ${inviteEmail} for ${gym.name}.`
      : inviteEmail
        ? `Invite ready for ${gym.name}. Email not delivered (${emailReason || "unknown"}); link copied.`
        : `Invite ready for ${gym.name}. No email on file — link copied.`,
    data: { invite_url: inviteUrl, gym_id: gym.id, email: inviteEmail },
  }
}

const VALID_STATUSES = [
  "pending",
  "reviewed",
  "verified",
  "ignored",
  "duplicate",
  "invited",
  "onboarded",
] as const
type DiscoveryStatus = (typeof VALID_STATUSES)[number]

export async function executeUpdateGymStatus(
  supabase: SupabaseClient,
  args: { gym_id: string; status: string; notes?: string }
): Promise<ActionResult> {
  if (!VALID_STATUSES.includes(args.status as DiscoveryStatus)) {
    return { ok: false, message: `Invalid status: ${args.status}` }
  }
  const updates: Record<string, unknown> = { status: args.status }
  if (args.notes) updates.notes = args.notes
  const { data, error } = await supabase
    .from("discovered_gyms")
    .update(updates)
    .eq("id", args.gym_id)
    .select("id, name, status")
    .single()
  if (error || !data) return { ok: false, message: error?.message || "Update failed" }
  return {
    ok: true,
    message: `${data.name} → ${data.status}`,
    data: { gym_id: data.id, status: data.status },
  }
}
