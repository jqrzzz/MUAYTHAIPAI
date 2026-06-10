/**
 * Per-gym OckOck voice (concierge persona) — gym-admin editor API.
 *
 * GET  → this gym's persona (or sensible defaults if unset)
 * PUT  → upsert { voice, greeting, language_mode, guidelines }
 *
 * Scoped to the caller's own gym via requireGymAdmin; writes go through the
 * authed client so the gym_ai_persona RLS (owner/admin) is enforced too. The
 * concierge reads this via the public-chat service-role client.
 */
import { NextResponse } from "next/server"
import { requireGymAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const LANGUAGE_MODES = ["thai_first", "english_first", "mirror"] as const
const MAX = { voice: 1200, greeting: 200, guidelines: 1500 }

const DEFAULT_PERSONA = {
  voice: null,
  greeting: null,
  language_mode: "thai_first" as const,
  guidelines: null,
  updated_at: null,
}

export async function GET() {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId } = auth

  const { data, error } = await supabase
    .from("gym_ai_persona")
    .select("voice, greeting, language_mode, guidelines, updated_at")
    .eq("org_id", orgId)
    .maybeSingle()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ persona: data ?? DEFAULT_PERSONA })
}

export async function PUT(request: Request) {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId } = auth

  const body = (await request.json().catch(() => ({}))) as {
    voice?: string | null
    greeting?: string | null
    language_mode?: string
    guidelines?: string | null
  }

  const clean = (v: string | null | undefined, max: number) => {
    const s = (v ?? "").trim()
    return s ? s.slice(0, max) : null
  }
  const language_mode = (LANGUAGE_MODES as readonly string[]).includes(body.language_mode ?? "")
    ? body.language_mode
    : "thai_first"

  const { error } = await supabase.from("gym_ai_persona").upsert(
    {
      org_id: orgId,
      voice: clean(body.voice, MAX.voice),
      greeting: clean(body.greeting, MAX.greeting),
      language_mode,
      guidelines: clean(body.guidelines, MAX.guidelines),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "org_id" },
  )
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
