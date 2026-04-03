import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET: Fetch recent notifications for the user's org
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single()

    if (!membership) {
      return NextResponse.json({ error: "No organization access" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get("limit") || "20"), 50)
    const unreadOnly = searchParams.get("unread") === "true"

    let query = supabase
      .from("gym_notifications")
      .select("*")
      .eq("org_id", membership.org_id)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.eq("is_read", false)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error("[notifications] Fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
    }

    // Also get unread count
    const { count } = await supabase
      .from("gym_notifications")
      .select("id", { count: "exact", head: true })
      .eq("org_id", membership.org_id)
      .eq("is_read", false)

    return NextResponse.json({ notifications: notifications || [], unread_count: count || 0 })
  } catch (error) {
    console.error("[notifications] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH: Mark notifications as read
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single()

    if (!membership) {
      return NextResponse.json({ error: "No organization access" }, { status: 403 })
    }

    const body = await request.json()
    const { notification_ids, mark_all_read } = body

    if (mark_all_read) {
      const { error } = await supabase
        .from("gym_notifications")
        .update({ is_read: true })
        .eq("org_id", membership.org_id)
        .eq("is_read", false)

      if (error) {
        return NextResponse.json({ error: "Failed to update" }, { status: 500 })
      }
    } else if (notification_ids?.length) {
      const { error } = await supabase
        .from("gym_notifications")
        .update({ is_read: true })
        .eq("org_id", membership.org_id)
        .in("id", notification_ids)

      if (error) {
        return NextResponse.json({ error: "Failed to update" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[notifications] PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
