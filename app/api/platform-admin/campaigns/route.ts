import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"

const EDITABLE_FIELDS = [
  "name",
  "description",
  "channel",
  "target_filter",
  "subject_template",
  "body_template",
  "personalize_prompt",
  "personalize",
  "from_name",
  "from_email",
  "status",
] as const

export async function GET() {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("campaigns")
    .select(
      "id, name, description, channel, status, total_targets, total_drafted, " +
        "total_sent, total_claimed, created_at, updated_at, sent_at"
    )
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ campaigns: data || [] })
}

export async function POST(request: Request) {
  const { supabase, user, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin || !user) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  if (!body.name || !body.body_template) {
    return NextResponse.json(
      { error: "name and body_template are required" },
      { status: 400 }
    )
  }

  const insert: Record<string, unknown> = {
    created_by: user.id,
    target_filter: body.target_filter || {},
    channel: body.channel || "email",
    body_template: body.body_template,
  }
  for (const key of EDITABLE_FIELDS) {
    if (key in body) insert[key] = body[key]
  }

  const { data, error } = await supabase
    .from("campaigns")
    .insert(insert)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ campaign: data })
}
