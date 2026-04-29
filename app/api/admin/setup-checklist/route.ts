import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

/**
 * Setup-completeness checklist for a fresh gym. Each item knows where
 * to send the operator (tab id) when they tap it.
 */
export async function GET() {
  const { supabase, membership } = await getMembership()
  if (!membership) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const orgId = membership.org_id

  const [orgRes, servicesRes, trainersRes, slotsRes] = await Promise.all([
    supabase
      .from("organizations")
      .select("description, city, logo_url, cover_image_url, phone, email")
      .eq("id", orgId)
      .single(),
    supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("is_active", true),
    supabase
      .from("org_members")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "active")
      .in("role", ["trainer", "owner", "admin"]),
    supabase
      .from("time_slots")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId),
  ])

  const org = orgRes.data || {}
  const items = [
    {
      id: "profile",
      label: "Add a gym description and city",
      tab: "profile",
      done: !!(org.description && org.city),
    },
    {
      id: "logo",
      label: "Upload a logo or cover image",
      tab: "profile",
      done: !!(org.logo_url || org.cover_image_url),
      optional: true,
    },
    {
      id: "contact",
      label: "Add contact email or phone",
      tab: "profile",
      done: !!(org.email || org.phone),
    },
    {
      id: "services",
      label: "Create at least one service",
      tab: "services",
      done: (servicesRes.count ?? 0) >= 1,
    },
    {
      id: "trainers",
      label: "Add a trainer",
      tab: "trainers",
      done: (trainersRes.count ?? 0) >= 1,
    },
    {
      id: "time-slots",
      label: "Set up bookable time slots",
      tab: "time-slots",
      done: (slotsRes.count ?? 0) >= 1,
    },
  ]

  const required = items.filter((i) => !i.optional)
  const completed = required.filter((i) => i.done).length
  const total = required.length

  return NextResponse.json({
    items,
    completed,
    total,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    is_complete: completed === total,
  })
}
