import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Capacity for an auto-generated group-class slot. Owners tune each slot
// afterward in the Time Slots tab.
const DEFAULT_SLOT_CAPACITY = 12

async function getMembership() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, membership: null }
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()
  return { supabase, membership }
}

type DayHours = { open?: string; close?: string }

function hourOf(t: string | undefined): number | null {
  if (!t) return null
  const h = Number.parseInt(t.split(":")[0], 10)
  return Number.isFinite(h) ? h : null
}

/**
 * Turn a gym's operating hours into a starter set of hourly, bookable time
 * slots, so a freshly onboarded gym's public booking shows its real window
 * instead of the hard-coded fallback times in /api/public/services.
 *
 * Idempotent by design: if the gym already has any slots, it leaves them
 * untouched (protects established gyms and safe to call more than once).
 */
export async function POST() {
  const { supabase, membership } = await getMembership()
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }
  const orgId = membership.org_id

  // Never clobber an existing schedule.
  const { count: existing } = await supabase
    .from("time_slots")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
  if ((existing ?? 0) > 0) {
    return NextResponse.json({ skipped: true, reason: "slots_exist", created: 0 })
  }

  const { data: settings } = await supabase
    .from("org_settings")
    .select("operating_hours")
    .eq("org_id", orgId)
    .single()

  const hours = (settings?.operating_hours ?? {}) as Record<string, DayHours>
  let earliest: number | null = null
  let latest: number | null = null
  for (const day of Object.values(hours)) {
    const open = hourOf(day?.open)
    const close = hourOf(day?.close)
    if (open === null || close === null || close <= open) continue
    earliest = earliest === null ? open : Math.min(earliest, open)
    latest = latest === null ? close : Math.max(latest, close)
  }

  if (earliest === null || latest === null) {
    return NextResponse.json({ skipped: true, reason: "no_hours", created: 0 })
  }

  const rows = []
  for (let h = earliest; h < latest; h++) {
    rows.push({
      org_id: orgId,
      service_id: null,
      day_of_week: null,
      start_time: `${String(h).padStart(2, "0")}:00:00`,
      end_time: `${String(h + 1).padStart(2, "0")}:00:00`,
      max_bookings: DEFAULT_SLOT_CAPACITY,
      is_active: true,
    })
  }

  const { data, error } = await supabase.from("time_slots").insert(rows).select("id")
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ created: data?.length ?? 0 })
}
