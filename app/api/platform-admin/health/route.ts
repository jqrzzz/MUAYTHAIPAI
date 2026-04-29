import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"

interface Check {
  id: string
  label: string
  group: "db" | "env" | "feature"
  ok: boolean
  detail?: string
  optional?: boolean
}

/**
 * Reports which dependencies the platform-admin needs are present.
 * No secrets leaked — env probes only check presence.
 */
export async function GET() {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const checks: Check[] = []

  // ---- DB / migration probes ----
  const dbProbe = async (
    id: string,
    label: string,
    table: string,
    optional = false
  ) => {
    try {
      const { error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true })
        .limit(1)
      if (error) {
        checks.push({
          id,
          label,
          group: "db",
          ok: false,
          detail: error.message,
          optional,
        })
      } else {
        checks.push({ id, label, group: "db", ok: true, optional })
      }
    } catch (err) {
      checks.push({
        id,
        label,
        group: "db",
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
        optional,
      })
    }
  }

  await dbProbe("db_organizations", "DB · organizations", "organizations")
  await dbProbe("db_users", "DB · users", "users")
  await dbProbe(
    "db_skill_signoffs",
    "DB · skill_signoffs (migration 017)",
    "skill_signoffs"
  )
  await dbProbe(
    "db_discovered_gyms",
    "DB · discovered_gyms (migration 024)",
    "discovered_gyms"
  )
  await dbProbe(
    "db_campaigns",
    "DB · campaigns (migration 026)",
    "campaigns"
  )
  await dbProbe(
    "db_campaign_sends",
    "DB · campaign_sends (migration 026)",
    "campaign_sends"
  )

  // last_nudged_at column probe (migration 025)
  try {
    const { error } = await supabase
      .from("discovered_gyms")
      .select("last_nudged_at")
      .limit(1)
    if (error) {
      checks.push({
        id: "db_nudges",
        label: "DB · last_nudged_at column (migration 025)",
        group: "db",
        ok: false,
        detail: error.message,
      })
    } else {
      checks.push({
        id: "db_nudges",
        label: "DB · last_nudged_at column (migration 025)",
        group: "db",
        ok: true,
      })
    }
  } catch (err) {
    checks.push({
      id: "db_nudges",
      label: "DB · last_nudged_at column (migration 025)",
      group: "db",
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    })
  }

  // ---- Env vars (presence only) ----
  const envProbe = (
    id: string,
    label: string,
    name: string,
    optional = false
  ) => {
    const present = !!process.env[name]
    checks.push({
      id,
      label,
      group: "env",
      ok: present,
      detail: present ? undefined : `${name} not set`,
      optional,
    })
  }

  envProbe(
    "env_supabase_url",
    "Env · NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL"
  )
  envProbe(
    "env_service_role",
    "Env · SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY"
  )
  envProbe(
    "env_site_url",
    "Env · NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_SITE_URL",
    true
  )
  envProbe("env_google_places", "Discovery · Google Places", "GOOGLE_PLACES_API_KEY")
  envProbe("env_firecrawl", "Discovery · Firecrawl", "FIRECRAWL_API_KEY")
  envProbe(
    "env_ai_gateway",
    "AI · gateway (Command bar, course author, campaigns)",
    "AI_GATEWAY_API_KEY"
  )
  envProbe(
    "env_resend",
    "Email · Resend (invites, campaigns)",
    "RESEND_API_KEY"
  )
  envProbe(
    "env_action_secret",
    "Security · ACTION_TOKEN_SECRET (falls back to service role if unset)",
    "ACTION_TOKEN_SECRET",
    true
  )

  // ---- Computed feature readiness ----
  const has = (id: string) => checks.find((c) => c.id === id)?.ok === true
  const features: Check[] = [
    {
      id: "feat_discovery_google",
      label: "Feature · Discovery via Google Places",
      group: "feature",
      ok: has("db_discovered_gyms") && has("env_google_places"),
    },
    {
      id: "feat_discovery_firecrawl",
      label: "Feature · Enrichment via Firecrawl",
      group: "feature",
      ok: has("db_discovered_gyms") && has("env_firecrawl"),
    },
    {
      id: "feat_command_bar",
      label: "Feature · AI Command bar",
      group: "feature",
      ok: has("env_ai_gateway"),
    },
    {
      id: "feat_campaigns",
      label: "Feature · Campaign outreach",
      group: "feature",
      ok:
        has("db_campaigns") &&
        has("db_campaign_sends") &&
        has("env_resend") &&
        has("env_ai_gateway"),
    },
    {
      id: "feat_onboarding",
      label: "Feature · Backpack onboarding (QR + magic link)",
      group: "feature",
      ok: has("db_discovered_gyms"),
    },
  ]
  checks.push(...features)

  const required = checks.filter((c) => !c.optional)
  const missing = required.filter((c) => !c.ok)

  return NextResponse.json({
    ok: missing.length === 0,
    summary: {
      total: required.length,
      passing: required.filter((c) => c.ok).length,
      missing: missing.length,
    },
    checks,
  })
}
