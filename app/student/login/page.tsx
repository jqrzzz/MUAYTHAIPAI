import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import StudentLoginClient from "./client"

export const metadata: Metadata = {
  title: "Student Login | Muay Thai Thailand Network",
  description: "Access your training history, certificates, and book at any gym across Thailand.",
}

export default async function StudentLoginPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If already logged in, redirect to student dashboard
  if (user) {
    redirect("/student")
  }

  return <StudentLoginClient />
}
