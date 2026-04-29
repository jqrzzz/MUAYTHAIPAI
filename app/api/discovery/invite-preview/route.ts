import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * Public preview of a discovery invite. Returns only the gym's basic
 * identity info so the signup form can pre-fill itself when an operator
 * shares an invite link. Uses the service role key to read past RLS,
 * since the signup flow is unauthenticated.
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")?.trim()
  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("discovered_gyms")
    .select("id, name, name_th, city, province, country, website, email, status, claimed_at")
    .eq("invite_token", token)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: "Invite not found or expired" }, { status: 404 })
  }
  if (data.status === "onboarded" || data.claimed_at) {
    return NextResponse.json({ error: "Invite already claimed" }, { status: 410 })
  }

  return NextResponse.json({
    invite: {
      id: data.id,
      gymName: data.name,
      nameTh: data.name_th,
      city: data.city,
      province: data.province,
      country: data.country,
      website: data.website,
      suggestedEmail: data.email,
    },
  })
}
