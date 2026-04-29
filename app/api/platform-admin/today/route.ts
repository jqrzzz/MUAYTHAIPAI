import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"

const DAY = 86400_000

/**
 * Aggregate everything the operator wants to see when they open the
 * dashboard in the morning — what needs attention, what just happened,
 * how the network grew this week.
 */
export async function GET() {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = Date.now()
  const ago = (days: number) => new Date(now - days * DAY).toISOString()

  // Fetch in parallel — keep this cheap
  const [
    pendingInvites,
    staleCrawls,
    needsExtraction,
    recentOnboarded,
    recentSignoffs,
    recentCerts,
    growthRows,
  ] = await Promise.all([
    // Invited > 7 days ago, not claimed
    supabase
      .from("discovered_gyms")
      .select("id, name, city, province, invite_email, invited_at")
      .eq("status", "invited")
      .lt("invited_at", ago(7))
      .order("invited_at", { ascending: true })
      .limit(20),
    // Verified but not crawled in 30+ days (Google source rows)
    supabase
      .from("discovered_gyms")
      .select("id, name, city, province, last_crawled_at")
      .eq("source", "google")
      .lt("last_crawled_at", ago(30))
      .order("last_crawled_at", { ascending: true })
      .limit(20),
    // Have website but never AI-extracted
    supabase
      .from("discovered_gyms")
      .select("id, name, city, province, website, status")
      .not("website", "is", null)
      .is("last_extracted_at", null)
      .limit(50),
    // Onboarded in last 7 days
    supabase
      .from("discovered_gyms")
      .select("id, name, city, province, claimed_at, linked_org_id")
      .eq("status", "onboarded")
      .gte("claimed_at", ago(7))
      .order("claimed_at", { ascending: false })
      .limit(10),
    // Signoffs in last 24h
    supabase
      .from("skill_signoffs")
      .select(
        "id, level, skill_index, signed_off_at, " +
          "users:student_id(full_name, email), " +
          "organizations:org_id(name)"
      )
      .gte("signed_off_at", ago(1))
      .order("signed_off_at", { ascending: false })
      .limit(15),
    // Certs issued in last 7 days
    supabase
      .from("certificates")
      .select(
        "id, level, certificate_number, issued_at, " +
          "users:user_id(full_name, email), " +
          "organizations:org_id(name)"
      )
      .gte("issued_at", ago(7))
      .order("issued_at", { ascending: false })
      .limit(10),
    // Daily new-onboarded counts for last 7 days (for tiny chart)
    supabase
      .from("discovered_gyms")
      .select("claimed_at")
      .eq("status", "onboarded")
      .gte("claimed_at", ago(7)),
  ])

  // Build a per-day chart for last 7 days
  const dayBuckets: { date: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * DAY)
    const key = d.toISOString().slice(0, 10)
    dayBuckets.push({ date: key, count: 0 })
  }
  for (const row of growthRows.data || []) {
    const claimedAt = (row as { claimed_at?: string }).claimed_at
    if (!claimedAt) continue
    const key = claimedAt.slice(0, 10)
    const bucket = dayBuckets.find((b) => b.date === key)
    if (bucket) bucket.count += 1
  }

  return NextResponse.json({
    pending_invites: (pendingInvites.data || []).map((g) => ({
      id: g.id,
      name: g.name,
      where: [g.city, g.province].filter(Boolean).join(", ") || null,
      invited_email: g.invite_email,
      invited_at: g.invited_at,
      days_since: Math.floor((now - new Date(g.invited_at!).getTime()) / DAY),
    })),
    stale_crawls: (staleCrawls.data || []).map((g) => ({
      id: g.id,
      name: g.name,
      where: [g.city, g.province].filter(Boolean).join(", ") || null,
      last_crawled_at: g.last_crawled_at,
      days_since: g.last_crawled_at
        ? Math.floor((now - new Date(g.last_crawled_at).getTime()) / DAY)
        : null,
    })),
    needs_extraction: (needsExtraction.data || []).map((g) => ({
      id: g.id,
      name: g.name,
      where: [g.city, g.province].filter(Boolean).join(", ") || null,
      website: g.website,
      status: g.status,
    })),
    needs_extraction_total: needsExtraction.data?.length ?? 0,
    recent_onboarded: (recentOnboarded.data || []).map((g) => ({
      id: g.id,
      name: g.name,
      where: [g.city, g.province].filter(Boolean).join(", ") || null,
      claimed_at: g.claimed_at,
      org_id: g.linked_org_id,
    })),
    recent_signoffs: (recentSignoffs.data || []).map((s) => {
      const u = s.users as unknown as { full_name?: string; email?: string }
      const o = s.organizations as unknown as { name?: string }
      return {
        id: s.id,
        student: u?.full_name || u?.email || "—",
        gym: o?.name || "—",
        level: s.level,
        skill_index: s.skill_index,
        signed_off_at: s.signed_off_at,
      }
    }),
    recent_certs: (recentCerts.data || []).map((c) => {
      const u = c.users as unknown as { full_name?: string; email?: string }
      const o = c.organizations as unknown as { name?: string }
      return {
        id: c.id,
        student: u?.full_name || u?.email || "—",
        gym: o?.name || "—",
        level: c.level,
        certificate_number: c.certificate_number,
        issued_at: c.issued_at,
      }
    }),
    growth_7d: dayBuckets,
  })
}
