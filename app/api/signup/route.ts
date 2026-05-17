import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { ensureChatGroups } from "@/lib/chat/bootstrap"
import { checkLimit, ipFromRequest } from "@/lib/rate-limit"

// Use service role to create orgs (no auth required for signup)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

export async function POST(request: Request) {
  // Per-IP rate limit. Without this, an attacker can flood
  // auth.admin.inviteUserByEmail — that sends real emails through
  // Supabase / Resend, drives up cost, and creates orphan orgs +
  // subscriptions for every burned email. 5/hour is generous for
  // a real human signing up; tight on a script.
  const ip = ipFromRequest(request)
  const gate = await checkLimit({
    key: `signup:${ip}`,
    max: 5,
    windowSeconds: 3600,
  }).catch(() => ({ ok: true as const, remaining: 5, resetAt: new Date() }))
  if (!gate.ok) {
    return NextResponse.json(
      { error: "Too many signups from this IP. Try again in an hour." },
      { status: 429, headers: gate.headers },
    )
  }

  try {
    const { gymName, ownerName, ownerEmail, city, province, country, inviteToken } =
      await request.json()

    if (!gymName || !ownerName || !ownerEmail) {
      return NextResponse.json(
        { error: "Gym name, owner name, and email are required" },
        { status: 400 }
      )
    }

    // If signing up via a discovery invite, look up + validate the token
    let discoveredGymId: string | null = null
    if (inviteToken) {
      const { data: discovered } = await supabase
        .from("discovered_gyms")
        .select("id, status, claimed_at")
        .eq("invite_token", inviteToken)
        .maybeSingle()
      if (discovered && !discovered.claimed_at) {
        discoveredGymId = discovered.id
      }
    }

    // Generate a unique slug
    let slug = generateSlug(gymName)
    const { data: existingOrg } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .single()

    if (existingOrg) {
      slug = `${slug}-${Date.now().toString(36)}`
    }

    // Check if email already has an org
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", ownerEmail)
      .single()

    if (existingUser) {
      const { data: existingMembership } = await supabase
        .from("org_members")
        .select("id")
        .eq("user_id", existingUser.id)
        .eq("role", "owner")
        .single()

      if (existingMembership) {
        // Hand the front-end a sign-in URL with the email pre-filled so
        // they can hop straight to the magic-link form for the gym they
        // already own. The signup page surfaces this as a CTA instead
        // of a generic error string.
        return NextResponse.json(
          {
            error: "This email already owns a gym.",
            signInUrl: `/admin/login?email=${encodeURIComponent(ownerEmail)}`,
          },
          { status: 409 }
        )
      }
    }

    // Create the organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: gymName,
        slug,
        city: city || null,
        province: province || null,
        country: country || "Thailand",
        timezone: "Asia/Bangkok",
        status: "active",
      })
      .select()
      .single()

    if (orgError) {
      console.error("Failed to create org:", orgError)
      return NextResponse.json(
        { error: "Failed to create gym. Please try again." },
        { status: 500 }
      )
    }

    // Create org settings with defaults
    await supabase.from("org_settings").insert({
      org_id: org.id,
    })

    // Link discovery invite back to the new org so the network map flips
    // this gym from 'invited' to 'onboarded', and mark any campaign_sends
    // pointing at this gym as 'claimed' for attribution.
    if (discoveredGymId) {
      const claimedAt = new Date().toISOString()
      await supabase
        .from("discovered_gyms")
        .update({
          status: "onboarded",
          linked_org_id: org.id,
          claimed_at: claimedAt,
        })
        .eq("id", discoveredGymId)

      // Mark every send pointing at this gym (across all campaigns) as
      // claimed. We don't know which specific campaign drove the claim,
      // so we credit every campaign that contacted them.
      await supabase
        .from("campaign_sends")
        .update({ status: "claimed", claimed_at: claimedAt })
        .eq("gym_id", discoveredGymId)
        .in("status", ["sent", "opened", "clicked"])
    }

    // Create trial subscription
    await supabase.from("gym_subscriptions").insert({
      org_id: org.id,
      status: "trial",
      price_thb: 0,
    })

    // Bootstrap the OckOck chat groups (public_inbox + owner_assist) so
    // OckOck works on day one without a "Chat is not set up yet" detour.
    await ensureChatGroups(supabase, org.id)

    // Create invite token for the owner
    const token = crypto.randomUUID()

    await supabase.from("invites").insert({
      org_id: org.id,
      email: ownerEmail,
      role: "owner",
      token,
    })

    // Send magic link via Supabase Auth
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
      "https://muaythaipai.com"

    const { error: authError } = await supabase.auth.admin.inviteUserByEmail(
      ownerEmail,
      {
        data: {
          full_name: ownerName,
          invite_token: token,
        },
        redirectTo: `${siteUrl}/invite/${token}`,
      }
    )

    if (authError) {
      console.error("Failed to send invite:", authError)
      // Don't fail the whole signup — the org is created, they can log in manually
    }

    return NextResponse.json({
      success: true,
      gymSlug: slug,
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
