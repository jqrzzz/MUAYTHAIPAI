/**
 * Daily email sequence cron.
 *
 * GET /api/cron/email-sequences  (Bearer CRON_SECRET)
 *
 * Steps:
 *   1. Enumerate candidates across all sequences (welcome, lapsed, cert)
 *   2. For each candidate, draft an AI body in the gym's voice
 *   3. Send via EmailService.sendAutomatedSequence
 *   4. Write to email_send_log — UNIQUE(user_id, sequence, trigger_ref)
 *      prevents duplicates on retry / multi-day runs
 *   5. Return summary stats
 *
 * Best-effort throughout: a single failed send doesn't block others.
 */
import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import type { Json } from "@/lib/supabase/database.types"
import { generateText } from "ai"
import { EmailService } from "@/lib/email-service"
import { allCandidates, type Candidate } from "@/lib/email-sequences"
import { MODEL_VOICE } from "@/lib/ai-models"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

function authorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) return false
  const hdr = request.headers.get("authorization")
  return hdr === `Bearer ${expected}`
}

const SEQUENCE_META: Record<
  string,
  {
    subjectTemplate: (c: Candidate) => string
    systemPrompt: (c: Candidate) => string
    accent: "indigo" | "amber" | "emerald" | "orange"
  }
> = {
  "welcome.day1": {
    subjectTemplate: (c) => `Welcome to ${c.org_name} 🥊`,
    accent: "indigo",
    systemPrompt: (c) =>
      `Write a 3-4 sentence welcome email to a new student at ${c.org_name}, a Muay Thai gym. The student just joined.\n\nWarm but not gushy. Acknowledge they took the first step. Give one concrete suggestion ("come in any time, no need to book your first class") OR ask what they're hoping to get out of training. Sign off as "The team at ${c.org_name}". Plain text, no emoji, no bullets.`,
  },
  "welcome.day7": {
    subjectTemplate: (c) => `How's the first week going at ${c.org_name}?`,
    accent: "emerald",
    systemPrompt: (c) =>
      `Write a 3-4 sentence check-in email to a student who joined ${c.org_name} a week ago. Friendly + curious tone. Ask how the first few classes have been + invite them to message back if they have questions. Sign off as "The team at ${c.org_name}". Plain text, no emoji.`,
  },
  "lapsed.day30": {
    subjectTemplate: (c) => `Miss you on the mats`,
    accent: "amber",
    systemPrompt: (c) =>
      `Write a 3-5 sentence re-engagement email to a former regular at ${c.org_name} who hasn't booked a session in 30+ days. Empathetic, no guilt. Acknowledge life gets busy. Say the door is always open + offer to help find a class that fits their schedule. Sign off as "The team at ${c.org_name}". Plain text, no emoji.`,
  },
  "cert.issued": {
    subjectTemplate: (c) =>
      `Congratulations on your ${c.payload.level ?? ""} certification`,
    accent: "orange",
    systemPrompt: (c) =>
      `Write a 3-4 sentence congratulations email to a student who just earned their ${c.payload.level} certification at ${c.org_name} (cert #${c.payload.certificate_number}). Proud but not corny. Acknowledge the work that went into it + briefly hint at what's next on their journey. Sign off as "The team at ${c.org_name}". Plain text, no emoji.`,
  },
}

async function generateBody(candidate: Candidate): Promise<string> {
  const meta = SEQUENCE_META[candidate.sequence]
  if (!meta) {
    return `Hi from ${candidate.org_name}. Just checking in.`
  }
  try {
    const result = await generateText({
      model: MODEL_VOICE,
      system: meta.systemPrompt(candidate),
      prompt:
        candidate.recipient_name
          ? `Recipient's first name: ${candidate.recipient_name.split(" ")[0]}`
          : `Recipient name unknown — keep generic but warm.`,
    })
    return result.text.trim()
  } catch (err) {
    console.error("[email cron] AI body failed:", err)
    // Safe fallback so the email still goes out
    if (candidate.sequence === "welcome.day1") {
      return `Welcome to ${candidate.org_name}! We're glad you joined. Come in any time — your first class is on us. If you have any questions, just hit reply.`
    }
    if (candidate.sequence === "welcome.day7") {
      return `Hope your first week has been good. Any questions about the classes or training? Hit reply — we're here.`
    }
    if (candidate.sequence === "lapsed.day30") {
      return `Haven't seen you in a while — hope everything's good. The door's always open. If life got busy, totally get it. Want me to help find a class that fits your schedule?`
    }
    if (candidate.sequence === "cert.issued") {
      return `Congratulations on your ${candidate.payload.level} certification — that's real work, recognized. Onward to the next level when you're ready.`
    }
    return `Hi from ${candidate.org_name}.`
  }
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServiceClient()
  const email = EmailService.getInstance()

  const candidates = await allCandidates(supabase)
  let sent = 0
  let skipped = 0
  let failed = 0

  for (const c of candidates) {
    // Pre-check the unique key so we don't burn AI tokens on a duplicate
    const preCheck = supabase
      .from("email_send_log")
      .select("id")
      .eq("sequence", c.sequence)
      .eq("trigger_ref", c.trigger_ref)
    const { data: existing } = await (c.recipient_user_id
      ? preCheck.eq("recipient_user_id", c.recipient_user_id)
      : preCheck.is("recipient_user_id", null)
    ).maybeSingle()
    if (existing) {
      skipped++
      continue
    }

    const meta = SEQUENCE_META[c.sequence]
    const subject = meta?.subjectTemplate(c) ?? `A note from ${c.org_name}`
    const body = await generateBody(c)

    // Pull the gym's contact email for "from"
    const { data: gymEmail } = await supabase
      .from("organizations")
      .select("email")
      .eq("id", c.org_id)
      .maybeSingle()

    const result = await email.sendAutomatedSequence({
      toEmail: c.recipient_email,
      toName: c.recipient_name,
      fromName: c.org_name,
      fromEmail: gymEmail?.email ?? null,
      subject,
      bodyText: body,
      accent: meta?.accent ?? "indigo",
      footer: `${c.org_name} · sent via MUAYTHAIPAI · sequence: ${c.sequence}`,
    })

    // Log it (idempotent via UNIQUE constraint)
    await supabase.from("email_send_log").insert({
      recipient_user_id: c.recipient_user_id,
      recipient_email: c.recipient_email,
      org_id: c.org_id,
      sequence: c.sequence,
      trigger_ref: c.trigger_ref,
      resend_message_id: result.messageId,
      status: result.ok ? "sent" : "failed",
      error_message: result.error,
      metadata: {
        subject,
        accent: meta?.accent,
        payload: c.payload,
      } as unknown as Json,
    })

    if (result.ok) sent++
    else failed++
  }

  return NextResponse.json({
    ok: true,
    candidates: candidates.length,
    sent,
    skipped,
    failed,
  })
}
