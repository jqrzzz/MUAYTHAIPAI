import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CERTIFICATION_LEVELS } from "@/lib/certification-levels"
import StudentProfileClient from "./client"

export const metadata = {
  title: "Student profile | MUAYTHAIPAI",
  robots: "noindex, nofollow",
}

interface StudentPageProps {
  params: Promise<{ id: string }>
}

const SKILLS_BY_LEVEL: Record<string, string[]> = Object.fromEntries(
  CERTIFICATION_LEVELS.map((l) => [l.id, l.skills]),
)

export default async function StudentProfilePage({ params }: StudentPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/admin/login")
  }

  // Role gate: owner / admin only — matches the /admin route. Trainers
  // can see their own students via /trainer; this is the deeper gym
  // management surface.
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  if (
    !membership ||
    !["owner", "admin"].includes(String(membership.role))
  ) {
    redirect("/admin")
  }

  const orgId = membership.org_id as string

  // Pull everything we need in parallel — keep this page-load cheap.
  const [
    studentRes,
    bookingsRes,
    creditsRes,
    transactionsRes,
    notesRes,
    signoffsHereRes,
    signoffsAnywhereRes,
    certsHereRes,
    enrollsHereRes,
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, email, full_name, display_name, phone, avatar_url, created_at")
      .eq("id", id)
      .single(),
    supabase
      .from("bookings")
      .select(
        "id, booking_date, booking_time, status, payment_status, payment_method, payment_amount_thb, payment_amount_usd, services:service_id(name, category)",
      )
      .eq("org_id", orgId)
      .eq("user_id", id)
      .order("booking_date", { ascending: false })
      .order("booking_time", { ascending: false }),
    supabase
      .from("student_credits")
      .select("id, credit_type, credits_remaining, expires_at")
      .eq("org_id", orgId)
      .eq("user_id", id),
    supabase
      .from("credit_transactions")
      .select("id, transaction_type, credit_change, amount_thb, payment_method, notes, created_at")
      .eq("org_id", orgId)
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("student_notes")
      .select(
        "id, note, created_at, created_by, users:created_by(full_name, email)",
      )
      .eq("org_id", orgId)
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("skill_signoffs")
      .select(
        "id, level, skill_index, notes, signed_off_at, users:signed_off_by(full_name, email)",
      )
      .eq("org_id", orgId)
      .eq("student_id", id)
      .order("signed_off_at", { ascending: false }),
    supabase
      .from("skill_signoffs")
      .select("level, skill_index, org_id")
      .eq("student_id", id),
    supabase
      .from("certificates")
      .select("id, level, certificate_number, issued_at, status")
      .eq("org_id", orgId)
      .eq("user_id", id)
      .order("issued_at", { ascending: false }),
    supabase
      .from("certification_enrollments")
      .select("id, level, status, enrolled_at, completed_at, payment_status")
      .eq("org_id", orgId)
      .eq("user_id", id)
      .order("enrolled_at", { ascending: false }),
  ])

  if (!studentRes.data) {
    notFound()
  }

  const bookings = bookingsRes.data ?? []
  const signoffsHere = signoffsHereRes.data ?? []
  const signoffsAnywhere = signoffsAnywhereRes.data ?? []
  const certsHere = certsHereRes.data ?? []
  const enrollsHere = enrollsHereRes.data ?? []

  // Business stats — what an operator wants to see at a glance.
  const paid = bookings.filter((b) => b.payment_status === "paid")
  const noShow = bookings.filter((b) => b.status === "no_show")
  const completed = bookings.filter((b) => b.status === "completed")
  const ltvThb = paid.reduce(
    (sum, b) => sum + (b.payment_amount_thb ?? 0),
    0,
  )
  const ltvUsd = paid.reduce(
    (sum, b) => sum + (b.payment_amount_usd ?? 0),
    0,
  )
  const attendanceDenominator = completed.length + noShow.length
  const attendanceRate =
    attendanceDenominator > 0
      ? Math.round((completed.length / attendanceDenominator) * 100)
      : null
  const lastVisit = bookings.find(
    (b) => b.status === "completed" || b.payment_status === "paid",
  )
  const daysSinceLastVisit = lastVisit
    ? Math.floor(
        (Date.now() - new Date(lastVisit.booking_date).getTime()) / 86400_000,
      )
    : null

  // Build the cert ladder view (mirrors the passport API shape but inline
  // here so the page loads with one DB round-trip instead of two HTTP calls)
  const ladder = CERTIFICATION_LEVELS.map((lvl) => {
    const here = new Set(
      signoffsHere
        .filter((s) => s.level === lvl.id)
        .map((s) => s.skill_index),
    )
    const anywhere = new Set(
      signoffsAnywhere
        .filter((s) => s.level === lvl.id)
        .map((s) => s.skill_index),
    )
    const earned = certsHere.find(
      (c) => c.level === lvl.id && c.status === "active",
    )
    const enrolled = enrollsHere.find(
      (e) => e.level === lvl.id && e.status === "active",
    )
    return {
      id: lvl.id,
      name: lvl.name,
      number: lvl.number,
      icon: lvl.icon,
      total_skills: lvl.skills.length,
      signed_off_here: here.size,
      signed_off_anywhere: anywhere.size,
      earned_here: !!earned,
      certificate_number: earned?.certificate_number ?? null,
      issued_at: earned?.issued_at ?? null,
      enrolled_here: !!enrolled,
      enrolled_at: enrolled?.enrolled_at ?? null,
      skills: lvl.skills.map((label, idx) => ({
        index: idx,
        label,
        signed_off_here: here.has(idx),
        signed_off_anywhere: anywhere.has(idx),
      })),
    }
  })

  return (
    <StudentProfileClient
      orgRole={String(membership.role) as "owner" | "admin"}
      student={studentRes.data}
      bookings={bookings.slice(0, 30).map((b) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const svc = (b as any).services
        const service = Array.isArray(svc) ? svc[0] : svc
        return {
          id: b.id,
          booking_date: b.booking_date,
          booking_time: b.booking_time,
          status: b.status,
          payment_status: b.payment_status,
          payment_method: b.payment_method,
          payment_amount_thb: b.payment_amount_thb,
          payment_amount_usd: b.payment_amount_usd,
          service_name: service?.name ?? null,
          service_category: service?.category ?? null,
        }
      })}
      credits={creditsRes.data ?? []}
      transactions={transactionsRes.data ?? []}
      notes={(notesRes.data ?? []).map((n) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = (n as any).users
        const author = Array.isArray(u) ? u[0] : u
        return {
          id: n.id,
          note: n.note,
          created_at: n.created_at,
          author: author?.full_name ?? author?.email ?? null,
        }
      })}
      ladder={ladder}
      recentSignoffs={signoffsHere.slice(0, 15).map((s) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = (s as any).users
        const signer = Array.isArray(u) ? u[0] : u
        return {
          id: s.id,
          level: s.level,
          skill_index: s.skill_index,
          skill_label:
            SKILLS_BY_LEVEL[s.level]?.[s.skill_index] ??
            `#${s.skill_index + 1}`,
          notes: s.notes,
          signed_off_at: s.signed_off_at,
          signed_off_by: signer?.full_name ?? signer?.email ?? null,
        }
      })}
      stats={{
        total_bookings: bookings.length,
        completed_count: completed.length,
        no_show_count: noShow.length,
        attendance_rate: attendanceRate,
        ltv_thb: ltvThb,
        ltv_usd: ltvUsd,
        last_visit: lastVisit?.booking_date ?? null,
        days_since_last_visit: daysSinceLastVisit,
        cross_network_signoffs: signoffsAnywhere.length,
        gyms_visited:
          new Set(signoffsAnywhere.map((s) => s.org_id as string)).size,
      }}
    />
  )
}
