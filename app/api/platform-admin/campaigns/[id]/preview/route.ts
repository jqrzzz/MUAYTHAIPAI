import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"
import { applyTargetFilter, resolveAddress } from "@/lib/campaigns/target-filter"
import type { TargetFilter } from "@/lib/campaigns/types"

/**
 * Preview which gyms would be targeted by a campaign's current filter.
 * Returns count + a small sample. Used by the builder UI before
 * generating drafts.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, channel, target_filter")
    .eq("id", id)
    .single()
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
  }

  const filter = (campaign.target_filter || {}) as TargetFilter
  const channel = campaign.channel as "email" | "line" | "whatsapp" | "test"

  const { rows, total } = await applyTargetFilter(supabase, filter, {
    campaignId: campaign.id,
  })

  const sampled = rows.slice(0, 25).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    city: (r.city as string) || null,
    province: (r.province as string) || null,
    address: resolveAddress(channel, {
      email: r.email as string | null | undefined,
      line_id: r.line_id as string | null | undefined,
      phone: r.phone as string | null | undefined,
    }),
    has_extraction: r.last_extracted_at != null,
    ai_summary: (r.ai_summary as string) || null,
  }))

  const reachable = sampled.filter((g) => !!g.address).length
  // Re-cache target count
  await supabase
    .from("campaigns")
    .update({ total_targets: total })
    .eq("id", campaign.id)

  return NextResponse.json({
    total,
    reachable_in_sample: reachable,
    sample: sampled,
    channel,
  })
}
