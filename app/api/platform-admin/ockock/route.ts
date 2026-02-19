import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify platform admin
    const { data: userData } = await supabase.from("users").select("is_platform_admin").eq("id", user.id).single()

    if (!userData?.is_platform_admin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const { message } = await request.json()

    // Fetch platform-wide data for context
    const today = new Date().toISOString().split("T")[0]
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
    const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split("T")[0]

    // Get all gyms with subscription status
    const { data: gyms } = await supabase.from("organizations").select(`
        id, name, slug,
        gym_subscriptions(status, price_thb, trial_ends_at, current_period_end)
      `)

    // Get this month's bookings across all gyms
    const { data: monthBookings } = await supabase
      .from("bookings")
      .select(`
        id, org_id, payment_status, payment_method, 
        payment_amount_usd, commission_amount_usd, payment_currency,
        organizations(name)
      `)
      .gte("booking_date", monthStart)

    // Get last month's bookings for comparison
    const { data: lastMonthBookings } = await supabase
      .from("bookings")
      .select("id, payment_amount_usd, commission_amount_usd, payment_currency")
      .gte("booking_date", lastMonthStart)
      .lt("booking_date", monthStart)

    // Get unpaid gym payouts
    const { data: pendingPayouts } = await supabase
      .from("gym_payouts")
      .select("org_id, amount_usd, organizations(name)")
      .eq("status", "pending")

    // Get total students
    const { data: users, count: totalUsers } = await supabase.from("users").select("id", { count: "exact" })

    // Calculate stats
    const totalGyms = gyms?.length || 0
    const activeSubscriptions = gyms?.filter((g) => (g.gym_subscriptions as any)?.status === "active").length || 0
    const trialGyms = gyms?.filter((g) => (g.gym_subscriptions as any)?.status === "trial").length || 0
    const pastDueGyms = gyms?.filter((g) => (g.gym_subscriptions as any)?.status === "past_due").length || 0

    // This month online bookings
    const onlineBookings = monthBookings?.filter((b) => b.payment_currency === "USD") || []
    const totalCollectedUsd = onlineBookings.reduce((sum, b) => sum + (b.payment_amount_usd || 0), 0)
    const totalCommissionUsd = onlineBookings.reduce((sum, b) => sum + (b.commission_amount_usd || 0), 0)
    const totalOwedToGyms = totalCollectedUsd - totalCommissionUsd

    // Last month for comparison
    const lastMonthOnline = lastMonthBookings?.filter((b) => b.payment_currency === "USD") || []
    const lastMonthCommission = lastMonthOnline.reduce((sum, b) => sum + (b.commission_amount_usd || 0), 0)

    // Per-gym breakdown
    const gymBreakdown =
      gyms
        ?.map((gym) => {
          const gymBookings = onlineBookings.filter((b) => b.org_id === gym.id)
          const collected = gymBookings.reduce((sum, b) => sum + (b.payment_amount_usd || 0), 0)
          const commission = gymBookings.reduce((sum, b) => sum + (b.commission_amount_usd || 0), 0)
          return {
            name: gym.name,
            bookings: gymBookings.length,
            collected,
            commission,
            owed: collected - commission,
            subscriptionStatus: (gym.gym_subscriptions as any)?.status || "none",
          }
        })
        .filter((g) => g.bookings > 0) || []

    // Build context
    const context = `
You are OckOck, the platform admin assistant for the Muay Thai Network.

PLATFORM STATS:
- Total Gyms: ${totalGyms}
- Active Subscriptions: ${activeSubscriptions} (฿${activeSubscriptions * 999}/month)
- Trial Period: ${trialGyms} gyms
- Past Due: ${pastDueGyms} gyms
- Total Users: ${totalUsers || 0}

THIS MONTH'S ONLINE BOOKINGS:
- Total Online Bookings: ${onlineBookings.length}
- Total Collected: $${totalCollectedUsd.toFixed(2)} USD
- Your Commission (15%): $${totalCommissionUsd.toFixed(2)} USD
- Owed to Gyms: $${totalOwedToGyms.toFixed(2)} USD

LAST MONTH COMPARISON:
- Last Month Commission: $${lastMonthCommission.toFixed(2)} USD
- ${totalCommissionUsd > lastMonthCommission ? "Up" : "Down"} ${Math.abs(((totalCommissionUsd - lastMonthCommission) / (lastMonthCommission || 1)) * 100).toFixed(0)}% from last month

PER-GYM BREAKDOWN THIS MONTH:
${gymBreakdown.map((g) => `- ${g.name}: ${g.bookings} bookings, collected $${g.collected.toFixed(2)}, owe them $${g.owed.toFixed(2)}`).join("\n") || "No online bookings this month"}

GYMS WITH SUBSCRIPTION ISSUES:
${
  gyms
    ?.filter((g) => ["past_due", "cancelled"].includes((g.gym_subscriptions as any)?.status))
    .map((g) => `- ${g.name}: ${(g.gym_subscriptions as any)?.status}`)
    .join("\n") || "All gyms in good standing"
}

PENDING PAYOUTS:
${pendingPayouts?.map((p) => `- ${(p.organizations as any)?.name}: $${p.amount_usd} pending`).join("\n") || "No pending payouts"}
`

    const systemPrompt = `${context}

PERSONALITY:
You are OckOck - a goofy but fierce water buffalo who helps run the Muay Thai Network platform. You're the business-savvy side - tracking revenue, managing gym relationships, and keeping the platform healthy. Still friendly and encouraging, but more focused on the business numbers.

Keep responses concise and actionable. When asked about money, give specific numbers. Flag any gyms that need attention (past due, pending payouts). Celebrate growth and wins!

Common questions you should handle:
- "What do I owe each gym?" - List per-gym amounts
- "How's business this month?" - Revenue summary
- "Which gyms are behind on payment?" - Subscription issues
- "Generate payout summary" - Monthly settlement overview`

    try {
      const { text } = await generateText({
        model: "openai/gpt-4o-mini",
        system: systemPrompt,
        prompt: message,
      })

      return NextResponse.json({ response: text })
    } catch {
      // Fallback if AI fails
      let response = `Hey boss! 🦬 Here's the platform overview:\n\n`
      response += `**This Month**: ${onlineBookings.length} online bookings\n`
      response += `**Collected**: $${totalCollectedUsd.toFixed(2)} USD\n`
      response += `**Your Commission**: $${totalCommissionUsd.toFixed(2)} USD\n`
      response += `**Owe to Gyms**: $${totalOwedToGyms.toFixed(2)} USD\n\n`
      response += `**Active Gyms**: ${activeSubscriptions} paying (฿${activeSubscriptions * 999}/month)\n`

      if (pastDueGyms > 0) {
        response += `\n⚠️ **Heads up**: ${pastDueGyms} gym(s) past due on subscription!`
      }

      return NextResponse.json({ response })
    }
  } catch (error) {
    console.error("Platform OckOck error:", error)
    return NextResponse.json({ error: "Failed to process" }, { status: 500 })
  }
}
