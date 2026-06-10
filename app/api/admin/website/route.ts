/**
 * Gym website API.
 *
 * GET  /api/admin/website     → fetch the current website (creates a
 *                               draft from defaults if none exists yet,
 *                               so the editor never opens to nothing)
 * PATCH /api/admin/website    → update sections / theme / status
 */
import { NextResponse } from "next/server"
import type { Json } from "@/lib/supabase/database.types"
import { z } from "zod"
import { requireGymAdmin } from "@/lib/auth-helpers"
import { defaultSections, type WebsiteSection, type WebsiteTheme } from "@/lib/website-sections"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId } = auth

  const { data: existing } = await supabase
    .from("gym_websites")
    .select("*")
    .eq("org_id", orgId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ website: existing })
  }

  // No row yet — create a draft from defaults using the org's name + city.
  const { data: org } = await supabase
    .from("organizations")
    .select("name, city, description")
    .eq("id", orgId)
    .single()

  const sections = defaultSections({
    gymName: org?.name ?? "Our gym",
    city: org?.city,
    description: org?.description,
  })

  const { data: created, error } = await supabase
    .from("gym_websites")
    .insert({
      org_id: orgId,
      status: "draft",
      sections: sections as unknown as Json,
      theme: {},
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ website: created })
}

const PatchSchema = z.object({
  sections: z.array(z.object({
    id: z.string(),
    type: z.string(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: z.any(),
  })).optional(),
  theme: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  seo_title: z.string().max(120).nullable().optional(),
  seo_description: z.string().max(300).nullable().optional(),
  seo_image_url: z.string().url().nullable().optional(),
})

export async function PATCH(request: Request) {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId } = auth

  const parsed = PatchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = {}
  if (parsed.data.sections) update.sections = parsed.data.sections as WebsiteSection[]
  if (parsed.data.theme) update.theme = parsed.data.theme as WebsiteTheme
  if (parsed.data.status) {
    update.status = parsed.data.status
    if (parsed.data.status === "published") {
      update.published_at = new Date().toISOString()
    }
  }
  if (parsed.data.seo_title !== undefined) update.seo_title = parsed.data.seo_title
  if (parsed.data.seo_description !== undefined) update.seo_description = parsed.data.seo_description
  if (parsed.data.seo_image_url !== undefined) update.seo_image_url = parsed.data.seo_image_url

  const { data, error } = await supabase
    .from("gym_websites")
    .update(update)
    .eq("org_id", orgId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ website: data })
}
