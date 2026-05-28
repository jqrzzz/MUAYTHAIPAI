/**
 * GET /api/platform-admin/impersonation/active
 *
 * Returns the active impersonation state for the signed-in actor, or
 * { active: null } if none. The underlying helper
 * getActiveImpersonation() server-side re-verifies the caller is a
 * platform admin on every call — so even if a non-admin sets the
 * cookie, they get null here.
 *
 * This endpoint exists so the ImpersonationBanner client component can
 * source its state from the server. The impersonation cookie itself is
 * httpOnly: true (set in /api/platform-admin/impersonate); JS cannot
 * read it directly anymore.
 */
import { NextResponse } from "next/server"
import { getActiveImpersonation } from "@/lib/impersonation"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const active = await getActiveImpersonation()
  return NextResponse.json({ active })
}
