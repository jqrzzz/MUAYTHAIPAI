/**
 * Email automation sequences.
 *
 * Three sequences in v1:
 *   - welcome.day1     — new student, 0-1 days after joining
 *   - welcome.day7     — new student, 6-8 days after joining
 *   - lapsed.day30     — no booking in 30+ days, monthly nudge
 *   - cert.issued      — within 24h of cert issuance
 *
 * Each enumerator returns the rows that should get the email NOW.
 * The cron route hands each row to EmailService + writes to
 * email_send_log with the trigger_ref. The UNIQUE constraint there
 * prevents duplicate sends.
 *
 * Per-gym opt-out: each gym can toggle sequences via
 * org_settings.email_*_enabled — checked here so we skip cleanly.
 */
import type { SupabaseClient } from "@supabase/supabase-js"

export interface Candidate {
  recipient_user_id: string | null
  recipient_email: string
  recipient_name: string | null
  org_id: string
  org_name: string
  sequence: string
  trigger_ref: string
  payload: Record<string, unknown>
}

const DAY_MS = 86_400_000

/**
 * Welcome series: gym admins want to greet a new student.
 * Day 1 = 0-1 days after joining the gym.
 * Day 7 = 6-8 days (window absorbs cron-miss slack).
 */
export async function welcomeCandidates(supabase: SupabaseClient): Promise<Candidate[]> {
  const now = Date.now()
  const startWindow = new Date(now - 8 * DAY_MS).toISOString()
  const endWindow = new Date(now - 0).toISOString()

  const { data } = await supabase
    .from("org_members")
    .select(`
      id, user_id, org_id, joined_at,
      organizations:org_id (
        id, name,
        settings:org_settings (email_welcome_enabled)
      ),
      users:user_id (full_name, email)
    `)
    .eq("role", "student")
    .eq("status", "active")
    .gte("joined_at", startWindow)
    .lte("joined_at", endWindow)
    .limit(500)

  const out: Candidate[] = []
  for (const m of data ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const org = Array.isArray((m as any).organizations) ? (m as any).organizations[0] : (m as any).organizations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settings = Array.isArray((org as any)?.settings) ? (org as any).settings[0] : (org as any)?.settings
    if (settings?.email_welcome_enabled === false) continue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = Array.isArray((m as any).users) ? (m as any).users[0] : (m as any).users
    if (!user?.email) continue

    const daysSinceJoin = Math.floor(
      (now - new Date(m.joined_at).getTime()) / DAY_MS,
    )

    let sequence: string | null = null
    if (daysSinceJoin <= 1) sequence = "welcome.day1"
    else if (daysSinceJoin >= 6 && daysSinceJoin <= 8) sequence = "welcome.day7"
    if (!sequence) continue

    out.push({
      recipient_user_id: m.user_id,
      recipient_email: user.email,
      recipient_name: user.full_name ?? null,
      org_id: m.org_id,
      org_name: org?.name ?? "your gym",
      sequence,
      trigger_ref: m.id, // membership id — same across day1 and day7 but
                        // sequence column differentiates in UNIQUE constraint
      payload: {
        day: daysSinceJoin <= 1 ? 1 : 7,
      },
    })
  }
  return out
}

/**
 * Lapsed re-engagement: any active student who hasn't booked in 30+
 * days. trigger_ref is "user_id:YYYY-MM" so we send at most one per
 * month per student (prevents annoying repeat nudges).
 */
export async function lapsedCandidates(supabase: SupabaseClient): Promise<Candidate[]> {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS).toISOString().slice(0, 10)
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  // Get all active students grouped by gym
  const { data: members } = await supabase
    .from("org_members")
    .select(`
      user_id, org_id, joined_at,
      organizations:org_id (
        id, name,
        settings:org_settings (email_lapsed_enabled)
      ),
      users:user_id (full_name, email)
    `)
    .eq("role", "student")
    .eq("status", "active")
    .limit(2000)

  const userIds = (members ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((m: any) => m.user_id)
    .filter(Boolean)
  if (userIds.length === 0) return []

  // Fetch last_booking_date per user (in the last year)
  const { data: bookings } = await supabase
    .from("bookings")
    .select("user_id, booking_date")
    .in("user_id", userIds)
    .in("status", ["confirmed", "completed"])
    .gte("booking_date", new Date(now.getTime() - 365 * DAY_MS).toISOString().slice(0, 10))
  const lastByUser = new Map<string, string>()
  for (const b of bookings ?? []) {
    if (!b.user_id) continue
    const cur = lastByUser.get(b.user_id)
    if (!cur || b.booking_date > cur) lastByUser.set(b.user_id, b.booking_date)
  }

  const out: Candidate[] = []
  for (const m of members ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const org = Array.isArray((m as any).organizations) ? (m as any).organizations[0] : (m as any).organizations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settings = Array.isArray((org as any)?.settings) ? (org as any).settings[0] : (org as any)?.settings
    if (settings?.email_lapsed_enabled === false) continue

    const lastBooking = lastByUser.get(m.user_id)
    // Must have booked at least once (no point nudging someone who never engaged)
    if (!lastBooking) continue
    if (lastBooking >= thirtyDaysAgo) continue // still active

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = Array.isArray((m as any).users) ? (m as any).users[0] : (m as any).users
    if (!user?.email) continue

    out.push({
      recipient_user_id: m.user_id,
      recipient_email: user.email,
      recipient_name: user.full_name ?? null,
      org_id: m.org_id,
      org_name: org?.name ?? "your gym",
      sequence: "lapsed.day30",
      trigger_ref: `${m.user_id}:${monthKey}`,
      payload: { last_booking_date: lastBooking },
    })
  }
  return out
}

/**
 * Cert congratulations: cert issued in the last 24-48h (window).
 * trigger_ref = certificate id so it can only fire once per cert.
 */
export async function certCongratsCandidates(
  supabase: SupabaseClient,
): Promise<Candidate[]> {
  const now = Date.now()
  const start = new Date(now - 2 * DAY_MS).toISOString()
  const end = new Date(now - 0).toISOString()

  const { data: certs } = await supabase
    .from("certificates")
    .select(`
      id, user_id, org_id, level, certificate_number, issued_at,
      organizations:org_id (
        id, name,
        settings:org_settings (email_cert_congrats_enabled)
      ),
      users:user_id (full_name, email)
    `)
    .gte("issued_at", start)
    .lte("issued_at", end)
    .eq("status", "active")
    .limit(500)

  const out: Candidate[] = []
  for (const c of certs ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const org = Array.isArray((c as any).organizations) ? (c as any).organizations[0] : (c as any).organizations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settings = Array.isArray((org as any)?.settings) ? (org as any).settings[0] : (org as any)?.settings
    if (settings?.email_cert_congrats_enabled === false) continue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = Array.isArray((c as any).users) ? (c as any).users[0] : (c as any).users
    if (!user?.email) continue

    out.push({
      recipient_user_id: c.user_id,
      recipient_email: user.email,
      recipient_name: user.full_name ?? null,
      org_id: c.org_id,
      org_name: org?.name ?? "your gym",
      sequence: "cert.issued",
      trigger_ref: c.id,
      payload: {
        level: c.level,
        certificate_number: c.certificate_number,
        issued_at: c.issued_at,
      },
    })
  }
  return out
}

export async function allCandidates(supabase: SupabaseClient): Promise<Candidate[]> {
  const [welcome, lapsed, cert] = await Promise.all([
    welcomeCandidates(supabase),
    lapsedCandidates(supabase),
    certCongratsCandidates(supabase),
  ])
  return [...welcome, ...lapsed, ...cert]
}
