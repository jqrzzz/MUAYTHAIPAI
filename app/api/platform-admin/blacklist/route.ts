import { getPlatformAdmin } from "@/lib/auth-helpers"
import { NextResponse } from "next/server"
import { logAudit } from "@/lib/audit-log"

export async function POST(request: Request) {
  const { supabase, user, isPlatformAdmin } = await getPlatformAdmin()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { name, nationality, description } = await request.json()

  const { data, error } = await supabase
    .from("blacklist")
    .insert({
      name,
      nationality,
      description,
      added_by_user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  await logAudit(supabase, {
    action: "blacklist.add",
    actorUserId: user.id,
    actorEmail: user.email,
    targetType: "blacklist_entry",
    targetId: data.id,
    targetLabel: name,
    metadata: { nationality, description },
    request,
  })

  return NextResponse.json({ success: true, entry: data })
}
