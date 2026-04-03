import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: fighter, error } = await supabase
    .from("fighters")
    .select(`
      *,
      organizations:gym_id (name, slug, city, province)
    `)
    .eq("id", id)
    .single()

  if (error || !fighter) {
    return NextResponse.json({ error: "Fighter not found" }, { status: 404 })
  }

  // Get recent bouts
  const { data: bouts } = await supabase
    .from("event_bouts")
    .select(`
      *,
      events:event_id (name, event_date, venue_name, venue_city)
    `)
    .or(`fighter_red_id.eq.${id},fighter_blue_id.eq.${id}`)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(10)

  const org = fighter.organizations as Record<string, unknown> | null
  const result = {
    ...fighter,
    organizations: undefined,
    gym_name: org?.name || null,
    gym_slug: org?.slug || null,
    gym_city: org?.city || null,
    gym_province: org?.province || null,
    recent_bouts: bouts || [],
  }

  return NextResponse.json({ fighter: result })
}
