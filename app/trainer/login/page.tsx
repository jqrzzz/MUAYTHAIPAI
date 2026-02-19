import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import TrainerLoginClient from "./client"

export const metadata: Metadata = {
  title: "Trainer Login | Muay Thai Thailand Network",
  description: "Access your trainer dashboard to manage classes and students.",
}

export default async function TrainerLoginPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If already logged in, check if they're a trainer and redirect
  if (user) {
    const { data: trainerProfile } = await supabase
      .from("trainer_profiles")
      .select("id, org_id")
      .eq("user_id", user.id)
      .single()

    if (trainerProfile) {
      redirect("/trainer")
    }
  }

  return <TrainerLoginClient />
}
