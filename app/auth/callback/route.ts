import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Whitelist of post-auth destinations. Same logic as the login
// client so neither path can be tricked into an open-redirect via a
// crafted ?next= (e.g. //evil.com would otherwise produce a
// protocol-relative URL after string concatenation).
function safeNext(raw: string | null): string {
  if (!raw) return "/admin"
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/admin"
  const allowed = ["/admin", "/trainer", "/ockock", "/platform-admin", "/student"]
  if (allowed.some((p) => raw === p || raw.startsWith(`${p}/`) || raw.startsWith(`${p}?`))) {
    return raw
  }
  return "/admin"
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = safeNext(searchParams.get("next"))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Get the user to link past bookings
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.email) {
        // Auto-link past bookings made with this email (as guest)
        // Only link bookings that don't have a user_id yet
        await supabase
          .from("bookings")
          .update({ user_id: user.id })
          .eq("guest_email", user.email)
          .is("user_id", null)
        
        console.log(`[v0] Auto-linked past bookings for ${user.email}`)
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
