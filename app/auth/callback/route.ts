import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/admin"

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
