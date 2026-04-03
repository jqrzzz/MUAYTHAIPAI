import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next")

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user?.email) {
        // Auto-link past bookings made with this email (as guest)
        await supabase
          .from("bookings")
          .update({ user_id: user.id })
          .eq("guest_email", user.email)
          .is("user_id", null)
      }

      // If a specific redirect was requested, use it
      if (next) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Otherwise, determine the best dashboard based on user's role
      if (user) {
        const { data: membership } = await supabase
          .from("org_members")
          .select("role")
          .eq("user_id", user.id)
          .eq("status", "active")
          .limit(1)
          .single()

        if (membership) {
          switch (membership.role) {
            case "owner":
            case "admin":
              return NextResponse.redirect(`${origin}/admin`)
            case "trainer":
              return NextResponse.redirect(`${origin}/trainer`)
            case "student":
              return NextResponse.redirect(`${origin}/student`)
            default:
              return NextResponse.redirect(`${origin}/student`)
          }
        }

        // No org membership — send to student dashboard as default
        return NextResponse.redirect(`${origin}/student`)
      }

      return NextResponse.redirect(`${origin}/`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
