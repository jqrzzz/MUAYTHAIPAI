import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // IMPORTANT: Do not run code between createServerClient and supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login") && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/admin/login"
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith("/student") && !pathname.startsWith("/student/login") && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/student/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
