import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AdminLoginClient from "./client"

export const metadata: Metadata = {
  title: "Staff Login | Muay Thai Pai",
  description: "Staff and trainer login for gym management.",
  robots: "noindex, nofollow",
}

export default async function AdminLoginPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If already logged in, redirect to admin dashboard
  if (user) {
    redirect("/admin")
  }

  return <AdminLoginClient />
}
