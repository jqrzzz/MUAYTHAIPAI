import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"
import { sendCampaignEmail } from "@/lib/campaigns/send-email"

/**
 * Execute every approved campaign_send for this campaign. Capped per
 * call so we stay under serverless timeouts; operator can re-click
 * for the next batch.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const limit = Math.max(1, Math.min(Number(body.limit) || 10, 25))

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, channel, from_name, from_email, status")
    .eq("id", id)
    .single()
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
  }

  const { data: approved } = await supabase
    .from("campaign_sends")
    .select("id, gym_id, channel, to_address, subject, body")
    .eq("campaign_id", id)
    .eq("status", "approved")
    .limit(limit)

  if (!approved || approved.length === 0) {
    return NextResponse.json({
      processed: 0,
      sent: 0,
      failed: 0,
      remaining: 0,
      message: "No approved sends.",
    })
  }

  if (campaign.status !== "sending") {
    await supabase.from("campaigns").update({ status: "sending" }).eq("id", id)
  }

  let sent = 0
  let failed = 0

  for (const s of approved) {
    if (s.channel !== "email" && s.channel !== "test") {
      // Non-email channels — placeholder until LINE/WhatsApp adapters wire in
      await supabase
        .from("campaign_sends")
        .update({
          status: "failed",
          error: `Channel '${s.channel}' not yet implemented`,
        })
        .eq("id", s.id)
      failed++
      continue
    }
    if (!s.to_address || !s.body) {
      await supabase
        .from("campaign_sends")
        .update({ status: "failed", error: "Missing address or body" })
        .eq("id", s.id)
      failed++
      continue
    }

    if (s.channel === "test") {
      await supabase
        .from("campaign_sends")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          provider_id: "test",
        })
        .eq("id", s.id)
      sent++
      continue
    }

    const result = await sendCampaignEmail({
      to: s.to_address,
      subject: s.subject || "MUAYTHAIPAI Network",
      bodyMarkdown: s.body,
      fromName: campaign.from_name,
      fromEmail: campaign.from_email,
    })

    if (result.ok) {
      await supabase
        .from("campaign_sends")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          provider_id: result.provider_id || null,
          error: null,
        })
        .eq("id", s.id)
      sent++
    } else {
      await supabase
        .from("campaign_sends")
        .update({
          status: "failed",
          error: result.error || "Unknown error",
        })
        .eq("id", s.id)
      failed++
    }
  }

  // How many approved still remain after this batch?
  const { count: remaining } = await supabase
    .from("campaign_sends")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", id)
    .eq("status", "approved")

  // Update cached counts; flip campaign status if drained
  const { count: anyApproved } = await supabase
    .from("campaign_sends")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", id)
    .eq("status", "approved")
  const { count: totalSent } = await supabase
    .from("campaign_sends")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", id)
    .in("status", ["sent", "opened", "clicked", "claimed"])

  const updates: Record<string, unknown> = { total_sent: totalSent ?? 0 }
  if ((anyApproved ?? 0) === 0 && campaign.status === "sending") {
    updates.status = "sent"
    updates.sent_at = new Date().toISOString()
  }
  await supabase.from("campaigns").update(updates).eq("id", id)

  return NextResponse.json({
    processed: approved.length,
    sent,
    failed,
    remaining: remaining ?? 0,
  })
}
