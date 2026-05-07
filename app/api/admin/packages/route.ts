/**
 * Gym packages — catalog CRUD.
 *
 * GET  /api/admin/packages          → list this gym's packages
 * POST /api/admin/packages          → create a package
 *
 * Owner / admin only. Trainers don't manage the catalog (price changes
 * affect the gym's revenue model).
 */

import { NextResponse } from "next/server"
import { z } from "zod"
import { requireGymAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PackageSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  price_thb: z.number().int().min(0),
  price_usd: z.number().int().min(0).optional().nullable(),
  credit_type: z.string().min(1).max(40).default("sessions"),
  credit_count: z.number().int().min(1).max(1000).optional().nullable(),
  duration_days: z.number().int().min(1).max(3650).optional().nullable(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  display_order: z.number().int().default(0),
})

export async function GET() {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId } = auth

  const { data, error } = await supabase
    .from("gym_packages")
    .select("*")
    .eq("org_id", orgId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ packages: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId } = auth

  const parsed = PackageSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from("gym_packages")
    .insert({ ...parsed.data, org_id: orgId })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ package: data })
}
