/**
 * POST /api/admin/faqs/seed
 *
 * Idempotently seeds the current org's gym_faqs table from the canonical
 * SEED_FAQS list (sourced from the public /faq page content).
 *
 * Behaviour:
 *   - Skips any question text already present for this org
 *   - Inserts everything else in one batch
 *   - Returns counts so the UI can show "Added 18 new answers" /
 *     "Up to date" feedback.
 *
 * Auth: owner or admin (trainers can read FAQs but shouldn't bulk-seed).
 */

import { createClient } from "@/lib/supabase/server"
import { SEED_FAQS } from "@/lib/chat/seed-faqs"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: "No organization" }, { status: 403 })
  }
  if (!["owner", "admin"].includes(String(membership.role))) {
    return NextResponse.json(
      { error: "Forbidden: owner or admin required" },
      { status: 403 },
    )
  }

  // Pull existing questions so we skip dupes. Question-text match is a
  // good-enough primary key for seed content — the seed list is small
  // and curated, not user-generated.
  const { data: existingRows, error: listErr } = await supabase
    .from("gym_faqs")
    .select("question")
    .eq("org_id", membership.org_id)

  if (listErr) {
    return NextResponse.json({ error: listErr.message }, { status: 500 })
  }

  const existing = new Set(
    (existingRows ?? []).map((r: { question: string }) => r.question.trim().toLowerCase()),
  )

  const toInsert = SEED_FAQS.filter(
    (f) => !existing.has(f.question.trim().toLowerCase()),
  ).map((f) => ({
    org_id: membership.org_id,
    question: f.question,
    answer: f.answer,
    category: f.category,
    is_active: true,
    created_by: user.id,
  }))

  if (toInsert.length === 0) {
    return NextResponse.json({
      ok: true,
      inserted: 0,
      skipped: SEED_FAQS.length,
      message: "Already up to date",
    })
  }

  const { error: insertErr } = await supabase.from("gym_faqs").insert(toInsert)

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    inserted: toInsert.length,
    skipped: SEED_FAQS.length - toInsert.length,
    message: `Added ${toInsert.length} answer${toInsert.length === 1 ? "" : "s"} to OckOck's knowledge`,
  })
}
